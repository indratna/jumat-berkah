import Link from "next/link";

import { AdminSummaryFooter } from "@/components/admin/admin-summary-footer";
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

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="kicker">Database Donatur</p>
        <h1 className="mt-4 text-2xl font-bold">
          Kontak operasional donatur untuk admin.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Email dan nomor WhatsApp hanya tampil di admin. Total donasi hanya
          menghitung status settlement agar tidak mencampur pembayaran pending
          atau gagal.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <TableToolbar filters={filters} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 text-sm text-slate-600">
          <span>Total {donors.total} donatur</span>
          <span>
            Halaman {donors.page} dari {donors.totalPages}
          </span>
        </div>
        {donors.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Donatur</th>
                  <th className="px-4 py-3 font-semibold">Kontak</th>
                  <th className="px-4 py-3 font-semibold">Settlement</th>
                  <th className="px-4 py-3 font-semibold">Label</th>
                  <th className="px-4 py-3 font-semibold">Consent WA</th>
                  <th className="px-4 py-3 font-semibold">Aktivitas</th>
                  <th className="px-4 py-3 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {donors.items.map((donor) => (
                  <tr key={donor.key} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">
                        {donor.name}
                      </p>
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
                    <td className="px-4 py-4">
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
                    <td className="px-4 py-4">
                      <Link
                        href={`?${buildDetailHref(pageQuery, donor.key)}`}
                        scroll={false}
                        className="btn-outline"
                      >
                        Lihat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            Belum ada donatur yang cocok dengan filter ini.
          </div>
        )}
        <AdminSummaryFooter
          items={[
            { label: "Total cocok", value: String(donors.total) },
            {
              label: "Halaman",
              value: `${donors.page}/${donors.totalPages}`,
            },
            { label: "Baris", value: String(filters.pageSize) },
            { label: "Aktivitas", value: filters.activity ?? "Semua" },
          ]}
        />
        <TableFooter
          page={donors.page}
          totalPages={donors.totalPages}
          query={pageQuery}
        />
      </section>

      <DonorDetail donor={donors.selectedDonor} query={pageQuery} />
    </main>
  );
}

function TableToolbar({
  filters,
}: {
  filters: {
    q: string | null;
    activity: string | null;
    pageSize: number;
    sort: DonorSortField;
    direction: AdminSortDirection;
    label: string | null;
  };
}) {
  const exportQuery = new URLSearchParams();
  if (filters.q) exportQuery.set("q", filters.q);
  if (filters.activity) exportQuery.set("activity", filters.activity);
  if (filters.label) exportQuery.set("label", filters.label);
  exportQuery.set("sort", filters.sort);
  exportQuery.set("direction", filters.direction);
  return (
    <form className="grid gap-3 border-b border-slate-100 bg-white p-5 lg:grid-cols-7">
      <input
        name="q"
        defaultValue={filters.q ?? ""}
        placeholder="Cari nama, email, WhatsApp"
        className="field lg:col-span-2"
      />
      <select
        name="activity"
        defaultValue={filters.activity ?? ""}
        className="field"
      >
        <option value="">Semua aktivitas</option>
        <option value="settlement">Pernah settlement</option>
        <option value="no_settlement">Belum settlement</option>
      </select>
      <input
        name="label"
        defaultValue={filters.label ?? ""}
        placeholder="Filter label"
        className="field"
      />
      <select name="sort" defaultValue={filters.sort} className="field">
        {donorSortOptions.map((option) => (
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
      <button className="btn-primary">Filter</button>
      <Link
        href={`/api/admin/donors/export?${exportQuery.toString()}`}
        className="btn-outline text-center"
      >
        Export CSV
      </Link>
    </form>
  );
}

function DonorDetail({
  donor,
  query,
}: {
  donor: AdminDonor | null;
  query: URLSearchParams;
}) {
  if (!donor) {
    return null;
  }

  const closeQuery = new URLSearchParams(query);
  closeQuery.delete("donor");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <aside className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">Detail Donatur</p>
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
        <DonorManagementForm donor={donor} />
        <DonorMergeForm donor={donor} />
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
      </aside>
    </div>
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
          className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100"
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
  const label = formatConsentStatus(donor);
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

function TableFooter({
  page,
  totalPages,
  query,
}: {
  page: number;
  totalPages: number;
  query: URLSearchParams;
}) {
  return (
    <div className="flex gap-2 border-t border-slate-100 px-5 py-4 text-sm">
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

  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  return (
    <Link
      href={`?${nextQuery.toString()}`}
      scroll={false}
      className="btn-outline"
    >
      {children}
    </Link>
  );
}

function buildDetailHref(query: URLSearchParams, donorKey: string) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("donor", donorKey);
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

function getDonorSort(value: string | null): DonorSortField {
  return donorSortOptions.some((option) => option.value === value)
    ? (value as DonorSortField)
    : "lastDonationAt";
}
