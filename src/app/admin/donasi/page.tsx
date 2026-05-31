import Link from "next/link";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AutoSubmitSelect } from "../auto-submit-select";
import { CheckStatusButton } from "./check-status-button";
import { DonationAutoRefresh } from "./donation-auto-refresh";
import { DonationStatus } from "@/generated/prisma/client";
import {
  type AdminSortDirection,
  type DonationSortField,
  formatAdminDate,
  formatRupiah,
  getAdminDonations,
  getAdminDonorName,
  normalizePage,
  normalizePageSize,
} from "@/lib/admin";

type AdminDonationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const donationSortOptions: Array<{ value: DonationSortField; label: string }> =
  [
    { value: "createdAt", label: "Tanggal dibuat" },
    { value: "paidAt", label: "Tanggal bayar" },
    { value: "amount", label: "Nominal" },
    { value: "status", label: "Status" },
    { value: "orderId", label: "Order ID" },
    { value: "donorName", label: "Donatur" },
  ];

export default async function AdminDonationsPage({
  searchParams,
}: AdminDonationPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = {
    status: getStringParam(resolvedSearchParams.status),
    q: getStringParam(resolvedSearchParams.q),
    from: getStringParam(resolvedSearchParams.from),
    to: getStringParam(resolvedSearchParams.to),
    page: normalizePage(getNumberParam(resolvedSearchParams.page)),
    pageSize: normalizePageSize(getNumberParam(resolvedSearchParams.pageSize)),
    sort: getDonationSort(getStringParam(resolvedSearchParams.sort)),
    direction: getSortDirection(getStringParam(resolvedSearchParams.direction)),
  };
  const donations = await getAdminDonations(filters);
  const pageQuery = buildPageQuery(resolvedSearchParams);
  const csvExportHref = buildExportHref(pageQuery, "csv");
  const pdfExportHref = buildExportHref(pageQuery, "pdf");

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <div className="sticky top-16 z-30 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">
          Daftar donasi dan status pembayaran.
        </h1>
        <div className="flex items-center gap-2">
          <ExportIconLink
            href={pdfExportHref}
            label="Export PDF"
            download="donasi.pdf"
          >
            PDF
          </ExportIconLink>
          <ExportIconLink
            href={csvExportHref}
            label="Export CSV"
            download="donasi.csv"
          >
            CSV
          </ExportIconLink>
          <DonationAutoRefresh />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <TableToolbar filters={filters} />
        {donations.items.length > 0 ? (
          <div>
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 font-semibold shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    <SortHeader
                      query={pageQuery}
                      field="orderId"
                      activeSort={filters.sort}
                      direction={filters.direction}
                    >
                      Order ID
                    </SortHeader>
                  </th>
                  <th className="sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 font-semibold shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    <SortHeader
                      query={pageQuery}
                      field="donorName"
                      activeSort={filters.sort}
                      direction={filters.direction}
                    >
                      Donatur
                    </SortHeader>
                  </th>
                  <th className="sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 font-semibold shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    <SortHeader
                      query={pageQuery}
                      field="amount"
                      activeSort={filters.sort}
                      direction={filters.direction}
                    >
                      Nominal
                    </SortHeader>
                  </th>
                  <th className="sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 font-semibold shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    <SortHeader
                      query={pageQuery}
                      field="status"
                      activeSort={filters.sort}
                      direction={filters.direction}
                    >
                      Status
                    </SortHeader>
                  </th>
                  <th className="sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 font-semibold shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    Metode
                  </th>
                  <th className="sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 font-semibold shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    <SortHeader
                      query={pageQuery}
                      field="createdAt"
                      activeSort={filters.sort}
                      direction={filters.direction}
                    >
                      Dibuat
                    </SortHeader>
                  </th>
                  <th className="sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 font-semibold shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    Catatan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {donations.items.map((donation) => (
                  <tr key={donation.id} className="align-top">
                    <td className="px-4 py-4 font-medium">
                      {donation.orderId}
                    </td>
                    <td className="px-4 py-4">{getAdminDonorName(donation)}</td>
                    <td className="px-4 py-4">
                      {formatRupiah(donation.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge status={donation.status} />
                      <p className="mt-2 text-xs text-slate-500">
                        {donation.paidAt
                          ? `Dibayar: ${formatAdminDate(donation.paidAt)}`
                          : "Belum dibayar"}
                      </p>
                      {donation.status === DonationStatus.pending && (
                        <CheckStatusButton orderId={donation.orderId} />
                      )}
                    </td>
                    <td className="px-4 py-4 uppercase">
                      {donation.paymentMethod}
                    </td>
                    <td className="px-4 py-4">
                      {formatAdminDate(donation.createdAt)}
                    </td>
                    <td className="max-w-xs px-4 py-4 text-slate-700">
                      <p className="line-clamp-2 text-sm">
                        {donation.message ?? "Tanpa pesan"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            Belum ada donasi yang cocok dengan filter ini.
          </div>
        )}
        <TableFooter
          page={donations.page}
          totalPages={donations.totalPages}
          query={pageQuery}
          pageSize={filters.pageSize}
          total={donations.total}
        />
      </div>
    </main>
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

function TableToolbar({
  filters,
}: {
  filters: {
    status: string | null;
    q: string | null;
    from: string | null;
    to: string | null;
    sort: DonationSortField;
    direction: AdminSortDirection;
  };
}) {
  return (
    <form className="grid gap-3 border-b border-slate-100 bg-white p-5 lg:grid-cols-12">
      <input
        name="q"
        defaultValue={filters.q ?? ""}
        placeholder="Cari order ID atau nama"
        className="field lg:col-span-3"
      />
      <select
        name="status"
        defaultValue={filters.status ?? ""}
        className="field lg:col-span-2"
      >
        <option value="">Semua status</option>
        {Object.values(DonationStatus).map((status) => (
          <option key={status} value={status}>
            {status}
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
      <input type="hidden" name="sort" value={filters.sort} />
      <input type="hidden" name="direction" value={filters.direction} />
      <button className="btn-primary lg:col-span-3">Filter</button>
    </form>
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
  field: DonationSortField;
  activeSort: DonationSortField;
  direction: AdminSortDirection;
  children: React.ReactNode;
}) {
  const isActive = activeSort === field;
  const nextDirection = isActive && direction === "desc" ? "asc" : "desc";
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

function TableFooter({
  page,
  totalPages,
  query,
  pageSize,
  total,
}: {
  page: number;
  totalPages: number;
  query: URLSearchParams;
  pageSize: number;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
      <div className="flex flex-wrap gap-3">
        <span>Total {total} donasi</span>
        <span>
          Halaman {page}/{totalPages}
        </span>
      </div>
      <div className="flex items-center gap-2">
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
        <div className="flex gap-1">
          <PaginationLink page={page - 1} disabled={page <= 1} query={query}>
            ←
          </PaginationLink>
          <PaginationLink
            page={page + 1}
            disabled={page >= totalPages}
            query={query}
          >
            →
          </PaginationLink>
        </div>
      </div>
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
  if (disabled) {
    return (
      <span className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-300">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={`?${buildPageHref(query, page)}`}
      scroll={false}
      className="btn-outline"
    >
      {children}
    </Link>
  );
}

function buildPageQuery(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0 && key !== "page")
      query.set(key, value);
  }
  return query;
}

function buildExportHref(query: URLSearchParams, format: "csv" | "pdf") {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("format", format);
  nextQuery.delete("page");
  nextQuery.delete("pageSize");
  const queryString = nextQuery.toString();
  return queryString
    ? `/api/admin/donations/export?${queryString}`
    : `/api/admin/donations/export?format=${format}`;
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

function getDonationSort(value: string | null): DonationSortField {
  return donationSortOptions.some((option) => option.value === value)
    ? (value as DonationSortField)
    : "createdAt";
}
