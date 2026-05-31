import Link from "next/link";

import { AdminDataPageShell } from "@/components/admin/admin-data-page-shell";
import { AdminStickyPageBar } from "@/components/admin/admin-sticky-page-bar";
import { AdminTableCard } from "@/components/admin/admin-table-card";
import { AdminTableFooter } from "@/components/admin/admin-table-footer";
import { adminTableStyles } from "@/components/admin/admin-table-styles";
import { AutoSubmitSelect } from "../auto-submit-select";
import {
  type AdminSortDirection,
  type AuditSortField,
  formatAdminDate,
  getAdminAuditLogs,
  normalizePage,
  normalizePageSize,
} from "@/lib/admin";

type AdminAuditPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAuditPage({
  searchParams,
}: AdminAuditPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = {
    action: getStringParam(resolvedSearchParams.action),
    actor: getStringParam(resolvedSearchParams.actor),
    entityType: getStringParam(resolvedSearchParams.entityType),
    from: getStringParam(resolvedSearchParams.from),
    to: getStringParam(resolvedSearchParams.to),
    page: normalizePage(getNumberParam(resolvedSearchParams.page)),
    pageSize: normalizePageSize(getNumberParam(resolvedSearchParams.pageSize)),
    sort: getAuditSort(getStringParam(resolvedSearchParams.sort)),
    direction: getSortDirection(getStringParam(resolvedSearchParams.direction)),
  };
  const logs = await getAdminAuditLogs(filters);
  const pageQuery = buildPageQuery(resolvedSearchParams);

  return (
    <AdminDataPageShell>
      <AdminStickyPageBar title="Jejak audit perubahan sistem." />

      <AdminTableCard>
        <AuditToolbar
          filters={filters}
          actions={logs.actions}
          entityTypes={logs.entityTypes}
        />

        {logs.items.length === 0 ? (
          <div className={adminTableStyles.emptyState}>
            Tidak ada audit log sesuai filter.
          </div>
        ) : (
          <>
            <AuditTableHeader
              query={pageQuery}
              sort={filters.sort}
              direction={filters.direction}
            />
            <div className="divide-y divide-slate-100">
              {logs.items.map((log) => (
                <details key={log.id} className="group p-5 open:bg-slate-50/70">
                  <summary className="grid cursor-pointer list-none gap-3 lg:grid-cols-[1fr_11rem_10rem_11rem] lg:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {log.action}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.entityId}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700">{log.entityType}</p>
                    <p className="text-sm text-slate-600">
                      {log.actor?.name ?? log.actor?.email ?? "Sistem"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatAdminDate(log.createdAt)}
                    </p>
                  </summary>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <AuditJson title="Sebelum" value={log.before} />
                    <AuditJson title="Sesudah" value={log.after} />
                  </div>
                </details>
              ))}
            </div>
          </>
        )}

        <AdminTableFooter
          page={logs.page}
          totalPages={logs.totalPages}
          hrefBuilder={(page) => buildPageHref(pageQuery, page)}
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
          totalLabel={`Total ${logs.total} log audit · Read-only`}
        />
      </AdminTableCard>
    </AdminDataPageShell>
  );
}

function AuditToolbar({
  filters,
  actions,
  entityTypes,
}: {
  filters: {
    action: string | null;
    actor: string | null;
    entityType: string | null;
    from: string | null;
    to: string | null;
    sort: AuditSortField;
    direction: AdminSortDirection;
  };
  actions: string[];
  entityTypes: string[];
}) {
  return (
    <form className={`${adminTableStyles.toolbar} lg:grid-cols-12`}>
      <select
        name="action"
        defaultValue={filters.action ?? ""}
        className="field lg:col-span-3"
      >
        <option value="">Semua aksi</option>
        {actions.map((action) => (
          <option key={action} value={action}>
            {action}
          </option>
        ))}
      </select>
      <select
        name="entityType"
        defaultValue={filters.entityType ?? ""}
        className="field lg:col-span-2"
      >
        <option value="">Semua entitas</option>
        {entityTypes.map((entityType) => (
          <option key={entityType} value={entityType}>
            {entityType}
          </option>
        ))}
      </select>
      <input
        name="actor"
        defaultValue={filters.actor ?? ""}
        placeholder="Cari aktor"
        className="field lg:col-span-2"
      />
      <input
        name="from"
        type="date"
        defaultValue={filters.from ?? ""}
        className="field lg:col-span-2"
      />
      <input
        name="to"
        type="date"
        defaultValue={filters.to ?? ""}
        className="field lg:col-span-2"
      />
      <input type="hidden" name="sort" value={filters.sort} />
      <input type="hidden" name="direction" value={filters.direction} />
      <button className="btn-primary lg:col-span-1">Filter</button>
    </form>
  );
}

function AuditTableHeader({
  query,
  sort,
  direction,
}: {
  query: URLSearchParams;
  sort: AuditSortField;
  direction: AdminSortDirection;
}) {
  const headerCellClass =
    "sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]";

  return (
    <div
      className={`grid border-b border-slate-200 bg-slate-50 lg:grid-cols-[1fr_11rem_10rem_11rem]`}
    >
      <div className={headerCellClass}>
        <SortHeader
          query={query}
          field="action"
          activeSort={sort}
          direction={direction}
        >
          Aksi
        </SortHeader>
      </div>
      <div className={headerCellClass}>
        <SortHeader
          query={query}
          field="entityType"
          activeSort={sort}
          direction={direction}
        >
          Entitas
        </SortHeader>
      </div>
      <div className={headerCellClass}>Aktor</div>
      <div className={headerCellClass}>
        <SortHeader
          query={query}
          field="createdAt"
          activeSort={sort}
          direction={direction}
        >
          Waktu
        </SortHeader>
      </div>
    </div>
  );
}

function SortHeader({
  query,
  field,
  activeSort,
  direction,
  children,
}: {
  query: URLSearchParams;
  field: AuditSortField;
  activeSort: AuditSortField;
  direction: AdminSortDirection;
  children: React.ReactNode;
}) {
  const isActive = activeSort === field;
  const nextDirection: AdminSortDirection =
    isActive && direction === "desc" ? "asc" : "desc";
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("sort", field);
  nextQuery.set("direction", nextDirection);
  nextQuery.delete("page");

  return (
    <Link
      href={`?${nextQuery.toString()}`}
      scroll={false}
      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-950"
    >
      <span>{children}</span>
      <span aria-hidden="true" className="text-[10px]">
        {isActive ? (direction === "desc" ? "↓" : "↑") : "↕"}
      </span>
    </Link>
  );
}

function AuditJson({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>
      <pre className="max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {value == null ? "-" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function buildPageHref(query: URLSearchParams, page: number) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  return nextQuery.toString();
}

function buildPageQuery(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value.length > 0 && key !== "page") {
      query.set(key, value);
    }
  }
  return query;
}

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getNumberParam(value: string | string[] | undefined) {
  return typeof value === "string" ? Number(value) : Number.NaN;
}

function getAuditSort(value: string | null): AuditSortField {
  return value === "action" || value === "entityType" ? value : "createdAt";
}

function getSortDirection(value: string | null): AdminSortDirection {
  return value === "asc" ? "asc" : "desc";
}
