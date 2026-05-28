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
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:pl-[252px]">
      <AdminSidebar />

      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Jumat Berkah Karyo
              </p>
              <p className="truncate text-sm font-bold text-slate-950 sm:text-base">
                Panel operasional donasi dan laporan
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 sm:block">
                Admin aktif
              </div>
              <div className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-green-700 shadow-sm">
                AK
              </div>
            </div>
          </div>
        </header>

        <div id="main-content" className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
