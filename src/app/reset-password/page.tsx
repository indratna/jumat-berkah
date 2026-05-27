import Link from "next/link";

import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";
  const error = params.error;

  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-16 text-emerald-950">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
        <Link
          href="/login"
          className="text-sm font-semibold text-emerald-800 hover:text-emerald-950"
        >
          ← Kembali ke login
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Password Baru
        </p>
        <h1 className="mt-4 text-3xl font-bold">Atur password baru.</h1>
        {error ? (
          <p className="mt-3 text-sm font-semibold text-rose-700">
            Tautan reset tidak valid atau sudah kedaluwarsa.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-emerald-900/70">
            Masukkan password baru. Setelah berhasil, semua sesi lama dicabut.
          </p>
        )}
        <ResetPasswordForm token={token} />
      </section>
    </main>
  );
}
