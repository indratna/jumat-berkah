import {
  canGrantAdminAccess,
  canGrantDonorAccess,
} from "@/lib/auth-authorization";
import { betterAuthInstance } from "@/lib/better-auth";

export async function requireBetterAuthAdminUser(requestHeaders: Headers) {
  const session = await betterAuthInstance.api.getSession({
    headers: requestHeaders,
  });
  const email = session?.user.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  return canGrantAdminAccess({
    sessionEmail: email,
    appUserRole: user?.role ?? null,
  })
    ? user
    : null;
}

export async function getBetterAuthDonorUser(requestHeaders: Headers) {
  const session = await betterAuthInstance.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return null;
  }

  const email = session.user.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const existingUser = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      telegramLinkCode: true,
    },
  });

  if (existingUser) {
    return canGrantDonorAccess({
      sessionEmail: email,
      appUserRole: existingUser.role,
    })
      ? existingUser
      : null;
  }

  const createdDonor = await prisma.user.create({
    data: {
      email,
      name: session.user.name?.trim() || null,
      role: "donor",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      telegramLinkCode: true,
    },
  });

  return createdDonor;
}
