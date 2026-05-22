import assert from "node:assert/strict";
import test from "node:test";

import { ExpenseApprovalStatus } from "@/generated/prisma/client";
import {
  parseDonationAmount,
  parseDonorCommand,
  shouldSendFridayReminder,
  fridayReminderMessage,
} from "@/lib/telegram-donor";
import {
  decideExpenseApproval,
  evaluateApprovalProgress,
  getExpenseApprovalRequiredCount,
  getExpenseApprovalThreshold,
} from "@/lib/expense-approvals";
import {
  buildReceiptObjectKey,
  buildSignedReceiptUrl,
  verifySignedReceiptUrl,
} from "@/lib/receipt-storage";
import {
  getCronSecretFromHeaders,
  getInvalidSignatureAlertWindowMinutes,
  getLowBalanceThreshold,
  shouldSendInvalidSignatureAlert,
  shouldSendLowBalanceAlert,
  verifyCronSecret,
} from "@/lib/telegram-cron";
import {
  getFailedLoginAlertThreshold,
  getFailedLoginAlertWindowMinutes,
  getLargeExpenseAlertThreshold,
  getTelegramAlertCooldownMinutes,
  isCriticalAuditEvent,
  shouldSendCooldownAlert,
  shouldSendFailedLoginAlert,
} from "@/lib/telegram-alerts";
import {
  checkTelegramPublicRateLimit,
  expenseCommandUsage,
  formatDonationSettlementMessage,
  formatRupiah,
  getTelegramAdminChatIds,
  getTelegramNotifyChatId,
  getTelegramPublicChannelId,
  isAllowedAdminChat,
  isTelegramNotifyEnabled,
  parseDeleteExpenseCommand,
  parseEditExpenseCommand,
  parseExpenseCommand,
  parseReceiptCommand,
  parseTelegramBroadcastCommand,
  parseTelegramPublicCommand,
  parseTelegramReadCommand,
  parseTelegramUpdate,
  verifyTelegramSecretToken,
} from "@/lib/telegram";

test("parseDonorCommand handles donor self-service commands", () => {
  assert.deepEqual(parseDonorCommand("/mulai ABC123"), {
    name: "/mulai",
    linkCode: "ABC123",
  });
  assert.deepEqual(parseDonorCommand("/donasi 50.000"), {
    name: "/donasi",
    amount: 50000,
  });
  assert.deepEqual(parseDonorCommand("/status JB-123"), {
    name: "/status",
    orderId: "JB-123",
  });
  assert.deepEqual(parseDonorCommand("/riwayat"), { name: "/riwayat" });
  assert.deepEqual(parseDonorCommand("/reminder on"), {
    name: "/reminder",
    enabled: true,
  });
  assert.deepEqual(parseDonorCommand("/reminder off"), {
    name: "/reminder",
    enabled: false,
  });
  assert.equal(parseDonorCommand("/saldo"), null);
});

test("parseDonationAmount rejects invalid donor amounts", () => {
  assert.equal(parseDonationAmount("10000"), 10000);
  assert.equal(parseDonationAmount("10.000"), 10000);
  assert.equal(parseDonationAmount("1000.5"), null);
  assert.equal(parseDonationAmount("0"), null);
  assert.equal(parseDonationAmount(undefined), null);
});

test("shouldSendFridayReminder sends only Friday once", () => {
  assert.equal(
    shouldSendFridayReminder({
      now: new Date("2026-05-22T01:00:00.000Z"),
      alreadySentThisDate: false,
    }),
    true,
  );
  assert.equal(
    shouldSendFridayReminder({
      now: new Date("2026-05-22T01:00:00.000Z"),
      alreadySentThisDate: true,
    }),
    false,
  );
  assert.equal(
    shouldSendFridayReminder({
      now: new Date("2026-05-21T01:00:00.000Z"),
      alreadySentThisDate: false,
    }),
    false,
  );
  assert.match(fridayReminderMessage(), /bukan donasi otomatis/);
});

test("parseTelegramUpdate accepts valid message payload", () => {
  const update = parseTelegramUpdate({
    update_id: 1,
    message: {
      message_id: 10,
      date: 1716355200,
      chat: { id: 123, type: "private" },
      from: { id: 999, is_bot: false, username: "admin", first_name: "Admin" },
      text: "/pengeluaran",
    },
  });

  assert.notEqual(update, null);
  assert.equal(update?.updateId, 1);
  assert.equal(update?.message?.chat.id, 123);
  assert.equal(update?.message?.text, "/pengeluaran");
});

