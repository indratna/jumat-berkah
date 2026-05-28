"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { formatRupiah } from "@/lib/format";
import type { ExpenseImportPreviewRow } from "@/lib/expenses";

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

const CSV_EXAMPLE = `expenseDate,category,description,amount,vendorName,receiptUrl\n2026-05-29,Beras,Pembelian beras,250000,Pasar,`;

type ImportPreview = {
  rows: ExpenseImportPreviewRow[];
  validRows: unknown[];
  hasErrors: boolean;
};

const emptyForm: ExpenseFormState = {
  id: null,
  expenseDate: new Date().toISOString().slice(0, 10),
  category: EXPENSE_CATEGORIES[0],
  description: "",
  amount: "",
  vendorName: "",
  receiptUrl: "",
};

export function ExpenseManager({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [csvText, setCsvText] = useState(CSV_EXAMPLE);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null,
  );
  const [importMessage, setImportMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    setForm(emptyForm);
    setMessage(
      form.id ? "Pengeluaran diperbarui." : "Pengeluaran ditambahkan.",
    );
    startTransition(() => router.refresh());
  }

  async function handleImport(mode: "preview" | "import") {
    setImportMessage(null);
    setErrors({});

    const response = await fetch("/api/admin/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, csv: csvText }),
    });
    const result = (await response.json().catch(() => null)) as
      | (ImportPreview & {
          imported?: number;
          errors?: Record<string, string>;
          preview?: ImportPreview;
        })
      | null;

    if (!response.ok) {
      setErrors(result?.errors ?? { import: "Import gagal diproses." });
      if (result?.preview) {
        setImportPreview(result.preview);
      }
      return;
    }

    if (mode === "preview") {
      setImportPreview(result ?? null);
      setImportMessage("Preview CSV selesai.");
      return;
    }

    setImportPreview(null);
    setImportMessage(`${result?.imported ?? 0} pengeluaran berhasil diimport.`);
    startTransition(() => router.refresh());
  }

  async function handleDelete(expense: ExpenseRow) {
    const confirmed = window.confirm(
      `Hapus pengeluaran "${expense.description}"?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setErrors({});
    const response = await fetch(`/api/admin/expenses/${expense.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setErrors({ form: "Pengeluaran gagal dihapus." });
      return;
    }

    if (form.id === expense.id) {
      setForm(emptyForm);
    }
    setMessage("Pengeluaran dihapus.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <p className="kicker">
            Form Pengeluaran
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            {form.id ? "Edit pengeluaran" : "Tambah pengeluaran"}
          </h2>
        </div>
        <FieldError message={errors.form} />
        {message ? (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </p>
        ) : null}
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Template cepat</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_EXPENSE_TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    category: template.category,
                    description: template.description,
                    amount: template.amount,
                    vendorName: template.vendorName,
                  })
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

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
        <label className="block text-sm font-medium text-slate-700">
          Deskripsi
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            className="field mt-1 min-h-24"
          />
          <FieldError message={errors.description} />
        </label>
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
        <label className="block text-sm font-medium text-slate-700">
          URL bukti opsional
          <input
            value={form.receiptUrl}
            onChange={(event) =>
              setForm({ ...form, receiptUrl: event.target.value })
            }
            className="field mt-1"
          />
        </label>
        <div className="flex gap-3">
          <button
            disabled={isPending}
            className="btn-primary disabled:opacity-60"
          >
            {form.id ? "Simpan" : "Tambah"}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-lg border border-slate-200 px-5 py-2 font-semibold text-slate-700"
            >
              Batal
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="kicker">
            Import CSV
          </p>
          <h2 className="mt-2 text-xl font-bold">Preview sebelum import</h2>
          <p className="mt-2 text-sm text-slate-600">
            Header wajib: expenseDate, category, description, amount. Opsional:
            vendorName, receiptUrl. Semua baris harus valid sebelum import.
          </p>
          <textarea
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
            className="field mt-4 min-h-32 font-mono text-xs"
          />
          <FieldError message={errors.import ?? errors.csv} />
          {importMessage ? (
            <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {importMessage}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleImport("preview")}
              className="rounded-lg border border-slate-200 px-5 py-2 font-semibold text-slate-700"
            >
              Preview CSV
            </button>
            <button
              type="button"
              disabled={!importPreview || importPreview.hasErrors}
              onClick={() => void handleImport("import")}
              className="btn-primary disabled:opacity-50"
            >
              Import baris valid
            </button>
          </div>
          {importPreview ? (
            <ImportPreviewTable preview={importPreview} />
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3">Nominal</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="align-top"
                    >
                      <td className="px-4 py-4">{expense.displayDate}</td>
                      <td className="px-4 py-4">{expense.category}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{expense.description}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {expense.vendorName ?? "Tanpa vendor"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {formatRupiah(expense.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                id: expense.id,
                                expenseDate: expense.expenseDate,
                                category: expense.category,
                                description: expense.description,
                                amount: String(expense.amount),
                                vendorName: expense.vendorName ?? "",
                                receiptUrl: expense.receiptUrl ?? "",
                              })
                            }
                            className="rounded-lg border border-slate-200 px-3 py-1 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(expense)}
                            className="rounded-lg bg-red-50 px-3 py-1 font-semibold text-red-700"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-500">
              Belum ada pengeluaran yang cocok dengan filter ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImportPreviewTable({ preview }: { preview: ImportPreview }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100">
      <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Baris</th>
            <th className="px-3 py-2">Tanggal</th>
            <th className="px-3 py-2">Kategori</th>
            <th className="px-3 py-2">Deskripsi</th>
            <th className="px-3 py-2">Nominal</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {preview.rows.map((row) => {
            const rowErrors = Object.values(row.errors);
            return (
              <tr key={row.rowNumber} className="border-t border-slate-100">
                <td className="px-3 py-2">{row.rowNumber}</td>
                <td className="px-3 py-2">{row.expenseDate}</td>
                <td className="px-3 py-2">{row.category}</td>
                <td className="px-3 py-2">{row.description}</td>
                <td className="px-3 py-2">
                  {row.amount === null ? "-" : formatRupiah(row.amount)}
                </td>
                <td className="px-3 py-2">
                  {rowErrors.length > 0 ? (
                    <span className="text-red-700">{rowErrors.join(" ")}</span>
                  ) : (
                    <span className="text-green-700">Valid</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-red-600">{message}</p>
  ) : null;
}
