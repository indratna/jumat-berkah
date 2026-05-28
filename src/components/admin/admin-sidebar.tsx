import Link from "next/link";

import { LogoutButton } from "@/app/admin/logout-button";

type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
};

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Utama",
    items: [
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
        href: "/admin/donatur",
        label: "Donatur",
        description: "Kontak operasional",
        icon: "◍",
      },
      {
        href: "/admin/pengeluaran",
        label: "Biaya",
        description: "Pengeluaran program",
        icon: "↘",
      },
    ],
  },
  {
    label: "Operasional",
    items: [
      {
        href: "/admin/penyaluran",
        label: "Cerita",
        description: "Penyaluran Jumat",
        icon: "✿",
      },
      {
        href: "/admin/persetujuan",
        label: "Approval",
        description: "Pengeluaran besar",
        icon: "✓",
      },
    ],
  },
  {
    label: "Laporan",
    items: [
      {
        href: "/laporan",
        label: "Publik",
        description: "Pratinjau laporan",
        icon: "◌",
      },
      {
        href: "/api/admin/reports/export",
        label: "Export",
        description: "Unduh CSV",
        icon: "↓",
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        href: "/admin/audit",
        label: "Audit",
        description: "Jejak sistem",
        icon: "≣",
      },
      {
        href: "/akun/profil",
        label: "Profil",
        description: "Akun admin",
        icon: "◎",
      },
    ],
  },
];

export function AdminSidebar() {
  return (
    <aside className="border-b border-white/70 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
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

      <nav aria-label="Navigasi admin" className="mt-5 space-y-4">
        {adminNavGroups.map((group) => (
          <section
            key={group.label}
            aria-labelledby={`admin-nav-${group.label}`}
          >
            <h3
              id={`admin-nav-${group.label}`}
              className="px-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
            >
              {group.label}
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-3xl border border-white/80 bg-white/80 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <span className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-base font-bold text-slate-700 transition group-hover:bg-emerald-500 group-hover:text-white">
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
            </div>
          </section>
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
  );
}
