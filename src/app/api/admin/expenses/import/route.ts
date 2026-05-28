import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import { validateExpenseImportCsv } from "@/lib/expenses";

export async function POST(request: Request) {
  const admin = await getAdminFromCookie();

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    csv?: unknown;
    mode?: unknown;
  } | null;

  if (!payload || typeof payload.csv !== "string") {
    return NextResponse.json(
      { errors: { csv: "CSV wajib dikirim sebagai teks." } },
      { status: 400 },
    );
  }

  const validation = validateExpenseImportCsv(payload.csv);

  if (payload.mode === "preview") {
    return NextResponse.json(validation);
  }

  if (payload.mode !== "import") {
    return NextResponse.json(
      { errors: { mode: "Mode harus preview atau import." } },
      { status: 400 },
    );
  }

  if (validation.hasErrors || validation.validRows.length === 0) {
    return NextResponse.json(
      {
        errors: { csv: "CSV masih memiliki error. Import dibatalkan." },
        preview: validation,
      },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const createdExpenses = [];

    for (const row of validation.validRows) {
      const created = await tx.expense.create({
        data: {
          expenseDate: row.expenseDate,
          category: row.category,
          description: row.description,
          amount: row.amount,
          vendorName: row.vendorName,
          receiptUrl: row.receiptUrl,
          createdBy: admin.id,
        },
      });

      createdExpenses.push(created);

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "expense.import.row_created",
          entityType: "expense",
          entityId: created.id,
          before: Prisma.JsonNull,
          after: {
            id: created.id,
            expenseDate: created.expenseDate.toISOString(),
            category: created.category,
            description: created.description,
            amount: created.amount,
            vendorName: created.vendorName,
            receiptUrl: created.receiptUrl,
            createdBy: created.createdBy,
            importRowNumber: row.rowNumber,
          },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "expense.import.completed",
        entityType: "expense_import",
        entityId: `expense-import-${Date.now()}`,
        before: Prisma.JsonNull,
        after: {
          importedRows: createdExpenses.length,
          totalAmount: createdExpenses.reduce(
            (total, expense) => total + expense.amount,
            0,
          ),
        },
      },
    });

    return createdExpenses;
  });

  return NextResponse.json({ imported: result.length });
}

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  return legacyAdmin ?? requireBetterAuthAdminUser(await headers());
}
