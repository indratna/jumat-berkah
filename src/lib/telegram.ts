import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/expenses";
import { getPublicDonorName } from "@/lib/reports";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export type TelegramConfig = {
  botToken: string;
};

export type TelegramFromUser = {
  id: number;
  isBot: boolean;
  username: string | null;
  firstName: string | null;
};

export type TelegramChat = {
  id: number;
  type: string;
};

export type TelegramPhotoSize = {
  fileId: string;
  fileUniqueId: string | null;
  width: number;
  height: number;
  fileSize: number | null;
};

export type TelegramMessage = {
  messageId: number;
  chat: TelegramChat;
  from: TelegramFromUser | null;
  text: string | null;
  caption: string | null;
  photo: TelegramPhotoSize[];
  replyToMessage: TelegramMessage | null;
  date: number;
};

export type TelegramCallbackQuery = {
  id: string;
  from: TelegramFromUser;
  message: TelegramMessage | null;
  data: string | null;
};

export type TelegramUpdate = {
  updateId: number;
  message: TelegramMessage | null;
  callbackQuery: TelegramCallbackQuery | null;
};

export class TelegramConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelegramConfigurationError";
  }
}

export function getTelegramBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return typeof token === "string" && token.trim().length > 0
    ? token.trim()
    : null;
}

export function getTelegramWebhookSecret(): string | null {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  return typeof secret === "string" && secret.trim().length > 0
    ? secret.trim()
    : null;
}

export function getTelegramAdminChatIds(): number[] {
  const value = process.env.TELEGRAM_ADMIN_CHAT_IDS;

  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => Number(entry))
    .filter((id) => Number.isFinite(id) && Number.isInteger(id));
}

export function getTelegramNotifyChatId(): number | null {
  const value = process.env.TELEGRAM_NOTIFY_CHAT_ID;

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const id = Number(value.trim());
  return Number.isFinite(id) && Number.isInteger(id) ? id : null;
}

export function getTelegramPublicChannelId(): number | null {
  const value = process.env.TELEGRAM_PUBLIC_CHANNEL_ID;

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const id = Number(value.trim());
  return Number.isFinite(id) && Number.isInteger(id) ? id : null;
}

export function isTelegramNotifyEnabled(): boolean {
  return process.env.TELEGRAM_NOTIFY_ENABLED === "true";
}

export function verifyTelegramSecretToken(
  headerValue: string | null | undefined,
): boolean {
  const expected = getTelegramWebhookSecret();

  if (!expected) {
    // No configured secret means we cannot trust any incoming update.
    return false;
  }

  if (typeof headerValue !== "string" || headerValue.length === 0) {
    return false;
  }

  return safeCompare(expected, headerValue);
}

export function isAllowedAdminChat(chatId: number): boolean {
  const allowlist = getTelegramAdminChatIds();
  return allowlist.includes(chatId);
}

type RawTelegramFrom = {
  id?: unknown;
  is_bot?: unknown;
  username?: unknown;
  first_name?: unknown;
};

type RawTelegramChat = {
  id?: unknown;
  type?: unknown;
};

type RawTelegramPhotoSize = {
  file_id?: unknown;
  file_unique_id?: unknown;
  width?: unknown;
  height?: unknown;
  file_size?: unknown;
};

type RawTelegramMessage = {
  message_id?: unknown;
  chat?: unknown;
  from?: unknown;
  text?: unknown;
  caption?: unknown;
  photo?: unknown;
  reply_to_message?: unknown;
  date?: unknown;
};

type RawTelegramCallbackQuery = {
  id?: unknown;
  from?: unknown;
  message?: unknown;
  data?: unknown;
};

type RawTelegramUpdate = {
  update_id?: unknown;
  message?: unknown;
  callback_query?: unknown;
};

export function parseTelegramUpdate(payload: unknown): TelegramUpdate | null {
  if (!isPlainObject(payload)) {
    return null;
  }

  const raw = payload as RawTelegramUpdate;
  const updateId = toFiniteInteger(raw.update_id);

  if (updateId === null) {
    return null;
  }

  const message = parseMessage(raw.message);
  const callbackQuery = parseCallbackQuery(raw.callback_query);

  return {
    updateId,
    message,
    callbackQuery,
  };
}

