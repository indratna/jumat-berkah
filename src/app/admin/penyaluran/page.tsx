import {
  getDistributionReportForCurrentCycle,
  listDistributionReports,
} from "@/lib/distribution-report";
import { DistributionReportForm } from "./distribution-report-form";

export default async function DistributionReportPage() {
  const current = await getDistributionReportForCurrentCycle();
  const recent = await listDistributionReports(10);

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Cerita Penyaluran Siklus Jumat
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Periode {current.cycle.label}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cerita publik dipakai untuk menjelaskan penyaluran nasi dan kegiatan
          Jumat ke jamaah serta donatur. Hindari menampilkan wajah penerima
          manfaat tanpa izin.
        </p>
        <div className="mt-5">
          <DistributionReportForm
            cycleStart={current.cycle.fromDate}
            initial={current.report}
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Riwayat Cerita
        </p>
        <p className="mt-2 text-sm text-slate-500">
          10 cerita terbaru.
        </p>
        <div className="mt-4 space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">
              Belum ada cerita penyaluran tersimpan.
            </p>
          ) : (
            recent.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {report.title}{" "}
                    <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      {report.publishedAt ? "Publik" : "Draft"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Mulai {report.cycleStart.toISOString().slice(0, 10)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {report.summary}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  {report.packageCount !== null ? (
                    <span>{report.packageCount} paket</span>
                  ) : null}
                  {report.locationSummary ? (
                    <span>Lokasi: {report.locationSummary}</span>
                  ) : null}
                  <span>Foto: {report.photoUrls.length}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
