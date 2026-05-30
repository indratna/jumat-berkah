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
      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
    >
      Auto-refresh {enabled ? "aktif" : "mati"}
    </button>
  );
}
