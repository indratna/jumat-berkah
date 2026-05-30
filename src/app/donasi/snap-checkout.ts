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
