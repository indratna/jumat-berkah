import Link from "next/link";

import { AdminSummaryFooter } from "@/components/admin/admin-summary-footer";
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
    <main className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
          Audit Admin
        </p>
        <h1 className="mt-4 text-3xl font-bold">Jejak perubahan sistem.</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Lihat aktivitas operasional penting secara read-only. Data audit tidak
          bisa diubah dari halaman ini.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <AuditToolbar filters={filters} actions={logs.actions} entityTypes={logs.entityTypes} />
        <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-600">
          Total {logs.total} log audit. Halaman {logs.page} dari {logs.totalPages}.
        </div>
        <div className="divide-y divide-slate-100">
          {logs.items.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              Tidak ada audit log sesuai filter.
            </div>
          ) : (
            logs.items.map((log) => (
              <details key={log.id} className="group p-5 open:bg-slate-50/70">
                <summary className="cursor-pointer list-none">
                  <div className="grid gap-3 lg:grid-cols-[1fr_11rem_10rem] lg:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">{log.action}</p>
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
        <AdminSummaryFooter
          items={[
            { label: "Total cocok", value: String(logs.total) },
            { label: "Halaman", value: `${logs.page}/${logs.totalPages}` },
            { label: "Baris", value: String(filters.pageSize) },
            { label: "Mode", value: "Read-only" },
          ]}
        />
        <TableFooter
          page={logs.page}
          totalPages={logs.totalPages}
          query={pageQuery}
          pageSize={filters.pageSize}
        />
      </div>
    </main>
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
    <form className="grid gap-3 border-b border-slate-100 bg-white p-5 lg:grid-cols-6">
      <select name="action" defaultValue={filters.action ?? ""} className="rounded-xl border border-slate-200 px-3 py-2">
        <option value="">Semua aksi</option>
        {actions.map((action) => <option key={action} value={action}>{action}</option>)}
      </select>
      <select name="entityType" defaultValue={filters.entityType ?? ""} className="rounded-xl border border-slate-200 px-3 py-2">
        <option value="">Semua entitas</option>
        {entityTypes.map((entityType) => <option key={entityType} value={entityType}>{entityType}</option>)}
      </select>
      <input name="actor" defaultValue={filters.actor ?? ""} placeholder="Cari aktor" className="rounded-xl border border-slate-200 px-3 py-2" />
      <input name="from" type="date" defaultValue={filters.from ?? ""} className="rounded-xl border border-slate-200 px-3 py-2" />
      <input name="to" type="date" defaultValue={filters.to ?? ""} className="rounded-xl border border-slate-200 px-3 py-2" />
      <button className="rounded-full bg-slate-900 px-5 py-2 font-semibold text-white">Filter</button>
      <select name="sort" defaultValue={filters.sort} className="rounded-xl border border-slate-200 px-3 py-2">
        {auditSortOptions.map((option) => <option key={option.value} value={option.value}>Urut: {option.label}</option>)}
      </select>
      <select name="direction" defaultValue={filters.direction} className="rounded-xl border border-slate-200 px-3 py-2">
        <option value="desc">Z-A/terbaru</option>
        <option value="asc">A-Z/terlama</option>
      </select>
      <select name="pageSize" defaultValue={String(filters.pageSize)} className="rounded-xl border border-slate-200 px-3 py-2">
        {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size} baris</option>)}
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

function TableFooter({ page, totalPages, query, pageSize }: { page: number; totalPages: number; query: URLSearchParams; pageSize: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5 text-sm">
      <Link aria-disabled={page <= 1} className={`rounded-full px-4 py-2 font-semibold ${page <= 1 ? "pointer-events-none bg-slate-100 text-slate-400" : "bg-slate-900 text-white"}`} href={`?${withPage(query, page - 1, pageSize)}`}>Sebelumnya</Link>
      <span className="text-slate-600">Halaman {page} / {totalPages}</span>
      <Link aria-disabled={page >= totalPages} className={`rounded-full px-4 py-2 font-semibold ${page >= totalPages ? "pointer-events-none bg-slate-100 text-slate-400" : "bg-slate-900 text-white"}`} href={`?${withPage(query, page + 1, pageSize)}`}>Berikutnya</Link>
    </div>
  );
}

function withPage(query: URLSearchParams, page: number, pageSize: number) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  nextQuery.set("pageSize", String(pageSize));
  return nextQuery.toString();
}

function buildPageQuery(searchParams: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value.length > 0 && key !== "page") {
      query.set(key, value);
    }
  }
  return query;
}

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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
