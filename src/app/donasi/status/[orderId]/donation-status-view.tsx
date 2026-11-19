"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { PaymentDeadlineCountdown } from "@/components/payment-deadline-countdown";
import { formatRupiah } from "@/lib/format";
import {
  getPaymentRedirectStorageKey,
  isFinalDonationStatus,
  resolveDonationStatusTone,
  type DonationStatusTone,
} from "@/lib/payment-status";

type DonationSnapshot = {
  orderId: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

type DonationStatusViewProps = {
  initialSnapshot: DonationSnapshot;
  receiptName: string;
};

const POLL_INTERVAL_MS = 10_000;

const toneStyles: Record<
  DonationStatusTone,
  { badge: string; ring: string; label: string }
> = {
  waiting: {
    badge: "bg-[color:var(--craft-amber-soft)] text-[#7a4a14]",
    ring: "border-[color:var(--craft-amber)]/50",
    label: "Menunggu pembayaran",
  },
  success: {
    badge: "bg-emerald-100 text-emerald-900",
    ring: "border-emerald-300",
    label: "Pembayaran berhasil",
  },
  failed: {
    badge: "bg-red-100 text-red-800",
    ring: "border-red-300",
    label: "Pembayaran gagal",
  },
  expired: {
    badge: "bg-[color:var(--craft-paper)] text-[color:var(--craft-ink)]",
    ring: "border-[color:var(--craft-line-strong)]",
    label: "Pembayaran kedaluwarsa",
  },
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function getStatusCopy(status: string, amount: number) {
  if (status === "settlement") {
    return {
      title: "Pembayaran berhasil. Terima kasih.",
      description: `Donasi ${formatRupiah(amount)} sudah kami terima dan akan masuk laporan pemasukan program.`,
    };
  }

  if (status === "expire") {
    return {
      title: "Waktu pembayaran sudah habis.",
      description:
        "Donasi ini tidak jadi masuk karena kode QRIS kedaluwarsa. Anda bisa membuat donasi baru kapan saja.",
    };
  }

  if (["cancel", "deny", "failure", "refund"].includes(status)) {
    return {
      title: "Pembayaran belum berhasil.",
      description:
        "Donasi ini tidak dihitung sebagai pemasukan. Silakan buat donasi baru jika masih ingin berdonasi.",
    };
  }

  return {
    title: "Menunggu pembayaran QRIS.",
    description:
      "Donasi sudah tercatat. Status diperbarui otomatis begitu pembayaran diterima, tanpa perlu memuat ulang halaman.",
  };
}

export function DonationStatusView({
  initialSnapshot,
  receiptName,
}: DonationStatusViewProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [pollError, setPollError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const previousStatus = useRef(initialSnapshot.status);
  const inFlight = useRef(false);

  const tone = resolveDonationStatusTone(snapshot.status);
  const isFinal = isFinalDonationStatus(snapshot.status);
  const copy = getStatusCopy(snapshot.status, snapshot.amount);
  const styles = toneStyles[tone];

  useEffect(() => {
    // Defer the read to after paint; sessionStorage is unavailable during SSR
    // and writing state inside the effect body would force a cascading render.
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      try {
        setPaymentUrl(
          window.sessionStorage.getItem(
            getPaymentRedirectStorageKey(initialSnapshot.orderId),
          ),
        );
      } catch {
        setPaymentUrl(null);
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [initialSnapshot.orderId]);

  const checkStatus = useCallback(async () => {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setIsChecking(true);

    try {
      const response = await fetch(
        `/api/donations/${encodeURIComponent(initialSnapshot.orderId)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`Status request failed: ${response.status}`);
      }

      const data = (await response.json()) as DonationSnapshot;
      setSnapshot((previous) => ({
        ...previous,
        amount: data.amount ?? previous.amount,
        status: data.status,
        paidAt: data.paidAt,
        createdAt: data.createdAt ?? previous.createdAt,
      }));
      setPollError(false);
    } catch {
      setPollError(true);
    } finally {
      inFlight.current = false;
      setIsChecking(false);
    }
  }, [initialSnapshot.orderId]);

  // Poll while the payment is still open so the donor sees the result live.
  useEffect(() => {
    if (isFinal) {
      return;
    }

    const tick = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void checkStatus();
    };

    // Catch up immediately when the donor returns to the tab.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    const timer = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkStatus, isFinal]);

  // Announce only real status changes, never each poll.
  useEffect(() => {
    if (previousStatus.current === snapshot.status) {
      return;
    }

    previousStatus.current = snapshot.status;
    setAnnouncement(`Status donasi diperbarui: ${getStatusCopy(snapshot.status, snapshot.amount).title}`);
  }, [snapshot.status, snapshot.amount]);

  const createdAtLabel = formatDateTime(snapshot.createdAt);
  const paidAtLabel = snapshot.paidAt ? formatDateTime(snapshot.paidAt) : null;

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <section
        className={`overflow-hidden rounded-[1.25rem] border bg-[color:var(--craft-cream-strong)] shadow-[0_18px_32px_-24px_rgba(15,42,31,0.22)] ${styles.ring}`}
        aria-labelledby="status-title"
      >
        <div className="space-y-3 border-b border-[color:var(--craft-line)] px-5 py-6 sm:px-8">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.18em] ${styles.badge}`}
          >
            {styles.label}
          </span>
          <h1
            id="status-title"
            className="text-2xl font-bold leading-tight sm:text-3xl"
          >
            {copy.title}
          </h1>
          <p className="text-sm leading-7 text-[color:var(--craft-ink-soft)]">
            {copy.description}
          </p>

          {!isFinal ? (
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--craft-ink-soft)]">
              <span
                aria-hidden="true"
                className="size-2 animate-pulse rounded-full bg-[color:var(--craft-leaf)] motion-reduce:animate-none"
              />
              {isChecking
                ? "Memeriksa status pembayaran..."
                : "Status dicek otomatis setiap 10 detik."}
            </p>
          ) : null}
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-8">
          <div className="rounded-2xl bg-[color:var(--craft-paper)] px-4 py-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[color:var(--craft-ink-soft)]">
              Nominal donasi
            </p>
            <p className="craft-num mt-1 text-3xl text-[color:var(--craft-ink)] sm:text-4xl">
              {formatRupiah(snapshot.amount)}
            </p>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Order ID" value={snapshot.orderId} mono />
            <Detail
              label="ID status Midtrans"
              value={snapshot.status}
              mono
            />
            {createdAtLabel ? (
              <Detail label="Dibuat" value={`${createdAtLabel} WIB`} />
            ) : null}
            {paidAtLabel ? (
              <Detail label="Dibayar" value={`${paidAtLabel} WIB`} />
            ) : null}
          </dl>

          {tone === "waiting" ? (
            <PaymentDeadlineCountdown createdAtIso={snapshot.createdAt} />
          ) : null}

          {tone === "success" ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
              <p className="font-bold">🌿 Terima kasih, {receiptName}.</p>
              <p className="mt-1 leading-6">
                Donasi {formatRupiah(snapshot.amount)} untuk Jumat Berkah sudah
                diterima. Anda bisa membagikan Order ID sebagai bukti tanpa
                membuka data kontak pribadi.
              </p>
              <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs leading-5 text-emerald-950">
                {buildShareText(snapshot.orderId, snapshot.amount)}
              </p>
            </div>
          ) : null}

          {pollError && !isFinal ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <p className="font-semibold">
                Gagal memperbarui status. Periksa koneksi internet Anda.
              </p>
              <button
                type="button"
                onClick={() => void checkStatus()}
                className="mt-2 inline-flex min-h-11 items-center rounded-full border border-red-300 bg-white px-4 text-sm font-bold text-red-800 hover:bg-red-100"
              >
                Coba lagi
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {tone === "waiting" && paymentUrl ? (
              <a
                href={paymentUrl}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
              >
                Lanjutkan pembayaran
              </a>
            ) : null}

            {tone === "waiting" ? (
              <button
                type="button"
                onClick={() => void checkStatus()}
                disabled={isChecking}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cek status sekarang
              </button>
            ) : (
              <Link
                href="/donasi"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
              >
                Buat donasi baru
              </Link>
            )}

            <Link
              href="/laporan"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
            >
              Lihat laporan
            </Link>
          </div>

          <p className="text-xs leading-5 text-[color:var(--craft-ink-soft)]">
            Hanya pembayaran berstatus <strong>settlement</strong> yang dihitung
            sebagai pemasukan. Nominal, email, dan nomor WhatsApp Anda tidak
            pernah ditampilkan di laporan publik.
          </p>
        </div>
      </section>
    </>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[color:var(--craft-line)] px-3 py-2">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-widest text-[color:var(--craft-ink-soft)]">
        {label}
      </dt>
      <dd
        className={`mt-1 break-all text-sm font-bold text-[color:var(--craft-ink)] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function buildShareText(orderId: string, amount: number) {
  return `Alhamdulillah, donasi ${formatRupiah(amount)} untuk Jumat Berkah sudah diterima. Order: ${orderId}. Semoga menjadi berkah.`;
}