import { createHmac, timingSafeEqual } from "node:crypto";

import { getTelegramBotToken } from "@/lib/telegram";

export type StoredReceipt = {
  objectKey: string;
  privateUrl: string;
};

export function getReceiptStorageBucket(): string | null {
  const value = process.env.RECEIPT_STORAGE_BUCKET;
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function getReceiptStorageBaseUrl(): string | null {
  const value = process.env.RECEIPT_STORAGE_BASE_URL;
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().replace(/\/$/, "")
    : null;
}

export function getReceiptSignedUrlSecret(): string | null {
  const value = process.env.RECEIPT_SIGNED_URL_SECRET;
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function buildReceiptObjectKey(input: {
  expenseId: string;
  telegramFileId: string;
  now: Date;
}): string {
  const safeFileId = input.telegramFileId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const date = input.now.toISOString().slice(0, 10);
  return `receipts/${date}/${input.expenseId}/${safeFileId}.jpg`;
}

export function buildPrivateReceiptUrl(objectKey: string): string {
  const bucket = getReceiptStorageBucket();
  return bucket ? `r2://${bucket}/${objectKey}` : `private://${objectKey}`;
}

export function buildSignedReceiptUrl(input: {
  objectKey: string;
  expiresAt: Date;
  baseUrl: string;
  secret: string;
}): string {
  const expires = Math.floor(input.expiresAt.getTime() / 1000);
  const signature = signReceiptPath({
    objectKey: input.objectKey,
    expires,
    secret: input.secret,
  });
  const url = new URL("/api/admin/receipts", input.baseUrl);
  url.searchParams.set("key", input.objectKey);
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("signature", signature);
  return url.toString();
}

export function verifySignedReceiptUrl(input: {
  objectKey: string;
  expires: number;
  signature: string;
  secret: string;
  now: Date;
}): boolean {
  if (input.expires < Math.floor(input.now.getTime() / 1000)) {
    return false;
  }

  const expected = signReceiptPath({
    objectKey: input.objectKey,
    expires: input.expires,
    secret: input.secret,
  });
  const received = Buffer.from(input.signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (received.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(received, expectedBuffer);
}

export async function storeTelegramPhotoReceipt(input: {
  expenseId: string;
  telegramFileId: string;
  now?: Date;
}): Promise<StoredReceipt> {
  const now = input.now ?? new Date();
  const objectKey = buildReceiptObjectKey({
    expenseId: input.expenseId,
    telegramFileId: input.telegramFileId,
    now,
  });
  const privateUrl = buildPrivateReceiptUrl(objectKey);

  const uploadUrl = process.env.RECEIPT_STORAGE_PUT_URL;
  if (!uploadUrl) {
    return { objectKey, privateUrl };
  }

  const file = await downloadTelegramFile(input.telegramFileId);
  const putUrl = uploadUrl.replace("{key}", encodeURIComponent(objectKey));
  const response = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Receipt upload failed: ${response.status}`);
  }

  return { objectKey, privateUrl };
}

async function downloadTelegramFile(fileId: string): Promise<ArrayBuffer> {
  const token = getTelegramBotToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is required.");
  }

  const fileResponse = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
  );

  if (!fileResponse.ok) {
    throw new Error(`Telegram getFile failed: ${fileResponse.status}`);
  }

  const payload: unknown = await fileResponse.json();
  const filePath = parseTelegramFilePath(payload);
  if (!filePath) {
    throw new Error("Telegram file_path missing.");
  }

  const downloadResponse = await fetch(
    `https://api.telegram.org/file/bot${token}/${filePath}`,
  );

  if (!downloadResponse.ok) {
    throw new Error(`Telegram file download failed: ${downloadResponse.status}`);
  }

  return downloadResponse.arrayBuffer();
}

function parseTelegramFilePath(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const result = (payload as { result?: unknown }).result;
  if (typeof result !== "object" || result === null) {
    return null;
  }

  const filePath = (result as { file_path?: unknown }).file_path;
  return typeof filePath === "string" ? filePath : null;
}

function signReceiptPath(input: {
  objectKey: string;
  expires: number;
  secret: string;
}): string {
  return createHmac("sha256", input.secret)
    .update(`${input.objectKey}:${input.expires}`)
    .digest("hex");
}
