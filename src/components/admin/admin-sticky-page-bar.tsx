import { adminTableStyles } from "@/components/admin/admin-table-styles";

export function AdminStickyPageBar({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className={adminTableStyles.stickyPageBar}>
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