function parseMessage(value: unknown): TelegramMessage | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const raw = value as RawTelegramMessage;
  const messageId = toFiniteInteger(raw.message_id);
  const chat = parseChat(raw.chat);
  const date = toFiniteInteger(raw.date);

  if (messageId === null || !chat || date === null) {
    return null;
  }

  return {
    messageId,
    chat,
    from: parseFrom(raw.from),
    text: typeof raw.text === "string" ? raw.text : null,
    caption: typeof raw.caption === "string" ? raw.caption : null,
    photo: parsePhotos(raw.photo),
    replyToMessage: parseMessage(raw.reply_to_message),
    date,
  };
}

function parseCallbackQuery(value: unknown): TelegramCallbackQuery | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const raw = value as RawTelegramCallbackQuery;
  const id = typeof raw.id === "string" ? raw.id : null;
  const from = parseFrom(raw.from);

  if (!id || !from) {
    return null;
  }

  return {
    id,
    from,
    message: parseMessage(raw.message),
    data: typeof raw.data === "string" ? raw.data : null,
  };
}

function parsePhotos(value: unknown): TelegramPhotoSize[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isPlainObject(entry)) {
      return [];
    }

    const raw = entry as RawTelegramPhotoSize;
    const fileId = typeof raw.file_id === "string" ? raw.file_id : null;
    const width = toFiniteInteger(raw.width);
    const height = toFiniteInteger(raw.height);

    if (!fileId || width === null || height === null) {
      return [];
    }

    return [
      {
        fileId,
        fileUniqueId:
          typeof raw.file_unique_id === "string" ? raw.file_unique_id : null,
        width,
        height,
        fileSize: toFiniteInteger(raw.file_size),
      },
    ];
  });
}

function parseChat(value: unknown): TelegramChat | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const raw = value as RawTelegramChat;
  const id = toFiniteInteger(raw.id);
  const type = typeof raw.type === "string" ? raw.type : "";

  if (id === null || type.length === 0) {
    return null;
  }

  return { id, type };
}

function parseFrom(value: unknown): TelegramFromUser | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const raw = value as RawTelegramFrom;
  const id = toFiniteInteger(raw.id);

  if (id === null) {
    return null;
  }

  return {
    id,
    isBot: raw.is_bot === true,
    username: typeof raw.username === "string" ? raw.username : null,
    firstName: typeof raw.first_name === "string" ? raw.first_name : null,
  };
}

export type ParsedExpenseCommand = {
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  vendorName: string | null;
};

export type ParseExpenseCommandResult =
  | { success: true; data: ParsedExpenseCommand }
  | { success: false; error: string };

export function parseExpenseCommand(text: string): ParseExpenseCommandResult {
  if (typeof text !== "string") {
    return { success: false, error: "Format perintah tidak dikenali." };
  }

  const trimmed = text.trim();

  if (!trimmed.startsWith("/pengeluaran")) {
    return { success: false, error: "Perintah harus diawali /pengeluaran." };
  }

  // Strip the leading command (handles `/pengeluaran` and `/pengeluaran@BotName`).
  const afterCommand = trimmed.replace(/^\/pengeluaran(@[\w_]+)?/i, "").trim();

  if (afterCommand.length === 0) {
    return { success: false, error: usageHint() };
  }

  // Format wajib: <YYYY-MM-DD> | <Kategori> | <amount> | <deskripsi> [| <vendor>]
  const parts = afterCommand.split("|").map((part) => part.trim());

  if (parts.length < 4 || parts.length > 5) {
    return { success: false, error: usageHint() };
  }

  const [datePart, categoryPart, amountPart, descriptionPart, vendorPart] =
    parts;

  if (!isIsoDate(datePart)) {
    return { success: false, error: "Tanggal harus format YYYY-MM-DD." };
  }

  const category = matchCategory(categoryPart);

  if (!category) {
    return {
      success: false,
      error: `Kategori tidak valid. Pilih: ${EXPENSE_CATEGORIES.join(", ")}.`,
    };
  }

  const amount = parseAmount(amountPart);

  if (amount === null) {
    return {
      success: false,
      error: "Nominal harus bilangan bulat positif dalam Rupiah.",
    };
  }

  if (descriptionPart.length === 0) {
    return { success: false, error: "Deskripsi wajib diisi." };
  }

  const vendor = vendorPart && vendorPart.length > 0 ? vendorPart : null;

  return {
    success: true,
    data: {
      expenseDate: datePart,
      category,
      amount,
      description: descriptionPart,
      vendorName: vendor,
    },
  };
}

