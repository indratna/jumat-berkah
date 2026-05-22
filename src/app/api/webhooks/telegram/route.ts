import { NextResponse } from "next/server";

import {
  DonationStatus,
  ExpenseApprovalStatus,
  Prisma,
} from "@/generated/prisma/client";
import { getAdminReportExport } from "@/lib/admin";
import { getPrisma } from "@/lib/db";
import {
  bindDonorTelegramChat,
  buildDonorHistoryReply,
  buildDonorStatusReply,
  createTelegramDonorDonation,
  donorTelegramAuditAfter,
  getDonorByTelegramChat,
  parseDonorCommand,
  setDonorReminderOptIn,
  type DonorCommand,
} from "@/lib/telegram-donor";
import {
  decideExpenseApproval,
  evaluateApprovalProgress,
  expenseApprovalAuditAfter,
  getExpenseApprovalRequiredCount,
  getExpenseApprovalThreshold,
} from "@/lib/expense-approvals";
import { validateExpenseInput, serializeExpenseForAudit } from "@/lib/expenses";
import { storeTelegramPhotoReceipt } from "@/lib/receipt-storage";
import { getPublicDonorName, getPublicReport } from "@/lib/reports";
import {
  approvalKeyboard,
  checkTelegramPublicRateLimit,
  expenseCommandUsage,
  formatJakartaDateTime,
  formatRupiah,
  getTelegramPublicChannelId,
  isAllowedAdminChat,
  parseDeleteExpenseCommand,
  parseEditExpenseCommand,
  parseExpenseCommand,
  parseReceiptCommand,
  parseTelegramBroadcastCommand,
  parseTelegramPublicCommand,
  parseTelegramReadCommand,
  parseTelegramUpdate,
  safeAnswerTelegramCallbackQuery,
  safeSendTelegramDocument,
  safeSendTelegramMessage,
  verifyTelegramSecretToken,
  type TelegramCallbackQuery,
  type TelegramMessage,
  type TelegramPublicCommand,
  type TelegramReadCommand,
} from "@/lib/telegram";

const TELEGRAM_SECRET_HEADER = "x-telegram-bot-api-secret-token";
const PENDING_ACTION_TTL_MS = 5 * 60 * 1000;
const PUBLIC_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const PUBLIC_RATE_LIMIT_MAX_HITS = 5;

type PendingAction =
  | {
      type: "edit";
      chatId: number;
      userId: number | null;
      expenseId: string;
      changes: Record<string, string>;
      expiresAt: number;
    }
  | {
      type: "delete";
      chatId: number;
      userId: number | null;
      expenseId: string;
      expiresAt: number;
    };

type GlobalTelegramState = typeof globalThis & {
  telegramPendingActions?: Map<string, PendingAction>;
  telegramPublicRateLimitHits?: Map<number, number[]>;
};

const telegramGlobal = globalThis as GlobalTelegramState;
const pendingActions =
  telegramGlobal.telegramPendingActions ?? new Map<string, PendingAction>();
const publicRateLimitHits =
  telegramGlobal.telegramPublicRateLimitHits ?? new Map<number, number[]>();

if (process.env.NODE_ENV !== "production") {
  telegramGlobal.telegramPendingActions = pendingActions;
  telegramGlobal.telegramPublicRateLimitHits = publicRateLimitHits;
}

export async function POST(request: Request) {
  const headerSecret = request.headers.get(TELEGRAM_SECRET_HEADER);

  if (!verifyTelegramSecretToken(headerSecret)) {
    return NextResponse.json(
      { errors: { auth: "Telegram secret token tidak valid." } },
      { status: 401 },
    );
  }

  const payload: unknown = await request.json().catch(() => null);
  const update = parseTelegramUpdate(payload);

  if (!update) {
    return NextResponse.json(
      { errors: { body: "Payload Telegram tidak valid." } },
      { status: 400 },
    );
  }

  if (update.callbackQuery) {
    return handleCallbackQuery(update.callbackQuery);
  }

  if (!update.message) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const message = update.message;

  if (message.photo.length > 0) {
    return handleReceiptPhotoMessage(message);
  }

  if (!message.text) {
    // Updates without text/photo we ignore but acknowledge to avoid Telegram retries.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const text = message.text ?? "";
  const command = extractCommand(text);

  if (!command) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const donorCommand = parseDonorCommand(text);

  if (donorCommand) {
    return handleDonorCommand(message, donorCommand);
  }

  const publicCommand = parseTelegramPublicCommand(text);

  if (publicCommand) {
    return handlePublicCommand(message, publicCommand);
  }

  if (!isAllowedAdminChat(message.chat.id)) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: "Akses ditolak. Chat ini tidak terdaftar sebagai admin.",
    });
    return NextResponse.json({ ok: true, rejected: "unauthorized" });
  }

  if (command === "/pengeluaran") {
    return handleExpenseCommand(message, text);
  }

  if (command === "/edit_pengeluaran") {
    return handleEditExpenseCommand(message, text);
  }

  if (command === "/hapus_pengeluaran") {
    return handleDeleteExpenseCommand(message, text);
  }

  if (command === "/struk") {
    return handleReceiptCommand(message, text);
  }

  const broadcastCommand = parseTelegramBroadcastCommand(text);

  if (broadcastCommand) {
    return handleBroadcastReportCommand(message);
  }

  const readCommand = parseTelegramReadCommand(text);

  if (readCommand) {
    return handleReadCommand(message, readCommand);
  }

  if (command === "/start" || command === "/help" || command === "/bantuan") {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: helpText(),
    });
    return NextResponse.json({ ok: true, handled: command });
  }

  await safeSendTelegramMessage({
    chatId: message.chat.id,
    text: `Perintah tidak dikenali: ${command}\n\n${helpText()}`,
  });
  return NextResponse.json({ ok: true, handled: "unknown" });
}

