import { DonationStatus, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import {
  mapMidtransStatus,
  parseMidtransNotification,
  verifyMidtransSignature,
} from "@/lib/midtrans";
import { NextResponse } from "next/server";

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
      },
    });

    if (!donation) {
      return { donationFound: false, statusChanged: false };
    }

    const nextStatus = getSafeNextStatus(donation.status, mappedStatus);

    if (nextStatus === donation.status) {
      return { donationFound: true, statusChanged: false };
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

    return { donationFound: true, statusChanged: true };
  });

  if (!result.donationFound) {
    return NextResponse.json(
      { errors: { orderId: "Donasi tidak ditemukan." } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    orderId: notification.orderId,
    status: mappedStatus,
    statusChanged: result.statusChanged,
  });
}

function getSafeNextStatus(currentStatus: DonationStatus, requestedStatus: DonationStatus) {
  if (
    currentStatus === DonationStatus.settlement &&
    requestedStatus !== DonationStatus.refund
  ) {
    return currentStatus;
  }

  return requestedStatus;
}
