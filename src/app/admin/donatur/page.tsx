import Link from "next/link";

import { AdminDataPageShell } from "@/components/admin/admin-data-page-shell";
import { AdminStickyPageBar } from "@/components/admin/admin-sticky-page-bar";
import { AdminTableActionButton } from "@/components/admin/admin-table-action-button";
import { AdminTableCard } from "@/components/admin/admin-table-card";
import { AdminTableFooter } from "@/components/admin/admin-table-footer";
import { adminTableStyles } from "@/components/admin/admin-table-styles";
import { AutoSubmitSelect } from "../auto-submit-select";
import { DonorManagementForm } from "@/app/admin/donatur/donor-management-form";
import { DonorMergeForm } from "@/app/admin/donatur/donor-merge-form";
import {
  type AdminDonor,
  type AdminSortDirection,
  type DonorSortField,
  formatAdminDate,
  formatRupiah,
  getAdminDonors,
  normalizePage,
  normalizePageSize,
} from "@/lib/admin";

type AdminDonorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type DonorDetailMode = "view" | "edit" | "merge";

const donorSortOptions: Array<{ value: DonorSortField; label: string }> = [
  { value: "lastDonationAt", label: "Aktivitas terakhir" },
  { value: "totalSettlementAmount", label: "Total settlement" },
  { value: "settlementCount", label: "Jumlah settlement" },
  { value: "name", label: "Nama" },
];

