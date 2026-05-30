import { DonationStatus } from "@/generated/prisma/client";

export type DashboardDonation = {
  id: string;
  orderId: string;
  amount: number;
  status: DonationStatus;
  isAnonymous: boolean;
  showNamePublicly: boolean;
  message: string | null;
  createdAt: Date;
  paidAt: Date | null;
};

export type DonorDashboardStats = {
  totalSuccessful: number;
  transactionCount: number;
  pendingCount: number;
};

export function calculateDonorDashboardStats(
  donations: DashboardDonation[],
): DonorDashboardStats {
  return {
    totalSuccessful: donations
      .filter((donation) => donation.status === DonationStatus.settlement)
      .reduce((total, donation) => total + donation.amount, 0),
    transactionCount: donations.length,
    pendingCount: donations.filter(
      (donation) => donation.status === DonationStatus.pending,
    ).length,
  };
}

export function getLatestDonationSummary(donations: DashboardDonation[]) {
  return [...donations].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  )[0] ?? null;
}

export function getDonationStatusTone(status: DonationStatus) {
  if (status === DonationStatus.settlement) {
    return {
      label: "Berhasil",
      className: "border-green-200 bg-green-50 text-green-800",
    };
  }

  if (status === DonationStatus.pending) {
    return {
      label: "Menunggu",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (status === DonationStatus.expire) {
    return {
      label: "Kedaluwarsa",
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (status === DonationStatus.refund) {
    return {
      label: "Refund",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  return {
    label: "Gagal",
    className: "border-red-200 bg-red-50 text-red-800",
  };
}

export function getDonationPrivacyLabel(input: {
  isAnonymous: boolean;
  showNamePublicly: boolean;
}) {
  if (input.isAnonymous) {
    return "Anonim";
  }

  return input.showNamePublicly ? "Nama tampil publik" : "Nama disamarkan";
}

export function getDonorDisplayName(input: {
  name: string | null;
  email: string;
}) {
  const name = input.name?.trim();
  if (name) {
    return name;
  }

  const email = input.email.trim();
  return email || "Donatur";
}

export function getTargetDashboardCopy(input: {
  targetAmount: number;
  collected: number;
  remaining: number;
  progressRatio: number;
}) {
  if (input.targetAmount <= 0) {
    return {
      hasTarget: false,
      progressPercent: 0,
      title: "Target Jumat belum diatur.",
    };
  }

  return {
    hasTarget: true,
    progressPercent: Math.round(input.progressRatio * 100),
    title: "Target Jumat berjalan",
  };
}
