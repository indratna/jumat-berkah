import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import { validateDonorProfilePayload } from "@/lib/admin-donor-profile";

type RouteContext = {
  params: Promise<{ donorKey: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getAdminFromCookie();

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const { donorKey: encodedDonorKey } = await context.params;
  const donorKey = decodeURIComponent(encodedDonorKey);
  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const validation = validateDonorProfilePayload(payload ?? {});

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const prisma = getPrisma();
  const previous = await prisma.donorProfile.findUnique({ where: { donorKey } });
  const now = new Date();
  const optInChanged =
    (previous?.whatsappReminderOptIn ?? false) !==
    validation.data.whatsappReminderOptIn;

  const profile = await prisma.$transaction(async (tx) => {
    const saved = await tx.donorProfile.upsert({
      where: { donorKey },
      create: {
        donorKey,
        userId: extractUserId(donorKey),
        displayName: validation.data.displayName,
        email: validation.data.email,
        phone: validation.data.phone,
        whatsappReminderOptIn: validation.data.whatsappReminderOptIn,
        whatsappReminderOptInAt: validation.data.whatsappReminderOptIn
          ? now
          : null,
        whatsappReminderOptOutAt: validation.data.whatsappReminderOptIn
          ? null
          : now,
        internalNote: validation.data.internalNote,
        labels: validation.data.labels,
      },
      update: {
        displayName: validation.data.displayName,
        email: validation.data.email,
        phone: validation.data.phone,
        whatsappReminderOptIn: validation.data.whatsappReminderOptIn,
        whatsappReminderOptInAt:
          validation.data.whatsappReminderOptIn && optInChanged
            ? now
            : previous?.whatsappReminderOptInAt,
        whatsappReminderOptOutAt:
          !validation.data.whatsappReminderOptIn && optInChanged
            ? now
            : previous?.whatsappReminderOptOutAt,
        internalNote: validation.data.internalNote,
        labels: validation.data.labels,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "donor.profile.updated",
        entityType: "donor_profile",
        entityId: saved.id,
        before: previous ? serializeProfile(previous) : Prisma.JsonNull,
        after: serializeProfile(saved),
      },
    });

    return saved;
  });

  return NextResponse.json({ ok: true, profile: serializeProfile(profile) });
}

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  return legacyAdmin ?? requireBetterAuthAdminUser(await headers());
}

function extractUserId(donorKey: string) {
  return donorKey.startsWith("user:") ? donorKey.slice("user:".length) : null;
}

function serializeProfile(profile: {
  id: string;
  donorKey: string;
  userId: string | null;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  whatsappReminderOptIn: boolean;
  whatsappReminderOptInAt: Date | null;
  whatsappReminderOptOutAt: Date | null;
  internalNote: string | null;
  labels: Prisma.JsonValue;
  mergedIntoId: string | null;
}) {
  return {
    id: profile.id,
    donorKey: profile.donorKey,
    userId: profile.userId,
    displayName: profile.displayName,
    email: profile.email,
    phone: profile.phone,
    whatsappReminderOptIn: profile.whatsappReminderOptIn,
    whatsappReminderOptInAt:
      profile.whatsappReminderOptInAt?.toISOString() ?? null,
    whatsappReminderOptOutAt:
      profile.whatsappReminderOptOutAt?.toISOString() ?? null,
    internalNote: profile.internalNote,
    labels: Array.isArray(profile.labels) ? profile.labels : [],
    mergedIntoId: profile.mergedIntoId,
  };
}
