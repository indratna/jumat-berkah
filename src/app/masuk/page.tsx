import Link from "next/link";

import { DonorLoginForm } from "./donor-login-form";

export default function DonorLoginPage() {
  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-16 text-emerald-950">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Donatur
        </p>
        <h1 className="mt-4 text-3xl font-bold">Masuk akun donatur.</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-900/70">
          Masuk opsional untuk melihat riwayat donasi. Donasi tanpa akun tetap bisa lewat halaman donasi.
        </p>
        <DonorLoginForm />
        <Link href="/donasi" className="mt-5 block text-center text-sm font-semibold text-emerald-700">
          Lanjut donasi tanpa login
        </Link>
      </section>
    </main>
  );
}
