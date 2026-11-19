import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { formatRupiah } from "@/lib/format";

const DEFAULT_BATCH_LIMIT = 20;
const MAX_BATCH_LIMIT = 100;
const DEFAULT_API_VERSION = "v20.0";

export const WHATSAPP_REMINDER_ACTION = "whatsapp.reminder.batch";

export type WhatsAppReminderConfig = {
  enabled: boolean;
  accessToken: string | null;
  phoneNumberId: string | null;
  templateName: string;
  templateLanguage: string;
  apiVersion: string;
  defaultCountryCode: string;
  batchLimit: number;
};

export type WhatsAppReminderRecipient = {
  phone: string;
  donorName: string;
  donationCount: number;
  totalSettlementAmount: number;
  lastDonationAt: Date | null;
};

export type WhatsAppReminderSendResult = {
  phone: string;
  ok: boolean;
  status: number | null;
  error: string | null;
};

export type WhatsAppReminderBatchResult = {
  ok: boolean;
  dryRun: boolean;
  providerEnabled: boolean;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  recipients: WhatsAppReminderRecipient[];
  results: WhatsAppReminderSendResult[];
};

export function getWhatsAppReminderConfig(
  env: Record<string, string | undefined> = process.env,
): WhatsAppReminderConfig {
  return {
    enabled: env.WHATSAPP_REMINDER_ENABLED === "true",
    accessToken: normalizeEnvString(env.WHATSAPP_CLOUD_ACCESS_TOKEN),
    phoneNumberId: normalizeEnvString(env.WHATSAPP_CLOUD_PHONE_NUMBER_ID),
    templateName:
      normalizeEnvString(env.WHATSAPP_REMINDER_TEMPLATE_NAME) ??
      "jumat_berkah_reminder",
    templateLanguage:
      normalizeEnvString(env.WHATSAPP_REMINDER_TEMPLATE_LANGUAGE) ?? "id",
    apiVersion:
      normalizeEnvString(env.WHATSAPP_CLOUD_API_VERSION) ?? DEFAULT_API_VERSION,
    defaultCountryCode:
      normalizeEnvString(env.WHATSAPP_DEFAULT_COUNTRY_CODE) ?? "62",
    batchLimit: normalizeBatchLimit(env.WHATSAPP_REMINDER_BATCH_LIMIT),
  };
}

export function isWhatsAppProviderConfigured(config: WhatsAppReminderConfig) {
  return Boolean(config.enabled && config.accessToken && config.phoneNumberId);
}

