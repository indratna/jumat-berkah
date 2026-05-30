import { PublicHeader } from "@/components/landing/public-header";
import { getPublishedDistributionReportForCurrentCycle } from "@/lib/distribution-report";
import { getPublicReport, parseReportDateRange } from "@/lib/reports";
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
  const progressPercent = Math.round(fridayProgress.progressRatio * 100);

  return (
    <div className="landing-craft landing-noise min-h-screen print:bg-white">
      <main
        id="main-content"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 text-[color:var(--craft-ink)] print:bg-white print:px-0 print:py-0 sm:px-6 lg:px-8 lg:py-12"
      >
        <PublicHeader className="print-hide" />

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start print:block">
          <div className="print:mb-5">
            <span className="craft-pill print:hidden">Laporan Publik</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.35rem]">
              Jaga <em>transparansi</em> pemasukan dan pengeluaran program.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)]">
              Hanya donasi berhasil yang dihitung sebagai pemasukan. Email dan
              nomor WhatsApp donatur tidak pernah ditampilkan pada laporan
              publik.
            </p>
            <p className="mt-4 hidden text-sm font-semibold text-[color:var(--craft-ink-soft)] print:block">
              {periodLabel} • Dicetak dari halaman laporan publik Jumat Berkah.
            </p>
          </div>

          <form className="craft-card-strong print-hide grid gap-3 p-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[color:var(--craft-ink)]">
              Dari tanggal
              <input
                name="from"
                type="date"
                defaultValue={from ?? ""}
                className="mt-2 w-full rounded-xl border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-3 py-2.5 text-sm text-[color:var(--craft-ink)]"
              />
            </label>
            <label className="text-sm font-semibold text-[color:var(--craft-ink)]">
              Sampai tanggal
              <input
                name="to"
                type="date"
                defaultValue={to ?? ""}
                className="mt-2 w-full rounded-xl border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-3 py-2.5 text-sm text-[color:var(--craft-ink)]"
              />
            </label>
            <button className="min-h-11 rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)] sm:col-span-2">
              Terapkan Filter
            </button>
            <a
              href="/laporan?period=jumat"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-5 text-center text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)] sm:col-span-2"
            >
              Lihat Siklus Jumat Ini
            </a>
            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
              <PrintButton />
              <a
                href="/api/reports/public/export?format=pdf"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-center text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
              >
                Unduh PDF
              </a>
              <a
                href="/api/reports/public/export?format=csv"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-5 text-center text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
              >
                Unduh CSV
              </a>
            </div>
            <p className="text-xs leading-5 text-[color:var(--craft-ink-soft)] sm:col-span-2">
              Filter dan tombol ini otomatis disembunyikan saat dicetak.
            </p>
          </form>
        </section>

        {distribution.report ? (
          <section className="craft-card overflow-hidden p-6 print:break-inside-avoid print:rounded-2xl print:border print:border-slate-200 print:shadow-none">
            <span className="craft-pill print:hidden">Cerita Penyaluran</span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              {distribution.report.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--craft-ink-soft)]">
              <span className="craft-pill">{distribution.cycle.label}</span>
              {distribution.report.locationSummary ? (
                <span className="craft-pill">
                  {distribution.report.locationSummary}
                </span>
              ) : null}
              {distribution.report.packageCount !== null ? (
                <span className="craft-pill">
                  {distribution.report.packageCount} paket
                </span>
              ) : null}
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[color:var(--craft-ink-soft)]">
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
                    className="block overflow-hidden rounded-2xl border border-[color:var(--craft-line)] bg-[color:var(--craft-cream-strong)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Foto kegiatan penyaluran"
                      width={640}
                      height={400}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {fridayProgress.target ? (
          <section className="craft-card-strong p-6 print:break-inside-avoid print:rounded-2xl print:border print:border-slate-200 print:shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="craft-pill print:hidden">
                  Target Siklus Jumat
                </span>
                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                  {formatRupiah(fridayProgress.target.targetAmount)}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--craft-ink-soft)]">
                  Periode {fridayProgress.cycle.label}
                </p>
              </div>
              <p className="text-sm font-bold text-[color:var(--craft-leaf)]">
                Terkumpul {formatRupiah(fridayProgress.collected)} (
                {progressPercent}%)
              </p>
            </div>
            <div
              className="mt-4 h-3 overflow-hidden rounded-full"
              style={{ background: "rgba(15, 42, 31, 0.08)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(progressPercent, 100)}%`,
                  background:
                    "linear-gradient(90deg, var(--craft-leaf), var(--craft-amber))",
                }}
              />
            </div>
            {fridayProgress.target.note ? (
              <p className="mt-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
                {fridayProgress.target.note}
              </p>
            ) : null}
          </section>
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
                className="border-b border-[color:var(--craft-line)] py-4 last:border-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[color:var(--craft-ink)]">
                      {donation.donorName}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--craft-ink-soft)]">
                      {donation.date}
                    </p>
                    {donation.message ? (
                      <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
                        {donation.message}
                      </p>
                    ) : null}
                  </div>
                  <p className="craft-num text-base font-bold text-[color:var(--craft-leaf)]">
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
                className="border-b border-[color:var(--craft-line)] py-4 last:border-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[color:var(--craft-ink)]">
                      {expense.category}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--craft-ink-soft)]">
                      {expense.date}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
                      {expense.description}
                    </p>
                  </div>
                  <p className="craft-num text-base font-bold text-[color:var(--craft-ink)]">
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
          strong
        >
          <div className="space-y-4">
            {report.expenseCategories.map((category) => {
              const percentage = getCategoryPercentage(
                category.amount,
                report.summary.expenses,
              );

              return (
                <div key={category.category}>
                  <div className="flex justify-between gap-3 text-sm font-semibold">
                    <span>{category.category}</span>
                    <span className="craft-num">
                      {formatRupiah(category.amount)}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2.5 overflow-hidden rounded-full"
                    style={{ background: "rgba(15, 42, 31, 0.08)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        background:
                          "linear-gradient(90deg, var(--craft-leaf), var(--craft-amber))",
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--craft-ink-soft)]">
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
                className="rounded-2xl bg-[color:var(--craft-paper)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="craft-pill">
                        {getTimelineTypeLabel(item.type)}
                      </span>
                      <span className="craft-pill">{item.date}</span>
                    </div>
                    <h3 className="mt-3 font-semibold text-[color:var(--craft-ink)]">
                      {item.title}
                    </h3>
                  </div>
                  {item.amount !== null ? (
                    <p className="craft-num text-base font-bold text-[color:var(--craft-leaf)]">
                      {formatRupiah(item.amount)}
                    </p>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
                  {item.description}
                </p>
                {item.meta ? (
                  <p className="mt-2 text-xs font-medium text-[color:var(--craft-ink-soft)]">
                    {item.meta}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </ReportPanel>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="craft-card p-5 print:break-inside-avoid print:rounded-xl print:border print:border-slate-200 print:shadow-none">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--craft-ink-soft)]">
        {label}
      </p>
      <p className="craft-num mt-3 text-2xl font-bold tracking-tight print:text-lg">
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
  strong = false,
}: {
  title: string;
  emptyText: string;
  hasItems: boolean;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`${strong ? "craft-card-strong" : "craft-card"} p-6 print:break-inside-avoid print:rounded-xl print:border print:border-slate-200 print:shadow-none`}
    >
      <h2 className="text-lg font-bold print:text-base">{title}</h2>
      <div className="mt-4">
        {hasItems ? (
          children
        ) : (
          <p className="rounded-2xl bg-[color:var(--craft-paper)] p-4 text-sm text-[color:var(--craft-ink-soft)]">
            {emptyText}
          </p>
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
