"use client";

import { useEffect, useState } from "react";

import { PAYMENT_WINDOW_HOURS } from "@/lib/payment-status";

type DeadlineState = {
  expired: boolean;
  label: string;
  deadlineLabel: string;
};

function buildDeadlineState(createdAtIso: string): DeadlineState | null {
  const createdAt = new Date(createdAtIso);

  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  const deadline = new Date(
    createdAt.getTime() + PAYMENT_WINDOW_HOURS * 60 * 60 * 1000,
  );
  const diff = deadline.getTime() - Date.now();
  const deadlineLabel = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(deadline);

  if (diff <= 0) {
    return {
      expired: true,
      label: "Perkiraan waktu pembayaran sudah lewat.",
      deadlineLabel,
    };
  }

  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    expired: false,
    label:
      hours > 0
        ? `Sekitar ${hours} jam ${minutes} menit lagi`
        : `Sekitar ${Math.max(minutes, 1)} menit lagi`,
    deadlineLabel,
  };
}

export function PaymentDeadlineCountdown({
  createdAtIso,
}: {
  createdAtIso: string;
}) {
  const [state, setState] = useState<DeadlineState | null>(null);

  useEffect(() => {
    const tick = () => setState(buildDeadlineState(createdAtIso));
    tick();

    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [createdAtIso]);

  return (
    <div className="min-h-[5.5rem] rounded-2xl border border-[color:var(--craft-line)] bg-[color:var(--craft-paper)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--craft-ink-soft)]">
        Perkiraan batas waktu bayar
      </p>
      <p
        role="status"
        aria-live="polite"
        className={`mt-1 text-sm font-bold ${
          state?.expired
            ? "text-[color:var(--craft-ink)]"
            : "text-[color:var(--craft-leaf)]"
        }`}
      >
        {state ? state.label : "Menghitung sisa waktu…"}
      </p>
      <p className="mt-1 text-xs leading-5 text-[color:var(--craft-ink-soft)]">
        {state
          ? `Perkiraan berakhir ${state.deadlineLabel} WIB. Batas resmi tampil di halaman QRIS Midtrans.`
          : "Batas resmi tampil di halaman QRIS Midtrans."}
      </p>
    </div>
  );
}