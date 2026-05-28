import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import {
  type FridayCycleRange,
  getCurrentFridayCycleRange,
} from "@/lib/friday-cycle";

export type DistributionReportRecord = {
  id: string;
  cycleStart: Date;
  title: string;
  summary: string;
  packageCount: number | null;
  locationSummary: string | null;
  photoUrls: string[];
  publishedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DistributionReportInput = {
  cycleStart: string;
  title: string;
  summary: string;
  packageCount?: number | null;
  locationSummary?: string | null;
  photoUrls?: string[];
  publish?: boolean;
};

export type DistributionReportValidationResult =
  | {
      success: true;
      data: {
        cycleStart: Date;
        title: string;
        summary: string;
        packageCount: number | null;
        locationSummary: string | null;
        photoUrls: string[];
        publish: boolean;
      };
    }
  | { success: false; errors: Record<string, string> };

const MAX_TITLE_LENGTH = 120;
const MAX_SUMMARY_LENGTH = 1500;
const MAX_LOCATION_LENGTH = 200;
const MAX_PHOTOS = 6;

export function validateDistributionReportInput(
  raw: unknown,
): DistributionReportValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return {
      success: false,
      errors: { body: "Body permintaan tidak valid." },
    };
  }

  const input = raw as Partial<DistributionReportInput>;
  const errors: Record<string, string> = {};
  const cycleStart = parseFridayDate(input.cycleStart);

  if (!cycleStart) {
    errors.cycleStart =
      "Tanggal mulai siklus harus berupa hari Jumat (YYYY-MM-DD).";
  }

  const title = trimString(input.title);
  if (!title) {
    errors.title = "Judul cerita harus diisi.";
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Judul maksimal ${MAX_TITLE_LENGTH} karakter.`;
  }

  const summary = trimString(input.summary);
  if (!summary) {
    errors.summary = "Ringkasan cerita harus diisi.";
  } else if (summary.length > MAX_SUMMARY_LENGTH) {
    errors.summary = `Ringkasan maksimal ${MAX_SUMMARY_LENGTH} karakter.`;
  }

  let packageCount: number | null = null;
  if (input.packageCount !== undefined && input.packageCount !== null) {
    const value =
      typeof input.packageCount === "number"
        ? Math.trunc(input.packageCount)
        : NaN;
    if (!Number.isInteger(value) || value < 0) {
      errors.packageCount = "Jumlah paket harus bilangan bulat \u2265 0.";
    } else {
      packageCount = value;
    }
  }

  let locationSummary: string | null = null;
  if (typeof input.locationSummary === "string") {
    const trimmed = input.locationSummary.trim();
    if (trimmed.length > MAX_LOCATION_LENGTH) {
      errors.locationSummary = `Ringkasan lokasi maksimal ${MAX_LOCATION_LENGTH} karakter.`;
    } else {
      locationSummary = trimmed.length > 0 ? trimmed : null;
    }
  }

  const photoUrls = sanitizePhotoUrls(input.photoUrls);
  if (Array.isArray(input.photoUrls) && photoUrls === null) {
    errors.photoUrls = `Maksimal ${MAX_PHOTOS} URL foto valid (https://...).`;
  }

  if (Object.keys(errors).length > 0 || !cycleStart || !title || !summary) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      cycleStart,
      title,
      summary,
      packageCount,
      locationSummary,
      photoUrls: photoUrls ?? [],
      publish: input.publish === true,
    },
  };
}

export async function upsertDistributionReport(input: {
  cycleStart: Date;
  title: string;
  summary: string;
  packageCount: number | null;
  locationSummary: string | null;
  photoUrls: string[];
  publish: boolean;
  createdBy: string;
}): Promise<DistributionReportRecord> {
  const prisma = getPrisma();
  const publishedAt = input.publish ? new Date() : null;

  const report = await prisma.distributionReport.upsert({
    where: { cycleStart: input.cycleStart },
    update: {
      title: input.title,
      summary: input.summary,
      packageCount: input.packageCount,
      locationSummary: input.locationSummary,
      photoUrls: input.photoUrls as unknown as Prisma.InputJsonValue,
      publishedAt: publishedAt,
    },
    create: {
      cycleStart: input.cycleStart,
      title: input.title,
      summary: input.summary,
      packageCount: input.packageCount,
      locationSummary: input.locationSummary,
      photoUrls: input.photoUrls as unknown as Prisma.InputJsonValue,
      publishedAt,
      createdBy: input.createdBy,
    },
  });

  return mapDistributionReport(report);
}

export async function listDistributionReports(limit = 20) {
  const prisma = getPrisma();
  const records = await prisma.distributionReport.findMany({
    orderBy: { cycleStart: "desc" },
    take: Math.max(1, Math.min(limit, 50)),
  });
  return records.map(mapDistributionReport);
}

export type DistributionReportWithCycle = {
  cycle: FridayCycleRange;
  report: DistributionReportRecord | null;
};

export async function getDistributionReportForCurrentCycle(
  now = new Date(),
): Promise<DistributionReportWithCycle> {
  const cycle = getCurrentFridayCycleRange(now);
  const cycleStart = new Date(`${cycle.fromDate}T00:00:00.000Z`);
  const prisma = getPrisma();
  const record = await prisma.distributionReport.findUnique({
    where: { cycleStart },
  });

  return { cycle, report: record ? mapDistributionReport(record) : null };
}

export async function getPublishedDistributionReportForCurrentCycle(
  now = new Date(),
): Promise<DistributionReportWithCycle> {
  const result = await getDistributionReportForCurrentCycle(now);
  if (!result.report || !result.report.publishedAt) {
    return { ...result, report: null };
  }
  return result;
}

type DistributionReportRow = {
  id: string;
  cycleStart: Date;
  title: string;
  summary: string;
  packageCount: number | null;
  locationSummary: string | null;
  photoUrls: unknown;
  publishedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export function mapDistributionReport(
  record: DistributionReportRow,
): DistributionReportRecord {
  return {
    id: record.id,
    cycleStart: record.cycleStart,
    title: record.title,
    summary: record.summary,
    packageCount: record.packageCount ?? null,
    locationSummary: record.locationSummary ?? null,
    photoUrls: parsePhotoUrlsFromJson(record.photoUrls),
    publishedAt: record.publishedAt ?? null,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function parsePhotoUrlsFromJson(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry === "string") {
      const sanitized = sanitizePhotoUrl(entry);
      if (sanitized) {
        result.push(sanitized);
      }
    }
  }
  return result;
}

function sanitizePhotoUrls(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return [];
  }

  const cleaned: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }
    const sanitized = sanitizePhotoUrl(entry);
    if (!sanitized) {
      continue;
    }
    cleaned.push(sanitized);
  }

  if (cleaned.length > MAX_PHOTOS) {
    return null;
  }
  return cleaned;
}

function sanitizePhotoUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function trimString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseFridayDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const date = new Date(`${value.trim()}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(date);

  return weekday === "Fri" ? date : null;
}
