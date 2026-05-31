"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { adminTableStyles } from "@/components/admin/admin-table-styles";
import type { AdminSortDirection, ExpenseSortField } from "@/lib/admin";

import { formatRupiah } from "@/lib/format";

import {
  buildExpenseBaseQuery,
  buildExpenseModalQuery,
  type ExpenseModalState,
} from "./expense-manager-state";
import {
  generateExpenseDeleteCaptcha,
  isExpenseDeleteCaptchaCorrect,
  type ExpenseDeleteCaptchaChallenge,
} from "./expense-delete-captcha";

const EXPENSE_CATEGORIES = [
  "Bahan makanan",
  "Lauk pauk",
  "Beras",
  "Gas/alat masak",
  "Kemasan",
  "Transportasi",
  "Operasional lain",
] as const;

type ExpenseRow = {
  id: string;
  expenseDate: string;
  displayDate: string;
  category: string;
  description: string;
  amount: number;
  vendorName: string | null;
  receiptUrl: string | null;
};

type ExpenseFormState = {
  id: string | null;
  expenseDate: string;
  category: string;
  description: string;
  amount: string;
  vendorName: string;
  receiptUrl: string;
};

const QUICK_EXPENSE_TEMPLATES = [
  {
    label: "Beras",
    category: "Beras",
    description: "Pembelian beras untuk paket Jumat Berkah",
    amount: "250000",
    vendorName: "Pasar",
  },
  {
    label: "Lauk pauk",
    category: "Lauk pauk",
    description: "Belanja lauk pauk",
    amount: "300000",
    vendorName: "Pasar",
  },
  {
    label: "Kemasan",
    category: "Kemasan",
    description: "Pembelian kotak makan dan plastik",
    amount: "100000",
    vendorName: "Toko kemasan",
  },
] as const;

const emptyForm: ExpenseFormState = {
  id: null,
  expenseDate: new Date().toISOString().slice(0, 10),
  category: EXPENSE_CATEGORIES[0],
  description: "",
  amount: "",
  vendorName: "",
  receiptUrl: "",
};

