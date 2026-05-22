import { Prisma, UserRole } from "@/generated/prisma/client";
import {
  createDonationOrderId,
  getInitialDonationStatus,
} from "@/lib/donations";
import { createMidtransSnapTransaction } from "@/lib/midtrans";
import { formatJakartaDateTime, formatRupiah } from "@/lib/telegram";

export const DONOR_LINK_CODE_BYTES = 8;
export const FRIDAY_REMINDER_ACTION = "telegram.donor.friday_reminder";

export type DonorCommand =
  | { name: "/mulai"; linkCode: string | null }
  | { name: "/donasi"; amount: number | null }
  | { name: "/status"; orderId: string | null }
  | { name: "/riwayat" }
  | { name: "/reminder"; enabled: boolean | null };

export function createDonorLinkCode(bytes = DONOR_LINK_CODE_BYTES): string {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(values)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function parseDonorCommand(text: string): DonorCommand | null {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const command = normalizeCommand(tokens[0] ?? "");

  if (command === "/mulai") {
    return { name: "/mulai", linkCode: tokens[1] ?? null };
  }

  if (command === "/donasi") {
    return { name: "/donasi", amount: parseDonationAmount(tokens[1]) };
  }

  if (command === "/status") {
    return { name: "/status", orderId: tokens[1] ?? null };
  }

  if (command === "/riwayat") {
    return { name: "/riwayat" };
  }

  if (command === "/reminder") {
    const value = tokens[1]?.toLowerCase();
    return {
      name: "/reminder",
      enabled: value === "on" ? true : value === "off" ? false : null,
    };
  }

  return null;
}

export function parseDonationAmount(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  let cleaned = value
    .replace(/[Rr][Pp]/g, "")
    .replace(/[_\s]/g, "")
    .trim();

  if (!/^[\d.]+$/.test(cleaned)) {
    return null;
  }

  if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    if (parts[0].length === 0 || parts[0].length > 3) {
      return null;
    }

    for (const part of parts.slice(1)) {
      if (!/^\d{3}$/.test(part)) {
        return null;
      }
    }

    cleaned = parts.join("");
  }

  const amount = Number(cleaned);
  return Number.isInteger(amount) && amount > 0 ? amount : null;
}

export async function bindDonorTelegramChat(input: {
  linkCode: string;
  chatId: number;
}) {
  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { telegramLinkCode: input.linkCode, role: UserRole.donor },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return null;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: BigInt(input.chatId),
      telegramLinkCode: null,
    },
    select: { id: true, name: true, email: true },
  });
}

export async function getDonorByTelegramChat(chatId: number) {
  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  return prisma.user.findFirst({
    where: { telegramChatId: BigInt(chatId), role: UserRole.donor },
    select: {
      id: true,
      name: true,
      email: true,
      telegramReminderOptIn: true,
    },
  });
}

export async function createTelegramDonorDonation(input: {
  userId: string;
  donorName: string | null;
  donorEmail: string;
  amount: number;
}) {
  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const donation = await prisma.donation.create({
    data: {
      orderId: createDonationOrderId(),
      userId: input.userId,
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      donorPhone: null,
      isAnonymous: false,
      showNamePublicly: true,
      amount: input.amount,
      message: "Donasi via Telegram",
      paymentProvider: "midtrans",
      paymentMethod: "qris",
      status: getInitialDonationStatus(),
    },
    select: {
      orderId: true,
      amount: true,
      donorName: true,
      donorEmail: true,
      donorPhone: true,
      status: true,
    },
  });

  const payment = await createMidtransSnapTransaction({
    orderId: donation.orderId,
    amount: donation.amount,
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    donorPhone: donation.donorPhone,
  });

  return { donation, payment };
}

export async function setDonorReminderOptIn(input: {
  chatId: number;
  enabled: boolean;
}) {
  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  return prisma.user.updateMany({
    where: { telegramChatId: BigInt(input.chatId), role: UserRole.donor },
    data: { telegramReminderOptIn: input.enabled },
  });
}

export async function buildDonorStatusReply(input: {
  chatId: number;
  orderId: string | null;
}) {
  if (!input.orderId) {
    return "Format: /status <orderId>";
  }

  const donor = await getDonorByTelegramChat(input.chatId);
  if (!donor) {
    return "Akun Telegram belum terhubung. Buka /akun/donasi lalu kirim /mulai <kode>.";
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const donation = await prisma.donation.findFirst({
    where: { orderId: input.orderId, userId: donor.id },
    select: {
      orderId: true,
      amount: true,
      status: true,
      createdAt: true,
      paidAt: true,
    },
  });

  if (!donation) {
    return `Donasi tidak ditemukan di akun Anda: ${input.orderId}`;
  }

  return [
    "🔎 Status Donasi",
    `Order: ${donation.orderId}`,
    `Nominal: ${formatRupiah(donation.amount)}`,
    `Status: ${donation.status}`,
    `Waktu: ${formatJakartaDateTime(donation.paidAt ?? donation.createdAt)}`,
  ].join("\n");
}

export async function buildDonorHistoryReply(chatId: number) {
  const donor = await getDonorByTelegramChat(chatId);
  if (!donor) {
    return "Akun Telegram belum terhubung. Buka /akun/donasi lalu kirim /mulai <kode>.";
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const donations = await prisma.donation.findMany({
    where: { userId: donor.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      orderId: true,
      amount: true,
      status: true,
      createdAt: true,
      paidAt: true,
    },
  });

  if (donations.length === 0) {
    return "Belum ada riwayat donasi di akun Anda.";
  }

  return [
    "📜 Riwayat Donasi Anda",
    ...donations.map((donation, index) =>
      [
        `${index + 1}. ${donation.orderId}`,
        `   ${formatRupiah(donation.amount)} — ${donation.status}`,
        `   ${formatJakartaDateTime(donation.paidAt ?? donation.createdAt)}`,
      ].join("\n"),
    ),
  ].join("\n");
}

export function shouldSendFridayReminder(input: {
  now: Date;
  alreadySentThisDate: boolean;
}): boolean {
  const jakartaWeekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Jakarta",
  }).format(input.now);
  return jakartaWeekday === "Fri" && !input.alreadySentThisDate;
}

export function fridayReminderMessage() {
  return [
    "🕌 Pengingat Jumat Berkah",
    "Jika ingin berdonasi hari ini, kirim /donasi <nominal>.",
    "Contoh: /donasi 50000",
    "Ini hanya pengingat, bukan donasi otomatis.",
  ].join("\n");
}

export function donorTelegramAuditAfter(input: {
  channel: "telegram";
  telegramChatId: number;
  action: string;
}): Prisma.InputJsonValue {
  return {
    channel: input.channel,
    telegramChatId: input.telegramChatId,
    action: input.action,
  };
}

function normalizeCommand(token: string) {
  return token.split("@")[0].toLowerCase();
}
