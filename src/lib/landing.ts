import { getPrisma } from "@/lib/db";
import { type FridayCycleRange } from "@/lib/friday-cycle";
import { getCurrentFridayCycleReport } from "@/lib/reports";
import {
  type WeeklyTargetProgress,
  getWeeklyTargetProgress,
} from "@/lib/weekly-target";

export type LandingMetrics = {
  cycle: FridayCycleRange;
  income: number;
  expenses: number;
  periodBalance: number;
  currentBalance: number;
  lastUpdatedAt: Date;
};

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

export async function getLandingMetrics(
  now = new Date(),
): Promise<LandingMetrics> {
  const { cycle, report } = await getCurrentFridayCycleReport(now);

  return {
    cycle,
    income: report.summary.income,
    expenses: report.summary.expenses,
    periodBalance: report.summary.periodBalance,
    currentBalance: report.summary.currentBalance,
    lastUpdatedAt: now,
  };
}

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
    coverImageUrl: pickFirstHttpsUrl(record.photoUrls),
    packageCount: record.packageCount,
    locationSummary: record.locationSummary,
  }));
}

function pickFirstHttpsUrl(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }
    const trimmed = entry.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
  }

  return null;
}
