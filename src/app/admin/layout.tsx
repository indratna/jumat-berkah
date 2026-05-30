import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getAdminNotifications } from "@/lib/admin-notifications";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const legacySession = verifyAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const betterAuthAdmin = legacySession
    ? null
    : await requireBetterAuthAdminUser(await headers());

  if (!legacySession && !betterAuthAdmin) {
    redirect("/login?next=/admin");
  }

  const notifications = await getAdminNotifications();

  return <AdminShell notifications={notifications}>{children}</AdminShell>;
}
