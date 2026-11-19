import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { PrismaPg } from "@prisma/adapter-pg";

import {
  DonationStatus,
  ExpenseApprovalStatus,
  Prisma,
  PrismaClient,
  UserRole,
} from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed dummy data.");
}

// Dummy rows must never be written to a production database by accident.
if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_DUMMY_SEED !== "1"
) {
  throw new Error(
    "Refusing to seed dummy data in production. Set ALLOW_DUMMY_SEED=1 only when you are certain.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const NOW = new Date();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FRIDAY_INDEX = 5;

function startOfUtcDay(date: Date) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function getCurrentFridayCycleStartUtc(now: Date) {
  const today = startOfUtcDay(now);
  const weekday = today.getUTCDay();
  const diff = (weekday - FRIDAY_INDEX + 7) % 7;
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * ONE_DAY_MS);
}

function buildDonorKey(input: {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}) {
  if (input.userId) {
    return `user:${input.userId}`;
  }

  const email = input.email?.trim().toLowerCase();
  if (email) {
    return `email:${email}`;
  }

  const phone = input.phone?.trim().replace(/[^0-9+]/g, "");
  if (phone) {
    return `phone:${phone}`;
  }

  const name = input.name?.trim().toLowerCase();
  if (name) {
    return `name:${name}`;
  }

  return "anonymous:unknown";
}

type SeededUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

async function clearDummyTables() {
  await prisma.$transaction([
    prisma.expenseApproval.deleteMany(),
    prisma.midtransWebhookLog.deleteMany(),
    prisma.adminNotification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.distributionReport.deleteMany(),
    prisma.weeklyTarget.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.donorProfile.deleteMany(),
    prisma.donation.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function upsertUsers(): Promise<{
  admin: SeededUser;
  donors: SeededUser[];
}> {
  const adminEmail =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "admin@jumat-berkah.id";
  const adminName = process.env.ADMIN_NAME?.trim() ?? "Admin Jumat Berkah";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: adminName, role: UserRole.admin },
    update: { name: adminName, role: UserRole.admin },
    select: { id: true, email: true, name: true, role: true },
  });

  const donorSeeds: Array<{
    email: string;
    name: string;
    telegramChatId: bigint | null;
    telegramReminderOptIn: boolean;
  }> = [
    {
      email: "siti.aminah@example.com",
      name: "Siti Aminah",
      telegramChatId: BigInt("6000000001"),
      telegramReminderOptIn: true,
    },
    {
      email: "budi.santoso@example.com",
      name: "Budi Santoso",
      telegramChatId: BigInt("6000000002"),
      telegramReminderOptIn: false,
    },
    {
      email: "rahma.yulianti@example.com",
      name: "Rahma Yulianti",
      telegramChatId: null,
      telegramReminderOptIn: false,
    },
    {
      email: "fajar.dwi@example.com",
      name: "Fajar Dwi",
      telegramChatId: null,
      telegramReminderOptIn: false,
    },
  ];

  const donors: SeededUser[] = [];

  for (const seed of donorSeeds) {
    const donor = await prisma.user.upsert({
      where: { email: seed.email },
      create: {
        email: seed.email,
        name: seed.name,
        role: UserRole.donor,
        telegramChatId: seed.telegramChatId ?? undefined,
        telegramReminderOptIn: seed.telegramReminderOptIn,
      },
      update: {
        name: seed.name,
        role: UserRole.donor,
        telegramChatId: seed.telegramChatId ?? null,
        telegramReminderOptIn: seed.telegramReminderOptIn,
      },
      select: { id: true, email: true, name: true, role: true },
    });
    donors.push({
      id: donor.id,
      email: donor.email,
      name: donor.name ?? seed.name,
      role: donor.role,
    });
  }

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name ?? adminName,
      role: admin.role,
    },
    donors,
  };
}

