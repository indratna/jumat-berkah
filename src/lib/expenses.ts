import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";

export const EXPENSE_CATEGORIES = [
  "Bahan makanan",
  "Lauk pauk",
  "Beras",
  "Gas/alat masak",
  "Kemasan",
  "Transportasi",
  "Operasional lain",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

type ExpenseInput = {
  expenseDate?: unknown;
  category?: unknown;
  description?: unknown;
  amount?: unknown;
  vendorName?: unknown;
  receiptUrl?: unknown;
};

export type ValidExpenseInput = {
  expenseDate: Date;
  category: ExpenseCategory;
  description: string;
  amount: number;
  vendorName: string | null;
  receiptUrl: string | null;
};

export type ExpenseValidationResult =
  | { success: true; data: ValidExpenseInput }
  | { success: false; errors: Record<string, string> };

export function validateExpenseInput(input: ExpenseInput): ExpenseValidationResult {
  const errors: Record<string, string> = {};
  const expenseDate = parseExpenseDate(input.expenseDate);
  const category = parseCategory(input.category);
  const description = normalizeRequiredString(input.description);
  const amount = parseAmount(input.amount);
  const vendorName = normalizeOptionalString(input.vendorName);
  const receiptUrl = normalizeOptionalString(input.receiptUrl);

  if (!expenseDate) {
    errors.expenseDate = "Tanggal pengeluaran wajib dan harus valid.";
  }

  if (!category) {
    errors.category = "Kategori pengeluaran tidak valid.";
  }

  if (!description) {
    errors.description = "Deskripsi wajib diisi.";
  }

  if (amount === null) {
    errors.amount = "Nominal wajib bilangan bulat positif dalam Rupiah.";
  }

  if (Object.keys(errors).length > 0 || !expenseDate || !category || !description || amount === null) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      expenseDate,
      category,
      description,
      amount,
      vendorName,
      receiptUrl,
    },
  };
}

export async function recordExpenseAudit(input: {
  actorUserId: string | null;
  action: "expense.created" | "expense.updated" | "expense.deleted";
  entityId: string;
  before: Prisma.InputJsonValue | null;
  after: Prisma.InputJsonValue | null;
}) {
  const prisma = getPrisma();

  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: "expense",
      entityId: input.entityId,
      before: input.before ?? Prisma.JsonNull,
      after: input.after ?? Prisma.JsonNull,
    },
  });
}

export function serializeExpenseForAudit(expense: {
  id: string;
  expenseDate: Date;
  category: string;
  description: string;
  amount: number;
  vendorName: string | null;
  receiptUrl: string | null;
  createdBy: string;
}): Prisma.InputJsonValue {
  return {
    id: expense.id,
    expenseDate: expense.expenseDate.toISOString(),
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    vendorName: expense.vendorName,
    receiptUrl: expense.receiptUrl,
    createdBy: expense.createdBy,
  };
}

function parseExpenseDate(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseCategory(value: unknown): ExpenseCategory | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return EXPENSE_CATEGORIES.includes(trimmed as ExpenseCategory)
    ? (trimmed as ExpenseCategory)
    : null;
}

function parseAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function normalizeRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
