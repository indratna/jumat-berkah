"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-emerald-900 px-5 py-2 text-center font-semibold text-white shadow-sm transition hover:bg-emerald-800"
    >
      Cetak Laporan A4
    </button>
  );
}
