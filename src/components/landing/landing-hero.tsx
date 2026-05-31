import Link from "next/link";

import type { LandingMetrics } from "@/lib/landing";

function formatLastUpdated(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function LandingHero({ metrics }: { metrics: LandingMetrics }) {
  return (
    <section className="flex flex-col">
      <span className="craft-pill self-start">
        <span className="size-1.5 rounded-full bg-current" />
        Program Sosial Kantor
      </span>
      <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">
        Sediakan <em>nasi Jumat</em> untuk masjid sekitar kantor.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)] sm:text-lg">
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
          href="/laporan"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-bold text-[color:var(--craft-ink)] underline decoration-[color:var(--craft-amber)] decoration-2 underline-offset-4 hover:decoration-[color:var(--craft-leaf)]"
        >
          Lihat laporan transparansi
        </Link>
      </div>
      <p className="mt-6 text-xs text-[color:var(--craft-ink-soft)]">
        Diperbarui {formatLastUpdated(metrics.lastUpdatedAt)}
      </p>
    </section>
  );
}
