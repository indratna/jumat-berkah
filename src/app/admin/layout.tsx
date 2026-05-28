import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_32rem),linear-gradient(180deg,#f8fafc,#eef2f7)] text-slate-950 lg:flex">
      <AdminSidebar />

      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {children}
      </div>
    </div>
  );
}