test("parseTelegramUpdate rejects payload without update_id", () => {
  assert.equal(parseTelegramUpdate({ message: {} }), null);
  assert.equal(parseTelegramUpdate(null), null);
  assert.equal(parseTelegramUpdate("not-an-object"), null);
});

test("parseTelegramUpdate accepts updates without text message", () => {
  const update = parseTelegramUpdate({
    update_id: 2,
    edited_message: { foo: "bar" },
  });

  assert.notEqual(update, null);
  assert.equal(update?.message, null);
});

test("verifyTelegramSecretToken accepts matching secret", () => {
  process.env.TELEGRAM_WEBHOOK_SECRET = "super-secret-value";
  assert.equal(verifyTelegramSecretToken("super-secret-value"), true);
});

test("verifyTelegramSecretToken rejects mismatched secret", () => {
  process.env.TELEGRAM_WEBHOOK_SECRET = "super-secret-value";
  assert.equal(verifyTelegramSecretToken("wrong-secret"), false);
  assert.equal(verifyTelegramSecretToken(""), false);
  assert.equal(verifyTelegramSecretToken(null), false);
  assert.equal(verifyTelegramSecretToken(undefined), false);
});

test("verifyTelegramSecretToken rejects when env secret is missing", () => {
  const previous = process.env.TELEGRAM_WEBHOOK_SECRET;
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  assert.equal(verifyTelegramSecretToken("anything"), false);

  if (previous !== undefined) {
    process.env.TELEGRAM_WEBHOOK_SECRET = previous;
  }
});

test("isAllowedAdminChat enforces admin chat allowlist", () => {
  process.env.TELEGRAM_ADMIN_CHAT_IDS = "123, 456 ,789";
  assert.deepEqual(getTelegramAdminChatIds(), [123, 456, 789]);
  assert.equal(isAllowedAdminChat(123), true);
  assert.equal(isAllowedAdminChat(456), true);
  assert.equal(isAllowedAdminChat(999), false);
});

test("isAllowedAdminChat rejects all when env empty", () => {
  process.env.TELEGRAM_ADMIN_CHAT_IDS = "";
  assert.deepEqual(getTelegramAdminChatIds(), []);
  assert.equal(isAllowedAdminChat(1), false);
});

test("getTelegramNotifyChatId parses valid integer chat id", () => {
  process.env.TELEGRAM_NOTIFY_CHAT_ID = "-1001234567890";
  assert.equal(getTelegramNotifyChatId(), -1001234567890);
});

test("getTelegramNotifyChatId returns null on invalid input", () => {
  process.env.TELEGRAM_NOTIFY_CHAT_ID = "";
  assert.equal(getTelegramNotifyChatId(), null);

  process.env.TELEGRAM_NOTIFY_CHAT_ID = "not-a-number";
  assert.equal(getTelegramNotifyChatId(), null);

  process.env.TELEGRAM_NOTIFY_CHAT_ID = "1.5";
  assert.equal(getTelegramNotifyChatId(), null);
});

test("getTelegramPublicChannelId parses configured channel id", () => {
  process.env.TELEGRAM_PUBLIC_CHANNEL_ID = "-100987654321";
  assert.equal(getTelegramPublicChannelId(), -100987654321);

  process.env.TELEGRAM_PUBLIC_CHANNEL_ID = "";
  assert.equal(getTelegramPublicChannelId(), null);

  process.env.TELEGRAM_PUBLIC_CHANNEL_ID = "bad";
  assert.equal(getTelegramPublicChannelId(), null);
});

test("verifyCronSecret requires matching configured secret", () => {
  process.env.CRON_SECRET = "cron-secret";
  assert.equal(verifyCronSecret("cron-secret"), true);
  assert.equal(verifyCronSecret("wrong"), false);
  assert.equal(verifyCronSecret(null), false);

  delete process.env.CRON_SECRET;
  assert.equal(verifyCronSecret("cron-secret"), false);
});

