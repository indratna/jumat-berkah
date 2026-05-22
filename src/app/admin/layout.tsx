import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

const adminNavItems = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Ringkasan dana",
    icon: "⌁",
  },
  {
    href: "/admin/donasi",
    label: "Donasi",
    description: "Transaksi masuk",
    icon: "↗",
  },
  {
    href: "/admin/pengeluaran",
    label: "Pengeluaran",
    description: "Biaya program",
    icon: "↘",
  },
  {
    href: "/api/admin/reports/export",
    label: "Export CSV",
    description: "Unduh laporan",
    icon: "↓",
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = verifyAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (!session) {
    redirect("/login?next=/admin");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_32rem),linear-gradient(180deg,#f8fafc,#eef2f7)] text-slate-950 lg:flex">
      <aside className="border-b border-white/70 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="rounded-4xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/40">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-400 text-xl font-black text-slate-950">
              JB
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                Jumat Berkah
              </p>
              <h2 className="text-lg font-bold">Admin Panel</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Pantau donasi, pengeluaran, saldo, dan laporan publik dalam satu
            tempat.
          </p>
        </div>

        <nav className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-3xl border border-white/80 bg-white/80 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-700 transition group-hover:bg-emerald-500 group-hover:text-white">
                {item.icon}
              </span>
              <span>
                <span className="block font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50/90 p-4 text-xs leading-5 text-amber-900">
          <p className="font-semibold">Catatan privasi</p>
          <p className="mt-1">
            Kontak donatur hanya untuk admin. Laporan publik tetap menyamarkan
            data privat.
          </p>
        </div>

        <div className="mt-5">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {children}
      </div>
    </div>
  );
}
