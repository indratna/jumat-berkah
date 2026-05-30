"use client";

import Link from "next/link";
import { useState } from "react";

import { LogoutButton } from "@/app/admin/logout-button";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
};

type AdminNavGroup = {
  label: string;
  icon: string;
  items: AdminNavItem[];
};

export const dashboardNavItem: AdminNavItem = {
  href: "/admin",
  label: "Dashboard",
  description: "Ringkasan dana",
  icon: "⌂",
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Masuk",
    icon: "↗",
    items: [
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
    ],
  },
  {
    label: "Keluar",
    icon: "↘",
    items: [
      {
        href: "/admin/pengeluaran",
        label: "Biaya",
        description: "Pengeluaran program",
        icon: "↘",
      },
      {
        href: "/admin/penyaluran",
        label: "Penyaluran",
        description: "Cerita Jumat",
        icon: "▣",
      },
    ],
  },
  {
    label: "Pengaturan",
    icon: "⚙",
    items: [
      {
        href: "/admin/persetujuan",
        label: "Approval",
        description: "Biaya besar",
        icon: "✓",
      },
      {
        href: "/admin/audit",
        label: "Audit Log",
        description: "Jejak perubahan",
        icon: "≣",
      },
      {
        href: "/admin/pengaturan/sistem",
        label: "Status Sistem",
        description: "Konfigurasi env",
        icon: "⚙",
      },
      {
        href: "/admin/profil",
        label: "Profil Admin",
        description: "Akun & sandi",
        icon: "◎",
      },
    ],
  },
];

export function AdminSidebar({ expanded }: { expanded: boolean }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Masuk: true,
    Keluar: true,
    Pengaturan: false,
  });

  return (
    <aside
      className={`border-b border-slate-200 bg-white transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:border-b-0 lg:border-r ${
        expanded ? "lg:w-63" : "lg:w-21"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-green-700 text-sm font-bold text-white shadow-sm">
            JB
          </div>
          <div className={`min-w-0 ${expanded ? "" : "lg:hidden"}`}>
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
          className="px-3 py-3 lg:flex-1 lg:py-4"
        >
          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            <Link
              href={dashboardNavItem.href}
              title={dashboardNavItem.description}
              className="group/link flex min-h-11 min-w-max shrink-0 items-center gap-2 rounded-md px-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950 lg:min-w-0"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 ring-1 ring-slate-200 group-hover/link:bg-green-50 group-hover/link:text-green-700">
                {dashboardNavItem.icon}
              </span>
              <span className={`min-w-0 ${expanded ? "" : "lg:hidden"}`}>
                <span className="block truncate text-sm font-bold leading-5">
                  {dashboardNavItem.label}
                </span>
                <span className="sr-only">{dashboardNavItem.description}</span>
              </span>
            </Link>

            {adminNavGroups.map((group) => {
              const isOpen = openGroups[group.label] ?? true;
              return (
                <section key={group.label} className="shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroups((current) => ({
                        ...current,
                        [group.label]: !isOpen,
                      }))
                    }
                    className="group flex min-h-11 w-full min-w-max items-center gap-2 rounded-md px-2 text-sm font-bold text-slate-700 hover:bg-slate-50 lg:min-w-0"
                    title={group.label}
                    aria-expanded={isOpen}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-100 text-xs text-slate-500 group-hover:bg-green-50 group-hover:text-green-700">
                      {group.icon}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-left ${
                        expanded ? "" : "lg:hidden"
                      }`}
                    >
                      {group.label}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="mt-1 flex gap-1 lg:grid lg:grid-cols-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.description}
                          className="group/link flex min-h-10 min-w-max items-center gap-2 rounded-md px-2 text-slate-600 hover:bg-slate-50 hover:text-slate-950 lg:min-w-0"
                        >
                          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white text-xs font-bold text-slate-400 ring-1 ring-slate-200 group-hover/link:bg-green-50 group-hover/link:text-green-700">
                            {item.icon}
                          </span>
                          <span
                            className={`min-w-0 ${expanded ? "" : "lg:hidden"}`}
                          >
                            <span className="block truncate text-sm font-semibold leading-5">
                              {item.label}
                            </span>
                            <span className="sr-only">{item.description}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </nav>

        <div className="hidden border-t border-slate-200 p-4 lg:block">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
