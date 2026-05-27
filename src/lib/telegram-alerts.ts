import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { safeSendAdminAlertEmail } from "@/lib/email";
import {
  formatJakartaDateTime,
  formatRupiah,
  getTelegramBotToken,
  getTelegramNotifyChatId,
  isTelegramNotifyEnabled,
  safeSendTelegramMessage,
} from "@/lib/telegram";

export const FAILED_ADMIN_LOGIN_ACTION = "admin.login.failed";
export const FAILED_ADMIN_LOGIN_ALERT_ACTION = "alert.failed_admin_login";
export const CRITICAL_AUDIT_ALERT_ACTION = "alert.critical_audit";
export const HEALTH_ALERT_ACTION = "alert.health";

const DEFAULT_FAILED_LOGIN_THRESHOLD = 5;
const DEFAULT_FAILED_LOGIN_WINDOW_MINUTES = 15;
const DEFAULT_ALERT_COOLDOWN_MINUTES = 30;

export type FailedLoginAlertDecision = {
  shouldAlert: boolean;
  failedCount: number;
  threshold: number;
  windowMinutes: number;
  cooldownMinutes: number;
};

export type CooldownDecision = {
  allowed: boolean;
  cooldownMinutes: number;
};

export function getFailedLoginAlertThreshold(): number {
  return parsePositiveInteger(
    process.env.TELEGRAM_FAILED_LOGIN_ALERT_THRESHOLD,
    DEFAULT_FAILED_LOGIN_THRESHOLD,
  );
}

export function getFailedLoginAlertWindowMinutes(): number {
  return parsePositiveInteger(
    process.env.TELEGRAM_FAILED_LOGIN_ALERT_WINDOW_MINUTES,
    DEFAULT_FAILED_LOGIN_WINDOW_MINUTES,
  );
}

export function getTelegramAlertCooldownMinutes(): number {
  return parsePositiveInteger(
    process.env.TELEGRAM_ALERT_COOLDOWN_MINUTES,
    DEFAULT_ALERT_COOLDOWN_MINUTES,
  );
}