async function seedDonorProfiles(donors: SeededUser[]) {
  const profileSeeds: Array<{
    user: SeededUser;
    phone: string | null;
    whatsappReminderOptIn: boolean;
    internalNote: string | null;
    labels: string[];
  }> = [
    {
      user: donors[0],
      phone: "+6281200000001",
      whatsappReminderOptIn: true,
      internalNote: "Donatur rutin tiap Jumat.",
      labels: ["Rutin", "VIP"],
    },
    {
      user: donors[1],
      phone: "+6281200000002",
      whatsappReminderOptIn: false,
      internalNote: "Lebih suka konfirmasi via Telegram.",
      labels: ["Telegram"],
    },
    {
      user: donors[2],
      phone: null,
      whatsappReminderOptIn: false,
      internalNote: null,
      labels: ["Baru"],
    },
    {
      user: donors[3],
      phone: "+6281200000004",
      whatsappReminderOptIn: true,
      internalNote: "Donatur kantor lantai 3.",
      labels: ["Kantor"],
    },
  ];

  for (const seed of profileSeeds) {
    const donorKey = buildDonorKey({ userId: seed.user.id });
    await prisma.donorProfile.upsert({
      where: { donorKey },
      create: {
        donorKey,
        userId: seed.user.id,
        displayName: seed.user.name,
        email: seed.user.email,
        phone: seed.phone,
        whatsappReminderOptIn: seed.whatsappReminderOptIn,
        whatsappReminderOptInAt: seed.whatsappReminderOptIn ? NOW : null,
        internalNote: seed.internalNote,
        labels: seed.labels,
      },
      update: {
        userId: seed.user.id,
        displayName: seed.user.name,
        email: seed.user.email,
        phone: seed.phone,
        whatsappReminderOptIn: seed.whatsappReminderOptIn,
        whatsappReminderOptInAt: seed.whatsappReminderOptIn ? NOW : null,
        internalNote: seed.internalNote,
        labels: seed.labels,
      },
    });
  }
}

type DonationSeed = {
  donor: SeededUser | null;
  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
  amount: number;
  message: string | null;
  status: DonationStatus;
  daysAgo: number;
  whatsappReminderOptIn: boolean;
};

function makeOrderId(daysAgo: number, suffix: string) {
  const date = addDays(NOW, -daysAgo);
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `JB-${yyyymmdd}-${suffix}`;
}

async function seedDonations(donors: SeededUser[]) {
  const seeds: DonationSeed[] = [
    {
      donor: donors[0],
      donorName: donors[0].name,
      donorEmail: donors[0].email,
      donorPhone: "+6281200000001",
      isAnonymous: false,
      showNamePublicly: true,
      amount: 250_000,
      message: "Semoga jadi keberkahan untuk semua.",
      status: DonationStatus.settlement,
      daysAgo: 1,
      whatsappReminderOptIn: true,
    },
    {
      donor: donors[1],
      donorName: donors[1].name,
      donorEmail: donors[1].email,
      donorPhone: "+6281200000002",
      isAnonymous: false,
      showNamePublicly: true,
      amount: 100_000,
      message: null,
      status: DonationStatus.settlement,
      daysAgo: 3,
      whatsappReminderOptIn: false,
    },
    {
      donor: donors[2],
      donorName: donors[2].name,
      donorEmail: donors[2].email,
      donorPhone: null,
      isAnonymous: false,
      showNamePublicly: false,
      amount: 50_000,
      message: "Untuk Jumat berkah pekan ini.",
      status: DonationStatus.settlement,
      daysAgo: 5,
      whatsappReminderOptIn: false,
    },
    {
      donor: donors[3],
      donorName: donors[3].name,
      donorEmail: donors[3].email,
      donorPhone: "+6281200000004",
      isAnonymous: false,
      showNamePublicly: true,
      amount: 75_000,
      message: null,
      status: DonationStatus.pending,
      daysAgo: 0,
      whatsappReminderOptIn: true,
    },
    {
      donor: null,
      donorName: "Hamba Allah",
      donorEmail: null,
      donorPhone: null,
      isAnonymous: true,
      showNamePublicly: false,
      amount: 500_000,
      message: "Bismillah, semoga tepat sasaran.",
      status: DonationStatus.settlement,
      daysAgo: 8,
      whatsappReminderOptIn: false,
    },
    {
      donor: null,
      donorName: "Donatur Tamu",
      donorEmail: "tamu@example.com",
      donorPhone: "+6281200000099",
      isAnonymous: false,
      showNamePublicly: true,
      amount: 25_000,
      message: null,
      status: DonationStatus.expire,
      daysAgo: 10,
      whatsappReminderOptIn: false,
    },
    {
      donor: null,
      donorName: "Pembatal Coba",
      donorEmail: null,
      donorPhone: null,
      isAnonymous: false,
      showNamePublicly: false,
      amount: 30_000,
      message: null,
      status: DonationStatus.cancel,
      daysAgo: 12,
      whatsappReminderOptIn: false,
    },
    {
      donor: donors[0],
      donorName: donors[0].name,
      donorEmail: donors[0].email,
      donorPhone: "+6281200000001",
      isAnonymous: false,
      showNamePublicly: true,
      amount: 150_000,
      message: "Donasi rutin pekan lalu.",
      status: DonationStatus.settlement,
      daysAgo: 8,
      whatsappReminderOptIn: true,
    },
    {
      donor: donors[1],
      donorName: donors[1].name,
      donorEmail: donors[1].email,
      donorPhone: "+6281200000002",
      isAnonymous: false,
      showNamePublicly: true,
      amount: 200_000,
      message: null,
      status: DonationStatus.settlement,
      daysAgo: 15,
      whatsappReminderOptIn: false,
    },
    {
      donor: null,
      donorName: null,
      donorEmail: null,
      donorPhone: null,
      isAnonymous: true,
      showNamePublicly: false,
      amount: 1_000_000,
      message: "Untuk distribusi 100 paket.",
      status: DonationStatus.settlement,
      daysAgo: 22,
      whatsappReminderOptIn: false,
    },
  ];

  for (let index = 0; index < seeds.length; index += 1) {
    const seed = seeds[index];
    const created = addDays(NOW, -seed.daysAgo);
    const isSettlement = seed.status === DonationStatus.settlement;
    const orderId = makeOrderId(
      seed.daysAgo,
      `SEED${String(index + 1).padStart(3, "0")}`,
    );

    await prisma.donation.create({
      data: {
        orderId,
        userId: seed.donor?.id ?? null,
        donorName: seed.donorName,
        donorEmail: seed.donorEmail,
        donorPhone: seed.donorPhone,
        whatsappReminderOptIn: seed.whatsappReminderOptIn,
        whatsappReminderOptInAt: seed.whatsappReminderOptIn ? created : null,
        isAnonymous: seed.isAnonymous,
        showNamePublicly: seed.showNamePublicly,
        amount: seed.amount,
        message: seed.message,
        paymentProvider: "midtrans",
        paymentMethod: "qris",
        status: seed.status,
        midtransTransactionId: isSettlement
          ? `MTX-DUMMY-${String(index + 1).padStart(4, "0")}`
          : null,
        paidAt: isSettlement ? created : null,
        createdAt: created,
        updatedAt: created,
      },
    });
  }
}