export function expenseCommandUsage(): string {
  return usageHint();
}

function usageHint() {
  return [
    "Format perintah:",
    "/pengeluaran YYYY-MM-DD | Kategori | Nominal | Deskripsi | Vendor (opsional)",
    "",
    "Kategori: " + EXPENSE_CATEGORIES.join(", "),
    "Contoh:",
    "/pengeluaran 2026-05-22 | Beras | 300000 | 30 kg beras | Pasar Senen",
  ].join("\n");
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000+07:00`);
  return !Number.isNaN(date.getTime());
}

function matchCategory(value: string): ExpenseCategory | null {
  const lowered = value.toLowerCase();

  for (const category of EXPENSE_CATEGORIES) {
    if (category.toLowerCase() === lowered) {
      return category;
    }
  }

  return null;
}

function parseAmount(value: string): number | null {
  // Accept "300000", "300.000", "300_000", "Rp300000".
  // Reject fractional like "1500.5" by requiring strict id-ID thousand separator pattern.
  let cleaned = value
    .replace(/[Rr][Pp]/g, "")
    .replace(/[_\s]/g, "")
    .trim();

  if (cleaned.length === 0) {
    return null;
  }

  // Only digits and dots allowed at this point.
  if (!/^[\d.]+$/.test(cleaned)) {
    return null;
  }

  if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    const firstPart = parts[0];

    if (firstPart.length === 0 || firstPart.length > 3) {
      return null;
    }

    for (let i = 1; i < parts.length; i += 1) {
      if (!/^\d{3}$/.test(parts[i])) {
        return null;
      }
    }

    cleaned = parts.join("");
  }

  const numeric = Number(cleaned);

  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
}

export type DonationNotificationInput = {
  orderId: string;
  amount: number;
  donorName: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
  message: string | null;
  paidAt: Date;
};

export function formatDonationSettlementMessage(
  input: DonationNotificationInput,
): string {
  const publicName = getPublicDonorName({
    donorName: input.donorName,
    isAnonymous: input.isAnonymous,
    showNamePublicly: input.showNamePublicly,
  });
  const formattedAmount = formatRupiah(input.amount);
  const formattedTime = formatJakartaDateTime(input.paidAt);
  const lines = [
    "🎉 Donasi Settlement",
    `Order: ${input.orderId}`,
    `Nominal: ${formattedAmount}`,
    `Donatur: ${publicName}`,
  ];

  if (input.message && input.message.trim().length > 0) {
    lines.push(`Pesan: "${input.message.trim()}"`);
  }

  lines.push(`Waktu: ${formattedTime}`);

  return lines.join("\n");
}

export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

export function formatJakartaDateTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export type TelegramEditExpenseField =
  | "expenseDate"
  | "category"
  | "amount"
  | "description"
  | "vendorName"
  | "receiptUrl";

export type TelegramEditExpenseCommand = {
  id: string | null;
  changes: Partial<Record<TelegramEditExpenseField, string>>;
  invalidFields: string[];
};

export function parseEditExpenseCommand(
  text: string,
): TelegramEditExpenseCommand | null {
  const tokens = splitCommandTokens(text);
  const command = normalizeCommandToken(tokens[0] ?? "");

  if (command !== "/edit_pengeluaran") {
    return null;
  }

  const id = tokens[1]?.trim() || null;
  const changes: Partial<Record<TelegramEditExpenseField, string>> = {};
  const invalidFields: string[] = [];

  for (const token of tokens.slice(2)) {
    const separatorIndex = token.indexOf("=");

    if (separatorIndex <= 0) {
      invalidFields.push(token);
      continue;
    }

    const rawField = token.slice(0, separatorIndex);
    const value = token.slice(separatorIndex + 1);
    const field = normalizeEditExpenseField(rawField);

    if (!field) {
      invalidFields.push(rawField);
      continue;
    }

    changes[field] = value;
  }

  return { id, changes, invalidFields };
}

export function parseReceiptCommand(text: string): string | null | undefined {
  const tokens = splitCommandTokens(text);
  const command = normalizeCommandToken(tokens[0] ?? "");

  if (command !== "/struk") {
    return undefined;
  }

  return tokens[1]?.trim() || null;
}

export function parseDeleteExpenseCommand(
  text: string,
): string | null | undefined {
  const tokens = splitCommandTokens(text);
  const command = normalizeCommandToken(tokens[0] ?? "");

  if (command !== "/hapus_pengeluaran") {
    return undefined;
  }

  return tokens[1]?.trim() || null;
}

function normalizeEditExpenseField(
  field: string,
): TelegramEditExpenseField | null {
  const normalized = field.trim().toLowerCase();

  if (
    normalized === "tanggal" ||
    normalized === "date" ||
    normalized === "expensedate"
  ) {
    return "expenseDate";
  }

  if (normalized === "kategori" || normalized === "category") {
    return "category";
  }

  if (normalized === "nominal" || normalized === "amount") {
    return "amount";
  }

  if (normalized === "deskripsi" || normalized === "description") {
    return "description";
  }

  if (normalized === "vendor" || normalized === "vendorname") {
    return "vendorName";
  }

  if (
    normalized === "struk" ||
    normalized === "receipt" ||
    normalized === "receipturl"
  ) {
    return "receiptUrl";
  }

  return null;
}

export type TelegramReadCommand =
  | { name: "/saldo" }
  | { name: "/donasi_terbaru"; limit: number }
  | { name: "/pengeluaran_terbaru"; limit: number }
  | { name: "/cari"; orderId: string | null }
  | { name: "/laporan"; period: "hari" | "minggu" | "bulan" }
  | { name: "/csv"; from: string | null; to: string | null };

export type TelegramPublicCommand =
  | { name: "/saldo_publik" }
  | { name: "/pengeluaran_publik"; limit: number }
  | { name: "/laporan_publik"; period: "hari" | "minggu" | "bulan" };

export type TelegramBroadcastCommand = { name: "/broadcast_laporan" };

export function parseTelegramPublicCommand(
  text: string,
): TelegramPublicCommand | null {
  const tokens = splitCommandTokens(text);
  const command = normalizeCommandToken(tokens[0] ?? "");

  if (command === "/saldo_publik") {
    return { name: "/saldo_publik" };
  }

  if (command === "/pengeluaran_publik") {
    return {
      name: "/pengeluaran_publik",
      limit: clampTelegramLimit(tokens[1]),
    };
  }

  if (command === "/laporan_publik") {
    const period = tokens[1]?.toLowerCase();
    return {
      name: "/laporan_publik",
      period: period === "minggu" || period === "bulan" ? period : "hari",
    };
  }

  return null;
}

export function parseTelegramBroadcastCommand(
  text: string,
): TelegramBroadcastCommand | null {
  const tokens = splitCommandTokens(text);
  const command = normalizeCommandToken(tokens[0] ?? "");
  return command === "/broadcast_laporan" ? { name: command } : null;
}

export type TelegramRateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function checkTelegramPublicRateLimit(input: {
  now: number;
  windowMs: number;
  maxHits: number;
  hits: number[];
}): TelegramRateLimitDecision {
  const activeHits = input.hits.filter(
    (hit) => input.now - hit < input.windowMs,
  );

  if (activeHits.length < input.maxHits) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const oldestHit = Math.min(...activeHits);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((input.windowMs - (input.now - oldestHit)) / 1000),
  );

  return { allowed: false, retryAfterSeconds };
}

export function parseTelegramReadCommand(
  text: string,
): TelegramReadCommand | null {
  const tokens = splitCommandTokens(text);
  const command = normalizeCommandToken(tokens[0] ?? "");

  if (command === "/saldo") {
    return { name: "/saldo" };
  }

  if (command === "/donasi_terbaru") {
    return { name: "/donasi_terbaru", limit: clampTelegramLimit(tokens[1]) };
  }

  if (command === "/pengeluaran_terbaru") {
    return {
      name: "/pengeluaran_terbaru",
      limit: clampTelegramLimit(tokens[1]),
    };
  }

  if (command === "/cari") {
    return { name: "/cari", orderId: tokens[1]?.trim() || null };
  }

  if (command === "/laporan") {
    const period = tokens[1]?.toLowerCase();
    return {
      name: "/laporan",
      period: period === "minggu" || period === "bulan" ? period : "hari",
    };
  }

  if (command === "/csv") {
    const from = isIsoDate(tokens[1] ?? "") ? tokens[1] : null;
    const to = isIsoDate(tokens[2] ?? "") ? tokens[2] : null;
    return { name: "/csv", from, to };
  }

  return null;
}

export function clampTelegramLimit(value: string | undefined): number {
  const parsed = value ? Number(value) : 5;

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 5;
  }

  return Math.min(parsed, 20);
}

function splitCommandTokens(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function normalizeCommandToken(token: string): string {
  return token.split("@")[0].toLowerCase();
}

type TelegramInlineKeyboardMarkup = {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
};

export function approvalKeyboard(expenseId: string) {
  return {
    inline_keyboard: [
      [{ text: "Setujui", callback_data: `expense_approve:${expenseId}` }],
    ],
  };
}

type SendMessageInput = {
  chatId: number;
  text: string;
  parseMode?: "HTML" | "MarkdownV2";
  replyMarkup?: TelegramInlineKeyboardMarkup;
};

type SendDocumentInput = {
  chatId: number;
  filename: string;
  content: string;
  caption?: string;
};

export async function sendTelegramMessage(
  input: SendMessageInput,
): Promise<void> {
  const token = getTelegramBotToken();

  if (!token) {
    throw new TelegramConfigurationError("TELEGRAM_BOT_TOKEN is required.");
  }

  const body: Record<string, unknown> = {
    chat_id: input.chatId,
    text: input.text,
    disable_web_page_preview: true,
  };

  if (input.parseMode) {
    body.parse_mode = input.parseMode;
  }

  if (input.replyMarkup) {
    body.reply_markup = input.replyMarkup;
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Telegram sendMessage failed: ${response.status} ${errorText}`,
    );
  }
}

