import Link from "next/link";

import { formatRupiah } from "@/lib/format";
import type { LandingSocialProof } from "@/lib/landing";

function formatCount(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function LandingSocialProofCard({
  proof,
}: {
  proof: LandingSocialProof;
}) {
  return (
    <section aria-labelledby="bukti-sosial" className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <span className="craft-pill">Bukti Sosial</span>
          <h2
            id="bukti-sosial"
            className="mt-3 text-2xl font-bold leading-tight sm:text-3xl"
          >
            Sudah banyak yang ikut berbagi.
          </h2>
        </div>
        <p className="text-sm leading-6 text-[color:var(--craft-ink-soft)] sm:max-w-xs">
          Ringkasan diambil dari donasi yang sudah berhasil dan penyaluran yang
          sudah dipublikasikan.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Donatur"
          value={formatCount(proof.donorCount)}
          unit="orang"
          note="Donatur anonim dihitung tanpa membuka identitas."
        />
        <Metric
          label="Porsi tersalurkan"
          value={
            proof.totalPortions > 0 ? formatCount(proof.totalPortions) : "—"
          }
          unit={proof.totalPortions > 0 ? "porsi" : undefined}
          note={
            proof.totalPortions > 0
              ? "Dari cerita penyaluran yang sudah terbit."
              : "Menunggu laporan penyaluran pertama."
          }
        />
        <Metric
          label="Donasi berhasil"
          value={formatCount(proof.settlementCount)}
          unit="donasi"
          note="Hanya pembayaran settlement yang dihitung."
        />
      </div>

      {proof.recentDonations.length > 0 ? (
        <div className="craft-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-[color:var(--craft-ink)]">
              Donasi terbaru
            </h3>
            <Link
              href="/laporan"
              className="inline-flex min-h-11 items-center text-sm font-bold text-[color:var(--craft-leaf)] underline decoration-[color:var(--craft-amber)] decoration-2 underline-offset-4 hover:text-[color:var(--craft-leaf-strong)]"
            >
              Lihat laporan lengkap →
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-[color:var(--craft-line)]">
            {proof.recentDonations.map((donation) => (
              <li
                key={donation.id}
                className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[color:var(--craft-ink)]">
                    {donation.donorName}
                  </p>
                  <p className="text-xs text-[color:var(--craft-ink-soft)]">
                    {donation.relativeTime}
                  </p>
                </div>
                <p className="craft-num shrink-0 text-sm text-[color:var(--craft-leaf)]">
                  {formatRupiah(donation.amount)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-[color:var(--craft-line)] pt-3 text-xs leading-5 text-[color:var(--craft-ink-soft)]">
            Email dan nomor WhatsApp donatur tidak pernah ditampilkan. Donatur
            yang memilih anonim tampil sebagai “Anonim”.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  note: string;
}) {
  return (
    <article className="craft-card flex flex-col gap-1 p-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[color:var(--craft-ink-soft)]">
        {label}
      </p>
      <p className="craft-num flex items-baseline gap-1.5 text-3xl text-[color:var(--craft-leaf)]">
        {value}
        {unit ? (
          <span className="text-sm font-semibold text-[color:var(--craft-ink-soft)]">
            {unit}
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-xs leading-5 text-[color:var(--craft-ink-soft)]">
        {note}
      </p>
    </article>
  );
}