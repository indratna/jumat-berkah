export const PAYMENT_WINDOW_HOURS = 24;

export const PAYMENT_REDIRECT_STORAGE_PREFIX = "jumat-berkah:payment-redirect:";

export const LAST_ORDER_STORAGE_KEY = "jumat-berkah:last-order";

export type LastOrderSnapshot = {
  orderId: string;
  amount: number;
  savedAt: number;
};

const FINAL_DONATION_STATUSES = new Set([
  "settlement",
  "expire",
  "cancel",
  "deny",
  "failure",
  "refund",
]);

const FAILED_DONATION_STATUSES = new Set(["cancel", "deny", "failure", "refund"]);

export type DonationStatusTone = "waiting" | "success" | "failed" | "expired";

/**
 * Only `settlement` counts as paid. Everything else must not be shown as
 * income, so the UI keeps a distinct tone per status family.
 */
export function resolveDonationStatusTone(status: string): DonationStatusTone {
  if (status === "settlement") {
    return "success";
  }

  if (status === "expire") {
    return "expired";
  }

  if (FAILED_DONATION_STATUSES.has(status)) {
    return "failed";
  }

  return "waiting";
}

/** Polling stops once Midtrans sends a terminal status. */
export function isFinalDonationStatus(status: string): boolean {
  return FINAL_DONATION_STATUSES.has(status);
}

/** Donor-facing wording; raw Midtrans status values are internal vocabulary. */
export function getPaymentStatusLabel(status: string): string {
  const tone = resolveDonationStatusTone(status);

  if (tone === "success") {
    return "Pembayaran berhasil";
  }

  if (tone === "expired") {
    return "Kedaluwarsa";
  }

  if (tone === "failed") {
    return "Tidak berhasil";
  }

  return "Menunggu pembayaran";
}

export function getPaymentRedirectStorageKey(orderId: string): string {
  return `${PAYMENT_REDIRECT_STORAGE_PREFIX}${orderId}`;
}

/**
 * Midtrans Snap's default expiry is 24 hours from transaction creation. The
 * real deadline lives inside Snap, so this stays an estimate for the UI.
 */
export function getEstimatedPaymentDeadline(
  createdAt: Date,
  windowHours = PAYMENT_WINDOW_HOURS,
): Date | null {
  if (Number.isNaN(createdAt.getTime()) || windowHours <= 0) {
    return null;
  }

  return new Date(createdAt.getTime() + windowHours * 60 * 60 * 1000);
}

export function isPaymentDeadlineExpired(
  createdAt: Date,
  now: Date,
  windowHours = PAYMENT_WINDOW_HOURS,
): boolean {
  const deadline = getEstimatedPaymentDeadline(createdAt, windowHours);

  if (!deadline) {
    return false;
  }

  return deadline.getTime() <= now.getTime();
}

/**
 * Remembers the most recent order so a page refresh or a closed tab does not
 * lose the transaction the donor was paying for.
 */
export function writeLastOrder(
  storage: Pick<Storage, "setItem">,
  input: { orderId: string; amount: number },
): void {
  storage.setItem(
    LAST_ORDER_STORAGE_KEY,
    JSON.stringify({ ...input, savedAt: Date.now() }),
  );
}

export function readLastOrder(
  storage: Pick<Storage, "getItem">,
): LastOrderSnapshot | null {
  const raw = storage.getItem(LAST_ORDER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    if (
      typeof record.orderId !== "string" ||
      typeof record.amount !== "number" ||
      typeof record.savedAt !== "number"
    ) {
      return null;
    }

    return {
      orderId: record.orderId,
      amount: record.amount,
      savedAt: record.savedAt,
    };
  } catch {
    return null;
  }
}

/** Only surface the resume banner while the Snap payment window is plausible. */
export function isLastOrderFresh(
  snapshot: LastOrderSnapshot,
  now = Date.now(),
  windowHours = PAYMENT_WINDOW_HOURS,
): boolean {
  const age = now - snapshot.savedAt;
  return Number.isFinite(age) && age >= 0 && age < windowHours * 60 * 60 * 1000;
}