export async function sendTelegramDocument(
  input: SendDocumentInput,
): Promise<void> {
  const token = getTelegramBotToken();

  if (!token) {
    throw new TelegramConfigurationError("TELEGRAM_BOT_TOKEN is required.");
  }

  const formData = new FormData();
  formData.set("chat_id", String(input.chatId));

  if (input.caption) {
    formData.set("caption", input.caption);
  }

  formData.set(
    "document",
    new Blob([input.content], { type: "text/csv;charset=utf-8" }),
    input.filename,
  );

  const response = await fetch(
    `${TELEGRAM_API_BASE}/bot${token}/sendDocument`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Telegram sendDocument failed: ${response.status} ${errorText}`,
    );
  }
}

export async function answerTelegramCallbackQuery(input: {
  callbackQueryId: string;
  text?: string;
}): Promise<void> {
  const token = getTelegramBotToken();

  if (!token) {
    throw new TelegramConfigurationError("TELEGRAM_BOT_TOKEN is required.");
  }

  const response = await fetch(
    `${TELEGRAM_API_BASE}/bot${token}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: input.callbackQueryId,
        ...(input.text ? { text: input.text } : {}),
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Telegram answerCallbackQuery failed: ${response.status} ${errorText}`,
    );
  }
}

export async function safeAnswerTelegramCallbackQuery(input: {
  callbackQueryId: string;
  text?: string;
}): Promise<boolean> {
  try {
    await answerTelegramCallbackQuery(input);
    return true;
  } catch (error) {
    console.error("Telegram callback answer failed:", error);
    return false;
  }
}

export async function safeSendTelegramDocument(
  input: SendDocumentInput,
): Promise<boolean> {
  try {
    await sendTelegramDocument(input);
    return true;
  } catch (error) {
    console.error("Telegram document send failed:", error);
    return false;
  }
}

/**
 * Send notification without throwing. Use this from webhook handlers so that
 * Telegram outages never fail Midtrans webhook processing.
 */
export async function safeSendTelegramMessage(
  input: SendMessageInput,
): Promise<boolean> {
  try {
    await sendTelegramMessage(input);
    return true;
  } catch (error) {
    console.error("Telegram notification failed:", error);
    return false;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toFiniteInteger(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value)
  ) {
    return null;
  }

  return value;
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;

  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}
