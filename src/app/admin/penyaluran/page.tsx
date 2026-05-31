import { AdminDataPageShell } from "@/components/admin/admin-data-page-shell";
import { AdminStickyPageBar } from "@/components/admin/admin-sticky-page-bar";
import { AdminTableCard } from "@/components/admin/admin-table-card";
import { AdminTableFooter } from "@/components/admin/admin-table-footer";
import { adminTableStyles } from "@/components/admin/admin-table-styles";
import { AutoSubmitSelect } from "../auto-submit-select";
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
  buildDistributionExportQuery,
  buildDistributionModalQuery,
  type DistributionSortDirection,
  type DistributionSortField,
  normalizeDistributionDirection,
  normalizeDistributionSort,
  resolveDistributionModalState,
} from "./distribution-manager-state";

type DistributionReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type DistributionStatusFilter = "published" | "draft" | null;

export default async function DistributionReportPage({
  searchParams,
}: DistributionReportPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters: {
    q: string | null;
    status: DistributionStatusFilter;
    sort: DistributionSortField;
    direction: DistributionSortDirection;
    page: number;
    pageSize: number;
  } = {
    q: getStringParam(resolvedSearchParams.q),
    status: getDistributionStatus(getStringParam(resolvedSearchParams.status)),
    sort: normalizeDistributionSort(getStringParam(resolvedSearchParams.sort)),
    direction: normalizeDistributionDirection(
      getStringParam(resolvedSearchParams.direction),
    ),
    page: normalizePage(getNumberParam(resolvedSearchParams.page)),
    pageSize: normalizePageSize(getNumberParam(resolvedSearchParams.pageSize)),
  };
  const modalState = resolveDistributionModalState({
    modal: getStringParam(resolvedSearchParams.modal),
    editReportId: getStringParam(resolvedSearchParams.editReportId),
    deleteReportId: getStringParam(resolvedSearchParams.deleteReportId),
  });

  const [current, reports] = await Promise.all([
    getDistributionReportForCurrentCycle(),
    getAdminDistributionReports(filters),
  ]);
  const pageQuery = buildPageQuery(resolvedSearchParams);
  const activeCycleReport = current.report;

  return (
    <AdminDataPageShell>
      <AdminStickyPageBar
        title="Cerita penyaluran"
        actions={
          <div className="flex items-center gap-2">
            <ExportAction
              href={`/api/admin/distribution/export?${buildDistributionExportHref(pageQuery, "pdf")}`}
              label="Export PDF cerita penyaluran"
              download="cerita-penyaluran.pdf"
            >
              PDF
            </ExportAction>
            <ExportAction
              href={`/api/admin/distribution/export?${buildDistributionExportHref(pageQuery, "csv")}`}
              label="Export CSV cerita penyaluran"
              download="cerita-penyaluran.csv"
            >
              CSV
            </ExportAction>
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
        <TableToolbar filters={filters} />
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
          sort={filters.sort}
          direction={filters.direction}
        />

        <AdminTableFooter
          page={reports.page}
          totalPages={reports.totalPages}
          hrefBuilder={(nextPage) => buildPageHref(pageQuery, nextPage)}
          pageSizeControl={
            <AutoSubmitSelect
              name="pageSize"
              label="Baris"
              defaultValue={String(filters.pageSize)}
              hiddenFields={Array.from(pageQuery.entries()).map(
                ([name, value]) => ({ name, value }),
              )}
              options={[10, 25, 50, 100].map((size) => ({
                value: String(size),
                label: String(size),
              }))}
            />
          }
          totalLabel={`Total ${reports.total} cerita · Siklus aktif ${current.cycle.label}`}
        />
      </AdminTableCard>
    </AdminDataPageShell>
  );
}

function TableToolbar({
  filters,
}: {
  filters: {
    q: string | null;
    status: DistributionStatusFilter;
    sort: DistributionSortField;
    direction: DistributionSortDirection;
  };
}) {
  return (
    <form className={`${adminTableStyles.toolbar} lg:grid-cols-12`}>
      <input
        name="q"
        defaultValue={filters.q ?? ""}
        placeholder="Cari judul, ringkasan, atau lokasi"
        className="field lg:col-span-9"
      />
      <select
        name="status"
        defaultValue={filters.status ?? ""}
        className="field lg:col-span-2"
      >
        <option value="">Semua status</option>
        <option value="published">Publik</option>
        <option value="draft">Draft</option>
      </select>
      <input type="hidden" name="sort" value={filters.sort} />
      <input type="hidden" name="direction" value={filters.direction} />
      <button className="btn-primary lg:col-span-1">Filter</button>
    </form>
  );
}

function ExportAction({
  href,
  label,
  children,
  download,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  download?: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex h-10 min-w-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black tracking-wide text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      aria-label={label}
      title={label}
      download={download}
      target="_blank"
      rel="noopener"
    >
      {children}
    </a>
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

function buildDistributionExportHref(
  query: URLSearchParams,
  format: "pdf" | "csv",
) {
  const next = new URLSearchParams(buildDistributionExportQuery(query));
  next.set("format", format);
  return next.toString();
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

function getDistributionStatus(value: string | null): DistributionStatusFilter {
  return value === "published" || value === "draft" ? value : null;
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
