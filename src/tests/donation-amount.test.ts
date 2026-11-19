import assert from "node:assert/strict";
import test from "node:test";

import {
  MIN_DONATION_AMOUNT,
  PRESET_DONATION_AMOUNTS,
  buildDonationHref,
  digitsOnly,
  formatAmountDigits,
  isPresetDonationAmount,
  parseDonationAmount,
  validateDonationAmount,
} from "@/lib/donation-amount";

test("digitsOnly keeps grouped rupiah input usable", () => {
  assert.equal(digitsOnly("Rp 25.000"), "25000");
  assert.equal(digitsOnly("1 000 000"), "1000000");
  assert.equal(digitsOnly("abc"), "");
});

test("formatAmountDigits groups thousands and trims leading zeroes", () => {
  assert.equal(formatAmountDigits("25000"), "25.000");
  assert.equal(formatAmountDigits("Rp 1.000.000"), "1.000.000");
  assert.equal(formatAmountDigits("000123"), "123");
  assert.equal(formatAmountDigits(""), "");
  assert.equal(formatAmountDigits("999999999999999999"), "999.999.999.999");
});

test("parseDonationAmount rejects empty, invalid, and zero values", () => {
  assert.equal(parseDonationAmount("25.000"), 25_000);
  assert.equal(parseDonationAmount(50_000), 50_000);
  assert.equal(parseDonationAmount(""), null);
  assert.equal(parseDonationAmount("abc"), null);
  assert.equal(parseDonationAmount("0"), null);
  assert.equal(parseDonationAmount(-5), null);
});

test("validateDonationAmount enforces the minimum donation", () => {
  assert.equal(validateDonationAmount("1000"), null);
  assert.equal(validateDonationAmount("25.000"), null);

  const belowMinimum = validateDonationAmount("999");
  assert.ok(belowMinimum?.includes("1.000"));

  assert.ok(validateDonationAmount("")?.includes("Masukkan nominal"));
});

test("buildDonationHref carries a valid selected amount only", () => {
  assert.equal(buildDonationHref(25_000), "/donasi?nominal=25000");
  assert.equal(buildDonationHref(0), "/donasi");
  assert.equal(buildDonationHref(null), "/donasi");
  assert.equal(buildDonationHref(undefined), "/donasi");
});

test("preset helpers stay aligned with the donation form chips", () => {
  assert.deepEqual([...PRESET_DONATION_AMOUNTS], [
    10_000, 25_000, 50_000, 100_000,
  ]);
  assert.equal(isPresetDonationAmount(25_000), true);
  assert.equal(isPresetDonationAmount(15_000), false);
  assert.equal(isPresetDonationAmount(null), false);
  assert.equal(MIN_DONATION_AMOUNT, 1_000);
});