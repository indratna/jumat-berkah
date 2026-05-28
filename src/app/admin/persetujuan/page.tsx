import Link from "next/link";

import { AdminSummaryFooter } from "@/components/admin/admin-summary-footer";
import {
  formatAdminDate,
  formatAdminDateOnly,
  formatRupiah,
  getAdminExpenseApprovals,
} from "@/lib/admin";

export default async function AdminApprovalsPage() {
  const approvals = await getAdminExpenseApprovals();

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="kicker">
          Persetujuan Pengeluaran
        </p>
        <h1 className="mt-4 text-2xl font-bold">Pantau approval besar.</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Daftar ini read-only. Approval tetap berjalan lewat tombol Telegram
          multi-admin supaya guard yang sudah ada tetap konsisten.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-bold">Menunggu persetujuan</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pengeluaran pending belum masuk laporan publik sampai kuorum approval terpenuhi.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {approvals.pending.length === 0 ? (
            <div className="p-6 text-center text-slate-600">
              Tidak ada pengeluaran pending approval.
            </div>
          ) : (
            approvals.pending.map((expense) => {
              const approvedCount = expense.approvals.length;
              return (
                <article key={expense.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_11rem_10rem] lg:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{expense.description}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {expense.category} · {formatAdminDateOnly(expense.expenseDate)} · dibuat oleh {expense.creator.name ?? expense.creator.email}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-lg bg-slate-100">
                      <div
                        className="h-full rounded-lg bg-amber-500"
                        style={{ width: `${Math.min(100, Math.round((approvedCount / expense.approvalRequired) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <p className="font-semibold text-slate-950">{formatRupiah(expense.amount)}</p>
                  <p className="rounded-lg bg-amber-100 px-3 py-2 text-center text-sm font-semibold text-amber-900">
                    {approvedCount}/{expense.approvalRequired} approval
                  </p>
                </article>
              );
            })
          )}
        </div>
        <AdminSummaryFooter
          items={[
            { label: "Pending", value: String(approvals.pending.length) },
            { label: "Mode", value: "Read-only" },
            { label: "Sumber aksi", value: "Telegram" },
          ]}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-bold">Timeline approval terbaru</h2>
          <p className="mt-1 text-sm text-slate-600">
            Riwayat approval dari admin Telegram. Detail audit lengkap tersedia di halaman audit.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {approvals.recentApprovals.length === 0 ? (
            <div className="p-6 text-center text-slate-600">
              Belum ada approval tercatat.
            </div>
          ) : (
            approvals.recentApprovals.map((approval) => (
              <article key={approval.id} className="grid gap-3 p-5 lg:grid-cols-[1fr_11rem_9rem] lg:items-center">
                <div>
                  <p className="font-semibold text-slate-950">{approval.expense.description}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Telegram user {approval.telegramUserId.toString()} · {approval.expense.category}
                  </p>
                </div>
                <p className="font-semibold text-slate-950">{formatRupiah(approval.expense.amount)}</p>
                <p className="text-sm text-slate-600">{formatAdminDate(approval.approvedAt)}</p>
              </article>
            ))
          )}
        </div>
        <div className="border-t border-slate-100 p-5">
          <Link href="/admin/audit?action=expense.approved" className="btn-primary text-sm">
            Lihat audit approval
          </Link>
        </div>
      </section>
    </main>
  );
}
