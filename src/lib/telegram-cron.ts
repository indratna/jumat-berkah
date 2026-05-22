import {
  DonationStatus,
  ExpenseApprovalStatus,
  Prisma,
} from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import {
  formatJakartaDateTime,
  formatRupiah,
  getTelegramBotToken,
  getTelegramNotifyChatId,
  isTelegramNotifyEnabled,
  safeSendTelegramMessage,
} from "@/lib/telegram";

export const CRON_SECRET_HEADER = "x-cron-secret";
const LOW_BALANCE_ALERT_ACTION = "telegram.alert.low_balance";
const PENDING_DONATION_ALERT_ACTION = "telegram.alert.pending_donation";
const INVALID_SIGNATURE_ALERT_ACTION = "telegram.alert.invalid_signature";
const DAILY_SUMMARY_ACTION = "telegram.summary.daily";
const WEEKLY_SUMMARY_ACTION = "telegram.summary.weekly";

export type TelegramCronSummary = {
  periodLabel: string;
  income: number;
  expenses: number;
  currentBalance: number;
  pendingCount: number;
  pendingAmount: number;
};

export type LowBalanceDecision = {
  shouldAlert: boolean;
  threshold: number;
  currentBalance: number;
};

export type InvalidSignatureAlertDecision = {
  shouldAlert: boolean;
  invalidCount: number;
  windowMinutes: number;
};

export function getCronSecretFromHeaders(headers: Headers): string | null {
  const headerValue = headers.get(CRON_SECRET_HEADER);

  if (headerValue) {
    return headerValue;
  }

  const authorization = headers.get("authorization");
  const prefix = "Bearer ";

  if (authorization?.startsWith(prefix)) {
    return authorization.slice(prefix.length).trim();
  }

  return null;
}

export function verifyCronSecret(headerValue: string | null): boolean {
  const secret = process.env.CRON_SECRET;

  if (typeof secret !== "string" || secret.trim().length === 0) {
    return false;
  }

  return headerValue === secret.trim();
}

