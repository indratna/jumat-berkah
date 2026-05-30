import Link from "next/link";

import type { LandingMetrics } from "@/lib/landing";
import { formatRupiah } from "@/lib/format";

function formatLastUpdated(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function LandingHero({
  metrics,
  collectedPercent,
}: {
  metrics: LandingMetrics;
  collectedPercent: number;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-8">
      <div className="flex flex-col justify-center lg:col-span-7">
        <span className="craft-pill self-start">
          <span className="size-1.5 rounded-full bg-current" />
          Program Sosial Kantor
        </span>
        <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">
          Sediakan <em>nasi Jumat</em> untuk masjid sekitar kantor.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-[color:var(--craft-ink-soft)] sm:text-lg">
          Donasi via QRIS, dana langsung dipakai memasak nasi Jumat. Setiap
          rupiah yang masuk dan keluar tercatat dan terbuka.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/donasi"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--craft-leaf)] px-6 text-sm font-bold text-[color:var(--craft-cream)] transition hover:bg-[color:var(--craft-leaf-strong)]"
          >
            Donasi Sekarang
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="#cerita"
            className="inline-flex min-h-12 items-center gap-2 text-sm font-bold text-[color:var(--craft-ink)] underline decoration-[color:var(--craft-amber)] decoration-2 underline-offset-4 hover:decoration-[color:var(--craft-leaf)]"
          >
            Lihat cerita penyaluran
          </Link>
        </div>
        <p className="mt-6 text-xs text-[color:var(--craft-ink-soft)]">
          Diperbarui {formatLastUpdated(metrics.lastUpdatedAt)}
        </p>
      </div>

      <aside className="craft-card-strong relative flex flex-col gap-5 p-6 sm:p-8 lg:col-span-5">
        <div className="flex items-center justify-between gap-3">
          <span className="craft-pill">Siklus berjalan</span>
          <span className="text-xs font-semibold tracking-widest text-[color:var(--craft-ink-soft)]">
            {metrics.cycle.label}
          </span>
        </div>
        <div className="grid gap-4">
          <KpiRow
            label="Pemasukan siklus"
            value={formatRupiah(metrics.income)}
          />
          <KpiRow
            label="Pengeluaran siklus"
            value={formatRupiah(metrics.expenses)}
          />
          <KpiRow
            label="Saldo program"
            value={formatRupiah(metrics.currentBalance)}
            emphasis
          />
        </div>
        <div className="mt-1 flex items-center justify-between rounded-2xl bg-[color:var(--craft-paper)] px-4 py-3">
          <p className="text-xs font-semibold tracking-widest text-[color:var(--craft-ink-soft)]">
            % terkumpul
          </p>
          <p className="craft-num text-base text-[color:var(--craft-leaf)]">
            {collectedPercent}%
          </p>
        </div>
      </aside>
    </section>
  );
}

function KpiRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-[color:var(--craft-line)] pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold tracking-widest uppercase text-[color:var(--craft-ink-soft)]">
        {label}
      </p>
      <p
        className={`craft-num ${emphasis ? "text-[color:var(--craft-leaf)] text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}
      >
        {value}
      </p>
    </div>
  );
}
