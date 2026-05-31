import Link from "next/link";

import {
  formatAdminDate,
  formatRupiah,
  getAdminDashboardSummary,
  getAdminTopDonors,
} from "@/lib/admin";
import { getPublicReport } from "@/lib/reports";
import { getWeeklyTargetProgress } from "@/lib/weekly-target";
import { DashboardDateRange } from "./dashboard-date-range";
import { DashboardExpenseModal } from "./dashboard-expense-modal";
import { WeeklyTargetModal } from "./weekly-target-modal";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const from = getStringParam(resolvedSearchParams.from);
  const to = getStringParam(resolvedSearchParams.to);
  const reportRange = {
    from: from ? new Date(`${from}T00:00:00.000+07:00`) : null,
    to: to ? new Date(`${to}T23:59:59.999+07:00`) : null,
  };
  const [summary, progress, topDonors, report] = await Promise.all([
    getAdminDashboardSummary({ from, to }),
    getWeeklyTargetProgress(),
    getAdminTopDonors({ from, to, limit: 5 }),
    getPublicReport(reportRange),
  ]);
  const progressPercent = Math.round(progress.progressRatio * 100);
  const progressBarPercent = Math.min(progressPercent, 100);
  const progressTone = getProgressTone(progressPercent);
  const dashboardQuery = buildDashboardQuery({ from, to });
  const expenseSaved =
    getStringParam(resolvedSearchParams.expenseSaved) === "1";

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
              <WeeklyTargetModal
                cycleStart={progress.cycle.fromDate}
                cycleEnd={progress.cycle.toDate}
                initialTargetAmount={progress.target?.targetAmount ?? null}
                initialNote={progress.target?.note ?? null}
              />
              <DashboardExpenseModal redirectQuery={dashboardQuery} />
            </div>
          </div>
          <DashboardDateRange from={from} to={to} />
        </div>
        {expenseSaved ? (
          <div className="border-t border-slate-200 bg-white px-5 pt-4">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Pengeluaran sudah tercatat.
            </p>
          </div>
        ) : null}
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
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          <div
            className={`rounded-xl border ${progressTone.cardBorder} ${progressTone.cardBackground} px-4 py-4`}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="grid gap-3 lg:grid-cols-[1.25fr_0.9fr_0.9fr] lg:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-slate-950">
                      Target Siklus Jumat
                    </p>
                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-bold ${progressTone.badge}`}
                    >
                      {progressPercent}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Periode {progress.cycle.label}
                  </p>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ease-out ${progressTone.bar}`}
                      style={{ width: `${progressBarPercent}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Target / Terkumpul
                  </p>
                  <p className="numeric mt-1 text-sm font-bold text-slate-950">
                    {progress.target
                      ? formatRupiah(progress.target.targetAmount)
                      : "Belum diatur"}
                  </p>
                  <p className="numeric mt-1 text-xs text-slate-500">
                    {formatRupiah(progress.collected)} terkumpul
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Sisa Pekan Ini
                  </p>
                  <p className="numeric mt-1 text-sm font-bold text-slate-950">
                    {progress.target
                      ? formatRupiah(progress.remaining)
                      : "Atur target"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {progress.target ? "Progress aktif" : "Belum aktif"}
                  </p>
                </div>
              </div>
              {progress.target?.note ? (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 lg:max-w-xs">
                  Catatan: {progress.target.note}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
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
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950">
                Diagram Pie Pengeluaran
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Mengikuti periode dashboard di atas.
              </p>
            </div>
          </div>
          {report.expenseCategories.length > 0 &&
          report.summary.expenses > 0 ? (
            <div className="grid gap-5 p-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
              <ExpensePieChart
                categories={report.expenseCategories}
                total={report.summary.expenses}
              />
              <div className="space-y-3">
                {report.expenseCategories.map((category) => {
                  const percentage = Math.round(
                    (category.amount / report.summary.expenses) * 100,
                  );
                  return (
                    <div
                      key={category.category}
                      className="rounded-lg border border-slate-200 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-950">
                            {category.category}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {percentage}% dari total pengeluaran
                          </p>
                        </div>
                        <p className="numeric text-sm font-bold text-slate-950">
                          {formatRupiah(category.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500">
              Belum ada pengeluaran pada periode ini.
            </div>
          )}
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

function buildDashboardQuery(input: {
  from: string | null;
  to: string | null;
}) {
  const params = new URLSearchParams();
  if (input.from) {
    params.set("from", input.from);
  }
  if (input.to) {
    params.set("to", input.to);
  }
  return params.toString();
}

function getProgressTone(progressPercent: number) {
  if (progressPercent <= 33) {
    return {
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      bar: "bg-rose-600",
      cardBorder: "border-rose-200",
      cardBackground: "bg-rose-50/70",
    };
  }

  if (progressPercent <= 67) {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
      cardBorder: "border-amber-200",
      cardBackground: "bg-amber-50/70",
    };
  }

  return {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-600",
    cardBorder: "border-emerald-200",
    cardBackground: "bg-emerald-50/70",
  };
}

function ExpensePieChart({
  categories,
  total,
}: {
  categories: Array<{ category: string; amount: number }>;
  total: number;
}) {
  const palette = [
    "#16a34a",
    "#f59e0b",
    "#0ea5e9",
    "#8b5cf6",
    "#ef4444",
    "#14b8a6",
    "#f97316",
    "#64748b",
  ];
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const segments = categories.map((category, index) => {
    const previousAmount = categories
      .slice(0, index)
      .reduce((sum, item) => sum + item.amount, 0);
    const fraction = category.amount / total;
    return {
      key: category.category,
      color: palette[index % palette.length],
      strokeDasharray: `${fraction * circumference} ${circumference}`,
      strokeDashoffset: -(previousAmount / total) * circumference,
    };
  });

  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="size-48">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="26"
        />
        {segments.map((segment) => (
          <circle
            key={segment.key}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth="26"
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="butt"
            transform="rotate(-90 100 100)"
          />
        ))}
        <circle cx="100" cy="100" r="50" fill="white" />
        <text
          x="100"
          y="92"
          textAnchor="middle"
          className="fill-slate-500 text-[10px] font-semibold uppercase tracking-wide"
        >
          Total
        </text>
        <text
          x="100"
          y="112"
          textAnchor="middle"
          className="fill-slate-950 text-[12px] font-bold"
        >
          {formatRupiah(total)}
        </text>
      </svg>
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
