"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatRupiah } from "@/lib/format";
import {
  isLastOrderFresh,
  readLastOrder,
  type LastOrderSnapshot,
} from "@/lib/payment-status";

/**
 * Shows the most recent unpaid order after a refresh so the donor does not have
 * to remember the Order ID. Only the order id and amount are stored locally.
 */
export function ResumeDonationBanner() {
  const [snapshot, setSnapshot] = useState<LastOrderSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      try {
        const stored = readLastOrder(window.localStorage);
        setSnapshot(stored && isLastOrderFresh(stored) ? stored : null);
      } catch {
        setSnapshot(null);
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!snapshot) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[color:var(--craft-amber)]/60 bg-[color:var(--craft-amber-soft)] px-4 py-4">
      <p className="text-sm font-bold text-[color:var(--craft-ink)]">
        Ada donasi yang belum selesai.
      </p>
      <p className="mt-1 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        Order <span className="font-mono">{snapshot.orderId}</span> sebesar{" "}
        {formatRupiah(snapshot.amount)} masih menunggu pembayaran.
      </p>
      <Link
        href={`/donasi/status/${encodeURIComponent(snapshot.orderId)}`}
        className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
      >
        Lanjutkan donasi terakhir
      </Link>
    </div>
  );
}