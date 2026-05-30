import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { markAdminNotificationsRead } from "@/lib/admin-notifications";

export async function PATCH() {
  const cookieStore = await cookies();
  const legacySession = verifyAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const betterAuthAdmin = legacySession
    ? null
    : await requireBetterAuthAdminUser(await headers());

  if (!legacySession && !betterAuthAdmin) {
    return NextResponse.json({ errors: { auth: "Unauthorized" } }, { status: 401 });
  }

  await markAdminNotificationsRead();
  return NextResponse.json({ ok: true });
}
