import Link from "next/link";

import { AdminDataPageShell } from "@/components/admin/admin-data-page-shell";
import { AdminStickyPageBar } from "@/components/admin/admin-sticky-page-bar";
import { AdminTableCard } from "@/components/admin/admin-table-card";
import { AdminTableFooter } from "@/components/admin/admin-table-footer";
import { adminTableStyles } from "@/components/admin/admin-table-styles";
import { AutoSubmitSelect } from "../auto-submit-select";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";
import {
  type AdminSortDirection,
  type ExpenseSortField,
  formatDateInput,
  getAdminExpenses,
  normalizePage,
  normalizePageSize,
} from "@/lib/admin";
import { ExpenseManager } from "./expense-manager";
import {
  buildExpenseModalQuery,
  resolveExpenseModalState,
} from "./expense-manager-state";

type AdminExpensesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const expenseSortOptions: ExpenseSortField[] = [
  "expenseDate",
  "amount",
  "category",
  "createdAt",
];

export default async function AdminExpensesPage({
  searchParams,
}: AdminExpensesPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = {
    q: getStringParam(resolvedSearchParams.q),
    category: getStringParam(resolvedSearchParams.category),
    from: getStringParam(resolvedSearchParams.from),
    to: getStringParam(resolvedSearchParams.to),
    page: normalizePage(getNumberParam(resolvedSearchParams.page)),
    pageSize: normalizePageSize(getNumberParam(resolvedSearchParams.pageSize)),
    sort: getExpenseSort(getStringParam(resolvedSearchParams.sort)),
    direction: getSortDirection(getStringParam(resolvedSearchParams.direction)),
  };
  const modalState = resolveExpenseModalState({
    modal: getStringParam(resolvedSearchParams.modal),
    editExpenseId: getStringParam(resolvedSearchParams.editExpenseId),
    deleteExpenseId: getStringParam(resolvedSearchParams.deleteExpenseId),
  });

  const expenses = await getAdminExpenses(filters);
  const pageQuery = buildPageQuery(resolvedSearchParams);

  return (
    <AdminDataPageShell>
      <AdminStickyPageBar
        title="Kelola pengeluaran program."
        actions={
          <div className="flex items-center gap-2">
            <ExportIconLink
              href={`/api/admin/expenses/export?${buildExpenseExportHref(filters, "pdf")}`}
              label="Export PDF pengeluaran"
              download="pengeluaran.pdf"
            >
              PDF
            </ExportIconLink>
            <ExportIconLink
              href={`/api/admin/expenses/export?${buildExpenseExportHref(filters, "csv")}`}
              label="Export CSV pengeluaran"
              download="pengeluaran.csv"
            >
              CSV
            </ExportIconLink>

            <TopActionLink
              href={`?${buildExpenseModalQuery({ query: pageQuery, modal: "add" })}`}
              label="Tambah pengeluaran"
              variant="primary"
            >
              <PlusIcon />
            </TopActionLink>
          </div>
        }
      />

      <AdminTableCard>
        <TableToolbar filters={filters} />
        <ExpenseManager
          expenses={expenses.items.map((expense) => ({
            id: expense.id,
            expenseDate: formatDateInput(expense.expenseDate),
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            vendorName: expense.vendorName,
            receiptUrl: expense.receiptUrl,
            createdAt: expense.createdAt.toISOString(),
            displayDate: formatDateInput(expense.expenseDate),
          }))}
          sort={filters.sort}
          direction={filters.direction}
          query={pageQuery}
          modalState={modalState}
        />
        <AdminTableFooter
          page={expenses.page}
          totalPages={expenses.totalPages}
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
          totalLabel={`Total ${expenses.total} pengeluaran · Kategori ${filters.category ?? "Semua"}`}
        />
      </AdminTableCard>
    </AdminDataPageShell>
  );
}

function ExportIconLink({
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
      className="inline-flex h-10 min-w-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black tracking-wide text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
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

function TopActionLink({
  href,
  label,
  children,
  variant = "neutral",
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  variant?: "neutral" | "primary";
}) {
  const base =
    "inline-flex h-10 min-w-12 items-center justify-center rounded-xl border px-3 text-xs font-black tracking-wide shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";
  const classes =
    variant === "primary"
      ? `${base} border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100`
      : `${base} border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700`;

  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      title={label}
      className={classes}
    >
      {children}
    </Link>
  );
}

function TableToolbar({
  filters,
}: {
  filters: {
    q: string | null;
    category: string | null;
    from: string | null;
    to: string | null;
  };
}) {
  return (
    <form className={`${adminTableStyles.toolbar} lg:grid-cols-12`}>
      <input
        name="q"
        defaultValue={filters.q ?? ""}
        placeholder="Cari deskripsi atau vendor"
        className="field lg:col-span-3"
      />
      <select
        name="category"
        defaultValue={filters.category ?? ""}
        className="field lg:col-span-2"
      >
        <option value="">Semua kategori</option>
        {EXPENSE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
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
      <button className="btn-primary lg:col-span-3">Filter</button>
    </form>
  );
}

function buildPageHref(query: URLSearchParams, page: number) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  return nextQuery.toString();
}

function buildExpenseExportHref(
  filters: {
    q: string | null;
    category: string | null;
    from: string | null;
    to: string | null;
    sort: ExpenseSortField;
    direction: AdminSortDirection;
  },
  format: "csv" | "pdf",
) {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.category) query.set("category", filters.category);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  query.set("sort", filters.sort);
  query.set("direction", filters.direction);
  query.set("format", format);
  return query.toString();
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

function getSortDirection(value: string | null): AdminSortDirection {
  return value === "asc" ? "asc" : "desc";
}

function getExpenseSort(value: string | null): ExpenseSortField {
  return expenseSortOptions.includes(value as ExpenseSortField)
    ? (value as ExpenseSortField)
    : "expenseDate";
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