type ExpenseSeed = {
  daysAgo: number;
  category: string;
  description: string;
  amount: number;
  vendorName: string | null;
  approvalStatus: ExpenseApprovalStatus;
  approvalRequired: number;
};

async function seedExpenses(adminId: string) {
  const seeds: ExpenseSeed[] = [
    {
      daysAgo: 2,
      category: "Bahan Makanan",
      description: "Belanja beras dan ayam untuk 60 paket nasi",
      amount: 750_000,
      vendorName: "Pasar Karyo",
      approvalStatus: ExpenseApprovalStatus.approved,
      approvalRequired: 1,
    },
    {
      daysAgo: 2,
      category: "Bahan Makanan",
      description: "Sayur, bumbu, dan minyak goreng",
      amount: 320_000,
      vendorName: "Pasar Karyo",
      approvalStatus: ExpenseApprovalStatus.approved,
      approvalRequired: 1,
    },
    {
      daysAgo: 1,
      category: "Operasional",
      description: "Gas elpiji 3kg untuk masak Jumat",
      amount: 60_000,
      vendorName: "Toko Sumber Rejeki",
      approvalStatus: ExpenseApprovalStatus.approved,
      approvalRequired: 1,
    },
    {
      daysAgo: 1,
      category: "Operasional",
      description: "Air minum kemasan dan tisu",
      amount: 95_000,
      vendorName: "Indo Mart",
      approvalStatus: ExpenseApprovalStatus.approved,
      approvalRequired: 1,
    },
    {
      daysAgo: 9,
      category: "Bahan Makanan",
      description: "Belanja Jumat pekan lalu",
      amount: 1_050_000,
      vendorName: "Pasar Karyo",
      approvalStatus: ExpenseApprovalStatus.approved,
      approvalRequired: 1,
    },
    {
      daysAgo: 9,
      category: "Transportasi",
      description: "BBM motor antar paket ke masjid",
      amount: 50_000,
      vendorName: null,
      approvalStatus: ExpenseApprovalStatus.approved,
      approvalRequired: 1,
    },
    {
      daysAgo: 0,
      category: "Peralatan",
      description: "Pembelian wajan besar (perlu persetujuan)",
      amount: 1_500_000,
      vendorName: "Toko Dapur Sejahtera",
      approvalStatus: ExpenseApprovalStatus.pending_approval,
      approvalRequired: 2,
    },
  ];

  for (const seed of seeds) {
    const expenseDate = startOfUtcDay(addDays(NOW, -seed.daysAgo));
    const isApproved = seed.approvalStatus === ExpenseApprovalStatus.approved;
    await prisma.expense.create({
      data: {
        expenseDate,
        category: seed.category,
        description: seed.description,
        amount: seed.amount,
        vendorName: seed.vendorName,
        approvalStatus: seed.approvalStatus,
        approvalRequired: seed.approvalRequired,
        approvedAt: isApproved ? expenseDate : null,
        createdBy: adminId,
        createdAt: expenseDate,
        updatedAt: expenseDate,
      },
    });
  }
}

