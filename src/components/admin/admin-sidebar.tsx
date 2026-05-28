import Link from "next/link";

import { LogoutButton } from "@/app/admin/logout-button";

export type AdminNavItem = {
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
        icon: "⌂",
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
        description: "Database kontak",
        icon: "◌",
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
        label: "Penyaluran",
        description: "Cerita Jumat",
        icon: "▣",
      },
      {
        href: "/admin/persetujuan",
        label: "Approval",
        description: "Biaya besar",
        icon: "✓",
      },
    ],
  },
  {
    label: "Laporan",
    items: [
      {
        href: "/laporan",
        label: "Laporan Publik",
        description: "Pratinjau web",
        icon: "◫",
      },
      {
        href: "/api/admin/reports/export",
        label: "Export CSV",
        description: "Rekonsiliasi",
        icon: "↓",
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        href: "/admin/audit",
        label: "Audit Log",
        description: "Jejak perubahan",
        icon: "≣",
      },
      {
        href: "/akun/profil",
        label: "Profil Admin",
        description: "Akun & sandi",
        icon: "◎",
      },
    ],
  },
];

export function AdminSidebar() {
  return (
    <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[252px] lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-green-700 text-sm font-bold text-white shadow-sm">
            JB
          </div>
          <div className="min-w-0">
            <p className="truncate text-[0.95rem] font-bold leading-5 text-slate-950">
              Jumat Berkah
            </p>
            <p className="truncate text-xs font-medium text-slate-500">
              Admin dashboard
            </p>
          </div>
        </div>

        <nav
          aria-label="Navigasi admin"
          className="px-3 py-3 lg:flex-1 lg:overflow-y-auto lg:py-4"
        >
          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-5 lg:overflow-visible lg:pb-0">
            {adminNavGroups.map((group) => (
              <section
                key={group.label}
                aria-labelledby={`admin-nav-${group.label}`}
                className="shrink-0"
              >
                <h3
                  id={`admin-nav-${group.label}`}
                  className="hidden px-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500 lg:block"
                >
                  {group.label}
                </h3>
                <div className="flex gap-1 lg:mt-2 lg:grid lg:grid-cols-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex min-w-max items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-950 lg:grid lg:min-w-0 lg:grid-cols-[2rem_1fr] lg:border-transparent lg:bg-transparent lg:px-2 lg:py-2.5"
                    >
                      <span className="hidden size-8 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 group-hover:bg-green-50 group-hover:text-green-700 lg:grid">
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold leading-5">
                          {item.label}
                        </span>
                        <span className="hidden truncate text-xs leading-4 text-slate-500 group-hover:text-slate-500 lg:block">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="hidden border-t border-slate-200 p-4 lg:block">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Kontak donatur hanya untuk operasional admin.
          </div>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
