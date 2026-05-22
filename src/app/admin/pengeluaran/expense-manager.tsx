"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setErrors({});

    const response = await fetch(form.id ? `/api/admin/expenses/${form.id}` : "/api/admin/expenses", {
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
    });

    const result = (await response.json().catch(() => null)) as { errors?: Record<string, string> } | null;

    if (!response.ok) {
      setErrors(result?.errors ?? { form: "Pengeluaran gagal disimpan." });
      return;
    }

    setForm(emptyForm);
    setMessage(form.id ? "Pengeluaran diperbarui." : "Pengeluaran ditambahkan.");
    startTransition(() => router.refresh());
  }

  async function handleDelete(expense: ExpenseRow) {
    const confirmed = window.confirm(`Hapus pengeluaran "${expense.description}"?`);

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setErrors({});
    const response = await fetch(`/api/admin/expenses/${expense.id}`, { method: "DELETE" });

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
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Form Pengeluaran</p>
          <h2 className="mt-2 text-2xl font-bold">{form.id ? "Edit pengeluaran" : "Tambah pengeluaran"}</h2>
        </div>
        <FieldError message={errors.form} />
        {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        <label className="block text-sm font-medium text-slate-700">
          Tanggal
          <input type="date" value={form.expenseDate} onChange={(event) => setForm({ ...form, expenseDate: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
          <FieldError message={errors.expenseDate} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Kategori
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
            {EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <FieldError message={errors.category} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Deskripsi
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2" />
          <FieldError message={errors.description} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Nominal Rupiah
          <input inputMode="numeric" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
          <FieldError message={errors.amount} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Vendor/penerima opsional
          <input value={form.vendorName} onChange={(event) => setForm({ ...form, vendorName: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          URL bukti opsional
          <input value={form.receiptUrl} onChange={(event) => setForm({ ...form, receiptUrl: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
        </label>
        <div className="flex gap-3">
          <button disabled={isPending} className="rounded-full bg-slate-900 px-5 py-2 font-semibold text-white disabled:opacity-60">{form.id ? "Simpan" : "Tambah"}</button>
          {form.id ? <button type="button" onClick={() => setForm(emptyForm)} className="rounded-full border border-slate-200 px-5 py-2 font-semibold text-slate-700">Batal</button> : null}
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        {expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Deskripsi</th><th className="px-4 py-3">Nominal</th><th className="px-4 py-3">Aksi</th></tr></thead>
              <tbody>{expenses.map((expense) => <tr key={expense.id} className="border-t border-slate-100 align-top"><td className="px-4 py-4">{expense.displayDate}</td><td className="px-4 py-4">{expense.category}</td><td className="px-4 py-4"><p className="font-medium">{expense.description}</p><p className="mt-1 text-xs text-slate-500">{expense.vendorName ?? "Tanpa vendor"}</p></td><td className="px-4 py-4">{formatRupiahClient(expense.amount)}</td><td className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => setForm({ id: expense.id, expenseDate: expense.expenseDate, category: expense.category, description: expense.description, amount: String(expense.amount), vendorName: expense.vendorName ?? "", receiptUrl: expense.receiptUrl ?? "" })} className="rounded-full border border-slate-200 px-3 py-1 font-semibold">Edit</button><button type="button" onClick={() => void handleDelete(expense)} className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">Hapus</button></div></td></tr>)}</tbody>
            </table>
          </div>
        ) : <div className="p-8 text-sm text-slate-500">Belum ada pengeluaran yang cocok dengan filter ini.</div>}
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

function formatRupiahClient(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}
