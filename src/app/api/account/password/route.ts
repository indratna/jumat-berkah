import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { validatePasswordChangePayload } from "@/lib/account-password";
import { getCurrentAccountProfile } from "@/lib/account-profile";
import { betterAuthInstance } from "@/lib/better-auth";
import { getPrisma } from "@/lib/db";

export async function PATCH(request: Request) {
  const user = await getCurrentAccountProfile();

  if (!user) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const validation = validatePasswordChangePayload(payload ?? {});

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  try {
    await betterAuthInstance.api.changePassword({
      body: {
        currentPassword: validation.data.currentPassword,
        newPassword: validation.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch {
    return NextResponse.json(
      { errors: { currentPassword: "Password saat ini tidak sesuai." } },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "account.password.changed",
      entityType: "user",
      entityId: user.id,
      before: Prisma.JsonNull,
      after: {
        email: user.email,
        role: user.role,
        revokeOtherSessions: true,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
