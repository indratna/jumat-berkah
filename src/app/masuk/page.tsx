import type { Metadata } from "next";
import Link from "next/link";

import { DonorLoginForm } from "./donor-login-form";

export const metadata: Metadata = {
  title: "Masuk Akun Donatur",
  robots: { index: false, follow: false },
};

type DonorLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DonorLoginPage({
  searchParams,
}: DonorLoginPageProps) {
  const params = await searchParams;
  const email = readQuery(params.email);
  const next = sanitizeNext(readQuery(params.next) || "/akun/donasi");
  const signupHref = `/daftar?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`;

  return (
    <main className="landing-craft landing-noise min-h-screen px-4 py-10 text-[color:var(--craft-ink)]">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-5">
          <Link
            href="/"
            className="inline-flex items-center gap-3 font-extrabold"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-[color:var(--craft-leaf)] text-sm text-[color:var(--craft-cream)]">
              JB
            </span>
            Jumat Berkah Karyo
          </Link>
          <span className="craft-pill">Akun donatur</span>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Masuk akun donatur
          </h1>
          <p className="text-base leading-7 text-[color:var(--craft-ink-soft)]">
            Lanjutkan dengan Google atau email/password untuk melihat riwayat
            donasi dan memakai data akun di form donasi.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/donasi"
              className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
            >
              Donasi tanpa akun tetap bisa
            </Link>
            <Link
              href={signupHref}
              className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
            >
              Belum punya akun? Daftar
            </Link>
          </div>
        </div>
        <DonorLoginForm initialEmail={email} next={next} />
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
