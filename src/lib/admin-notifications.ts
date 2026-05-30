import { Prisma } from "@/generated/prisma/client";
import { getAdminDonorName } from "@/lib/admin";
import { getPrisma } from "@/lib/db";
import { formatRupiah } from "@/lib/format";

type AdminNotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: Date | null;
  created_at: Date;
};

export async function createDonationCreatedNotification(input: {
  donationId: string;
  orderId: string;
  amount: number;
  donorName: string | null;
  donorEmail?: string | null;
  donorPhone?: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
}) {
  await createAdminNotification({
    type: "donation.created",
    title: "Donasi masuk",
    body: `${getAdminDonorName(input)} membuat donasi ${formatRupiah(input.amount)}.`,
    entityType: "donation",
    entityId: input.donationId,
  });
}

export async function createDonationSettlementNotification(input: {
  donationId: string;
  orderId: string;
  amount: number;
  donorName: string | null;
  donorEmail?: string | null;
  donorPhone?: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
}) {
  await createAdminNotification({
    type: "donation.settlement",
    title: "Donasi terbayar",
    body: `${getAdminDonorName(input)} menyelesaikan pembayaran ${formatRupiah(input.amount)}.`,
    entityType: "donation",
    entityId: input.donationId,
  });
}

async function createAdminNotification(input: {
  type: string;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
}) {
  const prisma = getPrisma();
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO admin_notifications (type, title, body, entity_type, entity_id) VALUES (${input.type}, ${input.title}, ${input.body}, ${input.entityType}, ${input.entityId})`,
  );
}

export async function getAdminNotifications() {
  const prisma = getPrisma();
  const [items, unreadRows] = await Promise.all([
    prisma.$queryRaw<AdminNotificationRow[]>(
      Prisma.sql`SELECT id::text, type, title, body, read_at, created_at FROM admin_notifications ORDER BY created_at DESC LIMIT 10`,
    ),
    prisma.$queryRaw<Array<{ count: bigint }>>(
      Prisma.sql`SELECT COUNT(*)::bigint AS count FROM admin_notifications WHERE read_at IS NULL`,
    ),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      readAt: item.read_at,
      createdAt: item.created_at,
    })),
    unreadCount: unreadRows[0] ? Number(unreadRows[0].count) : 0,
  };
}

export async function markAdminNotificationsRead() {
  const prisma = getPrisma();
  await prisma.$executeRaw(
    Prisma.sql`UPDATE admin_notifications SET read_at = NOW() WHERE read_at IS NULL`,
  );
}
