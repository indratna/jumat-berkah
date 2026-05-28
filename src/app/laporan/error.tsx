"use client";

export default function LaporanError({ reset }: { reset: () => void }) {
  return (
    <main className="page-shell text-slate-900">
      <section className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-green-700">
          Laporan Publik
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Laporan belum bisa dimuat.
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Coba muat ulang halaman. Data publik tetap hanya menampilkan ringkasan
          aman tanpa email, nomor WhatsApp, atau ID internal donatur.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-green-700 px-5 py-2 font-semibold text-white"
        >
          Muat ulang
        </button>
      </section>
    </main>
  );
}
