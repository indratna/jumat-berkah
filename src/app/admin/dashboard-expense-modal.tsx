"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const EXPENSE_CATEGORIES = [
  "Bahan makanan",
  "Lauk pauk",
  "Beras",
  "Gas/alat masak",
  "Kemasan",
  "Transportasi",
  "Operasional lain",
] as const;

type Props = {
  redirectQuery: string;
};

type FormState = {
  expenseDate: string;
  category: string;
  description: string;
  amount: string;
  vendorName: string;
  receiptUrl: string;
};

const emptyForm: FormState = {
  expenseDate: new Date().toISOString().slice(0, 10),
  category: EXPENSE_CATEGORIES[0],
  description: "",
  amount: "",
  vendorName: "",
  receiptUrl: "",
};

export function DashboardExpenseModal({ redirectQuery }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const successHref = useMemo(() => {
    const params = new URLSearchParams(redirectQuery);
    params.set("expenseSaved", "1");
    const query = params.toString();
    return query.length > 0 ? `/admin?${query}` : "/admin?expenseSaved=1";
  }, [redirectQuery]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrors({});

    const response = await fetch("/api/admin/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expenseDate: form.expenseDate,
        category: form.category,
        description: form.description,
        amount: Number(form.amount.replace(/\D/g, "")),
        vendorName: form.vendorName || null,
        receiptUrl: form.receiptUrl || null,
      }),
    });

    const result = (await response.json().catch(() => null)) as {
      errors?: Record<string, string>;
    } | null;

    if (!response.ok) {
      setErrors(result?.errors ?? { form: "Pengeluaran gagal disimpan." });
      setStatus("error");
      return;
    }

    setOpen(false);
    setForm(emptyForm);
    setStatus("idle");
    router.replace(successHref, { scroll: false });
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-md bg-green-700 px-3 py-2.5 text-center font-semibold text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
      >
        Catat Biaya
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-80 grid place-items-center overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dashboard-expense-modal-title"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                      Pengeluaran
                    </p>
                    <h2
                      id="dashboard-expense-modal-title"
                      className="mt-2 text-xl font-bold text-slate-950"
                    >
                      Catat Biaya
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Tutup popup pengeluaran"
                    className="grid size-10 place-items-center rounded-full border border-slate-200 text-lg font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    ×
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.form ? (
                      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {errors.form}
                      </p>
                    ) : null}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Tanggal
                        <input
                          type="date"
                          value={form.expenseDate}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              expenseDate: event.target.value,
                            }))
                          }
                          className="field mt-1"
                          required
                        />
                        <FieldError message={errors.expenseDate} />
                      </label>
                      <label className="block text-sm font-medium text-slate-700">
                        Kategori
                        <select
                          value={form.category}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              category: event.target.value,
                            }))
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
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        rows={3}
                        className="field mt-1"
                        required
                      />
                      <FieldError message={errors.description} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Nominal
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.amount}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              amount: event.target.value,
                            }))
                          }
                          className="field mt-1"
                          required
                        />
                        <FieldError message={errors.amount} />
                      </label>
                      <label className="block text-sm font-medium text-slate-700">
                        Vendor (opsional)
                        <input
                          type="text"
                          value={form.vendorName}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              vendorName: event.target.value,
                            }))
                          }
                          className="field mt-1"
                        />
                        <FieldError message={errors.vendorName} />
                      </label>
                    </div>
                    <label className="block text-sm font-medium text-slate-700">
                      URL bukti (opsional)
                      <input
                        type="url"
                        value={form.receiptUrl}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            receiptUrl: event.target.value,
                          }))
                        }
                        className="field mt-1"
                        placeholder="https://..."
                      />
                      <FieldError message={errors.receiptUrl} />
                    </label>
                    <div className="flex justify-end border-t border-slate-100 pt-4">
                      <button
                        type="submit"
                        disabled={status === "saving"}
                        className="btn-primary disabled:opacity-60"
                      >
                        {status === "saving" ? "Menyimpan…" : "Simpan biaya"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}
