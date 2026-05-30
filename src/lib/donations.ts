import { DonationStatus } from "@/generated/prisma/client";

export const MIN_DONATION_AMOUNT = 1_000;

type DonationInput = {
  donorName?: unknown;
  donorEmail?: unknown;
  donorPhone?: unknown;
  whatsappReminderOptIn?: unknown;
  isAnonymous?: unknown;
  showNamePublicly?: unknown;
  amount?: unknown;
  message?: unknown;
};

export type ValidDonationInput = {
  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  whatsappReminderOptIn: boolean;
  whatsappReminderOptInAt: Date | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
  amount: number;
  message: string | null;
};

export type DonationValidationResult =
  | { success: true; data: ValidDonationInput }
  | { success: false; errors: Record<string, string> };

export function validateDonationInput(
  input: DonationInput,
): DonationValidationResult {
  const errors: Record<string, string> = {};
  const isAnonymous = input.isAnonymous === true;
  const showNamePublicly = input.showNamePublicly !== false && !isAnonymous;
  const donorName = normalizeOptionalString(input.donorName);
  const donorEmail = normalizeOptionalString(input.donorEmail);
  const donorPhone = normalizeOptionalString(input.donorPhone);
  const whatsappReminderOptIn =
    input.whatsappReminderOptIn === true && Boolean(donorPhone);
  const whatsappReminderOptInAt = whatsappReminderOptIn ? new Date() : null;
  const message = normalizeOptionalString(input.message);
  const amount = normalizeAmount(input.amount);

  if (!isAnonymous && !donorName) {
    errors.donorName = "Nama wajib diisi atau pilih donasi anonim.";
  }

  if (donorEmail && !isValidEmail(donorEmail)) {
    errors.donorEmail = "Format email tidak valid.";
  }

  if (amount === null || amount < MIN_DONATION_AMOUNT) {
    errors.amount = `Nominal minimal Rp${MIN_DONATION_AMOUNT.toLocaleString("id-ID")}.`;
  }

  if (Object.keys(errors).length > 0 || amount === null) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      donorName: isAnonymous ? null : donorName,
      donorEmail,
      donorPhone,
      whatsappReminderOptIn,
      whatsappReminderOptInAt,
      isAnonymous,
      showNamePublicly,
      amount,
      message,
    },
  };
}

export function createDonationOrderId(date = new Date()) {
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("-", "");
  const randomPart = crypto.randomUUID().split("-")[0].toUpperCase();

  return `JB-${datePart}-${randomPart}`;
}

export function getInitialDonationStatus() {
  return DonationStatus.pending;
}

export function normalizeDonationAccountEmail(
  value: string | null | undefined,
) {
  const normalized = value?.trim().toLowerCase();
  return normalized && isValidEmail(normalized) ? normalized : null;
}

export function shouldAttachDonationToUser(input: {
  donationEmail: string | null;
  existingUserId: string | null;
  accountEmail: string;
}) {
  const donationEmail = normalizeDonationAccountEmail(input.donationEmail);
  const accountEmail = normalizeDonationAccountEmail(input.accountEmail);

  return Boolean(
    donationEmail &&
    accountEmail &&
    donationEmail === accountEmail &&
    !input.existingUserId,
  );
}

export async function attachOrphanDonationsToUser(input: {
  userId: string;
  email: string;
}) {
  const email = normalizeDonationAccountEmail(input.email);

  if (!email) {
    return { attachedCount: 0 };
  }

  const { Prisma } = await import("@/generated/prisma/client");
  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const result = await prisma.donation.updateMany({
    where: {
      donorEmail: { equals: email, mode: "insensitive" },
      userId: null,
    },
    data: { userId: input.userId },
  });

  if (result.count > 0) {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.userId,
        action: "donor_account_attached_donations",
        entityType: "user",
        entityId: input.userId,
        before: Prisma.JsonNull,
        after: { attachedCount: result.count, email },
      },
    });
  }

  return { attachedCount: result.count };
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
