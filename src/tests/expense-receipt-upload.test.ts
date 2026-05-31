import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExpenseReceiptFilename,
  validateExpenseReceiptFile,
} from "@/lib/expense-receipt-upload";

test("validateExpenseReceiptFile accepts image or PDF up to 1 MB", () => {
  assert.deepEqual(
    validateExpenseReceiptFile({
      name: "nota.jpg",
      size: 1_048_576,
      type: "image/jpeg",
    }),
    { success: true },
  );
  assert.deepEqual(
    validateExpenseReceiptFile({
      name: "nota.pdf",
      size: 50_000,
      type: "application/pdf",
    }),
    { success: true },
  );
});

test("validateExpenseReceiptFile rejects files above 1 MB", () => {
  assert.deepEqual(
    validateExpenseReceiptFile({
      name: "besar.png",
      size: 1_048_577,
      type: "image/png",
    }),
    {
      success: false,
      error: "Ukuran bukti maksimal 1 MB.",
    },
  );
});

test("validateExpenseReceiptFile rejects unsupported file types", () => {
  assert.deepEqual(
    validateExpenseReceiptFile({
      name: "nota.txt",
      size: 100,
      type: "text/plain",
    }),
    {
      success: false,
      error: "Format bukti harus JPG, PNG, WebP, atau PDF.",
    },
  );
});

test("buildExpenseReceiptFilename keeps safe extension and unique prefix", () => {
  assert.match(
    buildExpenseReceiptFilename({
      originalName: "Nota Warung.JPG",
      randomId: "abc123",
    }),
    /^expense-receipt-abc123\.jpg$/,
  );
});