test("getCronSecretFromHeaders supports custom header and Vercel bearer auth", () => {
  assert.equal(
    getCronSecretFromHeaders(new Headers({ "x-cron-secret": "custom" })),
    "custom",
  );
  assert.equal(
    getCronSecretFromHeaders(
      new Headers({ authorization: "Bearer vercel-secret" }),
    ),
    "vercel-secret",
  );
  assert.equal(getCronSecretFromHeaders(new Headers()), null);
});

test("getLowBalanceThreshold parses non-negative integer", () => {
  process.env.TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH = "500000";
  assert.equal(getLowBalanceThreshold(), 500000);

  process.env.TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH = "0";
  assert.equal(getLowBalanceThreshold(), 0);

  process.env.TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH = "-1";
  assert.equal(getLowBalanceThreshold(), null);

  process.env.TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH = "10.5";
  assert.equal(getLowBalanceThreshold(), null);
});

test("shouldSendLowBalanceAlert fires only below threshold and once", () => {
  assert.equal(
    shouldSendLowBalanceAlert({
      currentBalance: 99_999,
      threshold: 100_000,
      alreadySent: false,
    }).shouldAlert,
    true,
  );
  assert.equal(
    shouldSendLowBalanceAlert({
      currentBalance: 100_000,
      threshold: 100_000,
      alreadySent: false,
    }).shouldAlert,
    false,
  );
  assert.equal(
    shouldSendLowBalanceAlert({
      currentBalance: 50_000,
      threshold: 100_000,
      alreadySent: true,
    }).shouldAlert,
    false,
  );
  assert.equal(
    shouldSendLowBalanceAlert({
      currentBalance: 50_000,
      threshold: null,
      alreadySent: false,
    }).shouldAlert,
    false,
  );
});

test("failed admin login alert respects threshold and cooldown", () => {
  process.env.TELEGRAM_FAILED_LOGIN_ALERT_THRESHOLD = "4";
  process.env.TELEGRAM_FAILED_LOGIN_ALERT_WINDOW_MINUTES = "10";
  process.env.TELEGRAM_ALERT_COOLDOWN_MINUTES = "20";

  assert.equal(getFailedLoginAlertThreshold(), 4);
  assert.equal(getFailedLoginAlertWindowMinutes(), 10);
  assert.equal(getTelegramAlertCooldownMinutes(), 20);

  assert.equal(
    shouldSendFailedLoginAlert({
      failedCount: 3,
      threshold: 4,
      windowMinutes: 10,
      cooldownMinutes: 20,
      cooldownActive: false,
    }).shouldAlert,
    false,
  );
  assert.equal(
    shouldSendFailedLoginAlert({
      failedCount: 4,
      threshold: 4,
      windowMinutes: 10,
      cooldownMinutes: 20,
      cooldownActive: false,
    }).shouldAlert,
    true,
  );
  assert.equal(
    shouldSendFailedLoginAlert({
      failedCount: 5,
      threshold: 4,
      windowMinutes: 10,
      cooldownMinutes: 20,
      cooldownActive: true,
    }).shouldAlert,
    false,
  );
});

test("critical audit event detection covers delete and large create", () => {
  process.env.TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH = "500000";
  assert.equal(getLargeExpenseAlertThreshold(), 500000);
  assert.equal(
    isCriticalAuditEvent({
      action: "expense.deleted",
      amount: 1,
      largeExpenseThreshold: null,
    }),
    true,
  );
  assert.equal(
    isCriticalAuditEvent({
      action: "expense.created",
      amount: 500000,
      largeExpenseThreshold: 500000,
    }),
    true,
  );
  assert.equal(
    isCriticalAuditEvent({
      action: "expense.created",
      amount: 499999,
      largeExpenseThreshold: 500000,
    }),
    false,
  );
  assert.deepEqual(
    shouldSendCooldownAlert({ cooldownActive: true, cooldownMinutes: 30 }),
    { allowed: false, cooldownMinutes: 30 },
  );
});

