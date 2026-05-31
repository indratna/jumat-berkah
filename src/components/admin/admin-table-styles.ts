export const adminTableStyles = {
  pageShell: "mx-auto max-w-6xl space-y-4",
  stickyPageBar:
    "sticky top-16 z-30 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950",
  tableCard:
    "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950",
  toolbar:
    "grid gap-3 border-b border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950",
  footer:
    "flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm dark:border-slate-800",
  meta: "text-sm text-slate-600 dark:text-slate-300",
  emptyState: "p-6 text-sm text-slate-500 dark:text-slate-400",
  stickyHeadCell:
    "sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 font-semibold shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:bg-slate-900 dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]",
  headCell: "px-4 py-3 font-semibold",
  bodyCell: "px-4 py-4",
  compactAction:
    "inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200",
} as const;