async function seedWeeklyTarget(adminId: string) {
  const cycleStart = getCurrentFridayCycleStartUtc(NOW);
  const cycleEnd = addDays(cycleStart, 6);
  await prisma.weeklyTarget.upsert({
    where: { cycleStart },
    create: {
      cycleStart,
      cycleEnd,
      targetAmount: 1_500_000,
      note: "Target Jumat berkah pekan ini: 100 paket nasi.",
      createdBy: adminId,
    },
    update: {
      cycleEnd,
      targetAmount: 1_500_000,
      note: "Target Jumat berkah pekan ini: 100 paket nasi.",
      createdBy: adminId,
    },
  });
}

async function seedDistributionReport(adminId: string) {
  const currentCycleStart = getCurrentFridayCycleStartUtc(NOW);
  const previousCycleStart = addDays(currentCycleStart, -7);
  await prisma.distributionReport.upsert({
    where: { cycleStart: previousCycleStart },
    create: {
      cycleStart: previousCycleStart,
      title: "Distribusi 80 paket Jumat lalu",
      summary:
        "Alhamdulillah pekan lalu kami membagikan 80 paket nasi ke jamaah masjid belakang kantor. Terima kasih untuk semua donatur yang sudah berpartisipasi.",
      packageCount: 80,
      locationSummary: "Masjid Al-Karyo, RW 03",
      photoUrls: [],
      publishedAt: addDays(previousCycleStart, 1),
      createdBy: adminId,
    },
    update: {
      title: "Distribusi 80 paket Jumat lalu",
      summary:
        "Alhamdulillah pekan lalu kami membagikan 80 paket nasi ke jamaah masjid belakang kantor. Terima kasih untuk semua donatur yang sudah berpartisipasi.",
      packageCount: 80,
      locationSummary: "Masjid Al-Karyo, RW 03",
      photoUrls: [],
      publishedAt: addDays(previousCycleStart, 1),
      createdBy: adminId,
    },
  });
}

async function seedAdminNotifications() {
  const baseTime = addDays(NOW, -1);
  await prisma.adminNotification.createMany({
    data: [
      {
        type: "donation.settlement",
        title: "Donasi baru: Rp250.000",
        body: "Donatur Siti Aminah berhasil membayar.",
        entityType: "donation",
        entityId: "seed-1",
        readAt: null,
        createdAt: baseTime,
      },
      {
        type: "donation.created",
        title: "Donasi pending",
        body: "Donasi Rp75.000 masih menunggu pembayaran.",
        entityType: "donation",
        entityId: "seed-pending",
        readAt: null,
        createdAt: NOW,
      },
      {
        type: "expense.pending_approval",
        title: "Pengeluaran perlu persetujuan",
        body: "Pembelian wajan besar Rp1.500.000 menunggu approval.",
        entityType: "expense",
        entityId: "seed-pending-expense",
        readAt: null,
        createdAt: NOW,
      },
    ],
  });
}

async function seedAuditLogs(adminId: string) {
  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: adminId,
        action: "weekly_target.created",
        entityType: "weekly_target",
        entityId: "seed",
        before: Prisma.JsonNull,
        after: { targetAmount: 1_500_000 },
        createdAt: NOW,
      },
      {
        actorUserId: adminId,
        action: "distribution_report.published",
        entityType: "distribution_report",
        entityId: "seed",
        before: Prisma.JsonNull,
        after: { title: "Distribusi 80 paket Jumat lalu" },
        createdAt: addDays(NOW, -6),
      },
      {
        actorUserId: adminId,
        action: "expense.created",
        entityType: "expense",
        entityId: "seed",
        before: Prisma.JsonNull,
        after: { category: "Bahan Makanan", amount: 750_000 },
        createdAt: addDays(NOW, -2),
      },
    ],
  });
}

async function main() {
  console.log("Membersihkan tabel dummy...");
  await clearDummyTables();
  console.log("Mengisi user admin dan donor...");
  const { admin, donors } = await upsertUsers();
  console.log("Mengisi profil donatur...");
  await seedDonorProfiles(donors);
  console.log("Mengisi donasi...");
  await seedDonations(donors);
  console.log("Mengisi pengeluaran...");
  await seedExpenses(admin.id);
  console.log("Mengisi target Jumat...");
  await seedWeeklyTarget(admin.id);
  console.log("Mengisi cerita penyaluran pekan lalu...");
  await seedDistributionReport(admin.id);
  console.log("Mengisi notifikasi admin...");
  await seedAdminNotifications();
  console.log("Mengisi audit logs...");
  await seedAuditLogs(admin.id);
  console.log("Selesai. Total donatur seed:", donors.length);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
