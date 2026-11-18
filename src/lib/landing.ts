import {
  DonationStatus,
  ExpenseApprovalStatus,
} from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { getFridayCycleBoundsForStart } from "@/lib/friday-cycle";
import { countDistinctDonors, formatRelativeTime } from "@/lib/landing-stats";
import { calculateCostPerPortion } from "@/lib/portion-estimate";
import { getPublicDonorName } from "@/lib/reports";
import {
  type WeeklyTargetProgress,
  getWeeklyTargetProgress,
} from "@/lib/weekly-target";

export type LandingStory = {
  id: string;
  title: string;
  summary: string;
  cycleStart: Date;
  publishedAt: Date;
  coverImageUrl: string | null;
  packageCount: number | null;
  locationSummary: string | null;
};

export type LandingRecentDonation = {
  id: string;
  donorName: string;
  amount: number;
  relativeTime: string;
};

export type LandingSocialProof = {
  donorCount: number;
  settlementCount: number;
  totalPortions: number;
  recentDonations: LandingRecentDonation[];
};

const MAX_SETTLEMENTS_SCANNED = 5_000;
const RECENT_DONATION_LIMIT = 5;

export async function getLandingProgress(
  now = new Date(),
): Promise<WeeklyTargetProgress> {
  return getWeeklyTargetProgress(now);
}

export async function getLandingStories(limit = 3): Promise<LandingStory[]> {
  const prisma = getPrisma();
  const records = await prisma.distributionReport.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { cycleStart: "desc" },
    take: Math.max(1, Math.min(limit, 6)),
    select: {
      id: true,
      title: true,
      summary: true,
      cycleStart: true,
      publishedAt: true,
      photoUrls: true,
      packageCount: true,
      locationSummary: true,
    },
  });

  return records.map((record) => ({
    id: record.id,
    title: record.title,
    summary: record.summary,
    cycleStart: record.cycleStart,
    publishedAt: record.publishedAt ?? record.cycleStart,
    coverImageUrl: pickFirstPublicImageUrl(record.photoUrls),
    packageCount: record.packageCount,
    locationSummary: record.locationSummary,
  }));
}

/**
 * Cost per portion comes from the latest published distribution report.
 * Approved expenses of that cycle are used first because they reflect actual
 * spending; settlement income is a fallback when expenses are not recorded.
 */
export async function getLandingCostPerPortion(): Promise<number | null> {
  const prisma = getPrisma();
  const report = await prisma.distributionReport.findFirst({
    where: {
      publishedAt: { not: null },
      packageCount: { gt: 0 },
    },
    orderBy: { cycleStart: "desc" },
    select: { cycleStart: true, packageCount: true },
  });

  if (!report?.packageCount) {
    return null;
  }

  const cycleStartDate = report.cycleStart.toISOString().slice(0, 10);
  const bounds = getFridayCycleBoundsForStart(cycleStartDate);

  if (!bounds) {
    return null;
  }

  const [expenses, donations] = await Promise.all([
    prisma.expense.aggregate({
      where: {
        approvalStatus: ExpenseApprovalStatus.approved,
        expenseDate: { gte: bounds.from, lte: bounds.to },
      },
      _sum: { amount: true },
    }),
    prisma.donation.aggregate({
      where: {
        status: DonationStatus.settlement,
        paidAt: { gte: bounds.from, lte: bounds.to },
      },
      _sum: { amount: true },
    }),
  ]);

  // Real spending is preferred; settlement income is the fallback so the
  // estimate stays grounded in that cycle's actual data.
  const totalCost = expenses._sum.amount || donations._sum.amount || 0;

  return calculateCostPerPortion(totalCost, report.packageCount);
}

/**
 * Aggregated, privacy-safe social proof. Returns null when there is nothing to
 * show so the landing page can hide the section entirely.
 */
export async function getLandingSocialProof(
  now = new Date(),
): Promise<LandingSocialProof | null> {
  const prisma = getPrisma();

  const [settlementCount, donorRows, portions] = await Promise.all([
    prisma.donation.count({ where: { status: DonationStatus.settlement } }),
    prisma.donation.findMany({
      where: { status: DonationStatus.settlement },
      orderBy: { paidAt: "desc" },
      take: MAX_SETTLEMENTS_SCANNED,
      select: {
        id: true,
        userId: true,
        donorEmail: true,
        donorPhone: true,
        donorName: true,
        isAnonymous: true,
        showNamePublicly: true,
        amount: true,
        paidAt: true,
        createdAt: true,
      },
    }),
    prisma.distributionReport.aggregate({
      where: { publishedAt: { not: null } },
      _sum: { packageCount: true },
    }),
  ]);

  if (settlementCount === 0) {
    return null;
  }

  return {
    settlementCount,
    donorCount: countDistinctDonors(donorRows),
    totalPortions: portions._sum.packageCount ?? 0,
    recentDonations: donorRows
      .slice(0, RECENT_DONATION_LIMIT)
      .map((donation) => ({
        id: donation.id,
        donorName: getPublicDonorName({
          donorName: donation.donorName,
          isAnonymous: donation.isAnonymous,
          showNamePublicly: donation.showNamePublicly,
        }),
        amount: donation.amount,
        relativeTime: formatRelativeTime(
          donation.paidAt ?? donation.createdAt,
          now,
        ),
      })),
  };
}

function pickFirstPublicImageUrl(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }
    const trimmed = entry.trim();
    if (
      /^https?:\/\//i.test(trimmed) ||
      trimmed.startsWith("/uploads/distribution/")
    ) {
      return trimmed;
    }
  }

  return null;
}