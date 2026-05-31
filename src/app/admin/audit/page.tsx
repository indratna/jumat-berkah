import { AdminDataPageShell } from "@/components/admin/admin-data-page-shell";
import { AdminStickyPageBar } from "@/components/admin/admin-sticky-page-bar";
import { AdminTableCard } from "@/components/admin/admin-table-card";
import { AdminTableFooter } from "@/components/admin/admin-table-footer";
import { adminTableStyles } from "@/components/admin/admin-table-styles";
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

const auditSortOptions: Array<{ value: AuditSortField; label: string }> = [
  { value: "createdAt", label: "Waktu" },
  { value: "action", label: "Aksi" },
  { value: "entityType", label: "Entitas" },
];

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
      <AdminStickyPageBar
        title="Jejak perubahan sistem."
        description="Lihat aktivitas operasional penting secara read-only. Data audit tidak bisa diubah dari halaman ini."
      />

      <AdminTableCard>
        <AuditToolbar
          filters={filters}
          actions={logs.actions}
          entityTypes={logs.entityTypes}
        />
        <div className="divide-y divide-slate-100">
          {logs.items.length === 0 ? (
            <div className={adminTableStyles.emptyState}>
              Tidak ada audit log sesuai filter.
            </div>
          ) : (
            logs.items.map((log) => (
              <details key={log.id} className="group p-5 open:bg-slate-50/70">
                <summary className="cursor-pointer list-none">
                  <div className="grid gap-3 lg:grid-cols-[1fr_11rem_10rem] lg:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {log.action}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {log.entityType} · {log.entityId}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">
                      {log.actor?.name ?? log.actor?.email ?? "Sistem"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatAdminDate(log.createdAt)}
                    </p>
                  </div>
                </summary>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <AuditJson title="Sebelum" value={log.before} />
                  <AuditJson title="Sesudah" value={log.after} />
                </div>
              </details>
            ))
          )}
        </div>
        <AdminTableFooter
          page={logs.page}
          totalPages={logs.totalPages}
          hrefBuilder={(page) =>
            buildPageHref(pageQuery, page, filters.pageSize)
          }
          totalLabel={`Total ${logs.total} log audit · Baris ${filters.pageSize} · Mode read-only`}
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
    pageSize: number;
    sort: AuditSortField;
    direction: AdminSortDirection;
  };
  actions: string[];
  entityTypes: string[];
}) {
  return (
    <form className={`${adminTableStyles.toolbar} lg:grid-cols-6`}>
      <select
        name="action"
        defaultValue={filters.action ?? ""}
        className="field"
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
        className="field"
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
        className="field"
      />
      <input
        name="from"
        type="date"
        defaultValue={filters.from ?? ""}
        className="field"
      />
      <input
        name="to"
        type="date"
        defaultValue={filters.to ?? ""}
        className="field"
      />
      <button className="btn-primary">Filter</button>
      <select name="sort" defaultValue={filters.sort} className="field">
        {auditSortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            Urut: {option.label}
          </option>
        ))}
      </select>
      <select
        name="direction"
        defaultValue={filters.direction}
        className="field"
      >
        <option value="desc">Z-A/terbaru</option>
        <option value="asc">A-Z/terlama</option>
      </select>
      <select
        name="pageSize"
        defaultValue={String(filters.pageSize)}
        className="field"
      >
        {[10, 25, 50, 100].map((size) => (
          <option key={size} value={size}>
            {size} baris
          </option>
        ))}
      </select>
    </form>
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

function buildPageHref(query: URLSearchParams, page: number, pageSize: number) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  nextQuery.set("pageSize", String(pageSize));
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
