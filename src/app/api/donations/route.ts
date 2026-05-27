import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

import {
  createDonationOrderId,
  getInitialDonationStatus,
  validateDonationInput,
} from "@/lib/donations";
import { getPrisma } from "@/lib/db";
import { DONOR_SESSION_COOKIE, getDonorUser } from "@/lib/auth";
import { getBetterAuthDonorUser } from "@/lib/better-auth-guards";
import {
  createMidtransSnapTransaction,
  MidtransConfigurationError,
} from "@/lib/midtrans";

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { errors: { body: "Body request tidak valid." } },
      { status: 400 },
    );
  }

  const validation = validateDonationInput(payload);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const prisma = getPrisma();
  const cookieStore = await cookies();
  const legacyDonor = await getDonorUser(
    cookieStore.get(DONOR_SESSION_COOKIE)?.value,
  );
  const donor = legacyDonor ?? (await getBetterAuthDonorUser(await headers()));
  const data = validation.data;
  const donation = await prisma.donation.create({
    data: {
      orderId: createDonationOrderId(),
      userId: donor?.id ?? null,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      donorPhone: data.donorPhone,
      isAnonymous: data.isAnonymous,
      showNamePublicly: data.showNamePublicly,
      amount: data.amount,
      message: data.message,
      paymentProvider: "midtrans",
      paymentMethod: "qris",
      status: getInitialDonationStatus(),
    },
    select: {
      orderId: true,
      amount: true,
      donorName: true,
      donorEmail: true,
      donorPhone: true,
      status: true,
    },
  });

  try {
    const payment = await createMidtransSnapTransaction({
      orderId: donation.orderId,
      amount: donation.amount,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      donorPhone: donation.donorPhone,
    });

    return NextResponse.json(
      {
        orderId: donation.orderId,
        amount: donation.amount,
        status: donation.status,
        payment,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof MidtransConfigurationError) {
      return NextResponse.json(
        {
          orderId: donation.orderId,
          amount: donation.amount,
          status: donation.status,
          errors: { payment: "Konfigurasi Midtrans belum tersedia." },
        },
        { status: 503 },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        orderId: donation.orderId,
        amount: donation.amount,
        status: donation.status,
        errors: { payment: "Transaksi Midtrans belum bisa dibuat." },
      },
      { status: 502 },
    );
  }
}
