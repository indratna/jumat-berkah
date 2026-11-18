export const PAYMENT_WINDOW_HOURS = 24;

export const PAYMENT_REDIRECT_STORAGE_PREFIX = "jumat-berkah:payment-redirect:";

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