export function ExpenseManager({
  expenses,
  sort,
  direction,
  query,
  modalState,
}: {
  expenses: ExpenseRow[];
  sort: ExpenseSortField;
  direction: AdminSortDirection;
  query: URLSearchParams;
  modalState: ExpenseModalState;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const closeHref = useMemo(() => {
    const next = buildExpenseBaseQuery(query);
    return next.length > 0 ? `?${next}` : "?";
  }, [query]);

  const activeEditExpense =
    modalState?.type === "edit"
      ? (expenses.find((item) => item.id === modalState.expenseId) ?? null)
      : null;

  const initialForm = activeEditExpense
    ? {
        id: activeEditExpense.id,
        expenseDate: activeEditExpense.expenseDate,
        category: activeEditExpense.category,
        description: activeEditExpense.description,
        amount: String(activeEditExpense.amount),
        vendorName: activeEditExpense.vendorName ?? "",
        receiptUrl: activeEditExpense.receiptUrl ?? "",
      }
    : emptyForm;

  async function handleSubmit(form: ExpenseFormState) {
    setMessage(null);
    setErrors({});

    const response = await fetch(
      form.id ? `/api/admin/expenses/${form.id}` : "/api/admin/expenses",
      {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseDate: form.expenseDate,
          category: form.category,
          description: form.description,
          amount: Number(form.amount),
          vendorName: form.vendorName || null,
          receiptUrl: form.receiptUrl || null,
        }),
      },
    );

    const result = (await response.json().catch(() => null)) as {
      errors?: Record<string, string>;
    } | null;

    if (!response.ok) {
      setErrors(result?.errors ?? { form: "Pengeluaran gagal disimpan." });
      return;
    }

    setMessage(
      form.id ? "Pengeluaran diperbarui." : "Pengeluaran ditambahkan.",
    );
    startTransition(() => {
      router.push(closeHref, { scroll: false });
      router.refresh();
    });
  }

  async function handleDelete(expenseId: string) {
    setMessage(null);
    setErrors({});

    const response = await fetch(`/api/admin/expenses/${expenseId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setErrors({ form: "Pengeluaran gagal dihapus." });
      return;
    }

    setMessage("Pengeluaran dihapus.");
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
        {expenses.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className={adminTableStyles.stickyHeadCell}>
                  <SortHeader
                    query={query}
                    field="expenseDate"
                    activeSort={sort}
                    direction={direction}
                  >
                    Tanggal
                  </SortHeader>
                </th>
                <th className={adminTableStyles.stickyHeadCell}>
                  <SortHeader
                    query={query}
                    field="category"
                    activeSort={sort}
                    direction={direction}
                  >
                    Kategori
                  </SortHeader>
                </th>
                <th className={adminTableStyles.stickyHeadCell}>Deskripsi</th>
                <th className={adminTableStyles.stickyHeadCell}>
                  <SortHeader
                    query={query}
                    field="amount"
                    activeSort={sort}
                    direction={direction}
                  >
                    Nominal
                  </SortHeader>
                </th>
                <th className={adminTableStyles.stickyHeadCell}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {expenses.map((expense) => (
                <tr key={expense.id} className="align-top">
                  <td className={adminTableStyles.bodyCell}>
                    {expense.displayDate}
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    {expense.category}
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    <p className="font-medium text-slate-900">
                      {expense.description}
                    </p>
                    <div className="mt-1 space-y-1 text-xs text-slate-500">
                      <p>{expense.vendorName ?? "Tanpa vendor"}</p>
                      {expense.receiptUrl ? (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          Lihat bukti
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td
                    className={`${adminTableStyles.bodyCell} whitespace-nowrap font-semibold text-slate-900`}
                  >
                    {formatRupiah(expense.amount)}
                  </td>
                  <td className={adminTableStyles.bodyCell}>
                    <div className="flex gap-2">
                      <Link
                        href={`?${buildExpenseModalQuery({
                          query,
                          modal: "edit",
                          expenseId: expense.id,
                        })}`}
                        scroll={false}
                        className={adminTableStyles.compactAction}
                        aria-label={`Edit ${expense.description}`}
                        title="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <Link
                        href={`?${buildExpenseModalQuery({
                          query,
                          modal: "delete",
                          expenseId: expense.id,
                        })}`}
                        scroll={false}
                        className={`${adminTableStyles.compactAction} border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100`}
                        aria-label={`Hapus ${expense.description}`}
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
            Belum ada pengeluaran yang cocok dengan filter ini.
          </div>
        )}
      </div>

      <ExpenseModal
        modalState={modalState}
        closeHref={closeHref}
        initialForm={initialForm}
        deleteExpense={
          modalState?.type === "delete"
            ? (expenses.find((item) => item.id === modalState.expenseId) ??
              null)
            : null
        }
        errors={errors}
        isPending={isPending}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </>
  );
}

function ExpenseModal({
  modalState,
  closeHref,
  initialForm,
  deleteExpense,
  errors,
  isPending,
  onSubmit,
  onDelete,
}: {
  modalState: ExpenseModalState;
  closeHref: string;
  initialForm: ExpenseFormState;
  deleteExpense: ExpenseRow | null;
  errors: Record<string, string>;
  isPending: boolean;
  onSubmit: (form: ExpenseFormState) => Promise<void>;
  onDelete: (expenseId: string) => Promise<void>;
}) {
  useLockBodyScroll(Boolean(modalState));

  if (!modalState || typeof document === "undefined") {
    return null;
  }

  const title =
    modalState.type === "delete"
      ? "Hapus pengeluaran"
      : modalState.type === "edit"
        ? "Edit pengeluaran"
        : "Tambah pengeluaran";

  return createPortal(
    <div
      className="fixed inset-0 z-80 grid place-items-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
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
              {modalState.type === "delete"
                ? "Konfirmasi hapus"
                : "Pengeluaran"}
            </p>
            <h2
              id="expense-modal-title"
              className="mt-2 text-2xl font-bold text-slate-950"
            >
              {title}
            </h2>
          </div>
          <Link
            href={closeHref}
            scroll={false}
            className="grid size-10 place-items-center rounded-full border border-slate-200 text-lg font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            aria-label="Tutup popup pengeluaran"
          >
            ×
          </Link>
        </div>

        <div className="scrollbar-none max-h-[80vh] overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden">
          {modalState.type === "delete" ? (
            <ExpenseDeletePanel
              key={modalState.expenseId}
              expense={deleteExpense}
              closeHref={closeHref}
              isPending={isPending}
              onDelete={onDelete}
            />
          ) : (
            <ExpenseFormPanel
              key={
                modalState.type === "edit"
                  ? modalState.expenseId
                  : modalState.type
              }
              initialForm={initialForm}
              errors={errors}
              isPending={isPending}
              onSubmit={onSubmit}
              isEditing={modalState.type === "edit"}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ExpenseDeletePanel({
  expense,
  closeHref,
  isPending,
  onDelete,
}: {
  expense: ExpenseRow | null;
  closeHref: string;
  isPending: boolean;
  onDelete: (expenseId: string) => Promise<void>;
}) {
  const [challenge, setChallenge] = useState<ExpenseDeleteCaptchaChallenge>(
    () => generateExpenseDeleteCaptcha(),
  );
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!expense) {
    return (
      <div className="space-y-4 text-sm text-slate-600">
        <p>Pengeluaran tidak ditemukan atau sudah dihapus.</p>
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!expense) return;

    if (
      !isExpenseDeleteCaptchaCorrect({ expected: challenge.expected, answer })
    ) {
      setError("Jawaban captcha tidak sesuai. Coba lagi.");
      setChallenge(generateExpenseDeleteCaptcha());
      setAnswer("");
      return;
    }

    setError(null);
    void onDelete(expense.id);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm font-bold text-rose-800">
          Pengeluaran ini akan dihapus secara permanen.
        </p>
        <dl className="mt-3 grid gap-2 text-sm text-rose-900">
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Tanggal:</dt>
            <dd>{expense.displayDate}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Kategori:</dt>
            <dd>{expense.category}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Deskripsi:</dt>
            <dd>{expense.description}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Nominal:</dt>
            <dd>{formatRupiah(expense.amount)}</dd>
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
          aria-describedby="expense-delete-captcha-hint"
        />
        <p
          id="expense-delete-captcha-hint"
          className="mt-1 text-xs text-slate-500"
        >
          Jawab dengan angka untuk melanjutkan.
        </p>
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
          Hapus pengeluaran
        </button>
      </div>
    </form>
  );
}

function ExpenseFormPanel({
  initialForm,
  errors,
  isPending,
  onSubmit,
  isEditing,
}: {
  initialForm: ExpenseFormState;
  errors: Record<string, string>;
  isPending: boolean;
  onSubmit: (form: ExpenseFormState) => Promise<void>;
  isEditing: boolean;
}) {
  const [form, setForm] = useState(initialForm);
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(
    null,
  );
  const [receiptUploadMessage, setReceiptUploadMessage] = useState<
    string | null
  >(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  async function handleReceiptUpload(file: File | null) {
    setReceiptUploadError(null);
    setReceiptUploadMessage(null);

    if (!file) {
      return;
    }

    if (file.size > 1_048_576) {
      setReceiptUploadError("Ukuran bukti maksimal 1 MB.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setIsUploadingReceipt(true);

    const response = await fetch("/api/admin/expenses/receipts", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as {
      receiptUrl?: string;
      errors?: Record<string, string>;
    } | null;

    setIsUploadingReceipt(false);

    if (!response.ok || !result?.receiptUrl) {
      setReceiptUploadError(
        result?.errors?.file ?? "Upload bukti gagal diproses.",
      );
      return;
    }

    setForm((current) => ({ ...current, receiptUrl: result.receiptUrl ?? "" }));
    setReceiptUploadMessage("Bukti berhasil diunggah.");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(form);
      }}
      className="space-y-5"
    >
      <FieldError message={errors.form} />

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Template cepat</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_EXPENSE_TEMPLATES.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  category: template.category,
                  description: template.description,
                  amount: template.amount,
                  vendorName: template.vendorName,
                }))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700"
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Tanggal
          <input
            type="date"
            value={form.expenseDate}
            onChange={(event) =>
              setForm({ ...form, expenseDate: event.target.value })
            }
            className="field mt-1"
          />
          <FieldError message={errors.expenseDate} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Kategori
          <select
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            className="field mt-1"
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Deskripsi
        <textarea
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          className="field mt-1 min-h-28"
        />
        <FieldError message={errors.description} />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Nominal Rupiah
          <input
            inputMode="numeric"
            value={form.amount}
            onChange={(event) =>
              setForm({ ...form, amount: event.target.value })
            }
            className="field mt-1"
          />
          <FieldError message={errors.amount} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Vendor/penerima opsional
          <input
            value={form.vendorName}
            onChange={(event) =>
              setForm({ ...form, vendorName: event.target.value })
            }
            className="field mt-1"
          />
        </label>
      </div>

      <div className="block text-sm font-medium text-slate-700">
        Bukti/nota opsional
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(event) =>
            void handleReceiptUpload(event.target.files?.[0] ?? null)
          }
          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-emerald-700 hover:border-emerald-200"
        />
        <p className="mt-1 text-xs text-slate-500">
          Format JPG, PNG, WebP, atau PDF. Maksimal 1 MB.
        </p>
        {isUploadingReceipt ? (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Mengunggah bukti…
          </p>
        ) : null}
        {receiptUploadMessage ? (
          <p className="mt-1 text-xs font-semibold text-emerald-700">
            {receiptUploadMessage}
          </p>
        ) : null}
        <FieldError message={receiptUploadError ?? errors.receiptUrl} />
        {form.receiptUrl ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <a
              href={form.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-emerald-700 hover:text-emerald-800"
            >
              Lihat bukti tersimpan
            </a>
            <button
              type="button"
              onClick={() => setForm({ ...form, receiptUrl: "" })}
              className="font-bold text-rose-600 hover:text-rose-700"
            >
              Hapus dari form
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          disabled={isPending}
          className="btn-primary disabled:opacity-60"
        >
          {isEditing ? "Simpan perubahan" : "Tambah pengeluaran"}
        </button>
      </div>
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
  field: ExpenseSortField;
  activeSort: ExpenseSortField;
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
