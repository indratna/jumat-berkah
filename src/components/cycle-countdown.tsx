"use client";

import { useEffect, useMemo, useState } from "react";

type CycleCountdownProps = {
  deadlineAtIso: string;
  label?: string;
  tone?: "public" | "admin";
};

type CountdownState = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const ZERO_STATE: CountdownState = {
  days: "00",
  hours: "00",
  minutes: "00",
  seconds: "00",
};

function getCountdownState(deadlineAtIso: string): CountdownState {
  const diff = Math.max(new Date(deadlineAtIso).getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function CycleCountdown({
  deadlineAtIso,
  label,
  tone = "public",
}: CycleCountdownProps) {
  const [state, setState] = useState<CountdownState>(ZERO_STATE);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setState(getCountdownState(deadlineAtIso));
    }, 0);
    const timer = window.setInterval(() => {
      setState(getCountdownState(deadlineAtIso));
    }, 1000);
    return () => {
      window.clearTimeout(syncTimer);
      window.clearInterval(timer);
    };
  }, [deadlineAtIso]);

  const toneClass = useMemo(
    () =>
      tone === "admin"
        ? "border-slate-200 bg-white text-slate-950"
        : "border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] text-[color:var(--craft-ink)]",
    [tone],
  );

  const labelClass =
    tone === "admin" ? "text-slate-500" : "text-[color:var(--craft-ink-soft)]";

  const parts = state;

  return (
    <div>
      {label ? (
        <p
          className={`mb-2 text-xs font-semibold uppercase tracking-[0.14em] ${labelClass}`}
        >
          {label}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="off">
        {[
          { label: "Hari", value: parts.days },
          { label: "Jam", value: parts.hours },
          { label: "Menit", value: parts.minutes },
          { label: "Detik", value: parts.seconds },
        ].map((part) => (
          <div
            key={part.label}
            className={`rounded-2xl border px-3 py-3 ${toneClass}`}
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