test("invalid signature alert respects rate-limit window", () => {
  process.env.TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES = "45";
  assert.equal(getInvalidSignatureAlertWindowMinutes(), 45);

  process.env.TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES = "bad";
  assert.equal(getInvalidSignatureAlertWindowMinutes(), 30);

  assert.equal(
    shouldSendInvalidSignatureAlert({
      invalidCount: 1,
      windowMinutes: 30,
      alreadySentInWindow: false,
    }).shouldAlert,
    true,
  );
  assert.equal(
    shouldSendInvalidSignatureAlert({
      invalidCount: 1,
      windowMinutes: 30,
      alreadySentInWindow: true,
    }).shouldAlert,
    false,
  );
  assert.equal(
    shouldSendInvalidSignatureAlert({
      invalidCount: 0,
      windowMinutes: 30,
      alreadySentInWindow: false,
    }).shouldAlert,
    false,
  );
});

test("isTelegramNotifyEnabled requires explicit true string", () => {
  process.env.TELEGRAM_NOTIFY_ENABLED = "true";
  assert.equal(isTelegramNotifyEnabled(), true);

  process.env.TELEGRAM_NOTIFY_ENABLED = "false";
  assert.equal(isTelegramNotifyEnabled(), false);

  process.env.TELEGRAM_NOTIFY_ENABLED = "";
  assert.equal(isTelegramNotifyEnabled(), false);
});

test("expense approval threshold logic requires approval for large expense", () => {
  process.env.EXPENSE_APPROVAL_THRESHOLD_RUPIAH = "500000";
  process.env.EXPENSE_APPROVAL_REQUIRED_COUNT = "3";
  assert.equal(getExpenseApprovalThreshold(), 500000);
  assert.equal(getExpenseApprovalRequiredCount(), 3);

  const pending = decideExpenseApproval({
    amount: 500000,
    threshold: getExpenseApprovalThreshold(),
    requiredCount: getExpenseApprovalRequiredCount(),
    now: new Date("2026-05-22T00:00:00.000Z"),
  });
  assert.equal(pending.status, ExpenseApprovalStatus.pending_approval);
  assert.equal(pending.approvalRequired, 3);
  assert.equal(pending.approvedAt, null);

  const approved = decideExpenseApproval({
    amount: 499999,
    threshold: getExpenseApprovalThreshold(),
    requiredCount: getExpenseApprovalRequiredCount(),
    now: new Date("2026-05-22T00:00:00.000Z"),
  });
  assert.equal(approved.status, ExpenseApprovalStatus.approved);
  assert.equal(approved.approvalRequired, 1);
  assert.notEqual(approved.approvedAt, null);
});

test("approval progress requires enough distinct approvals", () => {
  assert.deepEqual(
    evaluateApprovalProgress({ approvalCount: 1, approvalRequired: 2 }),
    {
      approved: false,
      approvalCount: 1,
      approvalRequired: 2,
    },
  );
  assert.deepEqual(
    evaluateApprovalProgress({ approvalCount: 2, approvalRequired: 2 }),
    {
      approved: true,
      approvalCount: 2,
      approvalRequired: 2,
    },
  );
});

test("receipt signed URL generation verifies signature and expiry", () => {
  const objectKey = buildReceiptObjectKey({
    expenseId: "expense-id",
    telegramFileId: "file/unsafe:id",
    now: new Date("2026-05-22T01:02:03.000Z"),
  });
  assert.equal(objectKey, "receipts/2026-05-22/expense-id/file_unsafe_id.jpg");

  const url = buildSignedReceiptUrl({
    objectKey,
    expiresAt: new Date("2026-05-22T02:00:00.000Z"),
    baseUrl: "https://app.example.com",
    secret: "secret",
  });
  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/api/admin/receipts");
  assert.equal(parsed.searchParams.get("key"), objectKey);

  const expires = Number(parsed.searchParams.get("expires"));
  const signature = parsed.searchParams.get("signature") ?? "";
  assert.equal(
    verifySignedReceiptUrl({
      objectKey,
      expires,
      signature,
      secret: "secret",
      now: new Date("2026-05-22T01:30:00.000Z"),
    }),
    true,
  );
  assert.equal(
    verifySignedReceiptUrl({
      objectKey,
      expires,
      signature,
      secret: "secret",
      now: new Date("2026-05-22T02:30:00.000Z"),
    }),
    false,
  );
});

test("parseReceiptCommand parses /struk command", () => {
  assert.equal(parseReceiptCommand("/struk expense-id"), "expense-id");
  assert.equal(parseReceiptCommand("/struk"), null);
  assert.equal(parseReceiptCommand("/saldo"), undefined);
});

