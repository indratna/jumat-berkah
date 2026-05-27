import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { DonationStatus } from "@/generated/prisma/client";
import {
  canGrantAdminAccess,
  canGrantDonorAccess,
} from "@/lib/auth-authorization";
import { validatePasswordChangePayload } from "@/lib/account-password";
import { validateProfilePayload } from "@/lib/account-profile";
import { validateDonationInput } from "@/lib/donations";
import {
  buildAdminAlertEmail,
  buildPasswordResetEmail,
  buildSettlementAdminEmail,
  getAdminEmailRecipients,
} from "@/lib/email";
import {
  mapMidtransStatus,
  type ParsedMidtransNotification,
  verifyMidtransSignature,
} from "@/lib/midtrans";
import { getPublicDonorName, summarizeExpenseCategories } from "@/lib/reports";

test("Better Auth admin access still requires app admin role", () => {
  assert.equal(
    canGrantAdminAccess({
      sessionEmail: "admin@example.com",
      appUserRole: "admin",
    }),
    true,
  );
  assert.equal(
    canGrantAdminAccess({
      sessionEmail: "donor@example.com",
      appUserRole: "donor",
    }),
    false,
  );
  assert.equal(
    canGrantAdminAccess({
      sessionEmail: "unknown@example.com",
      appUserRole: null,
    }),
    false,
  );
});

test("Better Auth donor access stays donor-role scoped", () => {
  assert.equal(
    canGrantDonorAccess({
      sessionEmail: "donor@example.com",
      appUserRole: "donor",
    }),
    true,
  );
  assert.equal(
    canGrantDonorAccess({
      sessionEmail: "admin@example.com",
      appUserRole: "admin",
    }),
    false,
  );
  assert.equal(
    canGrantDonorAccess({ sessionEmail: null, appUserRole: "donor" }),
    false,
  );
});

test("profile validation accepts trimmed display name", () => {
  const result = validateProfilePayload({ name: "  Admin Lokal  " });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, "Admin Lokal");
  }
});

test("profile validation rejects long display name", () => {
  const result = validateProfilePayload({ name: "x".repeat(101) });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errors.name, "Nama maksimal 100 karakter.");
  }
});

test("password change validation requires matching confirmation", () => {
  const result = validatePasswordChangePayload({
    currentPassword: "old-password",
    newPassword: "new-password",
    confirmPassword: "different-password",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.errors.confirmPassword,
      "Konfirmasi password tidak sama.",
    );
  }
});

test("password change validation accepts valid payload", () => {
  const result = validatePasswordChangePayload({
    currentPassword: "old-password",
    newPassword: "new-password",
    confirmPassword: "new-password",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.newPassword, "new-password");
  }
});

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
    mapMidtransStatus(
      buildNotification({
        transactionStatus: "capture",
        fraudStatus: "accept",
      }),
    ),
    DonationStatus.settlement,
  );
  assert.equal(
    mapMidtransStatus(
      buildNotification({
        transactionStatus: "capture",
        fraudStatus: "challenge",
      }),
    ),
    DonationStatus.pending,
  );
  assert.equal(
    mapMidtransStatus(buildNotification({ transactionStatus: "expire" })),
    DonationStatus.expire,
  );
});

test("public report donor display hides private identities", () => {
  assert.equal(
    getPublicDonorName({
      donorName: "Siti",
      isAnonymous: false,
      showNamePublicly: true,
    }),
    "Siti",
  );
  assert.equal(
    getPublicDonorName({
      donorName: "Siti",
      isAnonymous: true,
      showNamePublicly: true,
    }),
    "Anonim",
  );
  assert.equal(
    getPublicDonorName({
      donorName: "Siti",
      isAnonymous: false,
      showNamePublicly: false,
    }),
    "Anonim",
  );
  assert.equal(
    getPublicDonorName({
      donorName: null,
      isAnonymous: false,
      showNamePublicly: true,
    }),
    "Anonim",
  );
});

test("email admin recipients are routed from server env", () => {
  process.env.ADMIN_EMAIL_NOTIFICATIONS =
    " admin@example.com,ops@example.com,invalid ";

  assert.deepEqual(getAdminEmailRecipients(), [
    "admin@example.com",
    "ops@example.com",
  ]);
});

test("settlement admin email hides donor private fields", () => {
  const message = buildSettlementAdminEmail({
    orderId: "JB-EMAIL-1",
    amount: 50_000,
    donorName: "Nama Rahasia",
    isAnonymous: true,
    showNamePublicly: false,
    message: "Semoga berkah",
    paidAt: new Date("2026-05-27T01:00:00.000Z"),
  });

  assert.match(message.text, /Anonim/);
  assert.doesNotMatch(message.text, /Nama Rahasia/);
  assert.doesNotMatch(message.text, /@/);
  assert.doesNotMatch(message.text, /081/);
});

test("admin alert email uses configured title and avoids private donor fields", () => {
  const message = buildAdminAlertEmail({
    title: "Signature Midtrans Tidak Valid",
    bodyLines: ["Jumlah webhook invalid: 2", "Window: 30 menit"],
    occurredAt: new Date("2026-05-27T01:00:00.000Z"),
  });

  assert.match(message.subject, /Signature Midtrans Tidak Valid/);
  assert.match(message.text, /Jumlah webhook invalid: 2/);
  assert.doesNotMatch(message.text, /@/);
  assert.doesNotMatch(message.text, /081/);
});

test("password reset email uses Indonesian copy and reset URL", () => {
  const message = buildPasswordResetEmail({
    email: "user@example.com",
    url: "https://example.com/reset-password?token=test",
  });

  assert.equal(message.to[0], "user@example.com");
  assert.match(message.subject, /Reset password/);
  assert.match(message.text, /Tautan berlaku 1 jam/);
  assert.match(
    message.text,
    /https:\/\/example.com\/reset-password\?token=test/,
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
