import Link from "next/link";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminSummaryFooter } from "@/components/admin/admin-summary-footer";
import { AdminTopTabs } from "@/components/admin/admin-top-tabs";
import { AutoSubmitSelect } from "../auto-submit-select";
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
  const statusTabs = buildStatusTabs(resolvedSearchParams, filters.status);

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">Donasi Admin</p>
          <h1 className="mt-4 text-2xl font-bold">
            Daftar donasi dan status pembayaran.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Data otomatis disegarkan tiap 10 detik saat halaman terbuka.
          </p>
        </div>
        <DonationAutoRefresh />
      </div>

      <AdminTopTabs tabs={statusTabs} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <TableToolbar filters={filters} />
        <TableMeta
          total={donations.total}
          page={donations.page}
          totalPages={donations.totalPages}
        />
        {donations.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Donatur</th>
                  <th className="px-4 py-3 font-semibold">Nominal</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Metode</th>
                  <th className="px-4 py-3 font-semibold">Dibuat</th>
                  <th className="px-4 py-3 font-semibold">Detail</th>
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
                    </td>
                    <td className="px-4 py-4 uppercase">
                      {donation.paymentMethod}
                    </td>
                    <td className="px-4 py-4">
                      {formatAdminDate(donation.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <p>
                        {donation.paidAt
                          ? `Dibayar: ${formatAdminDate(donation.paidAt)}`
                          : "Belum dibayar"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
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
        <AdminSummaryFooter
          items={[
            { label: "Total cocok", value: String(donations.total) },
            {
              label: "Halaman",
              value: `${donations.page}/${donations.totalPages}`,
            },
            { label: "Baris", value: String(filters.pageSize) },
            { label: "Status", value: filters.status ?? "Semua" },
          ]}
        />
        <TableFooter
          page={donations.page}
          totalPages={donations.totalPages}
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
    status: string | null;
    q: string | null;
    from: string | null;
    to: string | null;
    pageSize: number;
    sort: DonationSortField;
    direction: AdminSortDirection;
  };
}) {
  return (
    <form className="grid gap-3 border-b border-slate-100 bg-white p-5 lg:grid-cols-6">
      <input
        name="q"
        defaultValue={filters.q ?? ""}
        placeholder="Cari order ID atau nama"
        className="field lg:col-span-2"
      />
      <select
        name="status"
        defaultValue={filters.status ?? ""}
        className="field"
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
        {donationSortOptions.map((option) => (
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
        <option value="desc">Terbesar/terbaru</option>
        <option value="asc">Terkecil/terlama</option>
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
      <span>Total {total} donasi</span>
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

function buildStatusTabs(
  params: Record<string, string | string[] | undefined>,
  activeStatus: string | null,
) {
  return [
    {
      href: buildStatusHref(params, null),
      label: "Semua",
      active: !activeStatus,
    },
    {
      href: buildStatusHref(params, DonationStatus.pending),
      label: "Pending",
      active: activeStatus === DonationStatus.pending,
    },
    {
      href: buildStatusHref(params, DonationStatus.settlement),
      label: "Settlement",
      active: activeStatus === DonationStatus.settlement,
    },
    {
      href: buildStatusHref(params, DonationStatus.failure),
      label: "Failed/Expired",
      active:
        activeStatus === DonationStatus.failure ||
        activeStatus === DonationStatus.expire,
    },
  ];
}

function buildStatusHref(
  params: Record<string, string | string[] | undefined>,
  status: DonationStatus | null,
) {
  const query = buildPageQuery(params);
  query.delete("status");
  if (status) {
    query.set("status", status);
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

function getDonationSort(value: string | null): DonationSortField {
  return donationSortOptions.some((option) => option.value === value)
    ? (value as DonationSortField)
    : "createdAt";
}
