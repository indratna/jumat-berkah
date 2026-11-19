import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPublicDonorIdentity,
  countDistinctDonors,
  formatRelativeTime,
  getSocialProofHeading,
  shouldShowRecentDonations,
  type DonationIdentityRow,
} from "@/lib/landing-stats";
import { getFridayCycleBoundsForStart } from "@/lib/friday-cycle";
import {
  calculateCostPerPortion,
  estimatePortionCount,
} from "@/lib/portion-estimate";

const baseRow: DonationIdentityRow = {
  id: "donation-1",
  userId: null,
  donorEmail: null,
  donorPhone: null,
  donorName: null,
  isAnonymous: false,
  showNamePublicly: true,
};

test("donor identity dedupes email case-insensitively", () => {
  const rows: DonationIdentityRow[] = [
    { ...baseRow, id: "a", donorEmail: "Sinta@Example.com" },
    { ...baseRow, id: "b", donorEmail: "sinta@example.com" },
    { ...baseRow, id: "c", donorEmail: "budi@example.com" },
  ];

  assert.equal(countDistinctDonors(rows), 2);
});

test("donor identity prefers account and phone over display name", () => {
  assert.equal(
    buildPublicDonorIdentity({
      ...baseRow,
      userId: "user-1",
      donorEmail: "other@example.com",
    }),
    "user:user-1",
  );

  assert.equal(
    buildPublicDonorIdentity({
      ...baseRow,
      donorPhone: "+62 812-3456-7890",
    }),
    "phone:6281234567890",
  );
});

test("anonymous donations without identity are counted separately", () => {
  const rows: DonationIdentityRow[] = [
    { ...baseRow, id: "anon-1", isAnonymous: true, donorName: "Rahasia" },
    { ...baseRow, id: "anon-2", isAnonymous: true, donorName: "Rahasia" },
  ];

  assert.equal(countDistinctDonors(rows), 2);
});

test("hidden names are not used as donor identity", () => {
  assert.equal(
    buildPublicDonorIdentity({
      ...baseRow,
      donorName: "Sinta",
      showNamePublicly: false,
    }),
    "donation:donation-1",
  );
});

test("social proof heading stays neutral until support is established", () => {
  assert.equal(getSocialProofHeading(1), "Mereka yang sudah berbagi.");
  assert.equal(getSocialProofHeading(4), "Mereka yang sudah berbagi.");
  assert.equal(getSocialProofHeading(5), "Sudah banyak yang ikut berbagi.");
});

test("recent donation list only appears with at least three successes", () => {
  assert.equal(shouldShowRecentDonations(2), false);
  assert.equal(shouldShowRecentDonations(3), true);
});

test("relative time is human readable and never negative", () => {
  const now = new Date("2026-11-18T10:00:00.000Z");

  assert.equal(
    formatRelativeTime(new Date("2026-11-18T09:59:30.000Z"), now),
    "Baru saja",
  );
  assert.equal(
    formatRelativeTime(new Date("2026-11-18T09:45:00.000Z"), now),
    "15 menit lalu",
  );
  assert.equal(
    formatRelativeTime(new Date("2026-11-18T07:00:00.000Z"), now),
    "3 jam lalu",
  );
  assert.equal(
    formatRelativeTime(new Date("2026-11-16T10:00:00.000Z"), now),
    "2 hari lalu",
  );
  assert.equal(
    formatRelativeTime(new Date("2026-11-18T11:00:00.000Z"), now),
    "Baru saja",
  );
});

test("cycle bounds reuse the Jakarta range for a stored cycle start", () => {
  const bounds = getFridayCycleBoundsForStart("2026-11-13");

  assert.ok(bounds);
  assert.equal(bounds.from.toISOString(), "2026-11-12T17:00:00.000Z");
  assert.equal(bounds.to.toISOString(), "2026-11-19T16:59:59.999Z");
  assert.equal(bounds.toDate, "2026-11-19");
});

test("invalid cycle start dates produce no bounds", () => {
  assert.equal(getFridayCycleBoundsForStart("13-11-2026"), null);
  assert.equal(getFridayCycleBoundsForStart("2026-13-40"), null);
  assert.equal(getFridayCycleBoundsForStart(""), null);
});

test("cost per portion requires real, positive distribution data", () => {
  assert.equal(calculateCostPerPortion(1_500_000, 100), 15_000);
  assert.equal(calculateCostPerPortion(0, 100), null);
  assert.equal(calculateCostPerPortion(1_500_000, 0), null);
  assert.equal(calculateCostPerPortion(1_500_000, 2.5), null);
});

test("portion estimate floors partial portions and hides unknown cost", () => {
  assert.equal(
    estimatePortionCount({ amount: 1_500_000, costPerPortion: 15_000 }),
    100,
  );
  assert.equal(
    estimatePortionCount({ amount: 1_549_999, costPerPortion: 15_000 }),
    103,
  );
  assert.equal(
    estimatePortionCount({ amount: 10_000, costPerPortion: null }),
    null,
  );
  assert.equal(estimatePortionCount({ amount: 0, costPerPortion: 15_000 }), null);
});