"use client";

export default function LaporanError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-12 text-emerald-950 sm:py-16">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Laporan Publik
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Laporan belum bisa dimuat.
        </h1>
        <p className="mt-3 leading-7 text-emerald-900/75">
          Coba muat ulang halaman. Data publik tetap hanya menampilkan ringkasan
          aman tanpa email, nomor WhatsApp, atau ID internal donatur.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-emerald-700 px-5 py-2 font-semibold text-white"
        >
          Muat ulang
        </button>
      </section>
    </main>
  );
}
