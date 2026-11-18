import { formatRupiah } from "@/lib/format";

export const MIN_DONATION_AMOUNT = 1_000;

export const PRESET_DONATION_AMOUNTS = [
  10_000, 25_000, 50_000, 100_000,
] as const;

const MAX_AMOUNT_DIGITS = 12;

/** Keep only digits so inputs can accept "Rp 25.000", "25 000", etc. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Format a raw amount into grouped digits for a text input.
 * Intl is avoided for grouping so very long strings stay safe.
 */
export function formatAmountDigits(value: string | number): string {
  const digits = digitsOnly(String(value))
    .replace(/^0+(?=\d)/, "")
    .slice(0, MAX_AMOUNT_DIGITS);

  if (!digits) {
    return "";
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseDonationAmount(value: string | number): number | null {
  const digits =
    typeof value === "number" ? String(Math.trunc(value)) : digitsOnly(value);

  if (!digits) {
    return null;
  }

  const amount = Number(digits);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

export function validateDonationAmount(value: string | number): string | null {
  const amount = parseDonationAmount(value);

  if (amount === null) {
    return "Masukkan nominal donasi lebih dulu.";
  }

  if (amount < MIN_DONATION_AMOUNT) {
    return `Nominal minimal ${formatRupiah(MIN_DONATION_AMOUNT)}.`;
  }

  return null;
}

export function isPresetDonationAmount(
  amount: number | null,
): amount is (typeof PRESET_DONATION_AMOUNTS)[number] {
  return (
    amount !== null &&
    PRESET_DONATION_AMOUNTS.includes(
      amount as (typeof PRESET_DONATION_AMOUNTS)[number],
    )
  );
}

export function buildDonationHref(amount?: number | null): string {
  const validAmount = amount != null ? parseDonationAmount(amount) : null;
  return validAmount ? `/donasi?nominal=${validAmount}` : "/donasi";
}