import { DonationStatus } from "@/generated/prisma/client";

export const MIN_DONATION_AMOUNT = 1_000;

type DonationInput = {
  donorName?: unknown;
  donorEmail?: unknown;
  donorPhone?: unknown;
  isAnonymous?: unknown;
  showNamePublicly?: unknown;
  amount?: unknown;
  message?: unknown;
};

export type ValidDonationInput = {
  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
  amount: number;
  message: string | null;
};

export type DonationValidationResult =
  | { success: true; data: ValidDonationInput }
  | { success: false; errors: Record<string, string> };

export function validateDonationInput(input: DonationInput): DonationValidationResult {
  const errors: Record<string, string> = {};
  const isAnonymous = input.isAnonymous === true;
  const showNamePublicly = input.showNamePublicly !== false && !isAnonymous;
  const donorName = normalizeOptionalString(input.donorName);
  const donorEmail = normalizeOptionalString(input.donorEmail);
  const donorPhone = normalizeOptionalString(input.donorPhone);
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
