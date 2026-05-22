import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { serializeExpenseForAudit, validateExpenseInput } from "@/lib/expenses";
import { maybeSendCriticalAuditAlert } from "@/lib/telegram-alerts";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getAdminFromCookie();

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

  const { id } = await context.params;
  const prisma = getPrisma();

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findUnique({ where: { id } });

    if (!existing) {
      return null;
    }

    const next = await tx.expense.update({
      where: { id },
      data: {
        expenseDate: validation.data.expenseDate,
        category: validation.data.category,
        description: validation.data.description,
        amount: validation.data.amount,
        vendorName: validation.data.vendorName,
        receiptUrl: validation.data.receiptUrl,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "expense.updated",
        entityType: "expense",
        entityId: next.id,
        before: serializeExpenseForAudit(existing),
        after: serializeExpenseForAudit(next),
      },
    });

    return next;
  });

  if (!updated) {
    return NextResponse.json(
      { errors: { expense: "Pengeluaran tidak ditemukan." } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: updated.id,
    expenseDate: updated.expenseDate.toISOString().slice(0, 10),
    category: updated.category,
    description: updated.description,
    amount: updated.amount,
    vendorName: updated.vendorName,
    receiptUrl: updated.receiptUrl,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await getAdminFromCookie();

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const prisma = getPrisma();

  const deleted = await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findUnique({ where: { id } });

    if (!existing) {
      return null;
    }

    await tx.expense.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "expense.deleted",
        entityType: "expense",
        entityId: existing.id,
        before: serializeExpenseForAudit(existing),
        after: Prisma.JsonNull,
      },
    });

    return existing;
  });

  if (!deleted) {
    return NextResponse.json(
      { errors: { expense: "Pengeluaran tidak ditemukan." } },
      { status: 404 },
    );
  }

  await maybeSendCriticalAuditAlert({
    action: "expense.deleted",
    entityId: deleted.id,
    actorLabel: admin.email,
    amount: deleted.amount,
    description: deleted.description,
  });

  return NextResponse.json({ ok: true });
}

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  return requireAdminUser(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
