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

type AdminSidebarProps = {
  expanded: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AdminSidebar({
  expanded,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Masuk: true,
    Keluar: true,
    Pengaturan: false,
  });

  return (
    <>
      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-63 bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-slate-950 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800">
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-green-700 text-sm font-bold text-white shadow-sm">
              JB
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.95rem] font-bold leading-5 text-slate-950 dark:text-slate-50">
                Jumat Berkah
              </p>
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                Admin dashboard
              </p>
            </div>
            <button
              type="button"
              onClick={onMobileClose}
              className="ml-auto grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Tutup menu navigasi"
            >
              ✕
            </button>
          </div>

          <nav
            aria-label="Navigasi admin"
            className="flex-1 overflow-y-auto px-3 py-4"
          >
            <div className="space-y-2">
              <Link
                href={dashboardNavItem.href}
                title={dashboardNavItem.description}
                onClick={onMobileClose}
                className="group/link flex min-h-11 items-center gap-2 rounded-md px-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 ring-1 ring-slate-200 group-hover/link:bg-green-50 group-hover/link:text-green-700 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                  {dashboardNavItem.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold leading-5">
                    {dashboardNavItem.label}
                  </span>
                </span>
              </Link>

              {adminNavGroups.map((group) => {
                const isOpen = openGroups[group.label] ?? true;
                return (
                  <section key={group.label}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((current) => ({
                          ...current,
                          [group.label]: !isOpen,
                        }))
                      }
                      className="group flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-expanded={isOpen}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-100 text-xs text-slate-500 group-hover:bg-green-50 group-hover:text-green-700 dark:bg-slate-800 dark:text-slate-400">
                        {group.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-left">
                        {group.label}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="mt-1 grid grid-cols-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            title={item.description}
                            onClick={onMobileClose}
                            className="group/link flex min-h-10 items-center gap-2 rounded-md px-2 text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white text-xs font-bold text-slate-400 ring-1 ring-slate-200 group-hover/link:bg-green-50 group-hover/link:text-green-700 dark:bg-slate-900 dark:text-slate-500 dark:ring-slate-700">
                              {item.icon}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold leading-5">
                                {item.label}
                              </span>
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

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:border-r lg:border-slate-200 lg:bg-white lg:dark:border-slate-800 lg:dark:bg-slate-950 ${
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

          <nav aria-label="Navigasi admin" className="flex-1 px-3 py-4">
            <div className="space-y-2">
              <Link
                href={dashboardNavItem.href}
                title={dashboardNavItem.description}
                className="group/link flex min-h-11 items-center gap-2 rounded-md px-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 ring-1 ring-slate-200 group-hover/link:bg-green-50 group-hover/link:text-green-700">
                  {dashboardNavItem.icon}
                </span>
                <span className={`min-w-0 ${expanded ? "" : "lg:hidden"}`}>
                  <span className="block truncate text-sm font-bold leading-5">
                    {dashboardNavItem.label}
                  </span>
                  <span className="sr-only">
                    {dashboardNavItem.description}
                  </span>
                </span>
              </Link>

              {adminNavGroups.map((group) => {
                const isOpen = openGroups[group.label] ?? true;
                return (
                  <section key={group.label}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((current) => ({
                          ...current,
                          [group.label]: !isOpen,
                        }))
                      }
                      className="group flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
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
                      <div className="mt-1 grid grid-cols-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            title={item.description}
                            className="group/link flex min-h-10 items-center gap-2 rounded-md px-2 text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
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
                              <span className="sr-only">
                                {item.description}
                              </span>
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

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
