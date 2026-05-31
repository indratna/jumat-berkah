import { DonationStatus, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { getCurrentFridayCycleRange } from "@/lib/friday-cycle";
import {
  formatRupiah,
  getTelegramPublicChannelId,
  safeSendTelegramMessage,
} from "@/lib/telegram";

export const WEEKLY_CYCLE_TRANSITION_ACTION = "weekly_target.transition";
export const WEEKLY_CYCLE_TRANSITION_BROADCAST_ACTION =
  "telegram.broadcast.weekly_cycle_transition";

export function shouldCreateNextCycleTarget(input: {
  hasPreviousTarget: boolean;
  hasCurrentTarget: boolean;
}) {
  return input.hasPreviousTarget && !input.hasCurrentTarget;
}

export function buildCycleTransitionBroadcastMessage(input: {
  previousCycleLabel: string;
  previousTargetAmount: number | null;
  previousCollected: number;
  previousPercent: number;
  currentCycleLabel: string;
  currentTargetAmount: number | null;
  donationUrl: string;
}) {
  const previousTarget =
    input.previousTargetAmount === null
      ? "Belum diatur"
      : formatRupiah(input.previousTargetAmount);
  const currentTarget =
    input.currentTargetAmount === null
      ? "Belum diatur"
      : formatRupiah(input.currentTargetAmount);

  return [
    "📊 Siklus Jumat Berkah Selesai!",
    "",
    `Periode: ${input.previousCycleLabel}`,
    `Target: ${previousTarget}`,
    `Terkumpul: ${formatRupiah(input.previousCollected)} (${input.previousPercent}%)`,
    "",
    "🆕 Siklus baru dimulai!",
    `Periode: ${input.currentCycleLabel}`,
    `Target pekan ini: ${currentTarget}`,
    "",
    "Yuk berdonasi 🙏",
    `👉 ${input.donationUrl}`,
  ].join("\n");
}

export async function runWeeklyCycleTransition(now = new Date()) {
  const prisma = getPrisma();
  const currentCycle = getCurrentFridayCycleRange(now);
  const previousCycleStart = new Date(currentCycle.from);
  previousCycleStart.setUTCDate(previousCycleStart.getUTCDate() - 7);
  const previousCycle = getCurrentFridayCycleRange(previousCycleStart);

  const [previousTarget, currentTarget, previousCollectedRow, existingBroadcast] =
    await Promise.all([
      prisma.weeklyTarget.findUnique({
        where: { cycleStart: previousCycle.from },
      }),
      prisma.weeklyTarget.findUnique({
        where: { cycleStart: currentCycle.from },
      }),
      prisma.donation.aggregate({
        where: {
          status: DonationStatus.settlement,
          paidAt: { gte: previousCycle.from, lte: previousCycle.to },
        },
        _sum: { amount: true },
      }),
      prisma.auditLog.findFirst({
        where: {
          action: WEEKLY_CYCLE_TRANSITION_BROADCAST_ACTION,
          entityId: currentCycle.fromDate,
        },
        select: { id: true },
      }),
    ]);

  let activeTarget = currentTarget;
  let targetCopied = false;

  if (
    shouldCreateNextCycleTarget({
      hasPreviousTarget: previousTarget !== null,
      hasCurrentTarget: currentTarget !== null,
    }) &&
    previousTarget
  ) {
    activeTarget = await prisma.weeklyTarget.create({
      data: {
        cycleStart: currentCycle.from,
        cycleEnd: currentCycle.to,
        targetAmount: previousTarget.targetAmount,
        note: previousTarget.note,
        createdBy: previousTarget.createdBy,
      },
    });
    targetCopied = true;

    await prisma.auditLog.create({
      data: {
        action: WEEKLY_CYCLE_TRANSITION_ACTION,
        entityType: "weekly_target",
        entityId: currentCycle.fromDate,
        before: previousTarget as unknown as Prisma.InputJsonValue,
        after: {
          cycleStart: currentCycle.fromDate,
          cycleEnd: currentCycle.toDate,
          targetAmount: activeTarget.targetAmount,
          note: activeTarget.note,
          copiedFromCycleStart: previousCycle.fromDate,
        },
      },
    });
  }

  const previousCollected = previousCollectedRow._sum.amount ?? 0;
  const previousPercent = previousTarget?.targetAmount
    ? Math.min(
        Math.round((previousCollected / previousTarget.targetAmount) * 100),
        100,
      )
    : 0;

  const channelId = getTelegramPublicChannelId();
  if (channelId === null) {
    return {
      sent: false,
      reason: "missing-public-channel" as const,
      targetCopied,
      cycleStart: currentCycle.fromDate,
    };
  }

  if (existingBroadcast) {
    return {
      sent: false,
      reason: "already-sent" as const,
      targetCopied,
      cycleStart: currentCycle.fromDate,
    };
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  const message = buildCycleTransitionBroadcastMessage({
    previousCycleLabel: previousCycle.label,
    previousTargetAmount: previousTarget?.targetAmount ?? null,
    previousCollected,
    previousPercent,
    currentCycleLabel: currentCycle.label,
    currentTargetAmount: activeTarget?.targetAmount ?? null,
    donationUrl: `${baseUrl}/donasi`,
  });

  const sent = await safeSendTelegramMessage({
    chatId: channelId,
    text: message,
  });

  if (!sent) {
    return {
      sent: false,
      reason: "send-failed" as const,
      targetCopied,
      cycleStart: currentCycle.fromDate,
    };
  }

  await prisma.auditLog.create({
    data: {
      action: WEEKLY_CYCLE_TRANSITION_BROADCAST_ACTION,
      entityType: "telegram_channel",
      entityId: currentCycle.fromDate,
      before: Prisma.JsonNull,
      after: {
        cycleStart: currentCycle.fromDate,
        previousCycleStart: previousCycle.fromDate,
        targetCopied,
        targetAmount: activeTarget?.targetAmount ?? null,
        previousCollected,
        previousPercent,
        channelSent: true,
      },
    },
  });

  return {
    sent: true,
    targetCopied,
    cycleStart: currentCycle.fromDate,
  };
}
