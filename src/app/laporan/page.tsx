import { getPublicReport, parseReportDateRange } from "@/lib/reports";

type ReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const params = new URLSearchParams();
  const from = getStringParam(resolvedSearchParams.from);
  const to = getStringParam(resolvedSearchParams.to);

  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const report = await getPublicReport(parseReportDateRange(params));

  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-12 text-emerald-950 sm:py-16">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Laporan Publik
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                Transparansi pemasukan dan pengeluaran Jumat Berkah.
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-emerald-900/75">
                Hanya donasi berhasil yang dihitung sebagai pemasukan. Email dan
                nomor WhatsApp donatur tidak ditampilkan pada laporan publik.
              </p>
            </div>
            <form className="grid gap-3 rounded-2xl bg-emerald-50 p-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Dari tanggal
                <input name="from" type="date" defaultValue={from ?? ""} className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">
                Sampai tanggal
                <input name="to" type="date" defaultValue={to ?? ""} className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" />
              </label>
              <button className="rounded-full bg-emerald-700 px-5 py-2 font-semibold text-white sm:col-span-2">
                Terapkan Filter
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Pemasukan Periode" value={formatRupiah(report.summary.income)} />
          <SummaryCard label="Pengeluaran Periode" value={formatRupiah(report.summary.expenses)} />
          <SummaryCard label="Saldo Periode" value={formatRupiah(report.summary.periodBalance)} />
          <SummaryCard label="Saldo Berjalan" value={formatRupiah(report.summary.currentBalance)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ReportPanel title="Donasi Berhasil" emptyText="Belum ada donasi berhasil pada periode ini." hasItems={report.donations.length > 0}>
            {report.donations.map((donation) => (
              <div key={`${donation.date}-${donation.amount}-${donation.donorName}`} className="border-b border-emerald-100 py-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{donation.donorName}</p>
                    <p className="mt-1 text-sm text-emerald-900/65">{donation.date}</p>
                    {donation.message ? <p className="mt-2 text-sm text-emerald-900/75">{donation.message}</p> : null}
                  </div>
                  <p className="font-semibold">{formatRupiah(donation.amount)}</p>
                </div>
              </div>
            ))}
          </ReportPanel>

          <ReportPanel title="Pengeluaran" emptyText="Belum ada pengeluaran pada periode ini." hasItems={report.expenses.length > 0}>
            {report.expenses.map((expense) => (
              <div key={`${expense.date}-${expense.category}-${expense.description}`} className="border-b border-emerald-100 py-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{expense.category}</p>
                    <p className="mt-1 text-sm text-emerald-900/65">{expense.date}</p>
                    <p className="mt-2 text-sm text-emerald-900/75">{expense.description}</p>
                  </div>
                  <p className="font-semibold">{formatRupiah(expense.amount)}</p>
                </div>
              </div>
            ))}
          </ReportPanel>
        </div>

        <ReportPanel title="Ringkasan Kategori Pengeluaran" emptyText="Belum ada kategori pengeluaran." hasItems={report.expenseCategories.length > 0}>
          {report.expenseCategories.map((category) => (
            <div key={category.category} className="flex justify-between border-b border-emerald-100 py-3 last:border-0">
              <span>{category.category}</span>
              <strong>{formatRupiah(category.amount)}</strong>
            </div>
          ))}
        </ReportPanel>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
      <p className="text-sm font-medium text-emerald-900/65">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function ReportPanel({ title, emptyText, hasItems, children }: { title: string; emptyText: string; hasItems: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4">{hasItems ? children : <p className="text-sm text-emerald-900/65">{emptyText}</p>}</div>
    </div>
  );
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
