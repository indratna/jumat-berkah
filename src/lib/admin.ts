import {
  DonationStatus,
  ExpenseApprovalStatus,
} from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { getPublicDonorName } from "@/lib/reports";

export { formatRupiah } from "@/lib/format";

export type AdminSortDirection = "asc" | "desc";
export type DonationSortField = "createdAt" | "paidAt" | "amount" | "status";
export type ExpenseSortField =
  | "expenseDate"
  | "amount"
  | "category"
  | "createdAt";
export type AuditSortField = "createdAt" | "action" | "entityType";
export type DonorSortField =
  | "lastDonationAt"
  | "totalSettlementAmount"
  | "settlementCount"
  | "name";

export type AdminDonor = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  userId: string | null;
  totalSettlementAmount: number;
  settlementCount: number;
  donationCount: number;
  whatsappReminderOptIn: boolean;
  whatsappReminderOptInAt: Date | null;
  whatsappReminderOptOutAt: Date | null;
  lastDonationAt: Date | null;
  firstDonationAt: Date | null;
  donationOrderIds: string[];
};

export type DonorFilterParams = {
  q: string | null;
  activity: string | null;
  page: number;
  pageSize: number;
  sort: DonorSortField;
  direction: AdminSortDirection;
  selectedKey: string | null;
};

export type AuditLogFilterParams = {
  action: string | null;
  actor: string | null;
  entityType: string | null;
  from: string | null;
  to: string | null;
  page: number;
  pageSize: number;
  sort: AuditSortField;
  direction: AdminSortDirection;
};

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
      where: { approvalStatus: ExpenseApprovalStatus.approved },
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
        donorEmail: true,
        donorPhone: true,
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

export async function getAdminAuditLogs(filters: AuditLogFilterParams) {
  const prisma = getPrisma();
  const where = buildAuditLogWhere(filters);
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const [items, total, actions, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { [filters.sort]: filters.direction },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        before: true,
        after: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      orderBy: { action: "asc" },
      select: { action: true },
    }),
    prisma.auditLog.findMany({
      distinct: ["entityType"],
      orderBy: { entityType: "asc" },
      select: { entityType: true },
    }),
  ]);

  return {
    ...buildPaginatedResult({ items, total, page, pageSize }),
    actions: actions.map((item) => item.action),
    entityTypes: entityTypes.map((item) => item.entityType),
  };
}

export async function getAdminDonors(filters: DonorFilterParams) {
  const prisma = getPrisma();
  const [donorUsers, donations] = await Promise.all([
    prisma.user.findMany({
      where: { role: "donor" },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.donation.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        orderId: true,
        userId: true,
        donorName: true,
        donorEmail: true,
        donorPhone: true,
        whatsappReminderOptIn: true,
        whatsappReminderOptInAt: true,
        whatsappReminderOptOutAt: true,
        isAnonymous: true,
        status: true,
        amount: true,
        createdAt: true,
        paidAt: true,
      },
    }),
  ]);

  const donors = new Map<string, AdminDonor>();

  for (const user of donorUsers) {
    const key = buildAdminDonorKey({ userId: user.id, email: user.email });
    donors.set(key, {
      key,
      name: user.name?.trim() || "Donatur Terdaftar",
      email: user.email,
      phone: null,
      userId: user.id,
      totalSettlementAmount: 0,
      settlementCount: 0,
      donationCount: 0,
      whatsappReminderOptIn: false,
      whatsappReminderOptInAt: null,
      whatsappReminderOptOutAt: null,
      lastDonationAt: null,
      firstDonationAt: null,
      donationOrderIds: [],
    });
  }

  for (const donation of donations) {
    const key = buildAdminDonorKey({
      userId: donation.userId,
      email: donation.donorEmail,
      phone: donation.donorPhone,
      name: donation.donorName,
    });
    const donor = donors.get(key) ?? {
      key,
      name: getOperationalDonorName({
        donorName: donation.donorName,
        isAnonymous: donation.isAnonymous,
      }),
      email: normalizeContact(donation.donorEmail),
      phone: normalizeContact(donation.donorPhone),
      userId: donation.userId,
      totalSettlementAmount: 0,
      settlementCount: 0,
      donationCount: 0,
      whatsappReminderOptIn: false,
      whatsappReminderOptInAt: null,
      whatsappReminderOptOutAt: null,
      lastDonationAt: null,
      firstDonationAt: null,
      donationOrderIds: [],
    };

    donor.name = preferExisting(donor.name, donation.donorName);
    donor.email = donor.email ?? normalizeContact(donation.donorEmail);
    donor.phone = donor.phone ?? normalizeContact(donation.donorPhone);
    donor.userId = donor.userId ?? donation.userId;
    if (donation.donorPhone && donation.whatsappReminderOptIn) {
      donor.whatsappReminderOptIn = true;
      donor.whatsappReminderOptInAt = earliestDate(
        donor.whatsappReminderOptInAt,
        donation.whatsappReminderOptInAt ?? donation.createdAt,
      );
    }
    donor.whatsappReminderOptOutAt = latestDate(
      donor.whatsappReminderOptOutAt,
      donation.whatsappReminderOptOutAt,
    );
    donor.donationCount += 1;
    donor.donationOrderIds.push(donation.orderId);
    const activityAt = donation.paidAt ?? donation.createdAt;
    donor.lastDonationAt = latestDate(donor.lastDonationAt, activityAt);
    donor.firstDonationAt = earliestDate(donor.firstDonationAt, activityAt);

    if (donation.status === DonationStatus.settlement) {
      donor.totalSettlementAmount += donation.amount;
      donor.settlementCount += 1;
    }

    donors.set(key, donor);
  }

  const filtered = Array.from(donors.values())
    .filter((donor) => matchesDonorSearch(donor, filters.q))
    .filter((donor) => matchesDonorActivity(donor, filters.activity))
    .sort((left, right) =>
      compareDonors(left, right, filters.sort, filters.direction),
    );

  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const selectedDonor = filters.selectedKey
    ? (filtered.find((donor) => donor.key === filters.selectedKey) ??
      Array.from(donors.values()).find(
        (donor) => donor.key === filters.selectedKey,
      ) ??
      null)
    : null;

  return {
    ...buildPaginatedResult({
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    }),
    selectedDonor,
  };
}

