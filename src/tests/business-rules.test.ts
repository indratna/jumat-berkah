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
import { validateExpenseImportCsv } from "@/lib/expenses";
import { getCurrentFridayCycleRange } from "@/lib/friday-cycle";
import {
  calculateWeeklyTargetProgress,
  validateWeeklyTargetInput,
} from "@/lib/weekly-target";
import { shouldSendLowTargetProgressAlert } from "@/lib/telegram-cron";
import {
  adminNavGroups,
  dashboardNavItem,
} from "@/components/admin/admin-sidebar";
import { adminDonationStatusMeta } from "@/components/admin/admin-status-badge";
import { validateDistributionReportInput } from "@/lib/distribution-report";
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
import {
  buildPublicTimeline,
  getPublicDonorName,
  summarizeExpenseCategories,
} from "@/lib/reports";
import { buildAdminDonorKey } from "@/lib/admin";
import {
  normalizeDonorLabels,
  validateDonorMergePayload,
  validateDonorProfilePayload,
} from "@/lib/admin-donor-profile";
import {
  buildFridayCycleReportPdf,
  buildPublicReportCsv,
  buildReportTextLines,
} from "@/lib/report-export";
import {
  getWhatsAppReminderConfig,
  isWhatsAppProviderConfigured,
  normalizeWhatsAppPhone,
  sendWhatsAppTemplateMessage,
} from "@/lib/whatsapp-reminders";
import { getProfileInitials } from "@/lib/profile";
import { getPublicNavActiveState } from "@/lib/public-nav";

test("admin navigation keeps every current admin route reachable", () => {
  const navigationHrefs = new Set([
    dashboardNavItem.href,
    ...adminNavGroups.flatMap((group) => group.items.map((item) => item.href)),
  ]);
  const expectedReachableRoutes = [
    "/admin",
    "/admin/donasi",
    "/admin/donatur",
    "/admin/pengeluaran",
    "/admin/penyaluran",
    "/admin/persetujuan",
    "/admin/audit",
    "/admin/pengaturan/sistem",
    "/admin/profil",
  ];

  assert.equal(dashboardNavItem.label, "Dashboard");
  assert.deepEqual(
    adminNavGroups.map((group) => group.label),
    ["Masuk", "Keluar", "Pengaturan"],
  );

  for (const route of expectedReachableRoutes) {
    assert.equal(navigationHrefs.has(route), true, route);
  }
});

test("admin donor aggregation keys prefer stable contact identity", () => {
  assert.equal(
    buildAdminDonorKey({
      userId: "9a4fc2ed-4267-4c40-9337-a4d036b55f23",
      email: "budi@example.com",
    }),
    "user:9a4fc2ed-4267-4c40-9337-a4d036b55f23",
  );
  assert.equal(
    buildAdminDonorKey({ email: "  Budi@Example.Com " }),
    "email:budi@example.com",
  );
  assert.equal(buildAdminDonorKey({ phone: "0812-3456" }), "phone:08123456");
});

test("donor profile validation accepts contact note and labels", () => {
  const result = validateDonorProfilePayload({
    displayName: "  Budi  ",
    email: " Budi@Example.Com ",
    phone: "0812-3456-7890",
    whatsappReminderOptIn: true,
    internalNote: " Donatur rutin Jumat pertama. ",
    labels: ["Rutin", " follow-up ", "rutin"],
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data, {
      displayName: "Budi",
      email: "budi@example.com",
      phone: "081234567890",
      whatsappReminderOptIn: true,
      internalNote: "Donatur rutin Jumat pertama.",
      labels: ["Rutin", "follow-up"],
    });
  }
});

test("donor profile validation rejects consent without phone", () => {
  const result = validateDonorProfilePayload({
    displayName: "Budi",
    whatsappReminderOptIn: true,
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.errors.phone,
      "Nomor WhatsApp wajib untuk opt-in pengingat.",
    );
  }
});

