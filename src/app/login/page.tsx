import { AdminLoginForm } from "./admin-login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-16 text-emerald-950">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Admin
        </p>
        <h1 className="mt-4 text-3xl font-bold">Masuk dashboard admin.</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-900/70">
          Gunakan email admin yang ada di database dan kode admin dari environment lokal.
        </p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
