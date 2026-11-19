import Link from "next/link";

import { PublicHeader } from "@/components/landing/public-header";

import { OrderLookupForm } from "./order-lookup-form";

export const metadata = {
  title: "Cek Status Donasi",
  description:
    "Cek status pembayaran donasi Jumat Berkah dengan Order ID, tanpa perlu akun atau login.",
};

export default function DonationStatusLookupPage() {
  return (
    <div className="landing-craft landing-noise min-h-screen">
      <main
        id="main-content"
        className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 lg:py-12"
      >
        <PublicHeader />

        <section className="craft-card-strong px-6 py-7 sm:px-8 sm:py-9">
          <span className="craft-pill">Status Donasi</span>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            Cek status donasi tanpa akun.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--craft-ink-soft)]">
            Masukkan Order ID yang tampil setelah pembayaran. Status pembayaran
            akan diperbarui otomatis di halaman status.
          </p>

          <OrderLookupForm />

          <div className="mt-8 rounded-2xl bg-[color:var(--craft-paper)] px-4 py-4 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            <p className="font-bold text-[color:var(--craft-ink)]">
              Belum punya Order ID?
            </p>
            <p className="mt-1">
              Order ID ada di halaman setelah pembayaran dan di pesan konfirmasi.
              Jika donasi baru dibuat, buka tautan status yang tampil setelah
              menekan tombol donasi.
            </p>
            <Link
              href="/donasi"
              className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
            >
              Buat donasi baru
            </Link>
          </div>
        </section>

        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-[color:var(--craft-ink)] underline decoration-[color:var(--craft-amber)] decoration-2 underline-offset-4 hover:decoration-[color:var(--craft-leaf)]"
        >
          Kembali ke beranda
        </Link>
      </main>
    </div>
  );
}