test("parseExpenseCommand accepts well-formed command", () => {
  const result = parseExpenseCommand(
    "/pengeluaran 2026-05-22 | Beras | 300000 | 30 kg beras | Pasar Senen",
  );

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.expenseDate, "2026-05-22");
    assert.equal(result.data.category, "Beras");
    assert.equal(result.data.amount, 300_000);
    assert.equal(result.data.description, "30 kg beras");
    assert.equal(result.data.vendorName, "Pasar Senen");
  }
});

test("parseExpenseCommand accepts command with bot suffix and no vendor", () => {
  const result = parseExpenseCommand(
    "/pengeluaran@JumatBerkahBot 2026-05-22 | Beras | 300.000 | Beras 30 kg",
  );

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.amount, 300_000);
    assert.equal(result.data.vendorName, null);
  }
});

test("parseExpenseCommand rejects invalid date", () => {
  const result = parseExpenseCommand(
    "/pengeluaran 22-05-2026 | Beras | 300000 | Beras",
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /Tanggal/);
  }
});

test("parseExpenseCommand rejects unknown category", () => {
  const result = parseExpenseCommand(
    "/pengeluaran 2026-05-22 | Hadiah | 300000 | Sesuatu",
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /Kategori/);
  }
});

test("parseExpenseCommand rejects non-positive amount", () => {
  const zero = parseExpenseCommand(
    "/pengeluaran 2026-05-22 | Beras | 0 | Test",
  );
  assert.equal(zero.success, false);

  const negative = parseExpenseCommand(
    "/pengeluaran 2026-05-22 | Beras | -100 | Test",
  );
  assert.equal(negative.success, false);

  const fractional = parseExpenseCommand(
    "/pengeluaran 2026-05-22 | Beras | 1500.5 | Test",
  );
  assert.equal(fractional.success, false);
});

test("parseExpenseCommand rejects missing description", () => {
  const result = parseExpenseCommand(
    "/pengeluaran 2026-05-22 | Beras | 300000 | ",
  );

  assert.equal(result.success, false);
});

test("parseExpenseCommand rejects non-pengeluaran command", () => {
  const result = parseExpenseCommand("/saldo");
  assert.equal(result.success, false);
});

test("parseExpenseCommand replies with usage hint when arguments missing", () => {
  const result = parseExpenseCommand("/pengeluaran");
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error, expenseCommandUsage());
  }
});

test("parseTelegramUpdate accepts callback query payload", () => {
  const update = parseTelegramUpdate({
    update_id: 3,
    callback_query: {
      id: "callback-id",
      from: { id: 999, is_bot: false, first_name: "Admin" },
      message: {
        message_id: 11,
        date: 1716355200,
        chat: { id: 123, type: "private" },
        text: "Konfirmasi",
      },
      data: "expense_confirm:token-123",
    },
  });

  assert.notEqual(update, null);
  assert.equal(update?.callbackQuery?.id, "callback-id");
  assert.equal(update?.callbackQuery?.from.id, 999);
  assert.equal(update?.callbackQuery?.message?.chat.id, 123);
  assert.equal(update?.callbackQuery?.data, "expense_confirm:token-123");
});

test("parseEditExpenseCommand accepts allowed fields", () => {
  const result = parseEditExpenseCommand(
    "/edit_pengeluaran expense-id nominal=350000 vendor=Pasar kategori=Beras",
  );

  assert.notEqual(result, null);
  assert.equal(result?.id, "expense-id");
  assert.deepEqual(result?.changes, {
    amount: "350000",
    vendorName: "Pasar",
    category: "Beras",
  });
  assert.deepEqual(result?.invalidFields, []);
});

test("parseEditExpenseCommand rejects invalid field names", () => {
  const result = parseEditExpenseCommand(
    "/edit_pengeluaran expense-id foo=bar nominal=350000 badtoken",
  );

  assert.notEqual(result, null);
  assert.equal(result?.id, "expense-id");
  assert.deepEqual(result?.changes, { amount: "350000" });
  assert.deepEqual(result?.invalidFields, ["foo", "badtoken"]);
});

test("parseEditExpenseCommand returns null for other command", () => {
  assert.equal(parseEditExpenseCommand("/saldo"), null);
});

