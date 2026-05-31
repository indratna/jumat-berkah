import { DonationStatus, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { getSafeNextDonationStatus } from "@/lib/donation-status";
import {
  mapMidtransStatus,
  parseMidtransNotification,
  verifyMidtransSignature,
} from "@/lib/midtrans";
import { safeSendAdminSettlementEmail } from "@/lib/email";
import {
  formatDonationSettlementMessage,
  getTelegramBotToken,
  getTelegramNotifyChatId,
  isTelegramNotifyEnabled,
  safeSendTelegramMessage,
} from "@/lib/telegram";
import { NextResponse } from "next/server";
import { createDonationSettlementNotification } from "@/lib/admin-notifications";

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { errors: { body: "Body webhook tidak valid." } },
      { status: 400 },
    );
  }

  const notification = parseMidtransNotification(payload);

  if (!notification) {
    return NextResponse.json(
      { errors: { body: "Payload Midtrans tidak lengkap." } },
      { status: 400 },
    );
  }

  const signatureValid = verifyMidtransSignature(notification);
  const prisma = getPrisma();

  await prisma.midtransWebhookLog.create({
    data: {
      orderId: notification.orderId,
      transactionStatus: notification.transactionStatus,
      fraudStatus: notification.fraudStatus,
      signatureValid,
      rawPayload: payload as Prisma.InputJsonValue,
    },
  });

  if (!signatureValid) {
    return NextResponse.json(
      { errors: { signature: "Signature Midtrans tidak valid." } },
      { status: 401 },
    );
  }

  const mappedStatus = mapMidtransStatus(notification);

  if (!mappedStatus) {
    return NextResponse.json(
      { errors: { status: "Status Midtrans tidak didukung." } },
      { status: 400 },
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const donation = await tx.donation.findUnique({
      where: { orderId: notification.orderId },
      select: {
        id: true,
        orderId: true,
        status: true,
        paidAt: true,
        midtransTransactionId: true,
        amount: true,
        donorName: true,
        donorEmail: true,
        donorPhone: true,
        isAnonymous: true,
        showNamePublicly: true,
        message: true,
      },
    });

    if (!donation) {
      return {
        donationFound: false,
        statusChanged: false,
        donation: null,
        updatedDonation: null,
      };
    }

    const nextStatus = getSafeNextDonationStatus(donation.status, mappedStatus);

    if (nextStatus === donation.status) {
      return {
        donationFound: true,
        statusChanged: false,
        donation,
        updatedDonation: null,
      };
    }

    const updatedDonation = await tx.donation.update({
      where: { id: donation.id },
      data: {
        status: nextStatus,
        midtransTransactionId:
          notification.transactionId ?? donation.midtransTransactionId,
        paidAt:
          nextStatus === DonationStatus.settlement
            ? (donation.paidAt ?? new Date())
            : donation.paidAt,
      },
      select: {
        status: true,
        paidAt: true,
        midtransTransactionId: true,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "midtrans.webhook.status_changed",
        entityType: "donation",
        entityId: donation.id,
        before: {
          status: donation.status,
          paidAt: donation.paidAt?.toISOString() ?? null,
          midtransTransactionId: donation.midtransTransactionId,
        },
        after: {
          status: updatedDonation.status,
          paidAt: updatedDonation.paidAt?.toISOString() ?? null,
          midtransTransactionId: updatedDonation.midtransTransactionId,
        },
      },
    });

    return {
      donationFound: true,
      statusChanged: true,
      donation,
      updatedDonation,
    };
  });

  if (!result.donationFound) {
    return NextResponse.json(
      { errors: { orderId: "Donasi tidak ditemukan." } },
      { status: 404 },
    );
  }

  // Fire-and-forget Telegram notification for settlement transitions only.
  // Notification failure must NOT break the webhook response.
  if (
    result.statusChanged &&
    result.updatedDonation?.status === DonationStatus.settlement &&
    result.donation
  ) {
    const notificationInput = {
      orderId: result.donation.orderId,
      amount: result.donation.amount,
      donorName: result.donation.donorName,
      isAnonymous: result.donation.isAnonymous,
      showNamePublicly: result.donation.showNamePublicly,
      message: result.donation.message,
      paidAt: result.updatedDonation.paidAt ?? new Date(),
    };

    await createDonationSettlementNotification({
      donationId: result.donation.id,
      orderId: result.donation.orderId,
      amount: result.donation.amount,
      donorName: result.donation.donorName,
      donorEmail: result.donation.donorEmail,
      donorPhone: result.donation.donorPhone,
      isAnonymous: result.donation.isAnonymous,
      showNamePublicly: result.donation.showNamePublicly,
    });
    await maybeSendSettlementNotification(notificationInput);
    await safeSendAdminSettlementEmail(notificationInput);
  }

  return NextResponse.json({
    ok: true,
    orderId: notification.orderId,
    status: mappedStatus,
    statusChanged: result.statusChanged,
  });
}

type SettlementNotificationInput = {
  orderId: string;
  amount: number;
  donorName: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
  message: string | null;
  paidAt: Date;
};

async function maybeSendSettlementNotification(
  input: SettlementNotificationInput,
) {
  if (!isTelegramNotifyEnabled()) {
    return;
  }

  if (!getTelegramBotToken()) {
    return;
  }

  const chatId = getTelegramNotifyChatId();

  if (chatId === null) {
    return;
  }

  const text = formatDonationSettlementMessage(input);

  await safeSendTelegramMessage({ chatId, text });
}
