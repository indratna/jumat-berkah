import type { SupportedFileType } from "@/lib/file-signature";

export const MAX_EXPENSE_RECEIPT_SIZE_BYTES = 1_048_576;

const allowedMimeTypes = new Map<string, SupportedFileType>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

type ReceiptFileLike = {
  name: string;
  size: number;
  type: string;
};

export type ExpenseReceiptValidationResult =
  | { success: true }
  | { success: false; error: string };

export function validateExpenseReceiptFile(
  file: ReceiptFileLike,
): ExpenseReceiptValidationResult {
  if (!allowedMimeTypes.has(file.type)) {
    return {
      success: false,
      error: "Format bukti harus JPG, PNG, WebP, atau PDF.",
    };
  }

  if (file.size > MAX_EXPENSE_RECEIPT_SIZE_BYTES) {
    return {
      success: false,
      error: "Ukuran bukti maksimal 1 MB.",
    };
  }

  if (file.size <= 0) {
    return {
      success: false,
      error: "File bukti tidak boleh kosong.",
    };
  }

  return { success: true };
}

export function buildExpenseReceiptFilename(input: {
  originalName: string;
  randomId: string;
}) {
  const extension = getSafeExtension(input.originalName);
  return `expense-receipt-${input.randomId}.${extension}`;
}

export function getExpenseReceiptExtensionFromMime(
  type: string,
): SupportedFileType | null {
  return allowedMimeTypes.get(type) ?? null;
}

function getSafeExtension(originalName: string) {
  const rawExtension = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg"].includes(rawExtension)) return "jpg";
  if (["png", "webp", "pdf"].includes(rawExtension)) return rawExtension;
  return "bin";
}
