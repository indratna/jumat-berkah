import { DonationStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";

export type ReportDateRange = {
  from: Date | null;
  to: Date | null;
};

export function parseReportDateRange(params: URLSearchParams): ReportDateRange {
  return {
    from: parseDateStart(params.get("from")),
    to: parseDateEnd(params.get("to")),
  };
}

export async function getPublicReport(range: ReportDateRange) {
  const prisma = getPrisma();
  const donationDateFilter = buildDateFilter(range, "paidAt");
  const expenseDateFilter = buildDateFilter(range, "expenseDate");

  const [
    periodIncome,
    periodExpenses,
    totalIncome,
    totalExpenses,
    donations,
    expenses,
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
    prisma.expense.aggregate({ _sum: { amount: true } }),
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

function buildDateFilter(
  range: ReportDateRange,
  field: "paidAt" | "expenseDate",
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
