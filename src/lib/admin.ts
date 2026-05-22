import { DonationStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { getPublicDonorName } from "@/lib/reports";

export type AdminSortDirection = "asc" | "desc";
export type DonationSortField = "createdAt" | "paidAt" | "amount" | "status";
export type ExpenseSortField =
  | "expenseDate"
  | "amount"
  | "category"
  | "createdAt";

export type DonationFilterParams = {
  status: string | null;
  q: string | null;
  from: string | null;
  to: string | null;
  page: number;
  pageSize: number;
  sort: DonationSortField;
  direction: AdminSortDirection;
};

export type ExpenseFilterParams = {
  q: string | null;
  category: string | null;
  from: string | null;
  to: string | null;
  page: number;
  pageSize: number;
  sort: ExpenseSortField;
  direction: AdminSortDirection;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminDashboardSummary() {
  const prisma = getPrisma();
  const [income, expenses, pendingDonations] = await Promise.all([
    prisma.donation.aggregate({
      where: { status: DonationStatus.settlement },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),
    prisma.donation.count({ where: { status: DonationStatus.pending } }),
  ]);

  const totalIncome = income._sum.amount ?? 0;
  const totalExpenses = expenses._sum.amount ?? 0;

  return {
    income: totalIncome,
    expenses: totalExpenses,
    balance: totalIncome - totalExpenses,
    pendingDonations,
  };
}

export async function getAdminDonations(filters: DonationFilterParams) {
  const prisma = getPrisma();
  const where = buildDonationWhere(filters);
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy: buildDonationOrderBy(filters.sort, filters.direction),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderId: true,
        donorName: true,
        isAnonymous: true,
        showNamePublicly: true,
        amount: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        paidAt: true,
        message: true,
      },
    }),
    prisma.donation.count({ where }),
  ]);

  return buildPaginatedResult({ items, total, page, pageSize });
}

export async function getAdminExpenses(filters: ExpenseFilterParams) {
  const prisma = getPrisma();
  const where = buildExpenseWhere(filters);
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: buildExpenseOrderBy(filters.sort, filters.direction),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        expenseDate: true,
        category: true,
        description: true,
        amount: true,
        vendorName: true,
        receiptUrl: true,
        createdAt: true,
        creator: { select: { name: true, email: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return buildPaginatedResult({ items, total, page, pageSize });
}

function buildDonationWhere(filters: DonationFilterParams) {
  const where: Record<string, unknown> = {};
  const status = normalizeStatus(filters.status);
  const from = parseDateStart(filters.from);
  const to = parseDateEnd(filters.to);

  if (status) {
    where.status = status;
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  if (filters.q) {
    where.OR = [
      { orderId: { contains: filters.q, mode: "insensitive" } },
      { donorName: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildExpenseWhere(filters: ExpenseFilterParams) {
  const where: Record<string, unknown> = {};
  const from = parseDateStart(filters.from);
  const to = parseDateEnd(filters.to);

  if (filters.category) {
    where.category = filters.category;
  }

  if (from || to) {
    where.expenseDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  if (filters.q) {
    where.OR = [
      { description: { contains: filters.q, mode: "insensitive" } },
      { vendorName: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildDonationOrderBy(
  sort: DonationSortField,
  direction: AdminSortDirection,
) {
  return { [sort]: direction };
}

function buildExpenseOrderBy(
  sort: ExpenseSortField,
  direction: AdminSortDirection,
) {
  return { [sort]: direction };
}

function buildPaginatedResult<T>(input: {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}): PaginatedResult<T> {
  return {
    items: input.items,
    total: input.total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(input.total / input.pageSize)),
  };
}

export function normalizePage(value: number) {
  return Number.isInteger(value) && value > 0 ? value : 1;
}

export function normalizePageSize(value: number) {
  return [10, 25, 50, 100].includes(value) ? value : 10;
}

function normalizeStatus(status: string | null) {
  if (!status) {
    return null;
  }

  return Object.values(DonationStatus).includes(status as DonationStatus)
    ? (status as DonationStatus)
    : null;
}

function parseDateStart(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getAdminReportExport(filters: {
  from: string | null;
  to: string | null;
}) {
  const prisma = getPrisma();
  const from = parseDateStart(filters.from);
  const to = parseDateEnd(filters.to);
  const donationWhere =
    from || to
      ? {
          paidAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {};
  const expenseWhere =
    from || to
      ? {
          expenseDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {};

  const [donations, expenses] = await Promise.all([
    prisma.donation.findMany({
      where: { status: DonationStatus.settlement, ...donationWhere },
      orderBy: { paidAt: "desc" },
      select: {
        orderId: true,
        donorName: true,
        isAnonymous: true,
        showNamePublicly: true,
        amount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        message: true,
      },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      orderBy: { expenseDate: "desc" },
      select: {
        expenseDate: true,
        category: true,
        description: true,
        amount: true,
        vendorName: true,
      },
    }),
  ]);

  const rows = [
    [
      "jenis",
      "tanggal",
      "referensi",
      "nama",
      "kategori",
      "deskripsi",
      "nominal",
      "status",
    ],
    ...donations.map((donation) => [
      "donasi",
      formatDateInput(donation.paidAt ?? donation.createdAt),
      donation.orderId,
      getPublicDonorName({
        donorName: donation.donorName,
        isAnonymous: donation.isAnonymous,
        showNamePublicly: donation.showNamePublicly,
      }),
      "",
      donation.message ?? "",
      String(donation.amount),
      donation.status,
    ]),
    ...expenses.map((expense) => [
      "pengeluaran",
      formatDateInput(expense.expenseDate),
      "",
      expense.vendorName ?? "",
      expense.category,
      expense.description,
      String(-expense.amount),
      "tercatat",
    ]),
  ];

  return rows.map(formatCsvRow).join("\n");
}

function formatCsvRow(values: string[]) {
  return values.map(formatCsvCell).join(",");
}

function formatCsvCell(value: string) {
  const normalized = value.replaceAll('"', '""');
  return `"${normalized}"`;
}

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAdminDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function formatAdminDateOnly(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function formatDateInput(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function getAdminDonorName(input: {
  donorName: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
}) {
  if (input.isAnonymous) {
    return "Anonim";
  }

  if (input.donorName) {
    return input.donorName;
  }

  return input.showNamePublicly ? "Tanpa Nama" : "Disembunyikan";
}
