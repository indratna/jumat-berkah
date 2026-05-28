import { DonationStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import {
  type FridayCycleRange,
  getCurrentFridayCycleRange,
} from "@/lib/friday-cycle";

export type WeeklyTargetRecord = {
  id: string;
  cycleStart: Date;
  cycleEnd: Date;
  targetAmount: number;
  note: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WeeklyTargetInput = {
  cycleStart: string;
  targetAmount: number;
  note?: string | null;
};

export type WeeklyTargetValidationResult =
  | { success: true; data: { cycleStart: Date; targetAmount: number; note: string | null } }
  | { success: false; errors: Record<string, string> };

export type WeeklyTargetProgress = {
  cycle: FridayCycleRange;
  target: WeeklyTargetRecord | null;
  collected: number;
  remaining: number;
  progressRatio: number;
  reachedTarget: boolean;
};

const MAX_NOTE_LENGTH = 200;

export function validateWeeklyTargetInput(
  raw: unknown,
): WeeklyTargetValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return {
      success: false,
      errors: { body: "Body permintaan tidak valid." },
    };
  }

  const input = raw as Partial<WeeklyTargetInput>;
  const errors: Record<string, string> = {};
  const cycleStart = parseCycleStart(input.cycleStart);

  if (!cycleStart) {
    errors.cycleStart =
      "Tanggal mulai siklus harus berupa hari Jumat (YYYY-MM-DD).";
  }

  const targetAmount =
    typeof input.targetAmount === "number" ? Math.trunc(input.targetAmount) : NaN;

  if (!Number.isInteger(targetAmount) || targetAmount <= 0) {
    errors.targetAmount = "Target dana harus bilangan bulat lebih dari 0.";
  }

  let note: string | null = null;
  if (typeof input.note === "string") {
    const trimmed = input.note.trim();
    if (trimmed.length > MAX_NOTE_LENGTH) {
      errors.note = `Catatan maksimal ${MAX_NOTE_LENGTH} karakter.`;
    } else {
      note = trimmed.length > 0 ? trimmed : null;
    }
  }

  if (Object.keys(errors).length > 0 || !cycleStart) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { cycleStart, targetAmount, note },
  };
}

export async function upsertWeeklyTarget(input: {
  cycleStart: Date;
  targetAmount: number;
  note: string | null;
  createdBy: string;
}) {
  const prisma = getPrisma();
  const cycleEnd = addDays(input.cycleStart, 6);

  return prisma.weeklyTarget.upsert({
    where: { cycleStart: input.cycleStart },
    update: {
      targetAmount: input.targetAmount,
      note: input.note,
      cycleEnd,
    },
    create: {
      cycleStart: input.cycleStart,
      cycleEnd,
      targetAmount: input.targetAmount,
      note: input.note,
      createdBy: input.createdBy,
    },
  });
}

export async function getWeeklyTargetProgress(
  now = new Date(),
): Promise<WeeklyTargetProgress> {
  const cycle = getCurrentFridayCycleRange(now);
  const prisma = getPrisma();
  const cycleStart = new Date(`${cycle.fromDate}T00:00:00.000Z`);

  const [target, donations] = await Promise.all([
    prisma.weeklyTarget.findUnique({ where: { cycleStart } }),
    prisma.donation.aggregate({
      where: {
        status: DonationStatus.settlement,
        paidAt: { gte: cycle.from, lte: cycle.to },
      },
      _sum: { amount: true },
    }),
  ]);

  const collected = donations._sum.amount ?? 0;
  return calculateWeeklyTargetProgress({ cycle, target, collected });
}

export function calculateWeeklyTargetProgress(input: {
  cycle: FridayCycleRange;
  target: WeeklyTargetRecord | null;
  collected: number;
}): WeeklyTargetProgress {
  const targetAmount = input.target?.targetAmount ?? 0;
  const progressRatio =
    targetAmount > 0 ? Math.min(input.collected / targetAmount, 1) : 0;
  const remaining = Math.max(targetAmount - input.collected, 0);

  return {
    cycle: input.cycle,
    target: input.target,
    collected: input.collected,
    remaining,
    progressRatio,
    reachedTarget: targetAmount > 0 && input.collected >= targetAmount,
  };
}

function parseCycleStart(value: unknown): Date | null {
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

  // Cycle harus mulai hari Jumat berdasarkan zona Asia/Jakarta.
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(date);

  return weekday === "Fri" ? date : null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
