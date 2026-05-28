import Link from "next/link";

import { AdminSummaryFooter } from "@/components/admin/admin-summary-footer";
import { AdminTopTabs } from "@/components/admin/admin-top-tabs";
import { AutoSubmitSelect } from "../auto-submit-select";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";
import {
  type AdminSortDirection,
  type ExpenseSortField,
  formatAdminDateOnly,
  formatDateInput,
  getAdminExpenses,
  normalizePage,
  normalizePageSize,
} from "@/lib/admin";
import { ExpenseManager } from "./expense-manager";

type AdminExpensesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const expenseSortOptions: Array<{ value: ExpenseSortField; label: string }> = [
  { value: "expenseDate", label: "Tanggal" },
  { value: "amount", label: "Nominal" },
  { value: "category", label: "Kategori" },
  { value: "createdAt", label: "Waktu input" },
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
  const expenses = await getAdminExpenses(filters);
  const pageQuery = buildPageQuery(resolvedSearchParams);
  const categoryTabs = buildCategoryTabs(
    resolvedSearchParams,
    filters.category,
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
          Pengeluaran Admin
        </p>
        <h1 className="mt-4 text-3xl font-bold">Kelola pengeluaran program.</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Catat bahan makanan, beras, gas, kemasan, transportasi, dan
          operasional lain. Semua perubahan masuk audit log dan langsung
          memengaruhi laporan publik.
        </p>
      </div>

      <AdminTopTabs tabs={categoryTabs} />

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <TableToolbar filters={filters} />
        <TableMeta
          total={expenses.total}
          page={expenses.page}
          totalPages={expenses.totalPages}
        />
        <div className="p-0">
          <ExpenseManager
            expenses={expenses.items.map((expense) => ({
              id: expense.id,
              expenseDate: formatDateInput(expense.expenseDate),
              category: expense.category,
              description: expense.description,
              amount: expense.amount,
              vendorName: expense.vendorName,
              receiptUrl: expense.receiptUrl,
              displayDate: formatAdminDateOnly(expense.expenseDate),
            }))}
          />
        </div>
        <AdminSummaryFooter
          items={[
            { label: "Total cocok", value: String(expenses.total) },
            {
              label: "Halaman",
              value: `${expenses.page}/${expenses.totalPages}`,
            },
            { label: "Baris", value: String(filters.pageSize) },
            { label: "Kategori", value: filters.category ?? "Semua" },
          ]}
        />
        <TableFooter
          page={expenses.page}
          totalPages={expenses.totalPages}
          query={pageQuery}
          pageSize={filters.pageSize}
        />
      </div>
    </main>
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
    pageSize: number;
    sort: ExpenseSortField;
    direction: AdminSortDirection;
  };
}) {
  return (
    <form className="grid gap-3 border-b border-slate-100 bg-white p-5 lg:grid-cols-6">
      <input
        name="q"
        defaultValue={filters.q ?? ""}
        placeholder="Cari deskripsi atau vendor"
        className="rounded-xl border border-slate-200 px-3 py-2 lg:col-span-2"
      />
      <select
        name="category"
        defaultValue={filters.category ?? ""}
        className="rounded-xl border border-slate-200 px-3 py-2"
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
        className="rounded-xl border border-slate-200 px-3 py-2"
      />
      <input
        name="to"
        type="date"
        defaultValue={filters.to ?? ""}
        className="rounded-xl border border-slate-200 px-3 py-2"
      />
      <button className="rounded-full bg-slate-900 px-5 py-2 font-semibold text-white">
        Filter
      </button>
      <select
        name="sort"
        defaultValue={filters.sort}
        className="rounded-xl border border-slate-200 px-3 py-2"
      >
        {expenseSortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            Urut: {option.label}
          </option>
        ))}
      </select>
      <select
        name="direction"
        defaultValue={filters.direction}
        className="rounded-xl border border-slate-200 px-3 py-2"
      >
        <option value="desc">Terbesar/terbaru</option>
        <option value="asc">Terkecil/terlama</option>
      </select>
      <select
        name="pageSize"
        defaultValue={String(filters.pageSize)}
        className="rounded-xl border border-slate-200 px-3 py-2"
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

function TableMeta({
  total,
  page,
  totalPages,
}: {
  total: number;
  page: number;
  totalPages: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 text-sm text-slate-600">
      <span>Total {total} pengeluaran</span>
      <span>
        Halaman {page} dari {totalPages}
      </span>
    </div>
  );
}

function TableFooter({
  page,
  totalPages,
  query,
  pageSize,
}: {
  page: number;
  totalPages: number;
  query: URLSearchParams;
  pageSize: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm">
      <div className="flex gap-2">
        <PaginationLink page={page - 1} disabled={page <= 1} query={query}>
          Sebelumnya
        </PaginationLink>
        <PaginationLink
          page={page + 1}
          disabled={page >= totalPages}
          query={query}
        >
          Berikutnya
        </PaginationLink>
      </div>
      <AutoSubmitSelect
        name="pageSize"
        label="Baris"
        defaultValue={String(pageSize)}
        hiddenFields={Array.from(query.entries()).map(([name, value]) => ({
          name,
          value,
        }))}
        options={[10, 25, 50, 100].map((size) => ({
          value: String(size),
          label: String(size),
        }))}
      />
    </div>
  );
}

function PaginationLink({
  page,
  disabled,
  query,
  children,
}: {
  page: number;
  disabled: boolean;
  query: URLSearchParams;
  children: React.ReactNode;
}) {
  if (disabled)
    return (
      <span className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-300">
        {children}
      </span>
    );
  return (
    <Link
      href={`?${buildPageHref(query, page)}`}
      scroll={false}
      className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

function buildCategoryTabs(
  params: Record<string, string | string[] | undefined>,
  activeCategory: string | null,
) {
  const primaryCategories = EXPENSE_CATEGORIES.slice(0, 4);
  return [
    {
      href: buildCategoryHref(params, null),
      label: "Semua kategori",
      active: !activeCategory,
    },
    ...primaryCategories.map((category) => ({
      href: buildCategoryHref(params, category),
      label: category,
      active: activeCategory === category,
    })),
  ];
}

function buildCategoryHref(
  params: Record<string, string | string[] | undefined>,
  category: string | null,
) {
  const query = buildPageQuery(params);
  query.delete("category");
  if (category) {
    query.set("category", category);
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "?";
}

function buildPageQuery(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0 && key !== "page")
      query.set(key, value);
  }
  return query;
}

function buildPageHref(query: URLSearchParams, page: number) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  return nextQuery.toString();
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
  return expenseSortOptions.some((option) => option.value === value)
    ? (value as ExpenseSortField)
    : "expenseDate";
}
