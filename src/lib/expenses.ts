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

export type ExpenseImportRow = ValidExpenseInput & {
  rowNumber: number;
};

export type ExpenseImportPreviewRow = {
  rowNumber: number;
  expenseDate: string;
  category: string;
  description: string;
  amount: number | null;
  vendorName: string | null;
  receiptUrl: string | null;
  errors: Record<string, string>;
};

export type ExpenseImportValidation = {
  rows: ExpenseImportPreviewRow[];
  validRows: ExpenseImportRow[];
  hasErrors: boolean;
};

export function validateExpenseInput(
  input: ExpenseInput,
): ExpenseValidationResult {
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

  if (
    Object.keys(errors).length > 0 ||
    !expenseDate ||
    !category ||
    !description ||
    amount === null
  ) {
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

export function validateExpenseImportCsv(csv: string): ExpenseImportValidation {
  const parsedRows = parseCsvRows(csv);
  const rows: ExpenseImportPreviewRow[] = [];
  const validRows: ExpenseImportRow[] = [];

  if (parsedRows.length === 0) {
    return {
      rows: [
        {
          rowNumber: 1,
          expenseDate: "",
          category: "",
          description: "",
          amount: null,
          vendorName: null,
          receiptUrl: null,
          errors: { csv: "CSV wajib berisi header dan minimal 1 baris data." },
        },
      ],
      validRows,
      hasErrors: true,
    };
  }

  const [header, ...dataRows] = parsedRows;
  const indexes = buildHeaderIndexes(header);
  const missingHeaders = REQUIRED_IMPORT_HEADERS.filter(
    (name) => indexes[name] === undefined,
  );

  if (missingHeaders.length > 0) {
    return {
      rows: [
        {
          rowNumber: 1,
          expenseDate: "",
          category: "",
          description: "",
          amount: null,
          vendorName: null,
          receiptUrl: null,
          errors: {
            header: `Header wajib: ${REQUIRED_IMPORT_HEADERS.join(", ")}.`,
          },
        },
      ],
      validRows,
      hasErrors: true,
    };
  }

  for (const [index, cells] of dataRows.entries()) {
    if (cells.every((cell) => cell.trim().length === 0)) {
      continue;
    }

    const input = {
      expenseDate: getCell(cells, indexes.expenseDate),
      category: getCell(cells, indexes.category),
      description: getCell(cells, indexes.description),
      amount: getCell(cells, indexes.amount),
      vendorName: getCell(cells, indexes.vendorName),
      receiptUrl: getCell(cells, indexes.receiptUrl),
    };
    const validation = validateExpenseInput(input);
    const rowNumber = index + 2;

    if (validation.success) {
      rows.push({
        rowNumber,
        expenseDate: formatImportDate(validation.data.expenseDate),
        category: validation.data.category,
        description: validation.data.description,
        amount: validation.data.amount,
        vendorName: validation.data.vendorName,
        receiptUrl: validation.data.receiptUrl,
        errors: {},
      });
      validRows.push({ rowNumber, ...validation.data });
    } else {
      rows.push({
        rowNumber,
        expenseDate: String(input.expenseDate ?? ""),
        category: String(input.category ?? ""),
        description: String(input.description ?? ""),
        amount: parseImportAmount(input.amount),
        vendorName: normalizeOptionalString(input.vendorName),
        receiptUrl: normalizeOptionalString(input.receiptUrl),
        errors: validation.errors,
      });
    }
  }

  if (rows.length === 0) {
    rows.push({
      rowNumber: 2,
      expenseDate: "",
      category: "",
      description: "",
      amount: null,
      vendorName: null,
      receiptUrl: null,
      errors: { csv: "CSV belum memiliki baris data." },
    });
  }

  return {
    rows,
    validRows,
    hasErrors: rows.some((row) => Object.keys(row.errors).length > 0),
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

const REQUIRED_IMPORT_HEADERS = [
  "expenseDate",
  "category",
  "description",
  "amount",
] as const;

type ImportHeader =
  | (typeof REQUIRED_IMPORT_HEADERS)[number]
  | "vendorName"
  | "receiptUrl";

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

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim().length > 0)) {
    rows.push(row);
  }

  return rows;
}

function buildHeaderIndexes(header: string[]) {
  const indexes: Partial<Record<ImportHeader, number>> = {};
  for (const [index, value] of header.entries()) {
    const normalized = value.trim();
    if (isImportHeader(normalized)) {
      indexes[normalized] = index;
    }
  }
  return indexes;
}

function isImportHeader(value: string): value is ImportHeader {
  return [...REQUIRED_IMPORT_HEADERS, "vendorName", "receiptUrl"].includes(
    value as ImportHeader,
  );
}

function getCell(cells: string[], index: number | undefined) {
  return index === undefined ? "" : (cells[index] ?? "").trim();
}

function parseImportAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isInteger(amount) ? amount : null;
}

function formatImportDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
