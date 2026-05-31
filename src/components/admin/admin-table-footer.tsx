import Link from "next/link";

import { adminTableStyles } from "@/components/admin/admin-table-styles";

export function AdminTableFooter({
  page,
  totalPages,
  hrefBuilder,
  pageSizeControl,
  totalLabel,
}: {
  page: number;
  totalPages: number;
  hrefBuilder: (page: number) => string;
  pageSizeControl?: React.ReactNode;
  totalLabel?: React.ReactNode;
}) {
  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className={adminTableStyles.footer}>
      <div className="flex flex-wrap items-center gap-3">
        {totalLabel ? (
          <span className={adminTableStyles.meta}>{totalLabel}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {pageSizeControl}
        {page <= 1 ? (
          <span
            aria-disabled="true"
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-slate-300 dark:border-slate-800 dark:text-slate-600"
          >
            ←
          </span>
        ) : (
          <Link
            className="btn-outline"
            href={`?${hrefBuilder(previousPage)}`}
            scroll={false}
          >
            ←
          </Link>
        )}
        <span className={adminTableStyles.meta}>
          Halaman {page} / {totalPages}
        </span>
        {page >= totalPages ? (
          <span
            aria-disabled="true"
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-slate-300 dark:border-slate-800 dark:text-slate-600"
          >
            →
          </span>
        ) : (
          <Link
            className="btn-outline"
            href={`?${hrefBuilder(nextPage)}`}
            scroll={false}
          >
            →
          </Link>
        )}
      </div>
    </div>
  );
}
