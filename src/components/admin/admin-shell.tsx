"use client";

import { useEffect, useState } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { NotificationBell } from "@/components/admin/notification-bell";
import { ThemeToggle } from "@/components/admin/theme-toggle";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

type AdminShellProps = {
  children: React.ReactNode;
  notifications: {
    items: NotificationItem[];
    unreadCount: number;
  };
};

const expandedWidth = "252px";
const collapsedWidth = "84px";

export function AdminShell({ children, notifications }: AdminShellProps) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      expanded ? expandedWidth : collapsedWidth,
    );
  }, [expanded]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:pl-(--admin-sidebar-width,252px)">
      <AdminSidebar expanded={expanded} />

      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="hidden size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:grid"
                aria-label={
                  expanded
                    ? "Tampilkan logo sidebar saja"
                    : "Tampilkan nama menu sidebar"
                }
                title={expanded ? "Ciutkan sidebar" : "Lebarkan sidebar"}
              >
                {expanded ? "⇤" : "⇥"}
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Jumat Berkah Karyo
                </p>
                <p className="truncate text-sm font-bold text-slate-950 dark:text-slate-50 sm:text-base">
                  Panel operasional donasi dan laporan
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <ThemeToggle />
              <NotificationBell
                items={notifications.items}
                unreadCount={notifications.unreadCount}
              />
              <div className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-green-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-green-300">
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
