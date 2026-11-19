import assert from "node:assert/strict";
import test from "node:test";

import {
  LAST_ORDER_STORAGE_KEY,
  PAYMENT_REDIRECT_STORAGE_PREFIX,
  getEstimatedPaymentDeadline,
  getPaymentRedirectStorageKey,
  getPaymentStatusLabel,
  isFinalDonationStatus,
  isLastOrderFresh,
  isPaymentDeadlineExpired,
  readLastOrder,
  resolveDonationStatusTone,
  writeLastOrder,
} from "@/lib/payment-status";

test("only settlement maps to the success tone", () => {
  assert.equal(resolveDonationStatusTone("settlement"), "success");
  assert.equal(resolveDonationStatusTone("pending"), "waiting");
  assert.equal(resolveDonationStatusTone("expire"), "expired");
  assert.equal(resolveDonationStatusTone("cancel"), "failed");
  assert.equal(resolveDonationStatusTone("deny"), "failed");
  assert.equal(resolveDonationStatusTone("failure"), "failed");
  assert.equal(resolveDonationStatusTone("refund"), "failed");
});

test("polling stops for every terminal Midtrans status", () => {
  assert.equal(isFinalDonationStatus("pending"), false);

  for (const status of [
    "settlement",
    "expire",
    "cancel",
    "deny",
    "failure",
    "refund",
  ]) {
    assert.equal(isFinalDonationStatus(status), true, status);
  }
});

test("payment redirect storage key is scoped per order", () => {
  assert.equal(
    getPaymentRedirectStorageKey("JB-123"),
    `${PAYMENT_REDIRECT_STORAGE_PREFIX}JB-123`,
  );
});

test("donor-facing status labels avoid raw Midtrans vocabulary", () => {
  assert.equal(getPaymentStatusLabel("settlement"), "Pembayaran berhasil");
  assert.equal(getPaymentStatusLabel("pending"), "Menunggu pembayaran");
  assert.equal(getPaymentStatusLabel("expire"), "Kedaluwarsa");
  assert.equal(getPaymentStatusLabel("cancel"), "Tidak berhasil");
  assert.equal(getPaymentStatusLabel("deny"), "Tidak berhasil");
  assert.equal(getPaymentStatusLabel("failure"), "Tidak berhasil");
  assert.equal(getPaymentStatusLabel("refund"), "Tidak berhasil");
});

test("estimated deadline uses the 24 hour Snap default", () => {
  const createdAt = new Date("2026-11-18T03:00:00.000Z");
  const deadline = getEstimatedPaymentDeadline(createdAt);

  assert.ok(deadline);
  assert.equal(deadline.toISOString(), "2026-11-19T03:00:00.000Z");
});

test("invalid dates never produce a deadline", () => {
  assert.equal(getEstimatedPaymentDeadline(new Date("tidak valid")), null);
  assert.equal(
    getEstimatedPaymentDeadline(new Date("2026-11-18T03:00:00.000Z"), 0),
    null,
  );
});

test("deadline expiry is computed from the creation time", () => {
  const createdAt = new Date("2026-11-18T03:00:00.000Z");

  assert.equal(
    isPaymentDeadlineExpired(createdAt, new Date("2026-11-19T02:59:00.000Z")),
    false,
  );
  assert.equal(
    isPaymentDeadlineExpired(createdAt, new Date("2026-11-19T03:00:01.000Z")),
    true,
  );
});

test("last order storage round-trips only valid records", () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };

  writeLastOrder(storage, { orderId: "JB-20261119-ABCD1234", amount: 25_000 });

  const snapshot = readLastOrder(storage);
  assert.ok(snapshot);
  assert.equal(snapshot.orderId, "JB-20261119-ABCD1234");
  assert.equal(snapshot.amount, 25_000);
  assert.equal(store.has(LAST_ORDER_STORAGE_KEY), true);

  store.set(LAST_ORDER_STORAGE_KEY, "{not json");
  assert.equal(readLastOrder(storage), null);

  store.set(LAST_ORDER_STORAGE_KEY, JSON.stringify({ orderId: "JB-1" }));
  assert.equal(readLastOrder(storage), null);
});

test("resume banner only shows orders inside the payment window", () => {
  const now = Date.now();

  assert.equal(
    isLastOrderFresh({ orderId: "JB-1", amount: 10_000, savedAt: now }, now),
    true,
  );
  assert.equal(
    isLastOrderFresh(
      { orderId: "JB-1", amount: 10_000, savedAt: now - 25 * 60 * 60 * 1000 },
      now,
    ),
    false,
  );
  assert.equal(
    isLastOrderFresh(
      { orderId: "JB-1", amount: 10_000, savedAt: now + 60_000 },
      now,
    ),
    false,
  );
});