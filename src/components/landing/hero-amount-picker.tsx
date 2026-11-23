"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import {
  PRESET_DONATION_AMOUNTS,
  buildDonationHref,
  formatAmountDigits,
  parseDonationAmount,
  validateDonationAmount,
} from "@/lib/donation-amount";
import { formatRupiah } from "@/lib/format";

export function HeroAmountPicker() {
  const [amount, setAmount] = useState(() => formatAmountDigits(50_000));
  const [isCustom, setIsCustom] = useState(false);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsedAmount = parseDonationAmount(amount);
  const error = showError ? validateDonationAmount(amount) : null;

  function selectPreset(preset: number) {
    setAmount(formatAmountDigits(preset));
    setIsCustom(false);
    setShowError(false);
  }

  function selectCustom() {
    setIsCustom(true);
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  return (
    <div className="mt-6">
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--craft-ink-soft)]">
          Pilih nominal cepat
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_DONATION_AMOUNTS.map((preset) => {
            const isActive = !isCustom && parsedAmount === preset;

            return (
              <button
                key={preset}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectPreset(preset)}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition ${
                  isActive
                    ? "border-[color:var(--craft-leaf)] bg-[color:var(--craft-leaf)] text-[color:var(--craft-cream)]"
                    : "border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
                }`}
              >
                {formatRupiah(preset)}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={isCustom}
            aria-expanded={isCustom}
            onClick={selectCustom}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition ${
              isCustom
                ? "border-[color:var(--craft-leaf)] bg-[color:var(--craft-leaf)] text-[color:var(--craft-cream)]"
                : "border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
            }`}
          >
            Nominal lain
          </button>
        </div>
      </fieldset>

      {isCustom ? (
        <div className="mt-4">
          <label
            htmlFor="hero-custom-amount"
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
          >
            Nominal donasi
          </label>
          <div className="mt-2 flex min-h-12 items-center rounded-2xl border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-4 focus-within:border-[color:var(--craft-amber)] focus-within:ring-2 focus-within:ring-[color:var(--craft-amber)]/30">
            <span className="text-sm font-semibold text-[color:var(--craft-ink-soft)]">
              Rp
            </span>
            <input
              ref={inputRef}
              id="hero-custom-amount"
              name="nominal"
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              onChange={(event) =>
                setAmount(formatAmountDigits(event.target.value))
              }
              onBlur={() => setShowError(true)}
              aria-invalid={error ? true : undefined}
              aria-describedby={
                error ? "hero-amount-error" : "hero-amount-hint"
              }
              className="min-h-12 w-full bg-transparent px-2 text-base font-semibold text-[color:var(--craft-ink)] outline-none numeric"
              placeholder="25.000"
            />
          </div>
          {error ? (
            <p
              id="hero-amount-error"
              role="alert"
              className="mt-2 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          ) : (
            <p
              id="hero-amount-hint"
              className="mt-2 text-xs text-[color:var(--craft-ink-soft)]"
            >
              Minimal donasi Rp1.000.
            </p>
          )}
        </div>
      ) : null}

      <div
        id="hero-cta"
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {parsedAmount && !error ? (
          <Link
            href={buildDonationHref(parsedAmount)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--craft-leaf)] px-6 text-sm font-bold text-[color:var(--craft-cream)] transition hover:bg-[color:var(--craft-leaf-strong)]"
          >
            Donasi {formatRupiah(parsedAmount)}
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-slate-200 px-6 text-sm font-bold text-slate-700"
          >
            Donasi Sekarang
          </button>
        )}
        <Link
          href="/laporan"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[color:var(--craft-ink)] underline decoration-[color:var(--craft-amber)] decoration-2 underline-offset-4 hover:decoration-[color:var(--craft-leaf)]"
        >
          Lihat laporan transparansi
        </Link>
      </div>
    </div>
  );
}