export function getLowBalanceThreshold(): number | null {
  const value = process.env.TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH;

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function getInvalidSignatureAlertWindowMinutes(): number {
  const value = process.env.TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES;
  const parsed = typeof value === "string" ? Number(value.trim()) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 30;
}

export function shouldSendLowBalanceAlert(input: {
  currentBalance: number;
  threshold: number | null;
  alreadySent: boolean;
}): LowBalanceDecision {
  const threshold = input.threshold ?? 0;

  return {
    threshold,
    currentBalance: input.currentBalance,
    shouldAlert:
      input.threshold !== null &&
      input.currentBalance < input.threshold &&
      !input.alreadySent,
  };
}

export function shouldSendInvalidSignatureAlert(input: {
  invalidCount: number;
  windowMinutes: number;
  alreadySentInWindow: boolean;
}): InvalidSignatureAlertDecision {
  return {
    invalidCount: input.invalidCount,
    windowMinutes: input.windowMinutes,
    shouldAlert: input.invalidCount > 0 && !input.alreadySentInWindow,
  };
}

export async function runDailyTelegramCron(now = new Date()) {
  if (!canSendTelegramCron()) {
    return { sent: false, reason: "telegram-disabled" as const };
  }

  const prisma = getPrisma();
  const chatId = getTelegramNotifyChatId();

  if (chatId === null) {
    return { sent: false, reason: "missing-chat" as const };
  }

  const startOfToday = getJakartaStartOfDay(now);
  const startOfTomorrow = addDays(startOfToday, 1);
  const dailyKey = formatJakartaDate(startOfToday);
  const existingDaily = await prisma.auditLog.findFirst({
    where: { action: DAILY_SUMMARY_ACTION, entityId: dailyKey },
    select: { id: true },
  });

  const summary = await buildTelegramCronSummary({
    periodLabel: `Hari ini (${dailyKey})`,
    from: startOfToday,
    to: startOfTomorrow,
  });

  const messages: string[] = [];

  if (!existingDaily) {
    messages.push(formatSummaryMessage("📊 Ringkasan Harian", summary));
  }

  const lowBalance = await evaluateLowBalanceAlert(summary.currentBalance);
  if (lowBalance.shouldAlert) {
    messages.push(formatLowBalanceMessage(lowBalance));
  }

  const pendingDonations = await findUnalertedPendingDonations(now);
  for (const donation of pendingDonations) {
    messages.push(formatPendingDonationMessage(donation));
  }

  const invalidSignature = await evaluateInvalidSignatureAlert(now);
  if (invalidSignature.shouldAlert) {
    messages.push(formatInvalidSignatureMessage(invalidSignature));
  }

  if (messages.length === 0) {
    return { sent: false, reason: "no-alerts" as const };
  }

  const sent = await safeSendTelegramMessage({
    chatId,
    text: messages.join("\n\n---\n\n"),
  });

  if (!sent) {
    return { sent: false, reason: "send-failed" as const };
  }

  await prisma.$transaction(async (tx) => {
    if (!existingDaily) {
      await tx.auditLog.create({
        data: {
          action: DAILY_SUMMARY_ACTION,
          entityType: "telegram_cron",
          entityId: dailyKey,
          before: Prisma.JsonNull,
          after: summary as unknown as Prisma.InputJsonValue,
        },
      });
    }

    if (lowBalance.shouldAlert) {
      await tx.auditLog.create({
        data: {
          action: LOW_BALANCE_ALERT_ACTION,
          entityType: "telegram_alert",
          entityId: "low_balance",
          before: Prisma.JsonNull,
          after: lowBalance as unknown as Prisma.InputJsonValue,
        },
      });
    }

    for (const donation of pendingDonations) {
      await tx.auditLog.create({
        data: {
          action: PENDING_DONATION_ALERT_ACTION,
          entityType: "donation",
          entityId: donation.id,
          before: Prisma.JsonNull,
          after: {
            orderId: donation.orderId,
            amount: donation.amount,
            createdAt: donation.createdAt.toISOString(),
          },
        },
      });
    }

    if (invalidSignature.shouldAlert) {
      await tx.auditLog.create({
        data: {
          action: INVALID_SIGNATURE_ALERT_ACTION,
          entityType: "midtrans_webhook_log",
          entityId: `invalid_signature:${formatJakartaDateTime(now)}`,
          before: Prisma.JsonNull,
          after: invalidSignature as unknown as Prisma.InputJsonValue,
        },
      });
    }
  });

  return { sent: true, messageCount: messages.length };
}

export async function runWeeklyTelegramCron(now = new Date()) {
  if (!canSendTelegramCron()) {
    return { sent: false, reason: "telegram-disabled" as const };
  }

  const chatId = getTelegramNotifyChatId();
  if (chatId === null) {
    return { sent: false, reason: "missing-chat" as const };
  }

  const prisma = getPrisma();
  const startOfWeek = getJakartaStartOfWeek(now);
  const startOfNextWeek = addDays(startOfWeek, 7);
  const weeklyKey = formatJakartaDate(startOfWeek);
  const existingWeekly = await prisma.auditLog.findFirst({
    where: { action: WEEKLY_SUMMARY_ACTION, entityId: weeklyKey },
    select: { id: true },
  });

  if (existingWeekly) {
    return { sent: false, reason: "already-sent" as const };
  }

  const summary = await buildTelegramCronSummary({
    periodLabel: `Minggu ini (mulai ${weeklyKey})`,
    from: startOfWeek,
    to: startOfNextWeek,
  });

  const sent = await safeSendTelegramMessage({
    chatId,
    text: formatSummaryMessage("🕌 Rekap Jumat Pagi", summary),
  });

  if (!sent) {
    return { sent: false, reason: "send-failed" as const };
  }

  await prisma.auditLog.create({
    data: {
      action: WEEKLY_SUMMARY_ACTION,
      entityType: "telegram_cron",
      entityId: weeklyKey,
      before: Prisma.JsonNull,
      after: summary as unknown as Prisma.InputJsonValue,
    },
  });

  return { sent: true, messageCount: 1 };
}

async function buildTelegramCronSummary(input: {
  periodLabel: string;
  from: Date;
  to: Date;
}): Promise<TelegramCronSummary> {
  const prisma = getPrisma();
  const [periodIncome, periodExpenses, totalIncome, totalExpenses, pending] =
    await Promise.all([
      prisma.donation.aggregate({
        where: {
          status: DonationStatus.settlement,
          paidAt: { gte: input.from, lt: input.to },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          approvalStatus: ExpenseApprovalStatus.approved,
          expenseDate: { gte: input.from, lt: input.to },
        },
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
      prisma.donation.aggregate({
        where: { status: DonationStatus.pending },
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

  const allTimeIncome = totalIncome._sum.amount ?? 0;
  const allTimeExpenses = totalExpenses._sum.amount ?? 0;

  return {
    periodLabel: input.periodLabel,
    income: periodIncome._sum.amount ?? 0,
    expenses: periodExpenses._sum.amount ?? 0,
    currentBalance: allTimeIncome - allTimeExpenses,
    pendingCount: pending._count.id,
    pendingAmount: pending._sum.amount ?? 0,
  };
}

async function evaluateLowBalanceAlert(currentBalance: number) {
  const prisma = getPrisma();
  const threshold = getLowBalanceThreshold();
  const existing = await prisma.auditLog.findFirst({
    where: { action: LOW_BALANCE_ALERT_ACTION, entityId: "low_balance" },
    select: { id: true },
  });

  return shouldSendLowBalanceAlert({
    currentBalance,
    threshold,
    alreadySent: Boolean(existing),
  });
}

async function findUnalertedPendingDonations(now: Date) {
  const prisma = getPrisma();
  const cutoff = new Date(now.getTime() - 60 * 60 * 1000);
  const donations = await prisma.donation.findMany({
    where: { status: DonationStatus.pending, createdAt: { lte: cutoff } },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true, orderId: true, amount: true, createdAt: true },
  });

  const alerted = await prisma.auditLog.findMany({
    where: {
      action: PENDING_DONATION_ALERT_ACTION,
      entityId: { in: donations.map((donation) => donation.id) },
    },
    select: { entityId: true },
  });
  const alertedIds = new Set(alerted.map((entry) => entry.entityId));

  return donations.filter((donation) => !alertedIds.has(donation.id));
}

async function evaluateInvalidSignatureAlert(now: Date) {
  const prisma = getPrisma();
  const windowMinutes = getInvalidSignatureAlertWindowMinutes();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const [invalidCount, existingAlert] = await Promise.all([
    prisma.midtransWebhookLog.count({
      where: { signatureValid: false, receivedAt: { gte: windowStart } },
    }),
    prisma.auditLog.findFirst({
      where: {
        action: INVALID_SIGNATURE_ALERT_ACTION,
        createdAt: { gte: windowStart },
      },
      select: { id: true },
    }),
  ]);

  return shouldSendInvalidSignatureAlert({
    invalidCount,
    windowMinutes,
    alreadySentInWindow: Boolean(existingAlert),
  });
}

function canSendTelegramCron(): boolean {
  return (
    isTelegramNotifyEnabled() &&
    getTelegramBotToken() !== null &&
    getTelegramNotifyChatId() !== null
  );
}

function formatSummaryMessage(title: string, summary: TelegramCronSummary) {
  return [
    title,
    `Periode: ${summary.periodLabel}`,
    `Pemasukan: ${formatRupiah(summary.income)}`,
    `Pengeluaran: ${formatRupiah(summary.expenses)}`,
    `Saldo sekarang: ${formatRupiah(summary.currentBalance)}`,
    `Donasi pending: ${summary.pendingCount} (${formatRupiah(summary.pendingAmount)})`,
  ].join("\n");
}

function formatLowBalanceMessage(input: LowBalanceDecision) {
  return [
    "⚠️ Saldo Rendah",
    `Saldo sekarang: ${formatRupiah(input.currentBalance)}`,
    `Ambang batas: ${formatRupiah(input.threshold)}`,
  ].join("\n");
}

function formatPendingDonationMessage(input: {
  orderId: string;
  amount: number;
  createdAt: Date;
}) {
  return [
    "⏳ Donasi Pending > 1 Jam",
    `Order: ${input.orderId}`,
    `Nominal: ${formatRupiah(input.amount)}`,
    `Dibuat: ${formatJakartaDateTime(input.createdAt)}`,
  ].join("\n");
}

function formatInvalidSignatureMessage(input: InvalidSignatureAlertDecision) {
  return [
    "🚨 Signature Midtrans Tidak Valid",
    `Jumlah webhook invalid: ${input.invalidCount}`,
    `Window: ${input.windowMinutes} menit`,
  ].join("\n");
}

function getJakartaStartOfDay(date: Date) {
  const parts = getJakartaDateParts(date);
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, -7, 0, 0, 0),
  );
}

function getJakartaStartOfWeek(date: Date) {
  const startOfDay = getJakartaStartOfDay(date);
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
  const weekdayIndex = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(weekday);
  const daysFromMonday = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
  return addDays(startOfDay, -daysFromMonday);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getJakartaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: string) => {
    const part = parts.find((entry) => entry.type === type)?.value;
    return part ? Number(part) : 0;
  };

  return { year: value("year"), month: value("month"), day: value("day") };
}

function formatJakartaDate(date: Date) {
  const parts = getJakartaDateParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}
