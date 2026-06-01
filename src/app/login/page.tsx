import { AdminLoginForm } from "./admin-login-form";

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="page-shell grid place-items-center text-slate-900"
    >
      <section className="panel w-full max-w-md border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
        <p className="kicker">Admin</p>
        <h1 className="heading-balance mt-4 text-2xl font-bold tracking-tight text-slate-950">
          Masuk dashboard admin.
        </h1>
        <p className="body-muted mt-3 text-sm">
          Gunakan akun yang sudah diberi peran admin.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Akses dan aktivitas login tercatat untuk keamanan operasional.
        </p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
