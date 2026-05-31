"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState, useTransition } from "react";

import { adminTableStyles } from "@/components/admin/admin-table-styles";

import {
  buildDistributionBaseQuery,
  buildDistributionModalQuery,
  type DistributionModalState,
} from "./distribution-manager-state";
import {
  generateExpenseDeleteCaptcha,
  isExpenseDeleteCaptchaCorrect,
  type ExpenseDeleteCaptchaChallenge,
} from "../pengeluaran/expense-delete-captcha";

const PHOTO_LIMIT = 6;

export type DistributionRow = {
  id: string;
  cycleStartLabel: string;
  cycleStartIso: string;
  title: string;
  summary: string;
  packageCount: number | null;
  locationSummary: string | null;
  photoUrls: string[];
  publishedAt: string | null;
};

type DistributionFormSubmit = {
  cycleStart: string;
  title: string;
  summary: string;
  packageCount: number | null;
  locationSummary: string | null;
  photoUrls: string[];
  publish: boolean;
  isEditing: boolean;
};

export function DistributionManager({
  reports,
  query,
  modalState,
  currentCycleStart,
  currentCycleLabel,
}: {
  reports: DistributionRow[];
  query: URLSearchParams;
  modalState: DistributionModalState;
  currentCycleStart: string;
  currentCycleLabel: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const closeHref = useMemo(() => {
    const next = buildDistributionBaseQuery(query);
    return next.length > 0 ? `?${next}` : "?";
  }, [query]);

  const editingReport =
    modalState?.type === "edit"
      ? (reports.find((report) => report.id === modalState.reportId) ?? null)
      : null;
  const deletingReport =
    modalState?.type === "delete"
      ? (reports.find((report) => report.id === modalState.reportId) ?? null)
      : null;

  async function handleSubmit(input: DistributionFormSubmit) {
    setMessage(null);
    setErrors({});

    const response = await fetch("/api/admin/distribution-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cycleStart: input.cycleStart,
        title: input.title,
        summary: input.summary,
        packageCount: input.packageCount,
        locationSummary: input.locationSummary,
        photoUrls: input.photoUrls,
        publish: input.publish,
      }),
    });

    const result = (await response.json().catch(() => null)) as {
      errors?: Record<string, string>;
    } | null;

    if (!response.ok) {
      setErrors(result?.errors ?? { form: "Cerita gagal disimpan." });
      return;
    }

    setMessage(input.isEditing ? "Cerita diperbarui." : "Cerita ditambahkan.");
    startTransition(() => {
      router.push(closeHref, { scroll: false });
      router.refresh();
    });
  }

  async function handleDelete(reportId: string) {
    setMessage(null);
    setErrors({});

    const response = await fetch(
      `/api/admin/distribution-report?id=${encodeURIComponent(reportId)}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      setErrors({ form: "Cerita gagal dihapus." });
      return;
    }

    setMessage("Cerita dihapus.");
    startTransition(() => {
      router.push(closeHref, { scroll: false });
      router.refresh();
    });
  }

  return (
    <>
      {message ? (
        <p className="mx-5 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}
      {errors.form ? (
        <p className="mx-5 mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errors.form}
        </p>
      ) : null}

      <div>
        {reports.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className={adminTableStyles.stickyHeadCell}>Siklus</th>
                <th className={adminTableStyles.stickyHeadCell}>Cerita</th>
                <th className={adminTableStyles.stickyHeadCell}>Status</th>
                <th className={adminTableStyles.stickyHeadCell}>Foto</th>
                <th className={adminTableStyles.stickyHeadCell}>Paket</th>
                <th className={adminTableStyles.stickyHeadCell}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {reports.map((report) => (
                <tr key={report.id} className="align-top">
                  <td className={adminTableStyles.bodyCell}>
                    <p className="font-semibold text-slate-950">
                      {report.cycleStartLabel}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {report.cycleStartIso}
                    </p>
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    <p className="font-semibold text-slate-950">
                      {report.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      {report.summary}
                    </p>
                    {report.locationSummary ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Lokasi: {report.locationSummary}
                      </p>
                    ) : null}
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                        report.publishedAt
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {report.publishedAt ? "Publik" : "Draft"}
                    </span>
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    {report.photoUrls.length}
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    {report.packageCount ?? "-"}
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    <div className="flex gap-2">
                      <Link
                        href={`?${buildDistributionModalQuery({
                          query,
                          modal: "edit",
                          reportId: report.id,
                        })}`}
                        scroll={false}
                        className={adminTableStyles.compactAction}
                        aria-label={`Edit ${report.title}`}
                        title="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <Link
                        href={`?${buildDistributionModalQuery({
                          query,
                          modal: "delete",
                          reportId: report.id,
                        })}`}
                        scroll={false}
                        className={`${adminTableStyles.compactAction} border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100`}
                        aria-label={`Hapus ${report.title}`}
                        title="Hapus"
                      >
                        <DeleteIcon />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={adminTableStyles.emptyState}>
            Belum ada cerita penyaluran tersimpan.
          </div>
        )}
      </div>

      <DistributionModal
        modalState={modalState}
        closeHref={closeHref}
        editingReport={editingReport}
        deletingReport={deletingReport}
        currentCycleStart={currentCycleStart}
        currentCycleLabel={currentCycleLabel}
        errors={errors}
        isPending={isPending}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </>
  );
}

function DistributionModal({
  modalState,
  closeHref,
  editingReport,
  deletingReport,
  currentCycleStart,
  currentCycleLabel,
  errors,
  isPending,
  onSubmit,
  onDelete,
}: {
  modalState: DistributionModalState;
  closeHref: string;
  editingReport: DistributionRow | null;
  deletingReport: DistributionRow | null;
  currentCycleStart: string;
  currentCycleLabel: string;
  errors: Record<string, string>;
  isPending: boolean;
  onSubmit: (input: DistributionFormSubmit) => Promise<void>;
  onDelete: (reportId: string) => Promise<void>;
}) {
  useLockBodyScroll(Boolean(modalState));

  if (!modalState || typeof document === "undefined") {
    return null;
  }

  const title =
    modalState.type === "delete"
      ? "Hapus cerita penyaluran"
      : modalState.type === "edit"
        ? "Edit cerita penyaluran"
        : "Tambah cerita penyaluran";

  return createPortal(
    <div
      className="fixed inset-0 z-80 grid place-items-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="distribution-modal-title"
    >
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.16em] ${
                modalState.type === "delete"
                  ? "text-rose-700"
                  : "text-emerald-700"
              }`}
            >
              {modalState.type === "delete" ? "Konfirmasi hapus" : "Penyaluran"}
            </p>
            <h2
              id="distribution-modal-title"
              className="mt-2 text-2xl font-bold text-slate-950"
            >
              {title}
            </h2>
          </div>
          <Link
            href={closeHref}
            scroll={false}
            className="grid size-10 place-items-center rounded-full border border-slate-200 text-lg font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            aria-label="Tutup popup penyaluran"
          >
            ×
          </Link>
        </div>

        <div className="scrollbar-none max-h-[80vh] overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden">
          {modalState.type === "delete" ? (
            <DistributionDeletePanel
              key={modalState.reportId}
              report={deletingReport}
              closeHref={closeHref}
              isPending={isPending}
              onDelete={onDelete}
            />
          ) : (
            <DistributionFormPanel
              key={
                modalState.type === "edit"
                  ? modalState.reportId
                  : `add-${currentCycleStart}`
              }
              cycleStart={
                modalState.type === "edit" && editingReport
                  ? editingReport.cycleStartIso
                  : currentCycleStart
              }
              cycleLabel={
                modalState.type === "edit" && editingReport
                  ? editingReport.cycleStartLabel
                  : currentCycleLabel
              }
              initial={editingReport}
              isEditing={modalState.type === "edit"}
              isPending={isPending}
              errors={errors}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DistributionFormPanel({
  cycleStart,
  cycleLabel,
  initial,
  isEditing,
  isPending,
  errors,
  onSubmit,
}: {
  cycleStart: string;
  cycleLabel: string;
  initial: DistributionRow | null;
  isEditing: boolean;
  isPending: boolean;
  errors: Record<string, string>;
  onSubmit: (input: DistributionFormSubmit) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [packageCount, setPackageCount] = useState(
    initial?.packageCount !== null && initial?.packageCount !== undefined
      ? String(initial.packageCount)
      : "",
  );
  const [locationSummary, setLocationSummary] = useState(
    initial?.locationSummary ?? "",
  );
  const [photoUrls, setPhotoUrls] = useState(initial?.photoUrls ?? []);
  const [publish, setPublish] = useState(Boolean(initial?.publishedAt));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handlePhotoUpload(file: File | null) {
    setUploadError(null);

    if (!file) return;

    if (photoUrls.length >= PHOTO_LIMIT) {
      setUploadError(`Maksimal ${PHOTO_LIMIT} foto.`);
      return;
    }

    if (file.size > 1_048_576) {
      setUploadError("Ukuran foto maksimal 1 MB.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setIsUploading(true);

    const response = await fetch("/api/admin/distribution/photos", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as {
      url?: string;
      errors?: Record<string, string>;
    } | null;

    setIsUploading(false);

    if (!response.ok || !result?.url) {
      setUploadError(result?.errors?.file ?? "Upload foto gagal diproses.");
      return;
    }

    setPhotoUrls((current) => [...current, result.url as string]);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const parsedPackageCount = packageCount.trim()
          ? Number.parseInt(packageCount.replace(/\D/g, ""), 10)
          : null;
        void onSubmit({
          cycleStart,
          title: title.trim(),
          summary: summary.trim(),
          packageCount: Number.isNaN(parsedPackageCount)
            ? null
            : parsedPackageCount,
          locationSummary: locationSummary.trim() || null,
          photoUrls,
          publish,
          isEditing,
        });
      }}
      className="space-y-5"
    >
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-950">Siklus aktif</p>
        <p className="mt-1">{cycleLabel}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-600">
          <li>Hindari menampilkan wajah penerima manfaat tanpa izin.</li>
          <li>Foto kegiatan/paket lebih aman daripada identitas pribadi.</li>
          <li>Maksimal 6 foto, masing-masing 1 MB.</li>
        </ul>
      </div>

      <FieldError message={errors.form} />

      <label className="block text-sm font-medium text-slate-700">
        Judul cerita
        <input
          type="text"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          className="field mt-1"
          required
        />
        <FieldError message={errors.title} />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Ringkasan (maks 1500 karakter)
        <textarea
          value={summary}
          maxLength={1500}
          rows={7}
          onChange={(event) => setSummary(event.target.value)}
          className="field mt-1"
          required
        />
        <FieldError message={errors.summary} />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Jumlah paket (opsional)
          <input
            inputMode="numeric"
            value={packageCount}
            onChange={(event) => setPackageCount(event.target.value)}
            className="field mt-1"
          />
          <FieldError message={errors.packageCount} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Lokasi (opsional)
          <input
            type="text"
            maxLength={200}
            value={locationSummary}
            onChange={(event) => setLocationSummary(event.target.value)}
            className="field mt-1"
          />
          <FieldError message={errors.locationSummary} />
        </label>
      </div>

      <div className="block text-sm font-medium text-slate-700">
        Foto publik (maks {PHOTO_LIMIT})
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) =>
            void handlePhotoUpload(event.target.files?.[0] ?? null)
          }
          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-emerald-700 hover:border-emerald-200"
        />
        <p className="mt-1 text-xs text-slate-500">
          Format JPG, PNG, atau WebP. Maksimal 1 MB per foto.
        </p>
        {isUploading ? (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Mengunggah foto…
          </p>
        ) : null}
        <FieldError message={uploadError ?? errors.photoUrls} />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {photoUrls.map((url, index) => (
            <div
              key={url}
              className="rounded-xl border border-slate-200 p-3 text-xs"
            >
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Foto {index + 1}
              </a>
              <button
                type="button"
                onClick={() =>
                  setPhotoUrls((current) =>
                    current.filter((item) => item !== url),
                  )
                }
                className="ml-3 font-bold text-rose-600 hover:text-rose-700"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={publish}
          onChange={(event) => setPublish(event.target.checked)}
          className="size-4"
        />
        Publish cerita ini ke laporan publik
      </label>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          disabled={isPending}
          className="btn-primary disabled:opacity-60"
        >
          {isEditing ? "Simpan perubahan" : "Simpan cerita"}
        </button>
      </div>
    </form>
  );
}

function DistributionDeletePanel({
  report,
  closeHref,
  isPending,
  onDelete,
}: {
  report: DistributionRow | null;
  closeHref: string;
  isPending: boolean;
  onDelete: (reportId: string) => Promise<void>;
}) {
  const [challenge, setChallenge] = useState<ExpenseDeleteCaptchaChallenge>(
    () => generateExpenseDeleteCaptcha(),
  );
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!report) {
    return (
      <div className="space-y-4 text-sm text-slate-600">
        <p>Cerita penyaluran tidak ditemukan atau sudah dihapus.</p>
        <div className="flex justify-end">
          <Link
            href={closeHref}
            scroll={false}
            className="rounded-lg border border-slate-200 px-5 py-2 font-semibold text-slate-700"
          >
            Tutup
          </Link>
        </div>
      </div>
    );
  }

  const reportToDelete = report;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !isExpenseDeleteCaptchaCorrect({ expected: challenge.expected, answer })
    ) {
      setError("Jawaban captcha tidak sesuai. Coba lagi.");
      setChallenge(generateExpenseDeleteCaptcha());
      setAnswer("");
      return;
    }

    setError(null);
    void onDelete(reportToDelete.id);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm font-bold text-rose-800">
          Cerita ini akan dihapus secara permanen.
        </p>
        <dl className="mt-3 grid gap-2 text-sm text-rose-900">
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Siklus:</dt>
            <dd>{report.cycleStartLabel}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Judul:</dt>
            <dd>{report.title}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Status:</dt>
            <dd>{report.publishedAt ? "Publik" : "Draft"}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Foto:</dt>
            <dd>{report.photoUrls.length}</dd>
          </div>
        </dl>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Captcha keamanan: berapa hasil dari{" "}
        <span className="font-bold text-slate-950">
          {challenge.left} + {challenge.right}
        </span>
        ?
        <input
          inputMode="numeric"
          autoComplete="off"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          className="field mt-1 max-w-32"
          placeholder="Jawaban"
        />
        {error ? <FieldError message={error} /> : null}
      </label>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href={closeHref}
          scroll={false}
          className="rounded-lg border border-slate-200 px-5 py-2 font-semibold text-slate-700"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
        >
          Hapus cerita
        </button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-red-600">{message}</p>
  ) : null;
}

function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [active]);
}

function EditIcon() {
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
      <path d="M3.75 13.75v2.5h2.5L14.5 8 12 5.5l-8.25 8.25Z" />
      <path d="M10.75 6.75 13.25 9.25" />
      <path d="M11.25 4.75 13 3a1.768 1.768 0 1 1 2.5 2.5l-1.75 1.75" />
    </svg>
  );
}

function DeleteIcon() {
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
      <path d="M4.75 6.25h10.5" />
      <path d="M7.25 6.25V4.75a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1v1.5" />
      <path d="m6.25 6.25.7 8.05a1 1 0 0 0 1 .95h4.1a1 1 0 0 0 1-.95l.7-8.05" />
      <path d="M8.5 8.75v4.5" />
      <path d="M11.5 8.75v4.5" />
    </svg>
  );
}
