import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const prisma = getPrisma();
  const donation = await prisma.donation.findUnique({
    where: { orderId },
    select: {
      orderId: true,
      amount: true,
      status: true,
      paidAt: true,
      createdAt: true,
    },
  });

  if (!donation) {
    return NextResponse.json(
      { errors: { orderId: "Donasi tidak ditemukan." } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    orderId: donation.orderId,
    amount: donation.amount,
    status: donation.status,
    paidAt: donation.paidAt,
    createdAt: donation.createdAt,
  });
}
