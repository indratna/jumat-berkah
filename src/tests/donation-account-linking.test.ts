import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeDonationAccountEmail,
  shouldAttachDonationToUser,
} from "@/lib/donations";

test("normalizeDonationAccountEmail lowercases and trims valid email", () => {
  assert.equal(
    normalizeDonationAccountEmail(" Donor@Example.COM "),
    "donor@example.com",
  );
});

test("normalizeDonationAccountEmail returns null for empty values", () => {
  assert.equal(normalizeDonationAccountEmail("   "), null);
  assert.equal(normalizeDonationAccountEmail(null), null);
});

test("shouldAttachDonationToUser requires matching orphan email", () => {
  assert.equal(
    shouldAttachDonationToUser({
      donationEmail: "donor@example.com",
      existingUserId: null,
      accountEmail: "donor@example.com",
    }),
    true,
  );
  assert.equal(
    shouldAttachDonationToUser({
      donationEmail: "other@example.com",
      existingUserId: null,
      accountEmail: "donor@example.com",
    }),
    false,
  );
  assert.equal(
    shouldAttachDonationToUser({
      donationEmail: "donor@example.com",
      existingUserId: "existing-user",
      accountEmail: "donor@example.com",
    }),
    false,
  );
});
