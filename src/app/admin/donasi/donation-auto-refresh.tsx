"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const refreshMs = 10000;

export function DonationAutoRefresh() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const id = window.setInterval(() => {
      router.refresh();
    }, refreshMs);

    return () => window.clearInterval(id);
  }, [enabled, router]);

  return (
    <button
      type="button"
      onClick={() => setEnabled((value) => !value)}
      className={`inline-flex h-10 min-w-12 items-center justify-center rounded-xl border px-3 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:outline-emerald-600"
          : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:outline-rose-600"
      }`}
      aria-label={enabled ? "Matikan auto refresh" : "Aktifkan auto refresh"}
      title={enabled ? "Auto-refresh aktif" : "Auto-refresh mati"}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 0 1-15.5 6.2" />
        <path d="M3 12A9 9 0 0 1 18.5 5.8" />
        <path d="M18 2v4h4" />
        <path d="M6 22v-4H2" />
      </svg>
    </button>
  );
}
