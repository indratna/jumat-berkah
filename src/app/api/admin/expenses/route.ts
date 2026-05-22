import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { serializeExpenseForAudit, validateExpenseInput } from "@/lib/expenses";
import { maybeSendCriticalAuditAlert } from "@/lib/telegram-alerts";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const admin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const validation = validateExpenseInput(payload ?? {});

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const prisma = getPrisma();
  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        expenseDate: validation.data.expenseDate,
        category: validation.data.category,
        description: validation.data.description,
        amount: validation.data.amount,
        vendorName: validation.data.vendorName,
        receiptUrl: validation.data.receiptUrl,
        createdBy: admin.id,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "expense.created",
        entityType: "expense",
        entityId: created.id,
        before: Prisma.JsonNull,
        after: serializeExpenseForAudit(created),
      },
    });

    return created;
  });

  await maybeSendCriticalAuditAlert({
    action: "expense.created",
    entityId: expense.id,
    actorLabel: admin.email,
    amount: expense.amount,
    description: expense.description,
  });

  return NextResponse.json({
    id: expense.id,
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    vendorName: expense.vendorName,
    receiptUrl: expense.receiptUrl,
  });
}
