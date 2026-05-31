"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

type NotificationApiItem = Omit<NotificationItem, "readAt" | "createdAt"> & {
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell({
  items: initialItems,
  unreadCount,
}: {
  items: NotificationItem[];
  unreadCount: number;
}) {
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(unreadCount);
  const [isPending, startTransition] = useTransition();
  const markedReadRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchNotifications() {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      try {
        const response = await fetch("/api/admin/notifications", {
          cache: "no-store",
        });
        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as {
          items: NotificationApiItem[];
          unreadCount: number;
        };

        if (cancelled) {
          return;
        }

        setItems(
          data.items.map((item) => ({
            ...item,
            readAt: item.readAt ? new Date(item.readAt) : null,
            createdAt: new Date(item.createdAt),
          })),
        );
        if (!markedReadRef.current) {
          setCount(data.unreadCount);
        }
      } catch {
        // Network error; ignore until next tick.
      }
    }

    const interval = window.setInterval(fetchNotifications, 30_000);
    document.addEventListener("visibilitychange", fetchNotifications);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchNotifications);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function openPanel() {
    setOpen((value) => !value);
    if (count > 0) {
      markedReadRef.current = true;
      startTransition(async () => {
        await fetch("/api/admin/notifications/read", { method: "PATCH" });
        setCount(0);
      });
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={openPanel}
        className="relative grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label="Buka notifikasi admin"
      >
        🔔
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[0.65rem] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-[70] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-bold text-slate-950 dark:text-slate-50">
              Notifikasi
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isPending
                ? "Menandai sudah dibaca..."
                : "Donasi masuk dan terbayar"}
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-slate-950 dark:text-slate-50">
                      {item.title}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {getNotificationTypeLabel(item.type)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {item.body}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatNotificationDate(item.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                Belum ada notifikasi.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatNotificationDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function getNotificationTypeLabel(type: string) {
  if (type === "donation.created") {
    return "pending";
  }

  if (type === "donation.settlement") {
    return "settlement";
  }

  return "info";
}
