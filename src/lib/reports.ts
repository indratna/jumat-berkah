import {
  DonationStatus,
  ExpenseApprovalStatus,
} from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { getCurrentFridayCycleRange } from "@/lib/friday-cycle";

export type ReportDateRange = {
  from: Date | null;
  to: Date | null;
};

export function parseReportDateRange(params: URLSearchParams): ReportDateRange {
  if (params.get("period") === "jumat") {
    const cycle = getCurrentFridayCycleRange();
    return { from: cycle.from, to: cycle.to };
  }

  return {
    from: parseDateStart(params.get("from")),
    to: parseDateEnd(params.get("to")),
  };
}

export async function getCurrentFridayCycleReport(now = new Date()) {
  const cycle = getCurrentFridayCycleRange(now);
  const report = await getPublicReport({ from: cycle.from, to: cycle.to });

  return { cycle, report };
}

export async function getPublicReport(range: ReportDateRange) {
  const prisma = getPrisma();
  const donationDateFilter = buildDateFilter(range, "paidAt");
  const expenseDateFilter = {
    approvalStatus: ExpenseApprovalStatus.approved,
    ...buildDateFilter(range, "expenseDate"),
  };

  const [
    periodIncome,
    periodExpenses,
    totalIncome,
    totalExpenses,
    donations,
    expenses,
    distributions,
  ] = await Promise.all([
    prisma.donation.aggregate({
      where: { status: DonationStatus.settlement, ...donationDateFilter },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: expenseDateFilter,
      _sum: { amount: true },
    }),
    prisma.donation.aggregate({
      where: { status: DonationStatus.settlement },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { approvalStatus: ExpenseApprovalStatus.approved },
      _sum: { amount: true },
    }),
    prisma.donation.findMany({
      where: { status: DonationStatus.settlement, ...donationDateFilter },
      orderBy: { paidAt: "desc" },
      take: 50,
      select: {
        paidAt: true,
        createdAt: true,
        donorName: true,
        isAnonymous: true,
        showNamePublicly: true,
        amount: true,
        message: true,
      },
    }),
    prisma.expense.findMany({
      where: expenseDateFilter,
      orderBy: { expenseDate: "desc" },
      take: 50,
      select: {
        expenseDate: true,
        category: true,
        description: true,
        amount: true,
      },
    }),
    prisma.distributionReport.findMany({
      where: {
        publishedAt: { not: null },
        ...buildDateFilter(range, "cycleStart"),
      },
      orderBy: { cycleStart: "desc" },
      take: 20,
      select: {
        cycleStart: true,
        title: true,
        summary: true,
        packageCount: true,
        locationSummary: true,
      },
    }),
  ]);

  const income = periodIncome._sum.amount ?? 0;
  const expenseTotal = periodExpenses._sum.amount ?? 0;
  const allTimeIncome = totalIncome._sum.amount ?? 0;
  const allTimeExpenses = totalExpenses._sum.amount ?? 0;

  return {
    summary: {
      income,
      expenses: expenseTotal,
      periodBalance: income - expenseTotal,
      currentBalance: allTimeIncome - allTimeExpenses,
    },
    donations: donations.map((donation) => ({
      date: formatDate(donation.paidAt ?? donation.createdAt),
      donorName: getPublicDonorName({
        donorName: donation.donorName,
        isAnonymous: donation.isAnonymous,
        showNamePublicly: donation.showNamePublicly,
      }),
      amount: donation.amount,
      message: donation.message,
    })),
    expenses: expenses.map((expense) => ({
      date: formatDate(expense.expenseDate),
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
    })),
    expenseCategories: summarizeExpenseCategories(expenses),
    timeline: buildPublicTimeline({ donations, expenses, distributions }),
  };
}

export function getPublicDonorName(input: {
  donorName: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
}) {
  if (input.isAnonymous || !input.showNamePublicly || !input.donorName) {
    return "Anonim";
  }

  return input.donorName;
}

export type PublicTimelineItem = {
  type: "donation" | "expense" | "distribution";
  date: string;
  sortDate: Date;
  title: string;
  description: string;
  amount: number | null;
  meta: string | null;
};

export function buildPublicTimeline(input: {
  donations: Array<{
    paidAt: Date | null;
    createdAt: Date;
    donorName: string | null;
    isAnonymous: boolean;
    showNamePublicly: boolean;
    amount: number;
    message: string | null;
  }>;
  expenses: Array<{
    expenseDate: Date;
    category: string;
    description: string;
    amount: number;
  }>;
  distributions: Array<{
    cycleStart: Date;
    title: string;
    summary: string;
    packageCount: number | null;
    locationSummary: string | null;
  }>;
}): PublicTimelineItem[] {
  const donationItems: PublicTimelineItem[] = input.donations.map(
    (donation) => {
      const date = donation.paidAt ?? donation.createdAt;
      const donorName = getPublicDonorName({
        donorName: donation.donorName,
        isAnonymous: donation.isAnonymous,
        showNamePublicly: donation.showNamePublicly,
      });

      return {
        type: "donation",
        date: formatDate(date),
        sortDate: date,
        title: `Donasi dari ${donorName}`,
        description: donation.message ?? "Donasi berhasil diterima.",
        amount: donation.amount,
        meta: "Donasi berhasil",
      };
    },
  );

  const expenseItems: PublicTimelineItem[] = input.expenses.map((expense) => ({
    type: "expense",
    date: formatDate(expense.expenseDate),
    sortDate: expense.expenseDate,
    title: expense.category,
    description: expense.description,
    amount: expense.amount,
    meta: "Pengeluaran program",
  }));

  const distributionItems: PublicTimelineItem[] = input.distributions.map(
    (distribution) => ({
      type: "distribution",
      date: formatDate(distribution.cycleStart),
      sortDate: distribution.cycleStart,
      title: distribution.title,
      description: distribution.summary,
      amount: null,
      meta: buildDistributionMeta(distribution),
    }),
  );

  return [...donationItems, ...expenseItems, ...distributionItems]
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
    .slice(0, 30);
}

export function summarizeExpenseCategories(
  expenses: Array<{ category: string; amount: number }>,
) {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    totals.set(
      expense.category,
      (totals.get(expense.category) ?? 0) + expense.amount,
    );
  }

  return Array.from(totals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
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

function buildDistributionMeta(distribution: {
  packageCount: number | null;
  locationSummary: string | null;
}) {
  const parts: string[] = [];
  if (distribution.packageCount !== null) {
    parts.push(`${distribution.packageCount} paket`);
  }
  if (distribution.locationSummary) {
    parts.push(distribution.locationSummary);
  }
  return parts.length > 0 ? parts.join(" • ") : "Penyaluran dipublikasikan";
}

function buildDateFilter(
  range: ReportDateRange,
  field: "paidAt" | "expenseDate" | "cycleStart",
) {
  if (!range.from && !range.to) {
    return {};
  }

  return {
    [field]: {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    },
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
