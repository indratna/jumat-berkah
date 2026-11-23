import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DonorSignupForm } from "./donor-signup-form";

export const metadata: Metadata = {
  title: "Daftar Akun Donatur",
  robots: { index: false, follow: false },
};

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DonorSignupPage({
  searchParams,
}: SignupPageProps) {
  const params = await searchParams;
  const email = readQuery(params.email);
  const name = readQuery(params.name);
  const next = sanitizeNext(readQuery(params.next) || "/akun/donasi");

  return (
    <main
      id="main-content"
      className="landing-craft landing-noise min-h-screen px-4 py-10 text-[color:var(--craft-ink)]"
    >
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-5">
          <Link
            href="/"
            className="inline-flex items-center gap-3 font-extrabold"
          >
            <span className="grid size-10 place-items-center overflow-hidden rounded-2xl ring-1 ring-[color:var(--craft-line-strong)]/40">
              <Image
                src="/branding/logo-mark.png"
                alt="Logo Jumat Berkah"
                width={40}
                height={40}
                sizes="40px"
                priority
                className="size-full object-cover"
              />
            </span>
            Jumat Berkah Karyo
          </Link>
          <span className="craft-pill">Akun donatur</span>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Daftar akun donatur
          </h1>
          <p className="text-base leading-7 text-[color:var(--craft-ink-soft)]">
            Simpan riwayat donasi, kurangi isi ulang nama dan email, dan siapkan
            pengingat opsional saat program Jumat aktif.
          </p>
          <Link
            href="/donasi"
            className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
          >
            Donasi tanpa akun tetap bisa
          </Link>
        </div>
        <DonorSignupForm initialEmail={email} initialName={name} next={next} />
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