export function getLargeExpenseAlertThreshold(): number | null {
  const value = process.env.TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH;

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function shouldSendFailedLoginAlert(input: {
  failedCount: number;
  threshold: number;
  windowMinutes: number;
  cooldownMinutes: number;
  cooldownActive: boolean;
}): FailedLoginAlertDecision {
  return {
    failedCount: input.failedCount,
    threshold: input.threshold,
    windowMinutes: input.windowMinutes,
    cooldownMinutes: input.cooldownMinutes,
    shouldAlert: input.failedCount >= input.threshold && !input.cooldownActive,
  };
}

export function shouldSendCooldownAlert(input: {
  cooldownActive: boolean;
  cooldownMinutes: number;
}): CooldownDecision {
  return {
    allowed: !input.cooldownActive,
    cooldownMinutes: input.cooldownMinutes,
  };
}

export function isCriticalAuditEvent(input: {
  action: string;
  amount?: number | null;
  largeExpenseThreshold: number | null;
}): boolean {
  if (input.action === "expense.deleted") {
    return true;
  }

  if (input.action !== "expense.created") {
    return false;
  }

  return (
    input.largeExpenseThreshold !== null &&
    typeof input.amount === "number" &&
    input.amount >= input.largeExpenseThreshold
  );
}

export async function recordFailedAdminLogin(input: {
  email: string;
  ipAddress: string | null;
  now?: Date;
}) {
  const prisma = getPrisma();
  const now = input.now ?? new Date();

  await prisma.auditLog.create({
    data: {
      action: FAILED_ADMIN_LOGIN_ACTION,
      entityType: "auth",
      entityId: input.email || "unknown",
      before: Prisma.JsonNull,
      after: {
        email: input.email || null,
        ipAddress: input.ipAddress,
        createdAt: now.toISOString(),
      },
    },
  });

  await maybeSendFailedAdminLoginAlert(now);
}

export async function maybeSendFailedAdminLoginAlert(now = new Date()) {
  const prisma = getPrisma();
  const threshold = getFailedLoginAlertThreshold();
  const windowMinutes = getFailedLoginAlertWindowMinutes();
  const cooldownMinutes = getTelegramAlertCooldownMinutes();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const cooldownStart = new Date(now.getTime() - cooldownMinutes * 60 * 1000);

  const [failedCount, recentAlert] = await Promise.all([
    prisma.auditLog.count({
      where: {
        action: FAILED_ADMIN_LOGIN_ACTION,
        createdAt: { gte: windowStart },
      },
    }),
    prisma.auditLog.findFirst({
      where: {
        action: FAILED_ADMIN_LOGIN_ALERT_ACTION,
        createdAt: { gte: cooldownStart },
      },
      select: { id: true },
    }),
  ]);

  const decision = shouldSendFailedLoginAlert({
    failedCount,
    threshold,
    windowMinutes,
    cooldownMinutes,
    cooldownActive: Boolean(recentAlert),
  });

  if (!decision.shouldAlert) {
    return { sent: false, reason: "below-threshold" as const, decision };
  }

  const text = formatFailedLoginAlertMessage(decision, now);
  const [telegramSent, emailResult] = await Promise.all([
    safeSendTelegramAlert(text),
    safeSendAdminAlertEmail({
      title: "Percobaan Login Admin Gagal Berulang",
      bodyLines: [
        `Jumlah gagal: ${decision.failedCount}`,
        `Ambang batas: ${decision.threshold} dalam ${decision.windowMinutes} menit`,
        `Cooldown alert: ${decision.cooldownMinutes} menit`,
      ],
      occurredAt: now,
    }),
  ]);

  if (!telegramSent && !emailResult.sent) {
    return { sent: false, reason: "send-failed" as const, decision };
  }

  await prisma.auditLog.create({
    data: {
      action: FAILED_ADMIN_LOGIN_ALERT_ACTION,
      entityType: "auth",
      entityId: "failed_admin_login",
      before: Prisma.JsonNull,
      after: {
        ...decision,
        telegramSent,
        emailSent: emailResult.sent,
      },
    },
  });

  return { sent: true, decision };
}

export async function maybeSendCriticalAuditAlert(input: {
  action: "expense.created" | "expense.deleted";
  entityId: string;
  actorLabel: string;
  amount: number | null;
  description: string | null;
  occurredAt?: Date;
}) {
  const threshold = getLargeExpenseAlertThreshold();

  if (
    !isCriticalAuditEvent({
      action: input.action,
      amount: input.amount,
      largeExpenseThreshold: threshold,
    })
  ) {
    return { sent: false, reason: "not-critical" as const };
  }

  const prisma = getPrisma();
  const cooldownMinutes = getTelegramAlertCooldownMinutes();
  const occurredAt = input.occurredAt ?? new Date();
  const cooldownStart = new Date(
    occurredAt.getTime() - cooldownMinutes * 60 * 1000,
  );
  const recentAlert = await prisma.auditLog.findFirst({
    where: {
      action: CRITICAL_AUDIT_ALERT_ACTION,
      entityId: `${input.action}:${input.entityId}`,
      createdAt: { gte: cooldownStart },
    },
    select: { id: true },
  });
  const cooldown = shouldSendCooldownAlert({
    cooldownActive: Boolean(recentAlert),
    cooldownMinutes,
  });

  if (!cooldown.allowed) {
    return { sent: false, reason: "cooldown" as const };
  }

  const text = formatCriticalAuditAlertMessage({ ...input, occurredAt });
  const title =
    input.action === "expense.deleted"
      ? "Pengeluaran Dihapus"
      : "Pengeluaran Besar Dibuat";
  const [telegramSent, emailResult] = await Promise.all([
    safeSendTelegramAlert(text),
    safeSendAdminAlertEmail({
      title,
      bodyLines: [
        `Aksi: ${input.action}`,
        `ID: ${input.entityId}`,
        `Aktor: ${input.actorLabel}`,
        `Nominal: ${input.amount === null ? "-" : formatRupiah(input.amount)}`,
        `Deskripsi: ${input.description ?? "-"}`,
      ],
      occurredAt,
    }),
  ]);

  if (!telegramSent && !emailResult.sent) {
    return { sent: false, reason: "send-failed" as const };
  }

  await prisma.auditLog.create({
    data: {
      action: CRITICAL_AUDIT_ALERT_ACTION,
      entityType: "expense",
      entityId: `${input.action}:${input.entityId}`,
      before: Prisma.JsonNull,
      after: {
        action: input.action,
        entityId: input.entityId,
        actorLabel: input.actorLabel,
        amount: input.amount,
        description: input.description,
        occurredAt: occurredAt.toISOString(),
        telegramSent,
        emailSent: emailResult.sent,
      },
    },
  });

  return { sent: true };
}

export async function runTelegramHealthAlert(now = new Date()) {
  const prisma = getPrisma();
  const problems: string[] = [];

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    problems.push("Database tidak bisa diakses.");
  }

  if (!process.env.MIDTRANS_SERVER_KEY) {
    problems.push("MIDTRANS_SERVER_KEY kosong.");
  }

  if (!process.env.ADMIN_LOGIN_CODE) {
    problems.push("ADMIN_LOGIN_CODE kosong.");
  }

  if (problems.length === 0) {
    return { sent: false, reason: "healthy" as const };
  }

  const cooldownMinutes = getTelegramAlertCooldownMinutes();
  const cooldownStart = new Date(now.getTime() - cooldownMinutes * 60 * 1000);
  const recentAlert = await prisma.auditLog.findFirst({
    where: {
      action: HEALTH_ALERT_ACTION,
      createdAt: { gte: cooldownStart },
    },
    select: { id: true },
  });

  if (recentAlert) {
    return { sent: false, reason: "cooldown" as const };
  }

  const text = formatHealthAlertMessage(problems, now);
  const [telegramSent, emailResult] = await Promise.all([
    safeSendTelegramAlert(text),
    safeSendAdminAlertEmail({
      title: "Health Check Bermasalah",
      bodyLines: problems.map((problem) => `- ${problem}`),
      occurredAt: now,
    }),
  ]);

  if (!telegramSent && !emailResult.sent) {
    return { sent: false, reason: "send-failed" as const };
  }

  await prisma.auditLog.create({
    data: {
      action: HEALTH_ALERT_ACTION,
      entityType: "system",
      entityId: "health",
      before: Prisma.JsonNull,
      after: {
        problems,
        occurredAt: now.toISOString(),
        cooldownMinutes,
        telegramSent,
        emailSent: emailResult.sent,
      },
    },
  });

  return { sent: true, problems };
}

