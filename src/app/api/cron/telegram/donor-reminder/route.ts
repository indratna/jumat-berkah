import { NextResponse } from "next/server";

import { Prisma, UserRole } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import {
  getCronSecretFromHeaders,
  verifyCronSecret,
} from "@/lib/telegram-cron";
import {
  FRIDAY_REMINDER_ACTION,
  fridayReminderMessage,
  shouldSendFridayReminder,
} from "@/lib/telegram-donor";
import { getTelegramBotToken, safeSendTelegramMessage } from "@/lib/telegram";

export async function GET(request: Request) {
  if (!verifyCronSecret(getCronSecretFromHeaders(request.headers))) {
    return NextResponse.json(
      { errors: { auth: "Cron secret tidak valid." } },
      { status: 401 },
    );
  }

  if (!getTelegramBotToken()) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "telegram-disabled",
    });
  }

  const now = new Date();
  const reminderDate = formatJakartaDate(now);
  const prisma = getPrisma();
  const existing = await prisma.auditLog.findFirst({
    where: { action: FRIDAY_REMINDER_ACTION, entityId: reminderDate },
    select: { id: true },
  });

  if (
    !shouldSendFridayReminder({ now, alreadySentThisDate: Boolean(existing) })
  ) {
    return NextResponse.json({ ok: true, sent: false, reason: "not-due" });
  }

  const donors = await prisma.user.findMany({
    where: {
      role: UserRole.donor,
      telegramReminderOptIn: true,
      telegramChatId: { not: null },
    },
    select: { id: true, telegramChatId: true },
  });
  const text = fridayReminderMessage();
  let sentCount = 0;

  for (const donor of donors) {
    if (donor.telegramChatId === null) {
      continue;
    }

    const sent = await safeSendTelegramMessage({
      chatId: Number(donor.telegramChatId),
      text,
    });

    if (sent) {
      sentCount += 1;
    }
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: null,
      action: FRIDAY_REMINDER_ACTION,
      entityType: "telegram_donor_reminder",
      entityId: reminderDate,
      before: Prisma.JsonNull,
      after: { sentCount, donorCount: donors.length },
    },
  });

  return NextResponse.json({ ok: true, sent: true, sentCount });
}

function formatJakartaDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}
