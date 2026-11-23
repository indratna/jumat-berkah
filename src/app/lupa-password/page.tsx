import Link from "next/link";

import { PasswordResetRequestForm } from "./password-reset-request-form";

export default function ForgotPasswordPage() {
  return (
    <main id="main-content" className="page-shell text-slate-900">
      <section className="mx-auto max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <Link
          href="/login"
          className="text-sm font-semibold text-green-700 hover:text-slate-950"
        >
          ← Kembali ke login
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.08em] text-green-700">
          Reset Password
        </p>
        <h1 className="mt-4 text-3xl font-bold">Minta tautan reset.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Jika email terdaftar, sistem akan mengirim tautan reset password yang
          berlaku 1 jam.
        </p>
        <PasswordResetRequestForm />
      </section>
    </main>
  );
}
