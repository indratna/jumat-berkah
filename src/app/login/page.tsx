import { AdminLoginForm } from "./admin-login-form";

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="page-shell grid place-items-center text-slate-900"
    >
      <section className="panel w-full max-w-md p-6">
        <p className="kicker">Admin</p>
        <h1 className="heading-balance mt-4 text-2xl font-bold tracking-tight text-slate-950">
          Masuk dashboard admin.
        </h1>
        <p className="body-muted mt-3 text-sm">
          Gunakan akun admin terdaftar. Kode admin tetap tersedia sebagai
          fallback operasional.
        </p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
