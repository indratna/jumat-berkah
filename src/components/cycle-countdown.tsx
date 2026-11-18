"use client";

import { useEffect, useMemo, useState } from "react";

import { type CountdownParts, getCountdownParts } from "@/lib/countdown";

type CycleCountdownProps = {
  deadlineAtIso: string;
  label?: string;
  deadlineLabel?: string;
  tone?: "public" | "admin";
};

const PLACEHOLDER_PARTS: CountdownParts = {
  days: "--",
  hours: "--",
  minutes: "--",
  seconds: "--",
  expired: false,
  totalSeconds: 0,
};

function formatDeadline(deadlineAtIso: string) {
  const date = new Date(deadlineAtIso);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function CycleCountdown({
  deadlineAtIso,
  label,
  deadlineLabel,
  tone = "public",
}: CycleCountdownProps) {
  const [state, setState] = useState<CountdownParts | null>(null);

  const hasValidDeadline = useMemo(
    () => !Number.isNaN(new Date(deadlineAtIso).getTime()),
    [deadlineAtIso],
  );

  useEffect(() => {
    if (!hasValidDeadline) {
      return;
    }

    const deadlineMs = new Date(deadlineAtIso).getTime();
    const tick = () => setState(getCountdownParts(deadlineMs, Date.now()));
    tick();

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [deadlineAtIso, hasValidDeadline]);

  const toneClass = useMemo(
    () =>
      tone === "admin"
        ? "border-slate-200 bg-white text-slate-950"
        : "border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] text-[color:var(--craft-ink)]",
    [tone],
  );

  const labelClass =
    tone === "admin" ? "text-slate-600" : "text-[color:var(--craft-ink-soft)]";

  const parts =
    hasValidDeadline && state ? state : PLACEHOLDER_PARTS;
  const expired = hasValidDeadline && (state?.expired ?? false);
  const formattedDeadline = formatDeadline(deadlineAtIso);
  const accessibleDeadline = deadlineLabel ?? formattedDeadline;

  return (
    <div>
      <p
        className={`mb-2 min-h-[1.1rem] text-xs font-semibold uppercase tracking-[0.14em] ${labelClass}`}
      >
        {expired ? "Waktu donasi siklus ini sudah habis" : label}
      </p>
      <p className="sr-only">
        {expired
          ? "Waktu donasi siklus ini sudah habis. Siklus baru dibuka setiap Jumat."
          : `Sisa waktu donasi${accessibleDeadline ? ` sampai ${accessibleDeadline}` : ""}. Hitungan diperbarui otomatis.`}
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {expired ? "Waktu donasi siklus ini sudah habis." : ""}
      </p>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-hidden="true"
      >
        {[
          { label: "Hari", value: parts.days },
          { label: "Jam", value: parts.hours },
          { label: "Menit", value: parts.minutes },
          { label: "Detik", value: parts.seconds },
        ].map((part) => (
          <div
            key={part.label}
            className={`min-h-[4.25rem] rounded-2xl border px-3 py-3 ${toneClass}`}
          >
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">
              {part.value}
            </p>
            <p
              className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${labelClass}`}
            >
              {part.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}