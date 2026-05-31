import { DonationStatus } from "@/generated/prisma/client";

export function getSafeNextDonationStatus(
  currentStatus: DonationStatus,
  requestedStatus: DonationStatus,
): DonationStatus {
  if (
    currentStatus === DonationStatus.settlement &&
    requestedStatus !== DonationStatus.refund
  ) {
    return currentStatus;
  }

  return requestedStatus;
}