async function handleDonorCommand(
  message: TelegramMessage,
  command: DonorCommand,
) {
  if (command.name === "/mulai") {
    if (!command.linkCode) {
      await safeSendTelegramMessage({
        chatId: message.chat.id,
        text: "Format: /mulai <kode>. Ambil kode dari halaman /akun/donasi.",
      });
      return NextResponse.json({ ok: true, handled: command.name });
    }

    const donor = await bindDonorTelegramChat({
      linkCode: command.linkCode,
      chatId: message.chat.id,
    });

    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: donor
        ? `✅ Telegram terhubung ke akun ${donor.email}.`
        : "Kode tidak valid atau sudah dipakai.",
    });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  const donor = await getDonorByTelegramChat(message.chat.id);

  if (!donor) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: "Akun Telegram belum terhubung. Buka /akun/donasi lalu kirim /mulai <kode>.",
    });
    return NextResponse.json({
      ok: true,
      handled: command.name,
      error: "unbound",
    });
  }

  if (command.name === "/donasi") {
    if (!command.amount) {
      await safeSendTelegramMessage({
        chatId: message.chat.id,
        text: "Format: /donasi <nominal>. Contoh: /donasi 50000",
      });
      return NextResponse.json({
        ok: true,
        handled: command.name,
        error: "invalid-amount",
      });
    }

    try {
      const result = await createTelegramDonorDonation({
        userId: donor.id,
        donorName: donor.name,
        donorEmail: donor.email,
        amount: command.amount,
      });

      await safeSendTelegramMessage({
        chatId: message.chat.id,
        text: [
          "✅ Transaksi donasi dibuat",
          `Order: ${result.donation.orderId}`,
          `Nominal: ${formatRupiah(result.donation.amount)}`,
          `Bayar via Midtrans: ${result.payment.redirectUrl}`,
        ].join("\n"),
      });
      return NextResponse.json({
        ok: true,
        handled: command.name,
        orderId: result.donation.orderId,
      });
    } catch (error) {
      console.error("Telegram donor donation failed:", error);
      await safeSendTelegramMessage({
        chatId: message.chat.id,
        text: "Transaksi donasi belum bisa dibuat. Coba lagi nanti.",
      });
      return NextResponse.json({
        ok: true,
        handled: command.name,
        error: "payment",
      });
    }
  }

  if (command.name === "/status") {
    const text = await buildDonorStatusReply({
      chatId: message.chat.id,
      orderId: command.orderId,
    });
    await safeSendTelegramMessage({ chatId: message.chat.id, text });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  if (command.name === "/riwayat") {
    const text = await buildDonorHistoryReply(message.chat.id);
    await safeSendTelegramMessage({ chatId: message.chat.id, text });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  if (command.enabled === null) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: "Format: /reminder on atau /reminder off. Reminder hanya pengingat, bukan donasi otomatis.",
    });
    return NextResponse.json({
      ok: true,
      handled: command.name,
      error: "invalid-reminder",
    });
  }

  await setDonorReminderOptIn({
    chatId: message.chat.id,
    enabled: command.enabled,
  });
  const prisma = getPrisma();
  await prisma.auditLog.create({
    data: {
      actorUserId: donor.id,
      action: "telegram.donor.reminder_updated",
      entityType: "user",
      entityId: donor.id,
      before: Prisma.JsonNull,
      after: donorTelegramAuditAfter({
        channel: "telegram",
        telegramChatId: message.chat.id,
        action: command.enabled ? "reminder_on" : "reminder_off",
      }),
    },
  });
  await safeSendTelegramMessage({
    chatId: message.chat.id,
    text: command.enabled
      ? "✅ Reminder Jumat aktif. Ini hanya pengingat, bukan donasi otomatis."
      : "✅ Reminder Jumat nonaktif.",
  });
  return NextResponse.json({ ok: true, handled: command.name });
}

async function handleExpenseCommand(message: TelegramMessage, text: string) {
  const parsed = parseExpenseCommand(text);

  if (!parsed.success) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: `❌ ${parsed.error}\n\n${expenseCommandUsage()}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "/pengeluaran",
      error: parsed.error,
    });
  }

  const validation = validateExpenseInput({
    expenseDate: parsed.data.expenseDate,
    category: parsed.data.category,
    description: parsed.data.description,
    amount: parsed.data.amount,
    vendorName: parsed.data.vendorName,
    receiptUrl: null,
  });

  if (!validation.success) {
    const summary = Object.values(validation.errors).join("; ");
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: `❌ Input tidak valid: ${summary}\n\n${expenseCommandUsage()}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "/pengeluaran",
      error: summary,
    });
  }

  // Telegram-created expense has no admin user actor, so we use a stable system bot id.
  const botActorId = await getOrCreateBotActorId();
  const prisma = getPrisma();
  const approval = decideExpenseApproval({
    amount: validation.data.amount,
    threshold: getExpenseApprovalThreshold(),
    requiredCount: getExpenseApprovalRequiredCount(),
    now: new Date(),
  });
  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        expenseDate: validation.data.expenseDate,
        category: validation.data.category,
        description: validation.data.description,
        amount: validation.data.amount,
        vendorName: validation.data.vendorName,
        receiptUrl: validation.data.receiptUrl,
        approvalStatus: approval.status,
        approvalRequired: approval.approvalRequired,
        approvedAt: approval.approvedAt,
        createdBy: botActorId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: null,
        action: "expense.created",
        entityType: "expense",
        entityId: created.id,
        before: Prisma.JsonNull,
        after: {
          ...(serializeExpenseForAudit(created) as Record<string, unknown>),
          channel: "telegram",
          telegramChatId: message.chat.id,
          telegramUserId: message.from?.id ?? null,
        },
      },
    });

    return created;
  });

  const replyLines = [
    "✅ Pengeluaran tercatat",
    `Tanggal: ${parsed.data.expenseDate}`,
    `Kategori: ${parsed.data.category}`,
    `Nominal: ${formatRupiah(parsed.data.amount)}`,
    `Deskripsi: ${parsed.data.description}`,
  ];

  if (parsed.data.vendorName) {
    replyLines.push(`Vendor: ${parsed.data.vendorName}`);
  }

  replyLines.push(`ID: ${expense.id}`);

  if (expense.approvalStatus === ExpenseApprovalStatus.pending_approval) {
    replyLines.push(
      `Status: Menunggu ${expense.approvalRequired} persetujuan admin`,
    );
  }

  await safeSendTelegramMessage({
    chatId: message.chat.id,
    text: replyLines.join("\n"),
    replyMarkup:
      expense.approvalStatus === ExpenseApprovalStatus.pending_approval
        ? approvalKeyboard(expense.id)
        : undefined,
  });

  return NextResponse.json({
    ok: true,
    handled: "/pengeluaran",
    expenseId: expense.id,
  });
}

