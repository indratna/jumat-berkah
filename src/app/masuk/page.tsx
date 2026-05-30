import Link from "next/link";

import { DonorLoginForm } from "./donor-login-form";

type DonorLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DonorLoginPage({
  searchParams,
}: DonorLoginPageProps) {
  const params = await searchParams;
  const email = readQuery(params.email);
  const next = sanitizeNext(readQuery(params.next) || "/akun/donasi");

  return (
    <main className="page-shell text-slate-900">
      <section className="mx-auto max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-green-700">
          Donatur
        </p>
        <h1 className="mt-4 text-3xl font-bold">Masuk akun donatur.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Masuk opsional untuk melihat riwayat donasi. Donasi tanpa akun tetap
          bisa lewat halaman donasi.
        </p>
        <DonorLoginForm initialEmail={email} next={next} />
        <Link
          href="/donasi"
          className="mt-5 block text-center text-sm font-semibold text-green-700"
        >
          Lanjut donasi tanpa login
        </Link>
      </section>
    </main>
  );
}

function readQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}

function sanitizeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/akun/donasi";
}
