import Link from "next/link";

import { formatRupiah, getAdminDashboardSummary } from "@/lib/admin";
import { getWeeklyTargetProgress } from "@/lib/weekly-target";
import { WeeklyTargetForm } from "./weekly-target-form";

export default async function AdminPage() {
  const summary = await getAdminDashboardSummary();
  const progress = await getWeeklyTargetProgress();

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-4xl bg-slate-950 text-white shadow-2xl shadow-slate-300/60">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.6fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Dashboard Admin
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
              Pantau dana Jumat Berkah dengan cepat dan akurat.
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Ringkasan pemasukan, pengeluaran, saldo berjalan, dan donasi yang
              masih menunggu pembayaran.
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
            <p className="text-sm text-slate-300">Saldo berjalan</p>
            <p className="mt-3 text-3xl font-black text-emerald-300">
              {formatRupiah(summary.balance)}
            </p>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Saldo dihitung dari donasi sukses dikurangi semua pengeluaran
              tercatat.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Pemasukan"
          value={formatRupiah(summary.income)}
          tone="emerald"
          helper="Donasi settlement"
        />
        <SummaryCard
          label="Pengeluaran"
          value={formatRupiah(summary.expenses)}
          tone="rose"
          helper="Total biaya tercatat"
        />
        <SummaryCard
          label="Saldo"
          value={formatRupiah(summary.balance)}
          tone="sky"
          helper="Pemasukan - pengeluaran"
        />
        <SummaryCard
          label="Donasi Pending"
          value={String(summary.pendingDonations)}
          tone="amber"
          helper="Menunggu webhook"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Target Siklus Jumat
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            {progress.target
              ? formatRupiah(progress.target.targetAmount)
              : "Belum diatur"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Periode {progress.cycle.label}
          </p>
          <div className="mt-4 space-y-2">
            <div className="h-3 overflow-hidden rounded-full bg-emerald-50">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{
                  width: `${Math.round(progress.progressRatio * 100)}%`,
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
              <span>
                Terkumpul {formatRupiah(progress.collected)} (
                {Math.round(progress.progressRatio * 100)}%)
              </span>
              {progress.target ? (
                <span>Sisa target {formatRupiah(progress.remaining)}</span>
              ) : (
                <span>Atur target untuk menampilkan progress.</span>
              )}
            </div>
            {progress.target?.note ? (
              <p className="text-xs text-slate-500">
                Catatan: {progress.target.note}
              </p>
            ) : null}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Atur Target Siklus
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Target hanya dihitung dari donasi `settlement` di siklus berjalan.
          </p>
          <div className="mt-4">
            <WeeklyTargetForm
              cycleStart={progress.cycle.fromDate}
              cycleEnd={progress.cycle.toDate}
              initialTargetAmount={progress.target?.targetAmount ?? null}
              initialNote={progress.target?.note ?? null}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <QuickLink
          href="/admin/donasi"
          eyebrow="Transaksi"
          title="Kelola donasi"
          description="Lihat status pembayaran, filter order ID, dan cek detail pesan donatur."
        />
        <QuickLink
          href="/admin/pengeluaran"
          eyebrow="Operasional"
          title="Catat pengeluaran"
          description="Tambah, edit, hapus, dan audit biaya program secara langsung."
        />
        <QuickLink
          href="/api/admin/reports/export"
          eyebrow="Laporan"
          title="Export CSV"
          description="Unduh donasi sukses dan pengeluaran untuk rekonsiliasi."
        />
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "emerald" | "rose" | "sky" | "amber";
}) {
  const toneClasses = {
    emerald: "from-emerald-500/15 text-emerald-700 ring-emerald-100",
    rose: "from-rose-500/15 text-rose-700 ring-rose-100",
    sky: "from-sky-500/15 text-sky-700 ring-sky-100",
    amber: "from-amber-500/20 text-amber-700 ring-amber-100",
  }[tone];

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className={`mb-5 size-12 rounded-2xl bg-linear-to-br ${toneClasses} ring-1`}
      />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function QuickLink({
  href,
  eyebrow,
  title,
  description,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-950 hover:text-white hover:shadow-xl"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 group-hover:text-emerald-300">
        {eyebrow}
      </p>
      <p className="mt-4 text-xl font-black">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600 group-hover:text-slate-300">
        {description}
      </p>
      <p className="mt-5 text-sm font-semibold text-slate-900 group-hover:text-white">
        Buka →
      </p>
    </Link>
  );
}
