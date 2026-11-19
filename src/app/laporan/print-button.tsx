"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-5 text-center text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
    >
      Cetak Laporan A4
    </button>
  );
}
