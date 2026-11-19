"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  PRESET_DONATION_AMOUNTS,
  formatAmountDigits,
  isPresetDonationAmount,
  parseDonationAmount,
  validateDonationAmount,
} from "@/lib/donation-amount";
import { formatRupiah } from "@/lib/format";
import {
  getPaymentRedirectStorageKey,
  writeLastOrder,
} from "@/lib/payment-status";

import {
  canUseSnapPopup,
  resolveFallbackRedirect,
  resolveSnapCallbackDestination,
} from "./snap-checkout";
import type { DonationPaymentHandoff, SnapWindow } from "./snap-types";

type DonationResponse = {
  orderId: string;
  amount: number;
  status: string;
  payment?: DonationPaymentHandoff;
};

type ErrorResponse = {
  errors?: Record<string, string>;
};

function rememberPaymentRedirect(orderId: string, redirectUrl: string) {
  try {
    window.sessionStorage.setItem(
      getPaymentRedirectStorageKey(orderId),
      redirectUrl,
    );
  } catch {
    // Storage can be unavailable in private mode; the status page still works.
  }
}

function rememberLastOrder(orderId: string, amount: number) {
  try {
    writeLastOrder(window.localStorage, { orderId, amount });
  } catch {
    // Storage can be unavailable in private mode; the status page still works.
  }
}