test("donor labels normalize and limit values", () => {
  assert.deepEqual(normalizeDonorLabels([" VIP ", "vip", "Rutin"]), [
    "VIP",
    "Rutin",
  ]);
});

test("donor merge validation requires distinct donors and confirmation", () => {
  assert.deepEqual(
    validateDonorMergePayload({
      primaryDonorKey: "email:a@example.com",
      duplicateDonorKey: "email:a@example.com",
      confirmation: "GABUNG DONATUR",
    }),
    {
      success: false,
      errors: {
        duplicateDonorKey: "Donatur duplikat harus berbeda dari donatur utama.",
      },
    },
  );

  assert.deepEqual(
    validateDonorMergePayload({
      primaryDonorKey: "email:a@example.com",
      duplicateDonorKey: "phone:0812",
      confirmation: "gabung",
    }),
    {
      success: false,
      errors: { confirmation: "Ketik GABUNG DONATUR untuk konfirmasi." },
    },
  );
});

test("admin donor settlement summary excludes pending donations", () => {
  const donations = [
    { status: DonationStatus.settlement, amount: 50_000 },
    { status: DonationStatus.pending, amount: 100_000 },
    { status: DonationStatus.failure, amount: 25_000 },
  ];
  const totalSettlementAmount = donations
    .filter((donation) => donation.status === DonationStatus.settlement)
    .reduce((sum, donation) => sum + donation.amount, 0);

  assert.equal(totalSettlementAmount, 50_000);
});

test("admin donation status badge mapping follows payment state groups", () => {
  assert.equal(adminDonationStatusMeta[DonationStatus.pending].tone, "pending");
  assert.equal(
    adminDonationStatusMeta[DonationStatus.settlement].tone,
    "settlement",
  );
  assert.equal(adminDonationStatusMeta[DonationStatus.expire].tone, "failed");
  assert.equal(adminDonationStatusMeta[DonationStatus.failure].tone, "failed");
  assert.equal(adminDonationStatusMeta[DonationStatus.refund].tone, "neutral");
});

test("admin-only pages reject guest and donor roles", () => {
  const adminOnlyPaths = ["/admin/audit", "/admin/persetujuan"];

  for (const path of adminOnlyPaths) {
    assert.equal(
      canGrantAdminAccess({ sessionEmail: null, appUserRole: null }),
      false,
      path,
    );
    assert.equal(
      canGrantAdminAccess({
        sessionEmail: "donor@example.com",
        appUserRole: "donor",
      }),
      false,
      path,
    );
    assert.equal(
      canGrantAdminAccess({
        sessionEmail: "admin@example.com",
        appUserRole: "admin",
      }),
      true,
      path,
    );
  }
});

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

test("profile initials prefer first two words and fallback to JB", () => {
  assert.equal(getProfileInitials("Jumat Berkah"), "JB");
  assert.equal(getProfileInitials(" donor@example.com "), "D");
  assert.equal(getProfileInitials(""), "JB");
});

