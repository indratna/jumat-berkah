import Link from "next/link";

import { PasswordResetRequestForm } from "./password-reset-request-form";

export default function ForgotPasswordPage() {
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
          Reset Password
        </p>
        <h1 className="mt-4 text-3xl font-bold">Minta tautan reset.</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-900/70">
          Jika email terdaftar, sistem akan mengirim tautan reset password yang
          berlaku 1 jam.
        </p>
        <PasswordResetRequestForm />
      </section>
    </main>
  );
}
