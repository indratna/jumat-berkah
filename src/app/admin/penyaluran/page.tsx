import { AdminDataPageShell } from "@/components/admin/admin-data-page-shell";
import { AdminStickyPageBar } from "@/components/admin/admin-sticky-page-bar";
import { AdminTableCard } from "@/components/admin/admin-table-card";
import { AdminTableFooter } from "@/components/admin/admin-table-footer";
import {
  formatAdminDateOnly,
  normalizePage,
  normalizePageSize,
} from "@/lib/admin";
import {
  getAdminDistributionReports,
  getDistributionReportForCurrentCycle,
} from "@/lib/distribution-report";

import { DistributionManager } from "./distribution-manager";
import {
  buildDistributionModalQuery,
  resolveDistributionModalState,
} from "./distribution-manager-state";

type DistributionReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DistributionReportPage({
  searchParams,
}: DistributionReportPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = normalizePage(getNumberParam(resolvedSearchParams.page));
  const pageSize = normalizePageSize(
    getNumberParam(resolvedSearchParams.pageSize),
  );
  const modalState = resolveDistributionModalState({
    modal: getStringParam(resolvedSearchParams.modal),
    editReportId: getStringParam(resolvedSearchParams.editReportId),
    deleteReportId: getStringParam(resolvedSearchParams.deleteReportId),
  });

  const [current, reports] = await Promise.all([
    getDistributionReportForCurrentCycle(),
    getAdminDistributionReports({ page, pageSize }),
  ]);
  const pageQuery = buildPageQuery(resolvedSearchParams);
  const activeCycleReport = current.report;

  return (
    <AdminDataPageShell>
      <AdminStickyPageBar
        title="Cerita penyaluran"
        actions={
          <div className="flex items-center gap-2">
            <LinkAction
              href={`?${buildDistributionModalQuery({
                query: pageQuery,
                modal: activeCycleReport ? "edit" : "add",
                reportId: activeCycleReport?.id,
              })}`}
              label={
                activeCycleReport
                  ? "Edit cerita siklus aktif"
                  : "Buat cerita siklus ini"
              }
            >
              <PlusIcon />
            </LinkAction>
          </div>
        }
      />

      <AdminTableCard>
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-bold">Riwayat cerita penyaluran</h2>
          <p className="mt-1 text-sm text-slate-600">
            Satu cerita per siklus Jumat. Cerita publik dipakai untuk laporan
            penyaluran ke jamaah dan donatur.
          </p>
        </div>

        <DistributionManager
          reports={reports.items.map((report) => ({
            id: report.id,
            cycleStartLabel: formatAdminDateOnly(report.cycleStart),
            cycleStartIso: report.cycleStart.toISOString().slice(0, 10),
            title: report.title,
            summary: report.summary,
            packageCount: report.packageCount,
            locationSummary: report.locationSummary,
            photoUrls: report.photoUrls,
            publishedAt: report.publishedAt?.toISOString() ?? null,
          }))}
          query={pageQuery}
          modalState={modalState}
          currentCycleStart={current.cycle.fromDate}
          currentCycleLabel={current.cycle.label}
        />

        <AdminTableFooter
          page={reports.page}
          totalPages={reports.totalPages}
          hrefBuilder={(nextPage) => buildPageHref(pageQuery, nextPage)}
          totalLabel={`Total ${reports.total} cerita · Siklus aktif ${current.cycle.label}`}
        />
      </AdminTableCard>
    </AdminDataPageShell>
  );
}

function LinkAction({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex h-10 min-w-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black tracking-wide text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      aria-label={label}
      title={label}
    >
      {children}
    </a>
  );
}

function buildPageHref(query: URLSearchParams, page: number) {
  const next = new URLSearchParams(query);
  next.set("page", String(page));
  return next.toString();
}

function buildPageQuery(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0 && key !== "page") {
      query.set(key, value);
    }
  }
  return query;
}

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

function getNumberParam(value: string | string[] | undefined) {
  const parsed = Number(getStringParam(value));
  return Number.isInteger(parsed) ? parsed : 1;
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="size-5 stroke-current"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 4.25v11.5" />
      <path d="M4.25 10h11.5" />
    </svg>
  );
}
