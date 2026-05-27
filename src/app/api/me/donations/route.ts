import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { DONOR_SESSION_COOKIE, getDonorUser } from "@/lib/auth";
import { getBetterAuthDonorUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const legacyDonor = await getDonorUser(
    cookieStore.get(DONOR_SESSION_COOKIE)?.value,
  );
  const donor = legacyDonor ?? (await getBetterAuthDonorUser(await headers()));

  if (!donor) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const prisma = getPrisma();
  const donations = await prisma.donation.findMany({
    where: { userId: donor.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      orderId: true,
      amount: true,
      status: true,
      isAnonymous: true,
      showNamePublicly: true,
      message: true,
      createdAt: true,
      paidAt: true,
    },
  });

  return NextResponse.json({
    profile: { name: donor.name, email: donor.email },
    donations: donations.map((donation) => ({
      orderId: donation.orderId,
      amount: donation.amount,
      status: donation.status,
      isAnonymous: donation.isAnonymous,
      showNamePublicly: donation.showNamePublicly,
      message: donation.message,
      createdAt: donation.createdAt.toISOString(),
      paidAt: donation.paidAt?.toISOString() ?? null,
    })),
  });
}