async function handleReceiptCommand(message: TelegramMessage, text: string) {
  const expenseId = parseReceiptCommand(text);

  if (expenseId === undefined) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!expenseId) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: "Format: kirim foto struk dengan caption /struk <expenseId>",
    });
    return NextResponse.json({
      ok: true,
      handled: "/struk",
      error: "missing-id",
    });
  }

  if (message.photo.length === 0) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: "Kirim foto struk dengan caption /struk <expenseId>.",
    });
    return NextResponse.json({
      ok: true,
      handled: "/struk",
      error: "missing-photo",
    });
  }

  return attachReceiptToExpense(message, expenseId);
}

async function handleReceiptPhotoMessage(message: TelegramMessage) {
  if (!isAllowedAdminChat(message.chat.id)) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: "Akses ditolak. Chat ini tidak terdaftar sebagai admin.",
    });
    return NextResponse.json({ ok: true, rejected: "unauthorized" });
  }

  const caption = message.caption ?? "";
  const parsedFromCaption = parseReceiptCommand(caption);
  const expenseId =
    parsedFromCaption === undefined
      ? extractExpenseIdFromReply(message.replyToMessage)
      : parsedFromCaption;

  if (!expenseId) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: "Kirim foto dengan caption /struk <expenseId> atau reply ke pesan pengeluaran yang memuat ID.",
    });
    return NextResponse.json({
      ok: true,
      handled: "receipt-photo",
      error: "missing-id",
    });
  }

  return attachReceiptToExpense(message, expenseId);
}

async function attachReceiptToExpense(
  message: TelegramMessage,
  expenseId: string,
) {
  const prisma = getPrisma();
  const existing = await prisma.expense.findUnique({
    where: { id: expenseId },
  });

  if (!existing) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: `Pengeluaran tidak ditemukan: ${expenseId}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "receipt-photo",
      error: "not-found",
    });
  }

  const largestPhoto = message.photo.toSorted(
    (a, b) => (b.fileSize ?? 0) - (a.fileSize ?? 0),
  )[0];

  if (!largestPhoto) {
    return NextResponse.json({
      ok: true,
      handled: "receipt-photo",
      error: "missing-photo",
    });
  }

  const receipt = await storeTelegramPhotoReceipt({
    expenseId: existing.id,
    telegramFileId: largestPhoto.fileId,
  });

  const updated = await prisma.expense.update({
    where: { id: existing.id },
    data: { receiptUrl: receipt.privateUrl },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: null,
      action: "expense.receipt_attached",
      entityType: "expense",
      entityId: updated.id,
      before: serializeExpenseForAudit(existing),
      after: {
        ...(serializeExpenseForAudit(updated) as Record<string, unknown>),
        channel: "telegram",
        telegramChatId: message.chat.id,
        telegramUserId: message.from?.id ?? null,
        receiptObjectKey: receipt.objectKey,
      },
    },
  });

  await safeSendTelegramMessage({
    chatId: message.chat.id,
    text: `✅ Struk terlampir\nID: ${updated.id}`,
  });

  return NextResponse.json({
    ok: true,
    handled: "receipt-photo",
    expenseId: updated.id,
  });
}

function extractExpenseIdFromReply(
  message: TelegramMessage | null,
): string | null {
  const text = message?.text ?? message?.caption ?? "";
  const match = text.match(/ID:\s*([0-9a-fA-F-]{8,})/);
  return match?.[1] ?? null;
}

async function getOrCreateBotActorId(): Promise<string> {
  const prisma = getPrisma();
  const email = "telegram-bot@jumat-berkah.local";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.user.create({
    data: {
      email,
      name: "Telegram Bot",
      role: "admin",
    },
  });

  return created.id;
}

function extractCommand(text: string): string | null {
  const trimmed = text.trim();

  if (!trimmed.startsWith("/")) {
    return null;
  }

  const firstToken = trimmed.split(/\s+/)[0];

  if (!firstToken) {
    return null;
  }

  // Strip @BotName suffix.
  const normalized = firstToken.split("@")[0];
  return normalized.toLowerCase();
}

async function handleEditExpenseCommand(
  message: TelegramMessage,
  text: string,
) {
  const parsed = parseEditExpenseCommand(text);

  if (!parsed) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!parsed.id) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: editExpenseUsage(),
    });
    return NextResponse.json({
      ok: true,
      handled: "/edit_pengeluaran",
      error: "missing-id",
    });
  }

  if (parsed.invalidFields.length > 0) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: `Field tidak valid: ${parsed.invalidFields.join(", ")}\n\n${editExpenseUsage()}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "/edit_pengeluaran",
      error: "invalid-fields",
    });
  }

  if (Object.keys(parsed.changes).length === 0) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: editExpenseUsage(),
    });
    return NextResponse.json({
      ok: true,
      handled: "/edit_pengeluaran",
      error: "missing-changes",
    });
  }

  const prisma = getPrisma();
  const existing = await prisma.expense.findUnique({
    where: { id: parsed.id },
  });

  if (!existing) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: `Pengeluaran tidak ditemukan: ${parsed.id}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "/edit_pengeluaran",
      error: "not-found",
    });
  }

  const mergedInput = {
    expenseDate:
      parsed.changes.expenseDate ?? formatDateInput(existing.expenseDate),
    category: parsed.changes.category ?? existing.category,
    description: parsed.changes.description ?? existing.description,
    amount: parsed.changes.amount ?? existing.amount,
    vendorName: parsed.changes.vendorName ?? existing.vendorName,
    receiptUrl: parsed.changes.receiptUrl ?? existing.receiptUrl,
  };
  const validation = validateExpenseInput(mergedInput);

  if (!validation.success) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: `Input tidak valid: ${Object.values(validation.errors).join("; ")}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "/edit_pengeluaran",
      error: "validation",
    });
  }

  const token = createPendingAction({
    type: "edit",
    chatId: message.chat.id,
    userId: message.from?.id ?? null,
    expenseId: existing.id,
    changes: parsed.changes,
    expiresAt: Date.now() + PENDING_ACTION_TTL_MS,
  });

  await safeSendTelegramMessage({
    chatId: message.chat.id,
    text: [
      "Konfirmasi edit pengeluaran:",
      `ID: ${existing.id}`,
      `Perubahan: ${formatChanges(parsed.changes)}`,
      "Tekan Ya untuk simpan perubahan.",
    ].join("\n"),
    replyMarkup: confirmationKeyboard(token),
  });

  return NextResponse.json({
    ok: true,
    handled: "/edit_pengeluaran",
    pending: true,
  });
}

