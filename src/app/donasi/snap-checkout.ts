import type {
  DonationPaymentHandoff,
  SnapCallbackKind,
  SnapWindow,
} from "./snap-types";

export function buildDonationStatusUrl(orderId: string) {
  return `/donasi/status/${orderId}`;
}

export function resolveSnapCallbackDestination(input: {
  orderId: string;
  callback: SnapCallbackKind;
}) {
  return buildDonationStatusUrl(input.orderId);
}

export function canUseSnapPopup(
  payment: DonationPaymentHandoff | undefined,
  currentWindow: Window | undefined,
) {
  const snapWindow = currentWindow as SnapWindow | undefined;

  return Boolean(payment?.snapToken && snapWindow?.snap?.pay);
}

export function resolveFallbackRedirect(input: {
  payment: DonationPaymentHandoff | undefined;
  orderId: string;
}) {
  return input.payment?.redirectUrl ?? buildDonationStatusUrl(input.orderId);
}

export function getMidtransSnapScriptSrc(isProduction: boolean) {
  return isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export type DonationHandoff =
  | { kind: "popup"; snapToken: string }
  | { kind: "redirect"; url: string }
  | { kind: "none" };

/**
 * Single decision point after the donation API responds. A token alone is not
 * enough: when Snap.js is still loading (or failed), the redirect URL must win
 * so the donor is never left on a spinner.
 */
export function chooseDonationHandoff(input: {
  payment: DonationPaymentHandoff | undefined;
  orderId: string;
  snapReady: boolean;
}): DonationHandoff {
  if (!input.payment) {
    return { kind: "none" };
  }

  if (input.snapReady && input.payment.snapToken) {
    return { kind: "popup", snapToken: input.payment.snapToken };
  }

  if (input.payment.redirectUrl) {
    return { kind: "redirect", url: input.payment.redirectUrl };
  }

  return { kind: "none" };
}