export async function getWhatsAppReminderRecipients(
  limit = DEFAULT_BATCH_LIMIT,
): Promise<WhatsAppReminderRecipient[]> {
  const prisma = getPrisma();
  const donations = await prisma.donation.findMany({
    where: {
      whatsappReminderOptIn: true,
      whatsappReminderOptOutAt: null,
      donorPhone: { not: null },
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    select: {
      donorName: true,
      donorPhone: true,
      amount: true,
      status: true,
      paidAt: true,
      createdAt: true,
    },
    take: Math.min(Math.max(limit * 5, limit), 500),
  });

  const byPhone = new Map<string, WhatsAppReminderRecipient>();

  for (const donation of donations) {
    const normalizedPhone = normalizeWhatsAppPhone(donation.donorPhone);

    if (!normalizedPhone) {
      continue;
    }

    const existing = byPhone.get(normalizedPhone);
    const donorName = donation.donorName?.trim() || "Sahabat Jumat Berkah";
    const settlementAmount =
      donation.status === "settlement" ? donation.amount : 0;
    const lastDonationAt = donation.paidAt ?? donation.createdAt ?? null;

    if (existing) {
      existing.donationCount += 1;
      existing.totalSettlementAmount += settlementAmount;
      if (
        lastDonationAt &&
        (!existing.lastDonationAt || lastDonationAt > existing.lastDonationAt)
      ) {
        existing.lastDonationAt = lastDonationAt;
      }
      continue;
    }

    byPhone.set(normalizedPhone, {
      phone: normalizedPhone,
      donorName,
      donationCount: 1,
      totalSettlementAmount: settlementAmount,
      lastDonationAt,
    });

    if (byPhone.size >= limit) {
      break;
    }
  }

  return [...byPhone.values()];
}

export async function sendWhatsAppReminderBatch(options: {
  dryRun: boolean;
  actorUserId?: string | null;
  limit?: number;
  reason?: string;
  config?: WhatsAppReminderConfig;
}): Promise<WhatsAppReminderBatchResult> {
  const config = options.config ?? getWhatsAppReminderConfig();
  const limit = Math.min(
    Math.max(options.limit ?? config.batchLimit, 1),
    MAX_BATCH_LIMIT,
  );
  const recipients = await getWhatsAppReminderRecipients(limit);
  const providerEnabled = isWhatsAppProviderConfigured(config);
  const results: WhatsAppReminderSendResult[] = [];

  if (!options.dryRun && providerEnabled) {
    for (const recipient of recipients) {
      const result = await sendWhatsAppTemplateMessage({
        config,
        recipient,
      });
      results.push(result);
    }
  }

  const sentCount = results.filter((result) => result.ok).length;
  const failedCount = results.filter((result) => !result.ok).length;
  const skippedCount = options.dryRun || !providerEnabled ? recipients.length : 0;

  await getPrisma().auditLog.create({
    data: {
      actorUserId: options.actorUserId ?? null,
      action: WHATSAPP_REMINDER_ACTION,
      entityType: "whatsapp_reminder",
      entityId: formatJakartaDate(new Date()),
      before: Prisma.JsonNull,
      after: {
        dryRun: options.dryRun,
        reason: options.reason ?? null,
        providerEnabled,
        recipientCount: recipients.length,
        sentCount,
        failedCount,
        skippedCount,
        resultPreview: results.slice(0, 10),
      },
    },
  });

  return {
    ok: failedCount === 0,
    dryRun: options.dryRun,
    providerEnabled,
    recipientCount: recipients.length,
    sentCount,
    failedCount,
    skippedCount,
    recipients,
    results,
  };
}

export async function sendWhatsAppTemplateMessage(options: {
  config: WhatsAppReminderConfig;
  recipient: WhatsAppReminderRecipient;
}): Promise<WhatsAppReminderSendResult> {
  const { config, recipient } = options;

  if (!config.accessToken || !config.phoneNumberId) {
    return {
      phone: recipient.phone,
      ok: false,
      status: null,
      error: "whatsapp-provider-not-configured",
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient.phone,
          type: "template",
          template: {
            name: config.templateName,
            language: { code: config.templateLanguage },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: recipient.donorName },
                  {
                    type: "text",
                    text: formatRupiah(recipient.totalSettlementAmount),
                  },
                ],
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      return {
        phone: recipient.phone,
        ok: false,
        status: response.status,
        error: await safeResponseText(response),
      };
    }

    return { phone: recipient.phone, ok: true, status: response.status, error: null };
  } catch (error) {
    return {
      phone: recipient.phone,
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : "unknown-whatsapp-error",
    };
  }
}

export function normalizeWhatsAppPhone(phone: string | null) {
  if (!phone) {
    return null;
  }

  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^0-9]/g, "");

  if (digits.startsWith("0") && digits.length > 1) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  if (trimmed.startsWith("+") && digits.length > 0) {
    return digits;
  }

  return digits.length >= 8 ? digits : null;
}

function normalizeEnvString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeBatchLimit(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_BATCH_LIMIT;
  }

  return Math.min(parsed, MAX_BATCH_LIMIT);
}

async function safeResponseText(response: Response) {
  const text = await response.text().catch(() => "");
  return text.slice(0, 500) || `HTTP ${response.status}`;
}

function formatJakartaDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}
