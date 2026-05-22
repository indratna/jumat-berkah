import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { DonationStatus } from "@/generated/prisma/client";
import { validateDonationInput } from "@/lib/donations";
import {
  mapMidtransStatus,
  type ParsedMidtransNotification,
  verifyMidtransSignature,
} from "@/lib/midtrans";
import { getPublicDonorName, summarizeExpenseCategories } from "@/lib/reports";

test("donation validation rejects invalid amount", () => {
  const result = validateDonationInput({
    donorName: "Budi",
    amount: 999,
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errors.amount, "Nominal minimal Rp1.000.");
  }
});

test("donation validation accepts anonymous valid amount", () => {
  const result = validateDonationInput({
    isAnonymous: true,
    amount: 10_000,
    showNamePublicly: true,
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.donorName, null);
    assert.equal(result.data.showNamePublicly, false);
    assert.equal(result.data.amount, 10_000);
  }
});

test("webhook signature accepts valid Midtrans signature", () => {
  process.env.MIDTRANS_SERVER_KEY = "test-server-key";
  const notification = buildNotification({ transactionStatus: "settlement" });

  assert.equal(verifyMidtransSignature(notification), true);
});

test("webhook signature rejects invalid Midtrans signature", () => {
  process.env.MIDTRANS_SERVER_KEY = "test-server-key";
  const notification = {
    ...buildNotification({ transactionStatus: "settlement" }),
    signatureKey: "invalid-signature",
  };

  assert.equal(verifyMidtransSignature(notification), false);
});

test("Midtrans status mapping follows trusted internal statuses", () => {
  assert.equal(
    mapMidtransStatus(buildNotification({ transactionStatus: "settlement" })),
    DonationStatus.settlement,
  );
  assert.equal(
    mapMidtransStatus(buildNotification({ transactionStatus: "capture", fraudStatus: "accept" })),
    DonationStatus.settlement,
  );
  assert.equal(
    mapMidtransStatus(buildNotification({ transactionStatus: "capture", fraudStatus: "challenge" })),
    DonationStatus.pending,
  );
  assert.equal(
    mapMidtransStatus(buildNotification({ transactionStatus: "expire" })),
    DonationStatus.expire,
  );
});

test("public report donor display hides private identities", () => {
  assert.equal(
    getPublicDonorName({ donorName: "Siti", isAnonymous: false, showNamePublicly: true }),
    "Siti",
  );
  assert.equal(
    getPublicDonorName({ donorName: "Siti", isAnonymous: true, showNamePublicly: true }),
    "Anonim",
  );
  assert.equal(
    getPublicDonorName({ donorName: "Siti", isAnonymous: false, showNamePublicly: false }),
    "Anonim",
  );
  assert.equal(
    getPublicDonorName({ donorName: null, isAnonymous: false, showNamePublicly: true }),
    "Anonim",
  );
});

test("expense categories summarize report totals", () => {
  assert.deepEqual(
    summarizeExpenseCategories([
      { category: "Beras", amount: 20_000 },
      { category: "Beras", amount: 10_000 },
      { category: "Gas", amount: 40_000 },
    ]),
    [
      { category: "Gas", amount: 40_000 },
      { category: "Beras", amount: 30_000 },
    ],
  );
});

function buildNotification(input: {
  transactionStatus: string;
  fraudStatus?: string | null;
}): ParsedMidtransNotification {
  const orderId = "JB-20260521-TEST";
  const statusCode = "200";
  const grossAmount = "10000.00";
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "test-server-key";
  const signatureKey = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  return {
    orderId,
    statusCode,
    grossAmount,
    signatureKey,
    transactionStatus: input.transactionStatus,
    fraudStatus: input.fraudStatus ?? null,
    transactionId: "midtrans-transaction-id",
  };
}
