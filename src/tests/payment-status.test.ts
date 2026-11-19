import assert from "node:assert/strict";
import test from "node:test";

import {
  PAYMENT_REDIRECT_STORAGE_PREFIX,
  getEstimatedPaymentDeadline,
  getPaymentRedirectStorageKey,
  isFinalDonationStatus,
  isPaymentDeadlineExpired,
  resolveDonationStatusTone,
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