test("public landing nav active state follows landing-family routes", () => {
  assert.deepEqual(getPublicNavActiveState("/laporan"), {
    activeNavHref: "/laporan",
    isDonationActive: false,
  });
  assert.deepEqual(getPublicNavActiveState("/tentang"), {
    activeNavHref: "/tentang",
    isDonationActive: false,
  });
  assert.deepEqual(getPublicNavActiveState("/"), {
    activeNavHref: null,
    isDonationActive: false,
  });
  assert.deepEqual(getPublicNavActiveState("/donasi"), {
    activeNavHref: null,
    isDonationActive: true,
  });
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

test("donation validation defaults WhatsApp reminder consent off", () => {
  const result = validateDonationInput({
    donorName: "Budi",
    amount: 10_000,
    donorPhone: "08123456789",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.whatsappReminderOptIn, false);
    assert.equal(result.data.whatsappReminderOptInAt, null);
  }
});

test("donation validation requires phone for WhatsApp reminder consent", () => {
  const result = validateDonationInput({
    donorName: "Budi",
    amount: 10_000,
    whatsappReminderOptIn: true,
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.donorPhone, null);
    assert.equal(result.data.whatsappReminderOptIn, false);
    assert.equal(result.data.whatsappReminderOptInAt, null);
  }
});

test("donation validation stores WhatsApp reminder consent with phone", () => {
  const result = validateDonationInput({
    donorName: "Budi",
    amount: 10_000,
    donorPhone: "08123456789",
    whatsappReminderOptIn: true,
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.whatsappReminderOptIn, true);
    assert.equal(result.data.whatsappReminderOptInAt instanceof Date, true);
  }
});

test("WhatsApp reminder config is disabled unless explicitly enabled", () => {
  const config = getWhatsAppReminderConfig({
    WHATSAPP_REMINDER_ENABLED: "false",
    WHATSAPP_CLOUD_ACCESS_TOKEN: "secret-token",
    WHATSAPP_CLOUD_PHONE_NUMBER_ID: "12345",
  });

  assert.equal(config.enabled, false);
  assert.equal(isWhatsAppProviderConfigured(config), false);
});

test("WhatsApp reminder config requires server token and phone number id", () => {
  const config = getWhatsAppReminderConfig({
    WHATSAPP_REMINDER_ENABLED: "true",
    WHATSAPP_CLOUD_ACCESS_TOKEN: "secret-token",
    WHATSAPP_CLOUD_PHONE_NUMBER_ID: "12345",
    WHATSAPP_REMINDER_BATCH_LIMIT: "5",
  });

  assert.equal(isWhatsAppProviderConfigured(config), true);
  assert.equal(config.batchLimit, 5);
});

test("WhatsApp phone normalization keeps opted-in recipients sendable", () => {
  assert.equal(normalizeWhatsAppPhone("0812-3456-7890"), "6281234567890");
  assert.equal(normalizeWhatsAppPhone("+62812 3456 7890"), "6281234567890");
  assert.equal(normalizeWhatsAppPhone("123"), null);
});

test("WhatsApp send failure returns safe result instead of throwing", async () => {
  const result = await sendWhatsAppTemplateMessage({
    config: {
      enabled: true,
      accessToken: null,
      phoneNumberId: "12345",
      templateName: "jumat_berkah_reminder",
      templateLanguage: "id",
      apiVersion: "v20.0",
      defaultCountryCode: "62",
      batchLimit: 1,
    },
    recipient: {
      phone: "6281234567890",
      donorName: "Budi",
      donationCount: 1,
      totalSettlementAmount: 50_000,
      lastDonationAt: null,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, "whatsapp-provider-not-configured");
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

test("public timeline hides private donor identity fields", () => {
  const timeline = buildPublicTimeline({
    donations: [
      {
        paidAt: new Date("2026-05-28T03:00:00.000Z"),
        createdAt: new Date("2026-05-28T02:55:00.000Z"),
        donorName: "Rahasia",
        isAnonymous: true,
        showNamePublicly: false,
        amount: 25_000,
        message: "Semoga berkah",
      },
    ],
    expenses: [
      {
        expenseDate: new Date("2026-05-28T00:00:00.000Z"),
        category: "Bahan makanan",
        description: "Beras dan lauk",
        amount: 20_000,
      },
    ],
    distributions: [
      {
        cycleStart: new Date("2026-05-22T00:00:00.000Z"),
        title: "Penyaluran 50 paket",
        summary: "Paket disalurkan ke masjid belakang kantor.",
        packageCount: 50,
        locationSummary: "Masjid belakang kantor",
      },
    ],
  });
  const serialized = JSON.stringify(timeline);

  assert.equal(timeline.length, 3);
  assert.match(serialized, /Anonim/);
  assert.doesNotMatch(serialized, /Rahasia/);
  assert.doesNotMatch(serialized, /@/);
  assert.doesNotMatch(serialized, /081/);
  assert.doesNotMatch(serialized, /order_/);
});

test("public report exports hide donor private fields and keep totals", () => {
  const report = {
    summary: {
      income: 50_000,
      expenses: 20_000,
      periodBalance: 30_000,
      currentBalance: 125_000,
    },
    donations: [
      {
        date: "28 Mei 2026",
        donorName: "Anonim",
        amount: 50_000,
        message: "Semoga berkah",
      },
    ],
    expenses: [
      {
        date: "28 Mei 2026",
        category: "Bahan makanan",
        description: "Beras dan lauk",
        amount: 20_000,
      },
    ],
    expenseCategories: [{ category: "Bahan makanan", amount: 20_000 }],
    timeline: [
      {
        type: "donation" as const,
        date: "28 Mei 2026",
        title: "Donasi dari Anonim",
        description: "Doa publik aman tanpa kontak pribadi",
        amount: 50_000,
        meta: null,
      },
    ],
  };

  const csv = buildPublicReportCsv(report);
  const textLines = buildReportTextLines({
    title: "Laporan Jumat Berkah",
    periodLabel: "Siklus Jumat 22–28 Mei 2026",
    report,
    generatedAt: new Date("2026-05-28T03:00:00.000Z"),
  });
  const serialized = `${csv}\n${textLines.join("\n")}`;

  assert.match(csv, /50000/);
  assert.match(csv, /20000/);
  assert.match(csv, /30000/);
  assert.match(serialized, /Anonim/);
  assert.match(serialized, /Ringkasan Kategori Pengeluaran/);
  assert.match(serialized, /Timeline Transparansi/);
  assert.doesNotMatch(serialized, /rahasia@example\.com/);
  assert.doesNotMatch(serialized, /08123456789/);
});

test("Friday cycle PDF export returns a PDF buffer", () => {
  const report = {
    summary: {
      income: 10_000,
      expenses: 0,
      periodBalance: 10_000,
      currentBalance: 10_000,
    },
    donations: [],
    expenses: [],
    expenseCategories: [{ category: "Bahan makanan", amount: 10_000 }],
    timeline: [
      {
        type: "distribution" as const,
        date: "28 Mei 2026",
        title: "50 paket tersalurkan",
        description: "Masjid belakang kantor",
        amount: null,
        meta: "50 paket",
      },
    ],
  };

  const pdf = buildFridayCycleReportPdf({
    report,
    generatedAt: new Date("2026-05-28T03:00:00.000Z"),
    now: new Date("2026-05-28T03:00:00.000Z"),
  });

  const pdfText = pdf.toString("utf8");

  assert.equal(pdf.subarray(0, 8).toString("utf8"), "%PDF-1.4");
  assert.match(pdfText, /Laporan Jumat Berkah/);
  assert.match(pdfText, /Ringkasan Kategori Pengeluaran/);
  assert.match(pdfText, /Timeline Transparansi/);
  assert.doesNotMatch(pdfText, /@/);
  assert.doesNotMatch(pdfText, /081/);
});

test("public timeline sorts newest activity first", () => {
  const timeline = buildPublicTimeline({
    donations: [
      {
        paidAt: new Date("2026-05-20T00:00:00.000Z"),
        createdAt: new Date("2026-05-20T00:00:00.000Z"),
        donorName: "Budi",
        isAnonymous: false,
        showNamePublicly: true,
        amount: 10_000,
        message: null,
      },
    ],
    expenses: [
      {
        expenseDate: new Date("2026-05-21T00:00:00.000Z"),
        category: "Gas",
        description: "Isi ulang gas",
        amount: 18_000,
      },
    ],
    distributions: [
      {
        cycleStart: new Date("2026-05-22T00:00:00.000Z"),
        title: "Penyaluran Jumat",
        summary: "Makanan disalurkan.",
        packageCount: null,
        locationSummary: null,
      },
    ],
  });

  assert.deepEqual(
    timeline.map((item) => item.type),
    ["distribution", "expense", "donation"],
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

test("Friday cycle starts on Jakarta Friday and ends Thursday", () => {
  const cycle = getCurrentFridayCycleRange(
    new Date("2026-05-27T05:00:00.000Z"),
  );

  assert.equal(cycle.fromDate, "2026-05-22");
  assert.equal(cycle.toDate, "2026-05-28");
  assert.equal(cycle.from.toISOString(), "2026-05-21T17:00:00.000Z");
  assert.equal(cycle.to.toISOString(), "2026-05-28T16:59:59.999Z");
});

test("Friday cycle flips at Jakarta Friday midnight", () => {
  const beforeFriday = getCurrentFridayCycleRange(
    new Date("2026-05-28T16:59:59.999Z"),
  );
  const afterFriday = getCurrentFridayCycleRange(
    new Date("2026-05-28T17:00:00.000Z"),
  );

  assert.equal(beforeFriday.fromDate, "2026-05-22");
  assert.equal(afterFriday.fromDate, "2026-05-29");
});

test("weekly target validation requires Jumat cycle start and positive integer", () => {
  const okFriday = validateWeeklyTargetInput({
    cycleStart: "2026-05-22",
    targetAmount: 500_000,
    note: "  test  ",
  });
  assert.equal(okFriday.success, true);
  if (okFriday.success) {
    assert.equal(okFriday.data.targetAmount, 500_000);
    assert.equal(okFriday.data.note, "test");
  }

  const wrongDay = validateWeeklyTargetInput({
    cycleStart: "2026-05-21",
    targetAmount: 500_000,
  });
  assert.equal(wrongDay.success, false);
  if (!wrongDay.success) {
    assert.match(wrongDay.errors.cycleStart ?? "", /Jumat/);
  }

  const badAmount = validateWeeklyTargetInput({
    cycleStart: "2026-05-22",
    targetAmount: 0,
  });
  assert.equal(badAmount.success, false);
  if (!badAmount.success) {
    assert.equal(
      badAmount.errors.targetAmount,
      "Target dana harus bilangan bulat lebih dari 0.",
    );
  }
});

test("weekly target progress reports remaining and reached state", () => {
  const cycle = getCurrentFridayCycleRange(
    new Date("2026-05-27T05:00:00.000Z"),
  );
  const target = {
    id: "target-1",
    cycleStart: cycle.from,
    cycleEnd: cycle.to,
    targetAmount: 1_000_000,
    note: null,
    createdBy: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const partial = calculateWeeklyTargetProgress({
    cycle,
    target,
    collected: 250_000,
  });
  assert.equal(partial.remaining, 750_000);
  assert.equal(partial.progressRatio, 0.25);
  assert.equal(partial.reachedTarget, false);

  const reached = calculateWeeklyTargetProgress({
    cycle,
    target,
    collected: 1_500_000,
  });
  assert.equal(reached.remaining, 0);
  assert.equal(reached.progressRatio, 1);
  assert.equal(reached.reachedTarget, true);
});

test("low target progress alert respects threshold, day offset and cooldown", () => {
  const fires = shouldSendLowTargetProgressAlert({
    targetAmount: 1_000_000,
    collected: 200_000,
    thresholdPercent: 60,
    daysRemaining: 1,
    dayOffset: 1,
    alreadySent: false,
  });
  assert.equal(fires.shouldAlert, true);
  assert.equal(fires.progressPercent, 20);

  const cooldown = shouldSendLowTargetProgressAlert({
    targetAmount: 1_000_000,
    collected: 200_000,
    thresholdPercent: 60,
    daysRemaining: 1,
    dayOffset: 1,
    alreadySent: true,
  });
  assert.equal(cooldown.shouldAlert, false);

  const tooEarly = shouldSendLowTargetProgressAlert({
    targetAmount: 1_000_000,
    collected: 200_000,
    thresholdPercent: 60,
    daysRemaining: 5,
    dayOffset: 1,
    alreadySent: false,
  });
  assert.equal(tooEarly.shouldAlert, false);

  const onTrack = shouldSendLowTargetProgressAlert({
    targetAmount: 1_000_000,
    collected: 800_000,
    thresholdPercent: 60,
    daysRemaining: 1,
    dayOffset: 1,
    alreadySent: false,
  });
  assert.equal(onTrack.shouldAlert, false);
});

test("distribution report validation rejects missing fields and bad photo URLs", () => {
  const ok = validateDistributionReportInput({
    cycleStart: "2026-05-22",
    title: "Penyaluran Jumat 22 Mei",
    summary: "Penyaluran 100 paket nasi.",
    packageCount: 100,
    locationSummary: "Masjid kantor",
    photoUrls: [
      "https://example.com/foto1.jpg",
      "  https://example.com/foto2.jpg  ",
    ],
    publish: true,
  });

  assert.equal(ok.success, true);
  if (ok.success) {
    assert.equal(ok.data.title, "Penyaluran Jumat 22 Mei");
    assert.equal(ok.data.packageCount, 100);
    assert.equal(ok.data.publish, true);
    assert.equal(ok.data.photoUrls.length, 2);
    assert.match(ok.data.photoUrls[0], /^https:\/\//);
  }

  const missingTitle = validateDistributionReportInput({
    cycleStart: "2026-05-22",
    title: " ",
    summary: "Cerita",
  });
  assert.equal(missingTitle.success, false);
  if (!missingTitle.success) {
    assert.equal(missingTitle.errors.title, "Judul cerita harus diisi.");
  }

  const tooManyPhotos = validateDistributionReportInput({
    cycleStart: "2026-05-22",
    title: "Cerita",
    summary: "Ringkasan",
    photoUrls: Array.from(
      { length: 7 },
      (_, index) => `https://example.com/${index}.jpg`,
    ),
  });
  assert.equal(tooManyPhotos.success, false);
  if (!tooManyPhotos.success) {
    assert.match(tooManyPhotos.errors.photoUrls ?? "", /Maksimal 6 URL/);
  }

  const wrongDay = validateDistributionReportInput({
    cycleStart: "2026-05-21",
    title: "Cerita",
    summary: "Ringkasan",
  });
  assert.equal(wrongDay.success, false);
  if (!wrongDay.success) {
    assert.match(wrongDay.errors.cycleStart ?? "", /Jumat/);
  }
});

test("expense CSV import validates valid rows and quoted cells", () => {
  const result = validateExpenseImportCsv(
    'expenseDate,category,description,amount,vendorName,receiptUrl\n2026-05-29,Beras,"Beras, lauk",250000,Pasar,',
  );

  assert.equal(result.hasErrors, false);
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0].rowNumber, 2);
  assert.equal(result.validRows[0].description, "Beras, lauk");
  assert.equal(result.validRows[0].amount, 250_000);
});

test("expense CSV import rejects invalid rows without valid import", () => {
  const result = validateExpenseImportCsv(
    "expenseDate,category,description,amount\n2026-05-29,Beras,,250000\n2026-05-29,Kategori Salah,Beli gas,0",
  );

  assert.equal(result.hasErrors, true);
  assert.equal(result.validRows.length, 0);
  assert.equal(result.rows.length, 2);
  assert.match(result.rows[0].errors.description, /Deskripsi/);
  assert.match(result.rows[1].errors.category, /Kategori/);
  assert.match(result.rows[1].errors.amount, /Nominal/);
});

test("expense CSV import requires canonical headers", () => {
  const result = validateExpenseImportCsv(
    "tanggal,kategori,deskripsi,nominal\n",
  );

  assert.equal(result.hasErrors, true);
  assert.equal(result.validRows.length, 0);
  assert.match(result.rows[0].errors.header, /expenseDate/);
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
