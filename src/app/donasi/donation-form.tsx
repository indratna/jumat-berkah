"use client";

import { FormEvent, useState } from "react";

type DonationResponse = {
  orderId: string;
  amount: number;
  status: string;
  payment?: {
    redirectUrl: string;
    snapToken: string;
  };
};

type ErrorResponse = {
  errors?: Record<string, string>;
};

const presetAmounts = [10_000, 25_000, 50_000, 100_000];

export function DonationForm({
  donor,
}: {
  donor?: { name: string | null; email: string } | null;
}) {
  const [amount, setAmount] = useState("50000");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setResult(null);

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
        amount: Number(amount),
        message,
      }),
    });

    if (!response.ok) {
      const errorBody = (await response
        .json()
        .catch(() => ({}))) as ErrorResponse;
      setErrors(errorBody.errors ?? { form: "Donasi belum bisa diproses." });
      setIsSubmitting(false);
      return;
    }

    const donation = (await response.json()) as DonationResponse;

    if (donation.payment?.redirectUrl) {
      window.location.href = donation.payment.redirectUrl;
      return;
    }

    setResult(donation);
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="panel space-y-5 p-5 sm:p-6">
      {donor ? (
        <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-900">
          Masuk sebagai <strong>{donor.name ?? donor.email}</strong>. Donasi ini
          akan masuk ke riwayat akun Anda.
        </div>
      ) : null}
      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="amount"
        >
          Nominal donasi
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presetAmounts.map((presetAmount) => (
            <button
              key={presetAmount}
              type="button"
              onClick={() => setAmount(String(presetAmount))}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${amount === String(presetAmount) ? "border-green-700 bg-green-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
            >
              {formatRupiah(presetAmount)}
            </button>
          ))}
        </div>
        <input
          id="amount"
          name="amount"
          inputMode="numeric"
          min="1000"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="field mt-3 numeric"
          required
        />
        {errors.amount ? (
          <p className="mt-2 text-sm text-red-600">{errors.amount}</p>
        ) : null}
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-800">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
          className="size-4 accent-green-700"
        />
        Donasi sebagai Anonim
      </label>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
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
          disabled={isAnonymous}
          className="field mt-2 disabled:bg-slate-100"
          placeholder="Nama Anda…"
        />
        {errors.donorName ? (
          <p className="mt-2 text-sm text-red-600">{errors.donorName}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="text-sm font-semibold text-slate-800"
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
            className="field mt-2"
            placeholder="nama@email.com…"
          />
          {errors.donorEmail ? (
            <p className="mt-2 text-sm text-red-600">{errors.donorEmail}</p>
          ) : null}
        </div>
        <div>
          <label
            className="text-sm font-semibold text-slate-800"
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
            className="field mt-2"
            placeholder="08123456789…"
          />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={whatsappReminderOptIn}
          onChange={(event) => setWhatsappReminderOptIn(event.target.checked)}
          className="mt-1 size-4 accent-green-700"
        />
        <span>
          Saya bersedia menerima pengingat donasi Jumat Berkah via WhatsApp.
          Consent hanya disimpan jika nomor WhatsApp diisi. Untuk berhenti,
          balas pesan WhatsApp dengan kata STOP saat fitur pengingat sudah
          aktif.
        </span>
      </label>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="message"
        >
          Pesan atau doa opsional
        </label>
        <textarea
          id="message"
          name="message"
          autoComplete="off"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="field mt-2 min-h-28"
          placeholder="Semoga berkah untuk semua…"
        />
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={showNamePublicly}
          onChange={(event) => setShowNamePublicly(event.target.checked)}
          disabled={isAnonymous}
          className="size-4 accent-green-700"
        />
        Tampilkan nama saya di laporan publik
      </label>

      {errors.form ? (
        <p className="text-sm text-red-600">{errors.form}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Menyimpan donasi…" : "Lanjutkan Donasi"}
      </button>

      {result ? (
        <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-900">
          Donasi pending tersimpan dengan order ID{" "}
          <strong>{result.orderId}</strong> sebesar{" "}
          <strong>{formatRupiah(result.amount)}</strong>. Jika halaman
          pembayaran tidak terbuka, cek status donasi dari halaman status.
        </div>
      ) : null}
    </form>
  );
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