export async function getAdminExpenseApprovals() {
  const prisma = getPrisma();
  const [pending, recentApprovals] = await Promise.all([
    prisma.expense.findMany({
      where: { approvalStatus: ExpenseApprovalStatus.pending_approval },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        expenseDate: true,
        category: true,
        description: true,
        amount: true,
        approvalRequired: true,
        createdAt: true,
        creator: { select: { name: true, email: true } },
        approvals: { select: { id: true } },
      },
    }),
    prisma.expenseApproval.findMany({
      orderBy: { approvedAt: "desc" },
      take: 50,
      select: {
        id: true,
        telegramUserId: true,
        approvedAt: true,
        expense: {
          select: {
            id: true,
            description: true,
            amount: true,
            category: true,
            approvalStatus: true,
          },
        },
      },
    }),
  ]);

  return { pending, recentApprovals };
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
      { donorEmail: { contains: filters.q, mode: "insensitive" } },
      { donorPhone: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildAuditLogWhere(filters: AuditLogFilterParams) {
  const where: Record<string, unknown> = {};
  const from = parseDateStart(filters.from);
  const to = parseDateEnd(filters.to);

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  if (filters.actor) {
    where.actor = {
      OR: [
        { name: { contains: filters.actor, mode: "insensitive" } },
        { email: { contains: filters.actor, mode: "insensitive" } },
      ],
    };
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

export function buildAdminDonorKey(input: {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}) {
  if (input.userId) {
    return `user:${input.userId}`;
  }

  const email = normalizeContact(input.email)?.toLowerCase();
  if (email) {
    return `email:${email}`;
  }

  const phone = normalizePhone(input.phone);
  if (phone) {
    return `phone:${phone}`;
  }

  const name = input.name?.trim().toLowerCase();
  if (name) {
    return `name:${name}`;
  }

  return "anonymous:unknown";
}

function normalizeContact(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizePhone(value: string | null | undefined) {
  return normalizeContact(value)?.replace(/[^0-9+]/g, "") ?? null;
}

function getOperationalDonorName(input: {
  donorName: string | null;
  isAnonymous: boolean;
}) {
  if (input.isAnonymous) {
    return "Anonim";
  }

  return input.donorName?.trim() || "Tanpa Nama";
}

function preferExisting(current: string, next: string | null) {
  if (current !== "Anonim" && current !== "Tanpa Nama") {
    return current;
  }

  return next?.trim() || current;
}

function latestDate(current: Date | null, next: Date | null) {
  if (!next) {
    return current;
  }

  return current && current > next ? current : next;
}

function earliestDate(current: Date | null, next: Date | null) {
  if (!next) {
    return current;
  }

  return current && current < next ? current : next;
}

function matchesDonorSearch(donor: AdminDonor, query: string | null) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  return [donor.name, donor.email, donor.phone]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

function matchesDonorActivity(donor: AdminDonor, activity: string | null) {
  if (activity === "settlement") {
    return donor.settlementCount > 0;
  }

  if (activity === "no_settlement") {
    return donor.settlementCount === 0;
  }

  return true;
}

function compareDonors(
  left: AdminDonor,
  right: AdminDonor,
  sort: DonorSortField,
  direction: AdminSortDirection,
) {
  const multiplier = direction === "asc" ? 1 : -1;

  if (sort === "name") {
    return left.name.localeCompare(right.name, "id-ID") * multiplier;
  }

  if (sort === "lastDonationAt") {
    return (
      (dateValue(left.lastDonationAt) - dateValue(right.lastDonationAt)) *
      multiplier
    );
  }

  return (left[sort] - right[sort]) * multiplier;
}

function dateValue(date: Date | null) {
  return date?.getTime() ?? 0;
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
  const expenseWhere = {
    approvalStatus: ExpenseApprovalStatus.approved,
    ...(from || to
      ? {
          expenseDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

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
