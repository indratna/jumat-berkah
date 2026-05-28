import { DonationStatus } from "@/generated/prisma/client";

export type AdminDonationStatusGroup = DonationStatus;

type StatusTone = "pending" | "settlement" | "failed" | "neutral";

export const adminDonationStatusMeta: Record<
  AdminDonationStatusGroup,
  { label: string; tone: StatusTone }
> = {
  [DonationStatus.pending]: { label: "Pending", tone: "pending" },
  [DonationStatus.settlement]: { label: "Settlement", tone: "settlement" },
  [DonationStatus.expire]: { label: "Expired", tone: "failed" },
  [DonationStatus.cancel]: { label: "Cancel", tone: "failed" },
  [DonationStatus.deny]: { label: "Deny", tone: "failed" },
  [DonationStatus.failure]: { label: "Failure", tone: "failed" },
  [DonationStatus.refund]: { label: "Refund", tone: "neutral" },
};

const toneClasses: Record<StatusTone, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  settlement: "bg-green-50 text-green-700 ring-green-200",
  failed: "bg-rose-50 text-rose-800 ring-rose-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function AdminStatusBadge({ status }: { status: DonationStatus }) {
  const meta = adminDonationStatusMeta[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
}
