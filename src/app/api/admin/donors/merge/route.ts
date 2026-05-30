import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import {
  normalizeDonorLabels,
  validateDonorMergePayload,
} from "@/lib/admin-donor-profile";

export async function POST(request: Request) {
  const admin = await getAdminFromCookie();

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
  const validation = validateDonorMergePayload(payload ?? {});

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const prisma = getPrisma();
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const primary = await tx.donorProfile.upsert({
      where: { donorKey: validation.data.primaryDonorKey },
      create: {
        donorKey: validation.data.primaryDonorKey,
        userId: extractUserId(validation.data.primaryDonorKey),
      },
      update: {},
    });
    const duplicate = await tx.donorProfile.upsert({
      where: { donorKey: validation.data.duplicateDonorKey },
      create: {
        donorKey: validation.data.duplicateDonorKey,
        userId: extractUserId(validation.data.duplicateDonorKey),
      },
      update: {},
    });

    if (duplicate.mergedIntoId === primary.id) {
      return { primary, duplicate, merged: primary };
    }

    const primaryLabels = parseLabels(primary.labels);
    const duplicateLabels = parseLabels(duplicate.labels);
    const mergedLabels = normalizeDonorLabels([
      ...primaryLabels,
      ...duplicateLabels,
    ]);
    const mergedNote = mergeNotes(primary.internalNote, duplicate.internalNote, now);
    const before = {
      primary: serializeProfile(primary),
      duplicate: serializeProfile(duplicate),
    };

    const merged = await tx.donorProfile.update({
      where: { id: primary.id },
      data: {
        labels: mergedLabels,
        internalNote: mergedNote,
      },
    });
    const markedDuplicate = await tx.donorProfile.update({
      where: { id: duplicate.id },
      data: { mergedIntoId: primary.id },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "donor.merged",
        entityType: "donor_profile",
        entityId: primary.id,
        before,
        after: {
          primary: serializeProfile(merged),
          duplicate: serializeProfile(markedDuplicate),
          financialFieldsMutated: false,
          protectedDonationFields: [
            "amount",
            "status",
            "orderId",
            "midtransTransactionId",
          ],
        },
      },
    });

    return { primary, duplicate: markedDuplicate, merged };
  });

  return NextResponse.json({
    ok: true,
    primaryProfileId: result.primary.id,
    duplicateProfileId: result.duplicate.id,
    mergedProfileId: result.merged.id,
  });
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

function parseLabels(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((label): label is string => typeof label === "string");
}

function mergeNotes(primaryNote: string | null, duplicateNote: string | null, now: Date) {
  if (!duplicateNote) {
    return primaryNote;
  }

  const marker = `Catatan dari donor gabungan (${now.toISOString()}):`;
  return [primaryNote, marker, duplicateNote].filter(Boolean).join("\n\n");
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
    labels: parseLabels(profile.labels),
    mergedIntoId: profile.mergedIntoId,
  };
}