test("parseDeleteExpenseCommand parses delete command", () => {
  assert.equal(
    parseDeleteExpenseCommand("/hapus_pengeluaran expense-id"),
    "expense-id",
  );
  assert.equal(parseDeleteExpenseCommand("/hapus_pengeluaran"), null);
  assert.equal(parseDeleteExpenseCommand("/saldo"), undefined);
});

test("parseTelegramReadCommand parses balance command", () => {
  assert.deepEqual(parseTelegramReadCommand("/saldo"), { name: "/saldo" });
  assert.deepEqual(parseTelegramReadCommand("/saldo@JumatBerkahBot"), {
    name: "/saldo",
  });
});

test("parseTelegramReadCommand parses and clamps latest donation limit", () => {
  assert.deepEqual(parseTelegramReadCommand("/donasi_terbaru"), {
    name: "/donasi_terbaru",
    limit: 5,
  });
  assert.deepEqual(parseTelegramReadCommand("/donasi_terbaru 12"), {
    name: "/donasi_terbaru",
    limit: 12,
  });
  assert.deepEqual(parseTelegramReadCommand("/donasi_terbaru 99"), {
    name: "/donasi_terbaru",
    limit: 20,
  });
  assert.deepEqual(parseTelegramReadCommand("/donasi_terbaru nope"), {
    name: "/donasi_terbaru",
    limit: 5,
  });
});

test("parseTelegramReadCommand parses and clamps latest expense limit", () => {
  assert.deepEqual(parseTelegramReadCommand("/pengeluaran_terbaru 3"), {
    name: "/pengeluaran_terbaru",
    limit: 3,
  });
  assert.deepEqual(parseTelegramReadCommand("/pengeluaran_terbaru 0"), {
    name: "/pengeluaran_terbaru",
    limit: 5,
  });
});

test("parseTelegramReadCommand parses search command", () => {
  assert.deepEqual(parseTelegramReadCommand("/cari JB-20260522-ABC"), {
    name: "/cari",
    orderId: "JB-20260522-ABC",
  });
  assert.deepEqual(parseTelegramReadCommand("/cari"), {
    name: "/cari",
    orderId: null,
  });
});

test("parseTelegramReadCommand parses report period", () => {
  assert.deepEqual(parseTelegramReadCommand("/laporan"), {
    name: "/laporan",
    period: "hari",
  });
  assert.deepEqual(parseTelegramReadCommand("/laporan minggu"), {
    name: "/laporan",
    period: "minggu",
  });
  assert.deepEqual(parseTelegramReadCommand("/laporan bulan"), {
    name: "/laporan",
    period: "bulan",
  });
  assert.deepEqual(parseTelegramReadCommand("/laporan tahun"), {
    name: "/laporan",
    period: "hari",
  });
});

test("parseTelegramReadCommand parses CSV date filters", () => {
  assert.deepEqual(parseTelegramReadCommand("/csv 2026-05-01 2026-05-31"), {
    name: "/csv",
    from: "2026-05-01",
    to: "2026-05-31",
  });
  assert.deepEqual(parseTelegramReadCommand("/csv invalid 2026-05-31"), {
    name: "/csv",
    from: null,
    to: "2026-05-31",
  });
});

test("parseTelegramReadCommand rejects unknown command", () => {
  assert.equal(parseTelegramReadCommand("/unknown"), null);
});

test("parseTelegramPublicCommand parses public transparency commands", () => {
  assert.deepEqual(parseTelegramPublicCommand("/saldo_publik"), {
    name: "/saldo_publik",
  });
  assert.deepEqual(parseTelegramPublicCommand("/pengeluaran_publik 99"), {
    name: "/pengeluaran_publik",
    limit: 20,
  });
  assert.deepEqual(parseTelegramPublicCommand("/laporan_publik minggu"), {
    name: "/laporan_publik",
    period: "minggu",
  });
  assert.deepEqual(parseTelegramPublicCommand("/laporan_publik tahun"), {
    name: "/laporan_publik",
    period: "hari",
  });
  assert.equal(parseTelegramPublicCommand("/saldo"), null);
});

