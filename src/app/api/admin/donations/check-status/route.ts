import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { DonationStatus, Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import { getSafeNextDonationStatus } from "@/lib/donation-status";
import {
  checkMidtransTransactionStatus,
  mapMidtransStatus,
  type ParsedMidtransNotification,
} from "@/lib/midtrans";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const admin =
    legacyAdmin ?? (await requireBetterAuthAdminUser(await headers()));

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const orderId =
    typeof payload?.orderId === "string" ? payload.orderId.trim() : "";

  if (!orderId) {
    return NextResponse.json(
      { errors: { orderId: "orderId wajib diisi." } },
      { status: 400 },
    );
  }

  const prisma = getPrisma();

  const donation = await prisma.donation.findUnique({
    where: { orderId },
    select: {
      id: true,
      orderId: true,
      status: true,
      paidAt: true,
      midtransTransactionId: true,
    },
  });

  if (!donation) {
    return NextResponse.json(
      { errors: { orderId: "Donasi tidak ditemukan." } },
      { status: 404 },
    );
  }

  let midtransResult;
  try {
    midtransResult = await checkMidtransTransactionStatus(orderId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghubungi Midtrans.";
    return NextResponse.json(
      { errors: { midtrans: message } },
      { status: 502 },
    );
  }

  // Build a notification-like object to reuse mapMidtransStatus
  const notificationLike: ParsedMidtransNotification = {
    orderId: midtransResult.orderId,
    statusCode: midtransResult.statusCode,
    grossAmount: midtransResult.grossAmount,
    signatureKey: "", // Not needed for mapping
    transactionStatus: midtransResult.transactionStatus,
    fraudStatus: midtransResult.fraudStatus,
    transactionId: null,
  };

  const mappedStatus = mapMidtransStatus(notificationLike);

  if (!mappedStatus) {
    return createStatusCheckNoChangeResponse({
      orderId,
      currentStatus: donation.status,
      midtransStatus: midtransResult.transactionStatus,
      mappedStatus: null,
      message: "Status Midtrans tidak dapat dipetakan.",
    });
  }

  const nextStatus = getSafeNextDonationStatus(donation.status, mappedStatus);
  const statusChanged = nextStatus !== donation.status;

  if (!statusChanged) {
    return createStatusCheckNoChangeResponse({
      orderId,
      currentStatus: donation.status,
      midtransStatus: midtransResult.transactionStatus,
      mappedStatus,
      message: "Status sudah sesuai, tidak ada perubahan.",
    });
  }

  // Status differs — update within a transaction with audit log
  const updated = await prisma.$transaction(async (tx) => {
    const updatedDonation = await tx.donation.update({
      where: { id: donation.id },
      data: {
        status: nextStatus,
        paidAt:
          nextStatus === DonationStatus.settlement
            ? (donation.paidAt ?? new Date())
            : donation.paidAt,
      },
      select: {
        status: true,
        paidAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "admin.donation.status_check_updated",
        entityType: "donation",
        entityId: donation.id,
        before: {
          status: donation.status,
          paidAt: donation.paidAt?.toISOString() ?? null,
        } satisfies Prisma.InputJsonValue,
        after: {
          status: updatedDonation.status,
          paidAt: updatedDonation.paidAt?.toISOString() ?? null,
          midtransTransactionStatus: midtransResult.transactionStatus,
        } satisfies Prisma.InputJsonValue,
      },
    });

    return updatedDonation;
  });

  return NextResponse.json({
    ok: true,
    orderId,
    currentStatus: updated.status,
    previousStatus: donation.status,
    midtransStatus: midtransResult.transactionStatus,
    mappedStatus,
    statusUpdated: true,
    message: `Status diperbarui dari ${donation.status} ke ${updated.status}.`,
  });
}

type StatusCheckNoChangeResponseInput = {
  orderId: string;
  currentStatus: DonationStatus;
  midtransStatus: string;
  mappedStatus: DonationStatus | null;
  message: string;
};

function createStatusCheckNoChangeResponse(
  input: StatusCheckNoChangeResponseInput,
) {
  return NextResponse.json({
    ok: true,
    orderId: input.orderId,
    currentStatus: input.currentStatus,
    midtransStatus: input.midtransStatus,
    mappedStatus: input.mappedStatus,
    statusUpdated: false,
    message: input.message,
  });
}
