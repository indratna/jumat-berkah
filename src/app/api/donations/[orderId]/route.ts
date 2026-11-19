import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/db";
import {
  RATE_LIMITS,
  buildRateLimitKey,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const rateLimit = consumeRateLimit({
    key: buildRateLimitKey("donation:status", getClientIp(request)),
    rule: RATE_LIMITS.donationStatus,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(
      rateLimit,
      "Terlalu banyak pengecekan status. Coba lagi beberapa menit lagi.",
    );
  }

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