async function handleDeleteExpenseCommand(
  message: TelegramMessage,
  text: string,
) {
  const expenseId = parseDeleteExpenseCommand(text);

  if (expenseId === undefined) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!expenseId) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: "Format: /hapus_pengeluaran <id>",
    });
    return NextResponse.json({
      ok: true,
      handled: "/hapus_pengeluaran",
      error: "missing-id",
    });
  }

  const prisma = getPrisma();
  const existing = await prisma.expense.findUnique({
    where: { id: expenseId },
  });

  if (!existing) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: `Pengeluaran tidak ditemukan: ${expenseId}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "/hapus_pengeluaran",
      error: "not-found",
    });
  }

  const token = createPendingAction({
    type: "delete",
    chatId: message.chat.id,
    userId: message.from?.id ?? null,
    expenseId: existing.id,
    expiresAt: Date.now() + PENDING_ACTION_TTL_MS,
  });

  await safeSendTelegramMessage({
    chatId: message.chat.id,
    text: [
      "Konfirmasi hapus pengeluaran:",
      `ID: ${existing.id}`,
      `Kategori: ${existing.category}`,
      `Nominal: ${formatRupiah(existing.amount)}`,
      `Deskripsi: ${existing.description}`,
      "Tekan Ya untuk hapus permanen.",
    ].join("\n"),
    replyMarkup: confirmationKeyboard(token),
  });

  return NextResponse.json({
    ok: true,
    handled: "/hapus_pengeluaran",
    pending: true,
  });
}

async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery) {
  await safeAnswerTelegramCallbackQuery({ callbackQueryId: callbackQuery.id });

  if (!callbackQuery.message) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const data = callbackQuery.data ?? "";
  const approvalExpenseId = parseApprovalCallback(data);

  if (approvalExpenseId) {
    return confirmExpenseApproval(callbackQuery, approvalExpenseId);
  }

  const parsed = parseConfirmationCallback(data);

  if (!parsed) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const action = pendingActions.get(parsed.token);

  if (!action || action.expiresAt < Date.now()) {
    pendingActions.delete(parsed.token);
    await safeSendTelegramMessage({
      chatId: callbackQuery.message.chat.id,
      text: "Konfirmasi sudah kedaluwarsa. Ulangi perintah.",
    });
    return NextResponse.json({ ok: true, handled: "expired-confirmation" });
  }

  if (
    action.chatId !== callbackQuery.message.chat.id ||
    action.userId !== callbackQuery.from.id
  ) {
    await safeSendTelegramMessage({
      chatId: callbackQuery.message.chat.id,
      text: "Konfirmasi ditolak. Hanya admin yang membuat perintah dapat mengonfirmasi.",
    });
    return NextResponse.json({
      ok: true,
      handled: "unauthorized-confirmation",
    });
  }

  pendingActions.delete(parsed.token);

  if (parsed.decision === "cancel") {
    await safeSendTelegramMessage({
      chatId: callbackQuery.message.chat.id,
      text: "Aksi dibatalkan.",
    });
    return NextResponse.json({ ok: true, handled: "cancel-confirmation" });
  }

  if (action.type === "edit") {
    return confirmEditExpense(callbackQuery.message.chat.id, action);
  }

  return confirmDeleteExpense(callbackQuery.message.chat.id, action);
}

async function confirmExpenseApproval(
  callbackQuery: TelegramCallbackQuery,
  expenseId: string,
) {
  if (!callbackQuery.message) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const chatId = callbackQuery.message.chat.id;

  if (!isAllowedAdminChat(chatId)) {
    await safeSendTelegramMessage({
      chatId,
      text: "Akses ditolak. Chat ini tidak terdaftar sebagai admin.",
    });
    return NextResponse.json({ ok: true, rejected: "unauthorized" });
  }

  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.findUnique({
      where: { id: expenseId },
      include: { approvals: true },
    });

    if (!expense) {
      return { status: "not-found" as const };
    }

    if (expense.approvalStatus === ExpenseApprovalStatus.approved) {
      return {
        status: "already-approved" as const,
        approvalCount: expense.approvals.length,
        approvalRequired: expense.approvalRequired,
      };
    }

    await tx.expenseApproval.upsert({
      where: {
        expenseId_telegramUserId: {
          expenseId: expense.id,
          telegramUserId: BigInt(callbackQuery.from.id),
        },
      },
      create: {
        expenseId: expense.id,
        telegramChatId: BigInt(chatId),
        telegramUserId: BigInt(callbackQuery.from.id),
      },
      update: {},
    });

    const approvalCount = await tx.expenseApproval.count({
      where: { expenseId: expense.id },
    });
    const progress = evaluateApprovalProgress({
      approvalCount,
      approvalRequired: expense.approvalRequired,
    });

    const updated = progress.approved
      ? await tx.expense.update({
          where: { id: expense.id },
          data: {
            approvalStatus: ExpenseApprovalStatus.approved,
            approvedAt: new Date(),
          },
        })
      : expense;

    await tx.auditLog.create({
      data: {
        actorUserId: null,
        action: "expense.approved",
        entityType: "expense",
        entityId: expense.id,
        before: serializeExpenseForAudit(expense),
        after: {
          ...(serializeExpenseForAudit(updated) as Record<string, unknown>),
          ...(expenseApprovalAuditAfter({
            channel: "telegram",
            telegramChatId: chatId,
            telegramUserId: callbackQuery.from.id,
            approvalCount: progress.approvalCount,
            approvalRequired: progress.approvalRequired,
            approved: progress.approved,
          }) as Record<string, unknown>),
        } as Prisma.InputJsonValue,
      },
    });

    return { status: "ok" as const, ...progress };
  });

  if (result.status === "not-found") {
    await safeSendTelegramMessage({
      chatId,
      text: `Pengeluaran tidak ditemukan: ${expenseId}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "approval",
      error: "not-found",
    });
  }

  if (result.status === "already-approved") {
    await safeSendTelegramMessage({
      chatId,
      text: `Pengeluaran sudah disetujui: ${expenseId}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "approval",
      alreadyApproved: true,
    });
  }

  await safeSendTelegramMessage({
    chatId,
    text: result.approved
      ? `✅ Pengeluaran disetujui\nID: ${expenseId}`
      : `Persetujuan tercatat (${result.approvalCount}/${result.approvalRequired})\nID: ${expenseId}`,
  });

  return NextResponse.json({ ok: true, handled: "approval", expenseId });
}

async function confirmEditExpense(
  chatId: number,
  action: Extract<PendingAction, { type: "edit" }>,
) {
  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findUnique({
      where: { id: action.expenseId },
    });

    if (!existing) {
      return null;
    }

    const validation = validateExpenseInput({
      expenseDate:
        action.changes.expenseDate ?? formatDateInput(existing.expenseDate),
      category: action.changes.category ?? existing.category,
      description: action.changes.description ?? existing.description,
      amount: action.changes.amount ?? existing.amount,
      vendorName: action.changes.vendorName ?? existing.vendorName,
      receiptUrl: action.changes.receiptUrl ?? existing.receiptUrl,
    });

    if (!validation.success) {
      return { error: Object.values(validation.errors).join("; ") };
    }

    const updated = await tx.expense.update({
      where: { id: existing.id },
      data: {
        expenseDate: validation.data.expenseDate,
        category: validation.data.category,
        description: validation.data.description,
        amount: validation.data.amount,
        vendorName: validation.data.vendorName,
        receiptUrl: validation.data.receiptUrl,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: null,
        action: "expense.updated",
        entityType: "expense",
        entityId: updated.id,
        before: serializeExpenseForAudit(existing),
        after: {
          ...(serializeExpenseForAudit(updated) as Record<string, unknown>),
          channel: "telegram",
          telegramChatId: action.chatId,
          telegramUserId: action.userId,
        },
      },
    });

    return { updated };
  });

  if (!result) {
    await safeSendTelegramMessage({
      chatId,
      text: `Pengeluaran tidak ditemukan: ${action.expenseId}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "confirm-edit",
      error: "not-found",
    });
  }

  if ("error" in result) {
    await safeSendTelegramMessage({
      chatId,
      text: `Input tidak valid: ${result.error}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "confirm-edit",
      error: "validation",
    });
  }

  await safeSendTelegramMessage({
    chatId,
    text: `✅ Pengeluaran berhasil diperbarui\nID: ${result.updated.id}`,
  });

  return NextResponse.json({
    ok: true,
    handled: "confirm-edit",
    expenseId: result.updated.id,
  });
}

async function confirmDeleteExpense(
  chatId: number,
  action: Extract<PendingAction, { type: "delete" }>,
) {
  const prisma = getPrisma();
  const deleted = await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findUnique({
      where: { id: action.expenseId },
    });

    if (!existing) {
      return null;
    }

    await tx.expense.delete({ where: { id: existing.id } });
    await tx.auditLog.create({
      data: {
        actorUserId: null,
        action: "expense.deleted",
        entityType: "expense",
        entityId: existing.id,
        before: {
          ...(serializeExpenseForAudit(existing) as Record<string, unknown>),
          channel: "telegram",
          telegramChatId: action.chatId,
          telegramUserId: action.userId,
        },
        after: Prisma.JsonNull,
      },
    });

    return existing;
  });

  if (!deleted) {
    await safeSendTelegramMessage({
      chatId,
      text: `Pengeluaran tidak ditemukan: ${action.expenseId}`,
    });
    return NextResponse.json({
      ok: true,
      handled: "confirm-delete",
      error: "not-found",
    });
  }

  await safeSendTelegramMessage({
    chatId,
    text: `✅ Pengeluaran berhasil dihapus\nID: ${deleted.id}`,
  });

  return NextResponse.json({
    ok: true,
    handled: "confirm-delete",
    expenseId: deleted.id,
  });
}

async function handlePublicCommand(
  message: TelegramMessage,
  command: TelegramPublicCommand,
) {
  const rateLimit = consumePublicRateLimit(message.chat.id);

  if (!rateLimit.allowed) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: `Terlalu banyak permintaan. Coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
    });
    return NextResponse.json({
      ok: true,
      handled: command.name,
      rateLimited: true,
    });
  }

  if (command.name === "/saldo_publik") {
    const text = await buildPublicBalanceReply();
    await safeSendTelegramMessage({ chatId: message.chat.id, text });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  if (command.name === "/pengeluaran_publik") {
    const text = await buildPublicExpensesReply(command.limit);
    await safeSendTelegramMessage({ chatId: message.chat.id, text });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  const text = await buildPublicReportReply(command.period);
  await safeSendTelegramMessage({ chatId: message.chat.id, text });
  return NextResponse.json({ ok: true, handled: command.name });
}

async function handleBroadcastReportCommand(message: TelegramMessage) {
  const channelId = getTelegramPublicChannelId();

  if (channelId === null) {
    await safeSendTelegramMessage({
      chatId: message.chat.id,
      text: "TELEGRAM_PUBLIC_CHANNEL_ID belum dikonfigurasi.",
    });
    return NextResponse.json({
      ok: true,
      handled: "/broadcast_laporan",
      error: "missing-channel",
    });
  }

  const text = await buildPublicReportReply("minggu");
  const sent = await safeSendTelegramMessage({ chatId: channelId, text });

  await safeSendTelegramMessage({
    chatId: message.chat.id,
    text: sent
      ? "✅ Laporan mingguan terkirim ke channel publik."
      : "Laporan gagal dikirim ke channel publik. Cek token/channel bot.",
  });

  return NextResponse.json({
    ok: true,
    handled: "/broadcast_laporan",
    sent,
  });
}

async function handleReadCommand(
  message: TelegramMessage,
  command: TelegramReadCommand,
) {
  if (command.name === "/saldo") {
    const text = await buildBalanceReply();
    await safeSendTelegramMessage({ chatId: message.chat.id, text });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  if (command.name === "/donasi_terbaru") {
    const text = await buildRecentDonationsReply(command.limit);
    await safeSendTelegramMessage({ chatId: message.chat.id, text });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  if (command.name === "/pengeluaran_terbaru") {
    const text = await buildRecentExpensesReply(command.limit);
    await safeSendTelegramMessage({ chatId: message.chat.id, text });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  if (command.name === "/cari") {
    const text = await buildSearchDonationReply(command.orderId);
    await safeSendTelegramMessage({ chatId: message.chat.id, text });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  if (command.name === "/laporan") {
    const text = await buildReportReply(command.period);
    await safeSendTelegramMessage({ chatId: message.chat.id, text });
    return NextResponse.json({ ok: true, handled: command.name });
  }

  const csv = await getAdminReportExport({
    from: command.from,
    to: command.to,
  });
  const filename = buildExportFilename(command.from, command.to);
  await safeSendTelegramDocument({
    chatId: message.chat.id,
    filename,
    content: csv,
    caption: "Export laporan Jumat Berkah.",
  });
  return NextResponse.json({ ok: true, handled: command.name });
}

function consumePublicRateLimit(chatId: number) {
  const now = Date.now();
  const currentHits = publicRateLimitHits.get(chatId) ?? [];
  const decision = checkTelegramPublicRateLimit({
    now,
    windowMs: PUBLIC_RATE_LIMIT_WINDOW_MS,
    maxHits: PUBLIC_RATE_LIMIT_MAX_HITS,
    hits: currentHits,
  });
  const activeHits = currentHits.filter(
    (hit) => now - hit < PUBLIC_RATE_LIMIT_WINDOW_MS,
  );

  if (decision.allowed) {
    activeHits.push(now);
  }

  publicRateLimitHits.set(chatId, activeHits);
  return decision;
}

async function buildPublicBalanceReply() {
  const prisma = getPrisma();
  const [totalIncome, totalExpenses] = await Promise.all([
    prisma.donation.aggregate({
      where: { status: DonationStatus.settlement },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { approvalStatus: ExpenseApprovalStatus.approved },
      _sum: { amount: true },
    }),
  ]);
  const income = totalIncome._sum.amount ?? 0;
  const expenses = totalExpenses._sum.amount ?? 0;

  return [
    "💰 Saldo Publik Jumat Berkah",
    `Saldo saat ini: ${formatRupiah(income - expenses)}`,
    `Total pemasukan: ${formatRupiah(income)}`,
    `Total pengeluaran: ${formatRupiah(expenses)}`,
  ].join("\n");
}

async function buildPublicExpensesReply(limit: number) {
  const prisma = getPrisma();
  const expenses = await prisma.expense.findMany({
    where: { approvalStatus: ExpenseApprovalStatus.approved },
    orderBy: { expenseDate: "desc" },
    take: limit,
    select: {
      expenseDate: true,
      category: true,
      description: true,
      amount: true,
    },
  });

  if (expenses.length === 0) {
    return "Belum ada pengeluaran publik tercatat.";
  }

  return [
    `🧾 ${expenses.length} Pengeluaran Publik Terbaru`,
    ...expenses.map((expense, index) =>
      [
        `${index + 1}. ${expense.category}`,
        `   ${formatRupiah(expense.amount)} — ${expense.description}`,
        `   ${formatJakartaDateTime(expense.expenseDate)}`,
      ].join("\n"),
    ),
  ].join("\n");
}

async function buildPublicReportReply(period: "hari" | "minggu" | "bulan") {
  const range = getPeriodRange(period);
  const report = await getPublicReport(range);

  return [
    `📊 Laporan Publik ${periodLabel(period)}`,
    `Pemasukan: ${formatRupiah(report.summary.income)}`,
    `Pengeluaran: ${formatRupiah(report.summary.expenses)}`,
    `Saldo periode: ${formatRupiah(report.summary.periodBalance)}`,
    `Saldo saat ini: ${formatRupiah(report.summary.currentBalance)}`,
    `Jumlah donasi tampil: ${report.donations.length}`,
    `Jumlah pengeluaran tampil: ${report.expenses.length}`,
    "Detail lengkap: buka halaman /laporan.",
  ].join("\n");
}

async function buildBalanceReply() {
  const prisma = getPrisma();
  const today = getPeriodRange("hari");
  const week = getPeriodRange("minggu");
  const [totalIncome, totalExpenses, todayIncome, weekIncome] =
    await Promise.all([
      prisma.donation.aggregate({
        where: { status: DonationStatus.settlement },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { approvalStatus: ExpenseApprovalStatus.approved },
        _sum: { amount: true },
      }),
      prisma.donation.aggregate({
        where: {
          status: DonationStatus.settlement,
          paidAt: buildDateWhere(today),
        },
        _sum: { amount: true },
      }),
      prisma.donation.aggregate({
        where: {
          status: DonationStatus.settlement,
          paidAt: buildDateWhere(week),
        },
        _sum: { amount: true },
      }),
    ]);
  const income = totalIncome._sum.amount ?? 0;
  const expenses = totalExpenses._sum.amount ?? 0;

  return [
    "💰 Saldo Jumat Berkah",
    `Saldo saat ini: ${formatRupiah(income - expenses)}`,
    `Total pemasukan: ${formatRupiah(income)}`,
    `Total pengeluaran: ${formatRupiah(expenses)}`,
    `Pemasukan hari ini: ${formatRupiah(todayIncome._sum.amount ?? 0)}`,
    `Pemasukan minggu ini: ${formatRupiah(weekIncome._sum.amount ?? 0)}`,
  ].join("\n");
}

async function buildRecentDonationsReply(limit: number) {
  const prisma = getPrisma();
  const donations = await prisma.donation.findMany({
    where: { status: DonationStatus.settlement },
    orderBy: { paidAt: "desc" },
    take: limit,
    select: {
      orderId: true,
      donorName: true,
      isAnonymous: true,
      showNamePublicly: true,
      amount: true,
      paidAt: true,
      createdAt: true,
      message: true,
    },
  });

  if (donations.length === 0) {
    return "Belum ada donasi settlement.";
  }

  return [
    `🎉 ${donations.length} Donasi Terbaru`,
    ...donations.map((donation, index) => {
      const name = getPublicDonorName({
        donorName: donation.donorName,
        isAnonymous: donation.isAnonymous,
        showNamePublicly: donation.showNamePublicly,
      });
      const lines = [
        `${index + 1}. ${donation.orderId}`,
        `   ${formatRupiah(donation.amount)} — ${name}`,
        `   ${formatJakartaDateTime(donation.paidAt ?? donation.createdAt)}`,
      ];

      if (donation.message) {
        lines.push(`   Pesan: ${donation.message}`);
      }

      return lines.join("\n");
    }),
  ].join("\n");
}

async function buildRecentExpensesReply(limit: number) {
  const prisma = getPrisma();
  const expenses = await prisma.expense.findMany({
    where: { approvalStatus: ExpenseApprovalStatus.approved },
    orderBy: { expenseDate: "desc" },
    take: limit,
    select: {
      id: true,
      expenseDate: true,
      category: true,
      description: true,
      amount: true,
      vendorName: true,
    },
  });

  if (expenses.length === 0) {
    return "Belum ada pengeluaran tercatat.";
  }

  return [
    `🧾 ${expenses.length} Pengeluaran Terbaru`,
    ...expenses.map((expense, index) => {
      const vendor = expense.vendorName ? ` — ${expense.vendorName}` : "";
      return [
        `${index + 1}. ${expense.category}${vendor}`,
        `   ${formatRupiah(expense.amount)} — ${expense.description}`,
        `   ${formatJakartaDateTime(expense.expenseDate)}`,
        `   ID: ${expense.id}`,
      ].join("\n");
    }),
  ].join("\n");
}

async function buildSearchDonationReply(orderId: string | null) {
  if (!orderId) {
    return "Format: /cari <orderId>";
  }

  const prisma = getPrisma();
  const donation = await prisma.donation.findUnique({
    where: { orderId },
    select: {
      orderId: true,
      donorName: true,
      isAnonymous: true,
      showNamePublicly: true,
      amount: true,
      status: true,
      paidAt: true,
      createdAt: true,
      message: true,
    },
  });

  if (!donation) {
    return `Donasi tidak ditemukan: ${orderId}`;
  }

  const donorName = getPublicDonorName({
    donorName: donation.donorName,
    isAnonymous: donation.isAnonymous,
    showNamePublicly: donation.showNamePublicly,
  });
  const lines = [
    "🔎 Detail Donasi",
    `Order: ${donation.orderId}`,
    `Status: ${donation.status}`,
    `Nominal: ${formatRupiah(donation.amount)}`,
    `Donatur: ${donorName}`,
    `Waktu: ${formatJakartaDateTime(donation.paidAt ?? donation.createdAt)}`,
  ];

  if (donation.message) {
    lines.push(`Pesan: ${donation.message}`);
  }

  return lines.join("\n");
}

async function buildReportReply(period: "hari" | "minggu" | "bulan") {
  const range = getPeriodRange(period);
  const report = await getPublicReport(range);

  return [
    `📊 Laporan ${periodLabel(period)}`,
    `Pemasukan: ${formatRupiah(report.summary.income)}`,
    `Pengeluaran: ${formatRupiah(report.summary.expenses)}`,
    `Saldo periode: ${formatRupiah(report.summary.periodBalance)}`,
    `Saldo saat ini: ${formatRupiah(report.summary.currentBalance)}`,
    `Donasi tampil: ${report.donations.length}`,
    `Pengeluaran tampil: ${report.expenses.length}`,
  ].join("\n");
}

function getPeriodRange(period: "hari" | "minggu" | "bulan") {
  const now = new Date();
  const jakartaNow = new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now),
  );
  const start = new Date(jakartaNow);

  if (period === "minggu") {
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
  }

  if (period === "bulan") {
    start.setDate(1);
  }

  const end = new Date(jakartaNow);
  end.setHours(23, 59, 59, 999);

  return {
    from: new Date(`${formatDateInput(start)}T00:00:00.000+07:00`),
    to: new Date(`${formatDateInput(end)}T23:59:59.999+07:00`),
  };
}

function buildDateWhere(range: { from: Date | null; to: Date | null }) {
  return {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.to ? { lte: range.to } : {}),
  };
}

function periodLabel(period: "hari" | "minggu" | "bulan") {
  if (period === "hari") {
    return "Hari Ini";
  }

  if (period === "minggu") {
    return "Minggu Ini";
  }

  return "Bulan Ini";
}

function buildExportFilename(from: string | null, to: string | null) {
  const suffix = [from, to].filter(Boolean).join("_");
  return suffix
    ? `laporan-jumat-berkah-${suffix}.csv`
    : "laporan-jumat-berkah.csv";
}

function formatDateInput(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function createPendingAction(action: PendingAction): string {
  cleanupExpiredPendingActions();
  const token = crypto.randomUUID();
  pendingActions.set(token, action);
  return token;
}

function cleanupExpiredPendingActions() {
  const now = Date.now();

  for (const [token, action] of pendingActions.entries()) {
    if (action.expiresAt < now) {
      pendingActions.delete(token);
    }
  }
}

function confirmationKeyboard(token: string) {
  return {
    inline_keyboard: [
      [
        { text: "Ya", callback_data: `expense_confirm:${token}` },
        { text: "Batal", callback_data: `expense_cancel:${token}` },
      ],
    ],
  };
}

function parseApprovalCallback(data: string) {
  const [action, expenseId] = data.split(":");
  return action === "expense_approve" && expenseId ? expenseId : null;
}

function parseConfirmationCallback(data: string) {
  const [action, token] = data.split(":");

  if (!token) {
    return null;
  }

  if (action === "expense_confirm") {
    return { decision: "confirm" as const, token };
  }

  if (action === "expense_cancel") {
    return { decision: "cancel" as const, token };
  }

  return null;
}

function editExpenseUsage() {
  return [
    "Format:",
    "/edit_pengeluaran <id> field=value field=value",
    "",
    "Field: tanggal, kategori, nominal, deskripsi, vendor, struk",
    "Contoh:",
    "/edit_pengeluaran expense-id nominal=350000 vendor=Pasar",
  ].join("\n");
}

function formatChanges(changes: Record<string, string>) {
  return Object.entries(changes)
    .map(([field, value]) => `${field}=${value}`)
    .join(", ");
}

function helpText(): string {
  return [
    "Perintah tersedia:",
    "/pengeluaran — catat pengeluaran",
    "/edit_pengeluaran <id> field=value — edit pengeluaran dengan konfirmasi",
    "/hapus_pengeluaran <id> — hapus pengeluaran dengan konfirmasi",
    "/struk <expenseId> — lampirkan foto struk sebagai caption",
    "/saldo — cek saldo cepat",
    "/donasi_terbaru [n] — lihat donasi settlement terbaru",
    "/pengeluaran_terbaru [n] — lihat pengeluaran terbaru",
    "/cari <orderId> — cari donasi by order ID",
    "/laporan <hari|minggu|bulan> — ringkasan periode",
    "/csv [from] [to] — kirim export CSV laporan",
    "/broadcast_laporan — kirim laporan mingguan ke channel publik",
    "",
    "Perintah publik:",
    "/saldo_publik — saldo publik tanpa data privat",
    "/pengeluaran_publik [n] — pengeluaran publik terbaru",
    "/laporan_publik <hari|minggu|bulan> — ringkasan publik",
    "",
    expenseCommandUsage(),
  ].join("\n");
}
