import { getPublicReport, parseReportDateRange } from "@/lib/reports";
import { getPublishedDistributionReportForCurrentCycle } from "@/lib/distribution-report";
import { getWeeklyTargetProgress } from "@/lib/weekly-target";

import { PrintButton } from "./print-button";

type ReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const params = new URLSearchParams();
  const from = getStringParam(resolvedSearchParams.from);
  const to = getStringParam(resolvedSearchParams.to);
  const period = getStringParam(resolvedSearchParams.period);

  if (period === "jumat") {
    params.set("period", "jumat");
  } else {
    if (from) params.set("from", from);
    if (to) params.set("to", to);
  }

  const report = await getPublicReport(parseReportDateRange(params));
  const fridayProgress = await getWeeklyTargetProgress();
  const distribution = await getPublishedDistributionReportForCurrentCycle();

  const periodLabel =
    period === "jumat" ? "Siklus Jumat berjalan" : "Periode pilihan";

  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-12 text-emerald-950 sm:py-16 print:bg-white print:px-0 print:py-0">
      <section className="mx-auto max-w-6xl space-y-8 print:max-w-none print:space-y-5">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Laporan Publik
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-end print:block">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                Transparansi pemasukan dan pengeluaran Jumat Berkah.
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-emerald-900/75">
                Hanya donasi berhasil yang dihitung sebagai pemasukan. Email dan
                nomor WhatsApp donatur tidak ditampilkan pada laporan publik.
              </p>
              <p className="mt-4 hidden text-sm font-semibold text-emerald-900 print:block">
                {periodLabel} • Dicetak dari halaman laporan publik Jumat
                Berkah.
              </p>
            </div>
            <form className="print-hide grid gap-3 rounded-2xl bg-emerald-50 p-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Dari tanggal
                <input
                  name="from"
                  type="date"
                  defaultValue={from ?? ""}
                  className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2"
                />
              </label>
              <label className="text-sm font-semibold">
                Sampai tanggal
                <input
                  name="to"
                  type="date"
                  defaultValue={to ?? ""}
                  className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2"
                />
              </label>
              <button className="rounded-full bg-emerald-700 px-5 py-2 font-semibold text-white sm:col-span-2">
                Terapkan Filter
              </button>
              <a
                href="/laporan?period=jumat"
                className="rounded-full border border-emerald-700 px-5 py-2 text-center font-semibold text-emerald-800 sm:col-span-2"
              >
                Lihat Siklus Jumat Ini
              </a>
              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
                <PrintButton />
                <a
                  href="/api/reports/public/export?format=pdf"
                  className="rounded-full bg-emerald-800 px-5 py-2 text-center font-semibold text-white"
                >
                  Unduh PDF Siklus Jumat
                </a>
                <a
                  href="/api/reports/public/export?format=csv"
                  className="rounded-full border border-emerald-700 px-5 py-2 text-center font-semibold text-emerald-800"
                >
                  Unduh CSV Siklus Jumat
                </a>
              </div>
              <p className="text-xs leading-5 text-emerald-900/65 sm:col-span-2">
                Gunakan tombol cetak untuk laporan A4 ringkas. Tombol dan filter
                otomatis disembunyikan saat dicetak.
              </p>
            </form>
          </div>
        </div>

        {distribution.report ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Cerita Penyaluran Jumat
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              {distribution.report.title}
            </h2>
            <p className="mt-2 text-sm text-emerald-900/70">
              Periode {distribution.cycle.label}
              {distribution.report.locationSummary
                ? ` • ${distribution.report.locationSummary}`
                : null}
              {distribution.report.packageCount !== null
                ? ` • ${distribution.report.packageCount} paket`
                : null}
            </p>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-emerald-900/85">
              {distribution.report.summary}
            </p>
            {distribution.report.photoUrls.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {distribution.report.photoUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Foto kegiatan penyaluran"
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {fridayProgress.target ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Target Siklus Jumat
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {formatRupiah(fridayProgress.target.targetAmount)}
                </p>
                <p className="mt-1 text-sm text-emerald-900/70">
                  Periode {fridayProgress.cycle.label}
                </p>
              </div>
              <p className="text-sm font-semibold text-emerald-800">
                Terkumpul {formatRupiah(fridayProgress.collected)} (
                {Math.round(fridayProgress.progressRatio * 100)}%)
              </p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-50">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{
                  width: `${Math.round(fridayProgress.progressRatio * 100)}%`,
                }}
              />
            </div>
            {fridayProgress.target.note ? (
              <p className="mt-3 text-sm text-emerald-900/75">
                {fridayProgress.target.note}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4 print:grid-cols-4 print:gap-3">
          <SummaryCard
            label="Pemasukan Periode"
            value={formatRupiah(report.summary.income)}
          />
          <SummaryCard
            label="Pengeluaran Periode"
            value={formatRupiah(report.summary.expenses)}
          />
          <SummaryCard
            label="Saldo Periode"
            value={formatRupiah(report.summary.periodBalance)}
          />
          <SummaryCard
            label="Saldo Berjalan"
            value={formatRupiah(report.summary.currentBalance)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4">
          <ReportPanel
            title="Donasi Berhasil"
            emptyText="Belum ada donasi berhasil pada periode ini."
            hasItems={report.donations.length > 0}
          >
            {report.donations.map((donation) => (
              <div
                key={`${donation.date}-${donation.amount}-${donation.donorName}`}
                className="border-b border-emerald-100 py-4 last:border-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{donation.donorName}</p>
                    <p className="mt-1 text-sm text-emerald-900/65">
                      {donation.date}
                    </p>
                    {donation.message ? (
                      <p className="mt-2 text-sm text-emerald-900/75">
                        {donation.message}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-semibold">
                    {formatRupiah(donation.amount)}
                  </p>
                </div>
              </div>
            ))}
          </ReportPanel>

          <ReportPanel
            title="Pengeluaran"
            emptyText="Belum ada pengeluaran pada periode ini."
            hasItems={report.expenses.length > 0}
          >
            {report.expenses.map((expense) => (
              <div
                key={`${expense.date}-${expense.category}-${expense.description}`}
                className="border-b border-emerald-100 py-4 last:border-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{expense.category}</p>
                    <p className="mt-1 text-sm text-emerald-900/65">
                      {expense.date}
                    </p>
                    <p className="mt-2 text-sm text-emerald-900/75">
                      {expense.description}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatRupiah(expense.amount)}
                  </p>
                </div>
              </div>
            ))}
          </ReportPanel>
        </div>

        <ReportPanel
          title="Grafik Kategori Pengeluaran"
          emptyText="Belum ada kategori pengeluaran."
          hasItems={report.expenseCategories.length > 0}
        >
          <div className="space-y-4">
            {report.expenseCategories.map((category) => {
              const percentage = getCategoryPercentage(
                category.amount,
                report.summary.expenses,
              );

              return (
                <div key={category.category}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold">{category.category}</span>
                    <span>{formatRupiah(category.amount)}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-emerald-50">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-emerald-900/60">
                    {percentage}% dari pengeluaran periode.
                  </p>
                </div>
              );
            })}
          </div>
        </ReportPanel>

        <ReportPanel
          title="Timeline Transparansi"
          emptyText="Belum ada aktivitas publik pada periode ini."
          hasItems={report.timeline.length > 0}
        >
          <div className="space-y-4">
            {report.timeline.map((item) => (
              <div
                key={`${item.type}-${item.date}-${item.title}-${item.amount ?? "story"}`}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      {getTimelineTypeLabel(item.type)} • {item.date}
                    </p>
                    <h3 className="mt-2 font-semibold">{item.title}</h3>
                  </div>
                  {item.amount !== null ? (
                    <p className="font-semibold">{formatRupiah(item.amount)}</p>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-900/75">
                  {item.description}
                </p>
                {item.meta ? (
                  <p className="mt-2 text-xs font-medium text-emerald-900/60">
                    {item.meta}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </ReportPanel>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100 print:break-inside-avoid print:rounded-xl print:border print:border-emerald-100 print:p-4 print:shadow-none print:ring-0">
      <p className="text-sm font-medium text-emerald-900/65">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight print:text-lg">
        {value}
      </p>
    </div>
  );
}

function ReportPanel({
  title,
  emptyText,
  hasItems,
  children,
}: {
  title: string;
  emptyText: string;
  hasItems: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100 print:break-inside-avoid print:rounded-xl print:border print:border-emerald-100 print:p-4 print:shadow-none print:ring-0">
      <h2 className="text-xl font-bold print:text-base">{title}</h2>
      <div className="mt-4">
        {hasItems ? (
          children
        ) : (
          <p className="text-sm text-emerald-900/65">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function getCategoryPercentage(amount: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.round((amount / total) * 100);
}

function getTimelineTypeLabel(type: "donation" | "expense" | "distribution") {
  if (type === "donation") {
    return "Donasi";
  }
  if (type === "expense") {
    return "Pengeluaran";
  }
  return "Penyaluran";
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}