export default async function AdminDonorPage({
  searchParams,
}: AdminDonorPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = {
    q: getStringParam(resolvedSearchParams.q),
    activity: getStringParam(resolvedSearchParams.activity),
    page: normalizePage(getNumberParam(resolvedSearchParams.page)),
    pageSize: normalizePageSize(getNumberParam(resolvedSearchParams.pageSize)),
    sort: getDonorSort(getStringParam(resolvedSearchParams.sort)),
    direction: getSortDirection(getStringParam(resolvedSearchParams.direction)),
    selectedKey: getStringParam(resolvedSearchParams.donor),
    label: getStringParam(resolvedSearchParams.label),
  };
  const donors = await getAdminDonors(filters);
  const pageQuery = buildPageQuery(resolvedSearchParams);
  const detailMode = getDonorDetailMode(
    getStringParam(resolvedSearchParams.mode),
  );

  return (
    <AdminDataPageShell>
      <AdminStickyPageBar
        title="Kontak operasional donatur."
        actions={
          <>
            <a
              href={`/api/admin/donors/export?${buildDonorExportHref(filters, "pdf")}`}
              className="inline-flex h-10 min-w-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black tracking-wide text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              download="donatur.pdf"
              target="_blank"
              rel="noopener"
              aria-label="Export PDF donatur"
              title="Export PDF donatur"
            >
              PDF
            </a>
            <a
              href={`/api/admin/donors/export?${buildDonorExportHref(filters, "csv")}`}
              className="inline-flex h-10 min-w-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black tracking-wide text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              download="donatur.csv"
              target="_blank"
              rel="noopener"
              aria-label="Export CSV donatur"
              title="Export CSV donatur"
            >
              CSV
            </a>
          </>
        }
      />

      <AdminTableCard>
        <TableToolbar filters={filters} />
        {donors.items.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className={adminTableStyles.stickyHeadCell}>
                  <SortHeader
                    query={pageQuery}
                    field="name"
                    activeSort={filters.sort}
                    direction={filters.direction}
                  >
                    Donatur
                  </SortHeader>
                </th>
                <th className={adminTableStyles.stickyHeadCell}>Kontak</th>
                <th className={adminTableStyles.stickyHeadCell}>
                  <SortHeader
                    query={pageQuery}
                    field="totalSettlementAmount"
                    activeSort={filters.sort}
                    direction={filters.direction}
                  >
                    Settlement
                  </SortHeader>
                </th>
                <th className={adminTableStyles.stickyHeadCell}>Label</th>
                <th className={adminTableStyles.stickyHeadCell}>Consent WA</th>
                <th className={adminTableStyles.stickyHeadCell}>
                  <SortHeader
                    query={pageQuery}
                    field="lastDonationAt"
                    activeSort={filters.sort}
                    direction={filters.direction}
                  >
                    Aktivitas
                  </SortHeader>
                </th>
                <th className={adminTableStyles.stickyHeadCell}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {donors.items.map((donor) => (
                <tr key={donor.key} className="align-top">
                  <td className={adminTableStyles.bodyCell}>
                    <p className="font-semibold text-slate-950">{donor.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {donor.userId ? "Akun terdaftar" : "Donatur tamu"}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    <p>{donor.email ?? "Email kosong"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {donor.phone ?? "WhatsApp kosong"}
                    </p>
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    <p className="font-semibold">
                      {formatRupiah(donor.totalSettlementAmount)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {donor.settlementCount} settlement dari{" "}
                      {donor.donationCount} donasi
                    </p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    <LabelList labels={donor.labels} />
                    {donor.internalNote ? (
                      <p className="mt-2 text-xs font-semibold text-amber-700">
                        Ada catatan
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    <ConsentBadge donor={donor} />
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {donor.lastDonationAt
                      ? formatAdminDate(donor.lastDonationAt)
                      : "Belum ada donasi"}
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    <DonorActionButtons
                      query={pageQuery}
                      donorKey={donor.key}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={adminTableStyles.emptyState}>
            Belum ada donatur yang cocok dengan filter ini.
          </div>
        )}
        <AdminTableFooter
          page={donors.page}
          totalPages={donors.totalPages}
          hrefBuilder={(page) => buildPageHref(pageQuery, page)}
          pageSizeControl={
            <AutoSubmitSelect
              name="pageSize"
              label="Baris"
              defaultValue={String(filters.pageSize)}
              hiddenFields={Array.from(pageQuery.entries()).map(
                ([name, value]) => ({
                  name,
                  value,
                }),
              )}
              options={[10, 25, 50, 100].map((size) => ({
                value: String(size),
                label: String(size),
              }))}
            />
          }
          totalLabel={`Total ${donors.total} donatur · Aktivitas ${filters.activity ?? "Semua"}`}
        />
      </AdminTableCard>

      <DonorDetail
        donor={donors.selectedDonor}
        query={pageQuery}
        mode={detailMode}
      />
    </AdminDataPageShell>
  );
}

function TableToolbar({
  filters,
}: {
  filters: {
    q: string | null;
    activity: string | null;
  };
}) {
  return (
    <form className={`${adminTableStyles.toolbar} lg:grid-cols-12`}>
      <input
        name="q"
        defaultValue={filters.q ?? ""}
        placeholder="Cari nama, email, WhatsApp"
        className="field lg:col-span-5"
      />
      <select
        name="activity"
        defaultValue={filters.activity ?? ""}
        className="field lg:col-span-3"
      >
        <option value="">Semua aktivitas</option>
        <option value="settlement">Pernah settlement</option>
        <option value="no_settlement">Belum settlement</option>
      </select>
      <button className="btn-primary lg:col-span-4">Filter</button>
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
  field: DonorSortField;
  activeSort: DonorSortField;
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

function DonorActionButtons({
  query,
  donorKey,
}: {
  query: URLSearchParams;
  donorKey: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminTableActionButton
        href={`?${buildDetailHref(query, donorKey, "view")}`}
        ariaLabel="Lihat"
      >
        <ActionIconView />
      </AdminTableActionButton>
      <AdminTableActionButton
        href={`?${buildDetailHref(query, donorKey, "edit")}`}
        ariaLabel="Edit"
        variant="primary"
      >
        <ActionIconEdit />
      </AdminTableActionButton>
      <AdminTableActionButton
        href={`?${buildDetailHref(query, donorKey, "merge")}`}
        ariaLabel="Gabungkan"
      >
        <ActionIconMerge />
      </AdminTableActionButton>
    </div>
  );
}

function ActionIconView() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="size-4 stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.75 10s3-5.25 8.25-5.25S18.25 10 18.25 10 15.25 15.25 10 15.25 1.75 10 1.75 10Z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

function ActionIconEdit() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="size-4 stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.75 13.75v2.5h2.5L15 7.5 12.5 5l-8.75 8.75Z" />
      <path d="m11.75 5.75 2.5 2.5" />
    </svg>
  );
}

function ActionIconMerge() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="size-4 stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4.5H5.75A2.25 2.25 0 0 0 3.5 6.75v.5A2.25 2.25 0 0 0 5.75 9.5h8.5a2.25 2.25 0 0 1 2.25 2.25v.5a2.25 2.25 0 0 1-2.25 2.25H13" />
      <path d="m11 2.75-4 4 4 4" />
      <path d="m9 9.25 4 4-4 4" />
    </svg>
  );
}

function DonorDetail({
  donor,
  query,
  mode,
}: {
  donor: AdminDonor | null;
  query: URLSearchParams;
  mode: DonorDetailMode;
}) {
  if (!donor) {
    return null;
  }

  const closeQuery = new URLSearchParams(query);
  closeQuery.delete("donor");
  closeQuery.delete("mode");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <aside className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">{getModeTitle(mode)}</p>
            <h2 className="mt-3 text-2xl font-bold">{donor.name}</h2>
          </div>
          <Link
            href={`?${closeQuery.toString()}`}
            scroll={false}
            className="btn-outline"
          >
            Tutup
          </Link>
        </div>
        {mode === "view" ? <DonorSummary donor={donor} /> : null}
        {mode === "edit" ? <DonorManagementForm donor={donor} /> : null}
        {mode === "merge" ? <DonorMergeForm donor={donor} /> : null}
      </aside>
    </div>
  );
}

function DonorSummary({ donor }: { donor: AdminDonor }) {
  return (
    <>
      <dl className="mt-5 space-y-4 text-sm">
        <DetailRow label="Email" value={donor.email ?? "Tidak ada"} />
        <DetailRow label="WhatsApp" value={donor.phone ?? "Tidak ada"} />
        <DetailRow label="Consent WA" value={formatConsentStatus(donor)} />
        <DetailRow
          label="Label"
          value={
            donor.labels.length > 0 ? donor.labels.join(", ") : "Tidak ada"
          }
        />
        <DetailRow
          label="Catatan internal"
          value={donor.internalNote ?? "Tidak ada"}
        />
        <DetailRow
          label="Opt-in WA"
          value={
            donor.whatsappReminderOptInAt
              ? formatAdminDate(donor.whatsappReminderOptInAt)
              : "Belum pernah"
          }
        />
        <DetailRow
          label="Instruksi opt-out"
          value="Balas STOP saat fitur pengingat WhatsApp aktif."
        />
        <DetailRow
          label="Tipe"
          value={donor.userId ? "Akun terdaftar" : "Tamu"}
        />
        <DetailRow
          label="Total settlement"
          value={formatRupiah(donor.totalSettlementAmount)}
        />
        <DetailRow
          label="Jumlah settlement"
          value={String(donor.settlementCount)}
        />
        <DetailRow label="Total donasi" value={String(donor.donationCount)} />
        <DetailRow
          label="Donasi pertama"
          value={
            donor.firstDonationAt
              ? formatAdminDate(donor.firstDonationAt)
              : "Belum ada"
          }
        />
        <DetailRow
          label="Donasi terakhir"
          value={
            donor.lastDonationAt
              ? formatAdminDate(donor.lastDonationAt)
              : "Belum ada"
          }
        />
      </dl>
      <div className="mt-6 space-y-2">
        <Link
          href={`/admin/donasi?q=${encodeURIComponent(donor.email ?? donor.phone ?? donor.name)}`}
          className="btn-primary w-full text-sm"
        >
          Buka riwayat donasi
        </Link>
        {donor.donationOrderIds.slice(0, 5).map((orderId) => (
          <Link
            key={orderId}
            href={`/admin/donasi?q=${encodeURIComponent(orderId)}`}
            className="block rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {orderId}
          </Link>
        ))}
      </div>
    </>
  );
}

function LabelList({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return <span className="text-xs text-slate-400">Tanpa label</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {labels.slice(0, 3).map((label) => (
        <span
          key={label}
          className="rounded-full bg-emerald-50 px-1.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100"
        >
          {label}
        </span>
      ))}
      {labels.length > 3 ? (
        <span className="rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
          +{labels.length - 3}
        </span>
      ) : null}
    </div>
  );
}

function ConsentBadge({ donor }: { donor: AdminDonor }) {
  const label = formatConsentBadgeLabel(donor);
  const tone = donor.whatsappReminderOptIn
    ? "bg-green-50 text-green-700 ring-green-100"
    : "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ring-1 ${tone}`}
    >
      {label}
    </span>
  );
}

function formatConsentBadgeLabel(donor: AdminDonor) {
  if (donor.whatsappReminderOptIn) {
    return "Opt-in WA";
  }

  if (!donor.phone) {
    return "WA kosong";
  }

  return "Belum opt-in";
}

function formatConsentStatus(donor: AdminDonor) {
  if (donor.whatsappReminderOptIn) {
    return "Opt-in pengingat";
  }

  if (!donor.phone) {
    return "Tidak ada nomor WA";
  }

  return "Belum opt-in";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function buildDonorExportHref(
  filters: {
    q: string | null;
    activity: string | null;
    label: string | null;
    sort: DonorSortField;
    direction: AdminSortDirection;
  },
  format: "csv" | "pdf",
) {
  const exportQuery = new URLSearchParams();
  if (filters.q) exportQuery.set("q", filters.q);
  if (filters.activity) exportQuery.set("activity", filters.activity);
  if (filters.label) exportQuery.set("label", filters.label);
  exportQuery.set("sort", filters.sort);
  exportQuery.set("direction", filters.direction);
  exportQuery.set("format", format);
  return exportQuery.toString();
}

function buildPageHref(query: URLSearchParams, page: number) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  return nextQuery.toString();
}

function buildDetailHref(
  query: URLSearchParams,
  donorKey: string,
  mode: DonorDetailMode,
) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("donor", donorKey);
  nextQuery.set("mode", mode);
  return nextQuery.toString();
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

function getDonorDetailMode(value: string | null): DonorDetailMode {
  return value === "edit" || value === "merge" ? value : "view";
}

function getModeTitle(mode: DonorDetailMode) {
  if (mode === "edit") {
    return "Edit Donatur";
  }

  if (mode === "merge") {
    return "Gabungkan Donatur";
  }

  return "Ringkasan Donatur";
}

function getDonorSort(value: string | null): DonorSortField {
  return donorSortOptions.some((option) => option.value === value)
    ? (value as DonorSortField)
    : "lastDonationAt";
}