test("parseTelegramBroadcastCommand parses admin broadcast command", () => {
  assert.deepEqual(parseTelegramBroadcastCommand("/broadcast_laporan"), {
    name: "/broadcast_laporan",
  });
  assert.deepEqual(parseTelegramBroadcastCommand("/broadcast_laporan@Bot"), {
    name: "/broadcast_laporan",
  });
  assert.equal(parseTelegramBroadcastCommand("/laporan_publik"), null);
});

test("checkTelegramPublicRateLimit allows within window and blocks excess", () => {
  assert.deepEqual(
    checkTelegramPublicRateLimit({
      now: 10_000,
      windowMs: 60_000,
      maxHits: 3,
      hits: [1_000, 2_000],
    }),
    { allowed: true, retryAfterSeconds: 0 },
  );

  assert.deepEqual(
    checkTelegramPublicRateLimit({
      now: 10_000,
      windowMs: 60_000,
      maxHits: 3,
      hits: [1_000, 2_000, 3_000],
    }),
    { allowed: false, retryAfterSeconds: 51 },
  );

  assert.deepEqual(
    checkTelegramPublicRateLimit({
      now: 70_000,
      windowMs: 60_000,
      maxHits: 3,
      hits: [1_000, 2_000, 3_000],
    }),
    { allowed: true, retryAfterSeconds: 0 },
  );
});

test("public command names stay separate from private admin read commands", () => {
  assert.equal(parseTelegramReadCommand("/saldo_publik"), null);
  assert.equal(parseTelegramReadCommand("/pengeluaran_publik"), null);
  assert.equal(parseTelegramReadCommand("/laporan_publik"), null);
});

test("search-style donor display for Telegram read command stays public-safe", () => {
  const hidden = formatDonationSettlementMessage({
    orderId: "JB-20260522-HIDDEN",
    amount: 10_000,
    donorName: "Nama Rahasia",
    isAnonymous: false,
    showNamePublicly: false,
    message: null,
    paidAt: new Date("2026-05-22T03:00:00.000Z"),
  });

  assert.match(hidden, /Anonim/);
  assert.doesNotMatch(hidden, /Nama Rahasia/);
});

test("formatDonationSettlementMessage uses public donor name for anonymous donor", () => {
  const text = formatDonationSettlementMessage({
    orderId: "JB-20260522-ABC",
    amount: 50_000,
    donorName: "Budi",
    isAnonymous: true,
    showNamePublicly: true,
    message: "Semoga berkah",
    paidAt: new Date("2026-05-22T03:00:00.000Z"),
  });

  assert.match(text, /JB-20260522-ABC/);
  assert.match(text, /Anonim/);
  assert.doesNotMatch(text, /Budi/);
  assert.match(text, /Rp50\.000/);
  assert.match(text, /Semoga berkah/);
});

test("formatDonationSettlementMessage hides name when showNamePublicly false", () => {
  const text = formatDonationSettlementMessage({
    orderId: "JB-20260522-XYZ",
    amount: 25_000,
    donorName: "Siti",
    isAnonymous: false,
    showNamePublicly: false,
    message: null,
    paidAt: new Date("2026-05-22T03:00:00.000Z"),
  });

  assert.match(text, /Anonim/);
  assert.doesNotMatch(text, /Siti/);
});

test("formatDonationSettlementMessage shows real name when public", () => {
  const text = formatDonationSettlementMessage({
    orderId: "JB-20260522-PUB",
    amount: 100_000,
    donorName: "Andi",
    isAnonymous: false,
    showNamePublicly: true,
    message: null,
    paidAt: new Date("2026-05-22T03:00:00.000Z"),
  });

  assert.match(text, /Andi/);
});

test("formatDonationSettlementMessage never includes email or phone fields", () => {
  const text = formatDonationSettlementMessage({
    orderId: "JB-20260522-PRV",
    amount: 75_000,
    donorName: "Dewi",
    isAnonymous: false,
    showNamePublicly: true,
    message: null,
    paidAt: new Date("2026-05-22T03:00:00.000Z"),
  });

  assert.doesNotMatch(text, /@/);
  assert.doesNotMatch(text, /08\d{8,}/);
});

test("formatRupiah formats with id-ID separators", () => {
  assert.equal(formatRupiah(0), "Rp0");
  assert.equal(formatRupiah(1_000), "Rp1.000");
  assert.equal(formatRupiah(1_500_000), "Rp1.500.000");
});