async function safeSendTelegramAlert(text: string): Promise<boolean> {
  if (!canSendTelegramAlert()) {
    return false;
  }

  const chatId = getTelegramNotifyChatId();
  if (chatId === null) {
    return false;
  }

  return safeSendTelegramMessage({ chatId, text });
}

function canSendTelegramAlert(): boolean {
  return (
    isTelegramNotifyEnabled() &&
    getTelegramBotToken() !== null &&
    getTelegramNotifyChatId() !== null
  );
}

function formatFailedLoginAlertMessage(
  input: FailedLoginAlertDecision,
  now: Date,
) {
  return [
    "🚨 Percobaan Login Admin Gagal Berulang",
    `Jumlah gagal: ${input.failedCount}`,
    `Ambang batas: ${input.threshold} dalam ${input.windowMinutes} menit`,
    `Cooldown alert: ${input.cooldownMinutes} menit`,
    `Waktu: ${formatJakartaDateTime(now)}`,
  ].join("\n");
}

function formatCriticalAuditAlertMessage(input: {
  action: "expense.created" | "expense.deleted";
  entityId: string;
  actorLabel: string;
  amount: number | null;
  description: string | null;
  occurredAt: Date;
}) {
  const title =
    input.action === "expense.deleted"
      ? "🚨 Pengeluaran Dihapus"
      : "⚠️ Pengeluaran Besar Dibuat";

  return [
    title,
    `Aksi: ${input.action}`,
    `ID: ${input.entityId}`,
    `Aktor: ${input.actorLabel}`,
    `Nominal: ${input.amount === null ? "-" : formatRupiah(input.amount)}`,
    `Deskripsi: ${input.description ?? "-"}`,
    `Waktu: ${formatJakartaDateTime(input.occurredAt)}`,
  ].join("\n");
}

function formatHealthAlertMessage(problems: string[], now: Date) {
  return [
    "🚨 Health Check Bermasalah",
    ...problems.map((problem) => `- ${problem}`),
    `Waktu: ${formatJakartaDateTime(now)}`,
  ].join("\n");
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = typeof value === "string" ? Number(value.trim()) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
