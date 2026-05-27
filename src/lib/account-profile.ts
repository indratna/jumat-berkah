import { cookies, headers } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  DONOR_SESSION_COOKIE,
  getDonorUser,
  requireAdminUser,
} from "@/lib/auth";
import {
  getBetterAuthDonorUser,
  requireBetterAuthAdminUser,
} from "@/lib/better-auth-guards";
import { betterAuthInstance } from "@/lib/better-auth";
import { getPrisma } from "@/lib/db";

export type AccountProfileUser = {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "donor";
  image: string | null;
};

export type ProfileValidationResult =
  | { success: true; data: { name: string | null } }
  | { success: false; errors: { name?: string; form?: string } };

export async function getCurrentAccountProfile(): Promise<AccountProfileUser | null> {
  const cookieStore = await cookies();
  const requestHeaders = await headers();

  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const legacyDonor = await getDonorUser(
    cookieStore.get(DONOR_SESSION_COOKIE)?.value,
  );
  const appUser =
    legacyAdmin ??
    legacyDonor ??
    (await requireBetterAuthAdminUser(requestHeaders)) ??
    (await getBetterAuthDonorUser(requestHeaders));

  if (!appUser) {
    return null;
  }

  const authSession = await betterAuthInstance.api.getSession({
    headers: requestHeaders,
  });
  const authEmail = authSession?.user.email?.trim().toLowerCase();
  const authImage =
    authSession && authEmail === appUser.email.trim().toLowerCase()
      ? authSession.user.image
      : null;

  return {
    id: appUser.id,
    name: appUser.name,
    email: appUser.email,
    role: appUser.role,
    image: authImage ?? null,
  };
}

export function validateProfilePayload(
  payload: Record<string, unknown>,
): ProfileValidationResult {
  const rawName = payload.name;

  if (
    rawName !== null &&
    rawName !== undefined &&
    typeof rawName !== "string"
  ) {
    return { success: false, errors: { name: "Nama tidak valid." } };
  }

  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (name.length > 100) {
    return { success: false, errors: { name: "Nama maksimal 100 karakter." } };
  }

  return { success: true, data: { name: name.length > 0 ? name : null } };
}

export async function updateCurrentAccountProfile(input: {
  user: AccountProfileUser;
  name: string | null;
}) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: input.user.id },
      data: { name: input.name },
      select: { id: true, name: true, email: true, role: true },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: input.user.id,
        action: "account.profile.updated",
        entityType: "user",
        entityId: input.user.id,
        before: {
          name: input.user.name,
          email: input.user.email,
          role: input.user.role,
        },
        after: {
          name: updated.name,
          email: updated.email,
          role: updated.role,
        },
      },
    });

    const authUser = await tx.authUser.findUnique({
      where: { email: input.user.email },
      select: { id: true },
    });

    if (authUser) {
      await tx.authUser.update({
        where: { id: authUser.id },
        data: { name: input.name ?? "" },
      });
    }

    return updated;
  });
}
