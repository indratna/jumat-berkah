"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { WeeklyTargetForm } from "./weekly-target-form";

type Props = {
  cycleStart: string;
  cycleEnd: string;
  initialTargetAmount: number | null;
  initialNote: string | null;
};

export function WeeklyTargetModal({
  cycleStart,
  cycleEnd,
  initialTargetAmount,
  initialNote,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-center font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
      >
        Atur Target Siklus
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-80 grid place-items-center overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="weekly-target-modal-title"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                      Target Siklus
                    </p>
                    <h2
                      id="weekly-target-modal-title"
                      className="mt-2 text-xl font-bold text-slate-950"
                    >
                      Atur Target Siklus
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Tutup popup target"
                    className="grid size-10 place-items-center rounded-full border border-slate-200 text-lg font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    ×
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <WeeklyTargetForm
                    cycleStart={cycleStart}
                    cycleEnd={cycleEnd}
                    initialTargetAmount={initialTargetAmount}
                    initialNote={initialNote}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
