import Link from "next/link";

import {
  formatAdminDate,
  formatRupiah,
  getAdminDashboardSummary,
  getAdminTopDonors,
} from "@/lib/admin";
import { getWeeklyTargetProgress } from "@/lib/weekly-target";
import { DashboardDateRange } from "./dashboard-date-range";
import { WeeklyTargetForm } from "./weekly-target-form";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const from = getStringParam(resolvedSearchParams.from);
  const to = getStringParam(resolvedSearchParams.to);
  const [summary, progress, topDonors] = await Promise.all([
    getAdminDashboardSummary({ from, to }),
    getWeeklyTargetProgress(),
    getAdminTopDonors({ from, to, limit: 5 }),
  ]);
  const progressPercent = Math.round(progress.progressRatio * 100);
  const progressBarPercent = Math.min(progressPercent, 100);

  return (
    <main id="main-content" className="mx-auto max-w-295 space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 border-b border-slate-200 px-5 py-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green-700">
              Dashboard Admin
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Ringkasan operasional Jumat Berkah
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Monitor saldo, settlement, pengeluaran, dan target siklus dalam
              satu layar sesuai periode dashboard.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:flex sm:items-center">
              <Link
                href="/admin/donasi"
                className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-center font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                Lihat Donasi
              </Link>
              <Link
                href="/admin/pengeluaran"
                className="min-h-11 rounded-md bg-green-700 px-3 py-2.5 text-center font-semibold text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                Catat Biaya
              </Link>
            </div>
          </div>
          <DashboardDateRange from={from} to={to} />
        </div>
        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCell
            label="Pemasukan"
            value={formatRupiah(summary.income)}
            helper="Donasi settlement"
            tone="text-green-700"
          />
          <MetricCell
            label="Pengeluaran"
            value={formatRupiah(summary.expenses)}
            helper="Biaya tercatat"
            tone="text-rose-700"
          />
          <MetricCell
            label="Saldo"
            value={formatRupiah(summary.balance)}
            helper="Income - expense"
            tone="text-slate-950"
          />
          <MetricCell
            label="Donasi Pending"
            value={String(summary.pendingDonations)}
            helper="Menunggu webhook"
            tone="text-amber-700"
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950">
                Ranking Donatur Terbanyak
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Mengikuti periode dashboard di atas.
              </p>
            </div>
          </div>
          {topDonors.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {topDonors.map((donor, index) => (
                <div
                  key={donor.key}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[3rem_1fr_auto] sm:items-center"
                >
                  <div className="grid size-10 place-items-center rounded-full bg-green-50 text-sm font-bold text-green-700 ring-1 ring-green-100">
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">
                      {donor.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {donor.settlementCount} settlement
                      {donor.lastPaidAt
                        ? ` · terakhir ${formatAdminDate(donor.lastPaidAt)}`
                        : ""}
                    </p>
                  </div>
                  <p className="numeric text-lg font-bold text-green-700">
                    {formatRupiah(donor.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500">
              Belum ada donatur settlement pada periode ini.
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-950">
                Target Siklus Jumat
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Periode {progress.cycle.label}
              </p>
            </div>
            <span className="rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
              {progressPercent}%
            </span>
          </div>
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Target</p>
                <p className="numeric mt-2 text-2xl font-bold text-slate-950">
                  {progress.target
                    ? formatRupiah(progress.target.targetAmount)
                    : "Belum diatur"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Terkumpul {formatRupiah(progress.collected)}
                </p>
              </div>
              <div className="space-y-3">
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                  <div
                    className="h-full rounded-full bg-green-700 transition-[width] duration-300 ease-out"
                    style={{ width: `${progressBarPercent}%` }}
                  />
                </div>
                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Sisa target</p>
                    <p className="numeric mt-1 font-bold text-slate-950">
                      {progress.target
                        ? formatRupiah(progress.remaining)
                        : "Atur target"}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="mt-1 font-bold text-slate-950">
                      {progress.target ? "Aktif" : "Belum aktif"}
                    </p>
                  </div>
                </div>
                {progress.target?.note ? (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Catatan: {progress.target.note}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-bold text-slate-950">
              Atur Target Siklus
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Settlement siklus berjalan jadi sumber progress.
            </p>
          </div>
          <div className="p-5">
            <WeeklyTargetForm
              cycleStart={progress.cycle.fromDate}
              cycleEnd={progress.cycle.toDate}
              initialTargetAmount={progress.target?.targetAmount ?? null}
              initialNote={progress.target?.note ?? null}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-950">Akses Cepat</p>
            <p className="mt-1 text-xs text-slate-500">
              Aksi operasional paling sering dipakai.
            </p>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Gunakan dashboard untuk pantau, halaman detail untuk koreksi data.
          </p>
        </div>
        <div className="grid gap-px bg-slate-200 lg:grid-cols-3">
          <QuickLink
            href="/admin/donasi"
            eyebrow="Transaksi"
            title="Kelola donasi"
            description="Filter order ID, status, dan pesan donatur."
          />
          <QuickLink
            href="/admin/pengeluaran"
            eyebrow="Operasional"
            title="Catat pengeluaran"
            description="Tambah, edit, hapus, dan audit biaya program."
          />
          <QuickLink
            href="/api/admin/reports/export"
            eyebrow="Laporan"
            title="Export CSV"
            description="Unduh data untuk rekonsiliasi."
          />
        </div>
      </section>
    </main>
  );
}

function MetricCell({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: string;
}) {
  return (
    <div className="bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="size-2 rounded-full bg-current text-slate-300" />
      </div>
      <p className={`numeric mt-3 text-2xl font-bold tracking-tight ${tone}`}>
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
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
      className="block bg-white p-5 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-green-700 sm:p-6"
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-700">
        {eyebrow}
      </p>
      <p className="mt-2 text-base font-bold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-4 text-sm font-semibold text-green-700">Buka →</p>
    </Link>
  );
}