export function DonationForm({
  donor,
  authBanner,
  initialAmount = null,
}: {
  donor?: { name: string | null; email: string } | null;
  authBanner?: ReactNode;
  initialAmount?: number | null;
}) {
  const [amount, setAmount] = useState(() =>
    formatAmountDigits(initialAmount ?? 50_000),
  );
  const [donorName, setDonorName] = useState(donor?.name ?? "");
  const [donorEmail, setDonorEmail] = useState(donor?.email ?? "");
  const [donorPhone, setDonorPhone] = useState("");
  const [message, setMessage] = useState("");
  const [whatsappReminderOptIn, setWhatsappReminderOptIn] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showNamePublicly, setShowNamePublicly] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DonationResponse | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  const parsedAmount = parseDonationAmount(amount);
  const amountError = errors.amount ?? null;
  const formError = errors.form ?? errors.payment ?? null;

  function clearAmountError() {
    setErrors((previous) => {
      if (!previous.amount) {
        return previous;
      }
      const next = { ...previous };
      delete next.amount;
      return next;
    });
  }

  function handleAmountChange(value: string) {
    setAmount(formatAmountDigits(value));
    clearAmountError();
  }

  function handleAmountBlur() {
    const validationError = validateDonationAmount(amount);
    if (validationError) {
      setErrors((previous) => ({ ...previous, amount: validationError }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Snap can stay open while the request resolves; never create two orders.
    if (submittingRef.current) {
      return;
    }

    const amountValidation = validateDonationAmount(amount);
    if (amountValidation || parsedAmount === null) {
      setErrors((previous) => ({
        ...previous,
        amount: amountValidation ?? "Masukkan nominal donasi lebih dulu.",
      }));
      amountInputRef.current?.focus();
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrors({});
    setResult(null);

    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName,
          donorEmail,
          donorPhone,
          whatsappReminderOptIn,
          isAnonymous,
          showNamePublicly,
          amount: parsedAmount,
          message,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response
          .json()
          .catch(() => ({}))) as ErrorResponse;
        setErrors(
          errorBody.errors ?? {
            form: "Donasi belum bisa diproses. Coba lagi sebentar.",
          },
        );
        submittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      const donation = (await response.json()) as DonationResponse;

      rememberLastOrder(donation.orderId, donation.amount);

      if (donation.payment?.redirectUrl) {
        rememberPaymentRedirect(donation.orderId, donation.payment.redirectUrl);
      }

      if (canUseSnapPopup(donation.payment, window)) {
        const snapWindow = window as SnapWindow;
        const snapToken = donation.payment!.snapToken;

        snapWindow.snap?.pay(snapToken, {
          onSuccess: () => {
            window.location.assign(
              resolveSnapCallbackDestination({
                orderId: donation.orderId,
                callback: "success",
              }),
            );
          },
          onPending: () => {
            window.location.assign(
              resolveSnapCallbackDestination({
                orderId: donation.orderId,
                callback: "pending",
              }),
            );
          },
          onError: () => {
            window.location.assign(
              resolveSnapCallbackDestination({
                orderId: donation.orderId,
                callback: "error",
              }),
            );
          },
          onClose: () => {
            window.location.assign(
              resolveSnapCallbackDestination({
                orderId: donation.orderId,
                callback: "close",
              }),
            );
          },
        });
        return;
      }

      if (donation.payment?.redirectUrl) {
        window.location.assign(
          resolveFallbackRedirect({
            payment: donation.payment,
            orderId: donation.orderId,
          }),
        );
        return;
      }

      setResult(donation);
      submittingRef.current = false;
      setIsSubmitting(false);
    } catch {
      setErrors({
        form: "Koneksi terputus. Periksa internet Anda, lalu coba lagi.",
      });
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="craft-card-strong space-y-6 p-5 sm:p-6 lg:p-7"
    >
      <div className="space-y-3">
        <span className="craft-pill">Isi data singkat</span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[color:var(--craft-ink)] sm:text-[2rem]">
            Lanjutkan ke pembayaran QRIS.
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            Email dan WhatsApp opsional. Nama publik bisa Anda pilih sendiri,
            dan pembayaran tidak perlu login.
          </p>
        </div>
      </div>

      <div>
        <fieldset>
          <legend className="text-sm font-semibold text-[color:var(--craft-ink)]">
            Nominal donasi
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_DONATION_AMOUNTS.map((presetAmount) => {
              const isActive = parsedAmount === presetAmount;

              return (
                <button
                  key={presetAmount}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setAmount(formatAmountDigits(presetAmount));
                    clearAmountError();
                  }}
                  className={`min-h-11 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-[color:var(--craft-leaf)] bg-[color:var(--craft-leaf)] text-[color:var(--craft-cream)]"
                      : "border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
                  }`}
                >
                  {formatRupiah(presetAmount)}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={
                parsedAmount !== null && !isPresetDonationAmount(parsedAmount)
              }
              onClick={() => amountInputRef.current?.focus()}
              className={`min-h-11 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                parsedAmount !== null && !isPresetDonationAmount(parsedAmount)
                  ? "border-[color:var(--craft-leaf)] bg-[color:var(--craft-leaf)] text-[color:var(--craft-cream)]"
                  : "border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
              }`}
            >
              Nominal lain
            </button>
          </div>
        </fieldset>

        <div className="mt-3">
          <label
            htmlFor="amount"
            className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--craft-ink-soft)]"
          >
            Atau isi nominal lain
          </label>
          <div
            className={`mt-2 flex min-h-12 items-center rounded-2xl border bg-[color:var(--craft-paper)] px-4 focus-within:ring-2 focus-within:ring-[color:var(--craft-amber)]/30 ${
              amountError
                ? "border-red-700"
                : "border-[color:var(--craft-line-strong)] focus-within:border-[color:var(--craft-amber)]"
            }`}
          >
            <span className="text-sm font-semibold text-[color:var(--craft-ink-soft)]">
              Rp
            </span>
            <input
              ref={amountInputRef}
              id="amount"
              name="amount"
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              onChange={(event) => handleAmountChange(event.target.value)}
              onBlur={handleAmountBlur}
              aria-invalid={amountError ? true : undefined}
              aria-describedby={amountError ? "amount-error" : "amount-hint"}
              className="min-h-12 w-full bg-transparent px-2 text-base font-semibold text-[color:var(--craft-ink)] outline-none numeric"
              placeholder="25.000"
            />
          </div>
          {amountError ? (
            <p
              id="amount-error"
              role="alert"
              className="mt-2 text-sm font-medium text-red-700"
            >
              {amountError}
            </p>
          ) : (
            <p
              id="amount-hint"
              className="mt-2 text-xs text-[color:var(--craft-ink-soft)]"
            >
              Nominal minimal Rp1.000.
            </p>
          )}
        </div>
      </div>

      {authBanner ? <div>{authBanner}</div> : null}

      <div>
        <label
          className="text-sm font-semibold text-[color:var(--craft-ink)]"
          htmlFor="donorName"
        >
          Nama donatur
        </label>
        <input
          id="donorName"
          name="donorName"
          autoComplete="name"
          value={donorName}
          onChange={(event) => setDonorName(event.target.value)}
          aria-describedby="donor-name-hint"
          className="field mt-2"
          placeholder="Nama Anda..."
        />
        <p
          id="donor-name-hint"
          className="mt-1 text-xs text-[color:var(--craft-ink-soft)]"
        >
          Opsional. Jika kosong atau memilih Anonim, donasi tampil sebagai
          Anonim.
        </p>
        {errors.donorName ? (
          <p role="alert" className="mt-2 text-sm font-medium text-red-700">
            {errors.donorName}
          </p>
        ) : null}
      </div>

      <fieldset className="rounded-2xl border border-[color:var(--craft-line)] bg-[color:var(--craft-paper)] p-4">
        <legend className="px-1 text-sm font-semibold text-[color:var(--craft-ink)]">
          Nama di laporan publik
        </legend>
        <div className="mt-2 space-y-1">
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-[color:var(--craft-ink)]">
            <input
              type="radio"
              name="visibility"
              checked={!isAnonymous && showNamePublicly}
              onChange={() => {
                setIsAnonymous(false);
                setShowNamePublicly(true);
              }}
              className="size-4 accent-[#1f5d3f]"
            />
            Tampilkan nama saya
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-[color:var(--craft-ink)]">
            <input
              type="radio"
              name="visibility"
              checked={isAnonymous || !showNamePublicly}
              onChange={() => {
                setIsAnonymous(true);
                setShowNamePublicly(false);
              }}
              className="size-4 accent-[#1f5d3f]"
            />
            Anonim
          </label>
        </div>
        <p className="mt-2 text-xs leading-5 text-[color:var(--craft-ink-soft)]">
          Jika memilih Anonim, donasi tampil sebagai “Anonim” di laporan publik.
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
            htmlFor="donorEmail"
          >
            Email opsional
          </label>
          <input
            id="donorEmail"
            name="donorEmail"
            type="email"
            autoComplete="email"
            spellCheck={false}
            value={donorEmail}
            onChange={(event) => setDonorEmail(event.target.value)}
            aria-describedby="contact-hint"
            className="field mt-2"
            placeholder="nama@email.com..."
          />
          {errors.donorEmail ? (
            <p role="alert" className="mt-2 text-sm font-medium text-red-700">
              {errors.donorEmail}
            </p>
          ) : null}
        </div>
        <div>
          <label
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
            htmlFor="donorPhone"
          >
            WhatsApp opsional
          </label>
          <input
            id="donorPhone"
            name="donorPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={donorPhone}
            onChange={(event) => setDonorPhone(event.target.value)}
            aria-describedby="contact-hint"
            className="field mt-2"
            placeholder="08123456789..."
          />
        </div>
      </div>

      <p
        id="contact-hint"
        className="text-xs leading-5 text-[color:var(--craft-ink-soft)]"
      >
        Email atau WhatsApp opsional. Hanya dipakai untuk bukti donasi dan tidak
        pernah ditampilkan di laporan publik.
      </p>

      <details className="group rounded-2xl border border-[color:var(--craft-line)] bg-[color:var(--craft-paper)] p-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[color:var(--craft-ink)] [&::-webkit-details-marker]:hidden">
          <span>
            Pesan, doa, dan pengingat WhatsApp{" "}
            <span className="font-normal text-[color:var(--craft-ink-soft)]">
              (opsional)
            </span>
          </span>
          <span
            aria-hidden="true"
            className="text-[color:var(--craft-ink-soft)] transition-transform group-open:rotate-180 motion-reduce:transition-none"
          >
            ▾
          </span>
        </summary>

        <div className="mt-4 space-y-4">
          <div>
            <label
              className="text-sm font-semibold text-[color:var(--craft-ink)]"
              htmlFor="message"
            >
              Pesan atau doa
            </label>
            <textarea
              id="message"
              name="message"
              autoComplete="off"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="field mt-2 min-h-24"
              placeholder="Semoga berkah untuk semua..."
            />
          </div>

          <label className="flex min-h-11 items-start gap-3 text-sm font-medium text-[color:var(--craft-ink)]">
            <input
              type="checkbox"
              checked={whatsappReminderOptIn}
              onChange={(event) =>
                setWhatsappReminderOptIn(event.target.checked)
              }
              className="mt-1 size-4 accent-[#1f5d3f]"
            />
            <span>
              Saya bersedia menerima pengingat donasi Jumat Berkah via WhatsApp.
              Persetujuan hanya disimpan jika nomor WhatsApp diisi. Untuk
              berhenti, balas pesan WhatsApp dengan kata STOP saat fitur
              pengingat sudah aktif.
            </span>
          </label>
        </div>
      </details>

      {formError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {formError}
        </p>
      ) : null}

      <div className="rounded-2xl bg-[color:var(--craft-paper)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--craft-ink-soft)]">
          Total donasi
        </p>
        <p
          aria-live="polite"
          className="craft-num mt-1 text-2xl text-[color:var(--craft-ink)]"
        >
          {parsedAmount ? formatRupiah(parsedAmount) : "Belum diisi"}
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] transition hover:bg-[color:var(--craft-leaf-strong)] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? (
          <>
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
            />
            Menyiapkan pembayaran...
          </>
        ) : (
          "Donasi Sekarang"
        )}
      </button>

      <p className="text-center text-xs leading-5 text-[color:var(--craft-ink-soft)]">
        Dengan melanjutkan, Anda akan diarahkan ke halaman QRIS Midtrans.
      </p>

      {result ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-bold">Donasi menunggu pembayaran.</p>
          <p className="mt-1 leading-6">
            Order <strong>{result.orderId}</strong> sebesar{" "}
            <strong>{formatRupiah(result.amount)}</strong> sudah tercatat. Jika
            halaman pembayaran tidak terbuka, lanjutkan dari halaman status.
          </p>
          <Link
            href={`/donasi/status/${result.orderId}`}
            className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
          >
            Buka status donasi
          </Link>
        </div>
      ) : null}
    </form>
  );
}