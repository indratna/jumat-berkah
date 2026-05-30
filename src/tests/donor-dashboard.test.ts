import assert from "node:assert/strict";
import test from "node:test";

import { DonationStatus } from "@/generated/prisma/client";
import {
  calculateDonorDashboardStats,
  getDonationPrivacyLabel,
  getDonationStatusTone,
  getDonorDisplayName,
  getLatestDonationSummary,
  getTargetDashboardCopy,
} from "@/app/akun/donasi/dashboard-rules";

const baseDonation = {
  id: "donation-1",
  orderId: "JB-20260530-AAAA1111",
  amount: 10000,
  status: DonationStatus.settlement,
  isAnonymous: false,
  showNamePublicly: true,
  message: null,
  createdAt: new Date("2026-05-30T01:00:00.000Z"),
  paidAt: new Date("2026-05-30T02:00:00.000Z"),
};

test("calculateDonorDashboardStats counts only settlement as successful total", () => {
  const stats = calculateDonorDashboardStats([
    baseDonation,
    {
      ...baseDonation,
      id: "donation-2",
      orderId: "JB-20260530-BBBB2222",
      amount: 50000,
      status: DonationStatus.pending,
    },
    {
      ...baseDonation,
      id: "donation-3",
      orderId: "JB-20260530-CCCC3333",
      amount: 25000,
      status: DonationStatus.failure,
    },
  ]);

  assert.equal(stats.totalSuccessful, 10000);
  assert.equal(stats.transactionCount, 3);
  assert.equal(stats.pendingCount, 1);
});

test("getLatestDonationSummary returns latest donation by createdAt", () => {
  const latest = getLatestDonationSummary([
    {
      ...baseDonation,
      orderId: "older",
      createdAt: new Date("2026-05-29T01:00:00.000Z"),
    },
    {
      ...baseDonation,
      orderId: "newer",
      createdAt: new Date("2026-05-30T01:00:00.000Z"),
    },
  ]);

  assert.equal(latest?.orderId, "newer");
});

test("getDonationStatusTone maps statuses to donor-friendly labels", () => {
  assert.deepEqual(getDonationStatusTone(DonationStatus.settlement), {
    label: "Berhasil",
    className: "border-green-200 bg-green-50 text-green-800",
  });
  assert.deepEqual(getDonationStatusTone(DonationStatus.pending), {
    label: "Menunggu",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  });
  assert.deepEqual(getDonationStatusTone(DonationStatus.failure), {
    label: "Gagal",
    className: "border-red-200 bg-red-50 text-red-800",
  });
});

test("getDonationPrivacyLabel follows public donor privacy labels", () => {
  assert.equal(
    getDonationPrivacyLabel({ isAnonymous: true, showNamePublicly: true }),
    "Anonim",
  );
  assert.equal(
    getDonationPrivacyLabel({ isAnonymous: false, showNamePublicly: false }),
    "Nama disamarkan",
  );
  assert.equal(
    getDonationPrivacyLabel({ isAnonymous: false, showNamePublicly: true }),
    "Nama tampil publik",
  );
});

test("getDonorDisplayName prefers trimmed name then email then fallback", () => {
  assert.equal(
    getDonorDisplayName({ name: " Aditya ", email: "a@example.com" }),
    "Aditya",
  );
  assert.equal(
    getDonorDisplayName({ name: null, email: "a@example.com" }),
    "a@example.com",
  );
  assert.equal(getDonorDisplayName({ name: " ", email: "" }), "Donatur");
});

test("getTargetDashboardCopy handles missing and configured targets", () => {
  assert.deepEqual(
    getTargetDashboardCopy({
      targetAmount: 0,
      collected: 25000,
      remaining: 0,
      progressRatio: 0,
    }),
    {
      hasTarget: false,
      progressPercent: 0,
      title: "Target Jumat belum diatur.",
    },
  );

  assert.deepEqual(
    getTargetDashboardCopy({
      targetAmount: 100000,
      collected: 25000,
      remaining: 75000,
      progressRatio: 0.25,
    }),
    {
      hasTarget: true,
      progressPercent: 25,
      title: "Target Jumat berjalan",
    },
  );
});
