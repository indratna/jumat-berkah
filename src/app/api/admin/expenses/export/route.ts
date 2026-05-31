import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { buildAdminExpensePdf } from "@/lib/admin-expense-pdf";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import {
  type AdminSortDirection,
  type ExpenseSortField,
  formatAdminDate,
  getAdminExpenses,
  normalizePage,
  normalizePageSize,
} from "@/lib/admin";

const expenseSortFields = new Set<ExpenseSortField>([
  "expenseDate",
  "amount",
  "category",
  "createdAt",
]);

export async function GET(request: Request) {
  const admin = await getAdminFromCookie();

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";
  const filters = {
    q: url.searchParams.get("q"),
    category: url.searchParams.get("category"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    page: normalizePage(1),
    pageSize: normalizePageSize(10_000),
    sort: getExpenseSort(url.searchParams.get("sort")),
    direction: getSortDirection(url.searchParams.get("direction")),
  };
  const expenses = await getAdminExpenses(filters);
  const prisma = getPrisma();

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "expense.exported",
      entityType: "expense",
      entityId: "admin-expense-export",
      before: Prisma.JsonNull,
      after: {
        format,
        q: filters.q,
        category: filters.category,
        from: filters.from,
        to: filters.to,
        sort: filters.sort,
        direction: filters.direction,
        total: expenses.total,
      },
    },
  });

  if (format === "csv") {
    const csv = buildExpenseCsv(expenses.items);
    return new Response(`\ufeff${csv}`, {
      headers: {
        "Content-Disposition": `attachment; filename="${buildFilename(filters.from, filters.to, format)}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "pdf") {
    return new Response(
      buildAdminExpensePdf({
        expenses: expenses.items,
        total: expenses.total,
        filters: {
          q: filters.q,
          category: filters.category,
          from: filters.from,
          to: filters.to,
        },
      }),
      {
        headers: {
          "Content-Disposition": `attachment; filename="${buildFilename(filters.from, filters.to, format)}"`,
          "Content-Type": "application/pdf",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    { errors: { format: "Format export tidak didukung." } },
    { status: 400 },
  );
}

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  return legacyAdmin ?? requireBetterAuthAdminUser(await headers());
}

function buildExpenseCsv(
  expenses: Awaited<ReturnType<typeof getAdminExpenses>>["items"],
) {
  const rows = [
    [
      "tanggal",
      "kategori",
      "deskripsi",
      "nominal",
      "vendor",
      "bukti",
      "dibuat",
    ],
    ...expenses.map((expense) => [
      formatAdminDate(expense.expenseDate),
      expense.category,
      expense.description,
      String(expense.amount),
      expense.vendorName ?? "",
      buildReceiptCsvCell(expense.receiptUrl),
      formatAdminDate(expense.createdAt),
    ]),
  ];

  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`;
}

function buildReceiptCsvCell(receiptUrl: string | null) {
  if (!receiptUrl) return "";
  return receiptUrl.startsWith("http")
    ? receiptUrl
    : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${receiptUrl}`;
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function buildFilename(from: string | null, to: string | null, format: string) {
  const suffix = [from, to].filter(Boolean).join("_");
  const extension = format === "pdf" ? "pdf" : "csv";
  return suffix
    ? `pengeluaran-${suffix}.${extension}`
    : `pengeluaran.${extension}`;
}

function getSortDirection(value: string | null): AdminSortDirection {
  return value === "asc" ? "asc" : "desc";
}

function getExpenseSort(value: string | null): ExpenseSortField {
  return value && expenseSortFields.has(value as ExpenseSortField)
    ? (value as ExpenseSortField)
    : "expenseDate";
}
