import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cek Email Donatur",
  robots: { index: false, follow: false },
};

type CheckEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = await searchParams;
  const email = readQuery(params.email);
  const next = sanitizeNext(readQuery(params.next) || "/akun/donasi");
  const loginHref = `/masuk?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`;

  return (
    <main className="landing-craft landing-noise min-h-screen px-4 py-10 text-[color:var(--craft-ink)]">
      <section className="craft-card-strong mx-auto max-w-xl p-8">
        <span className="craft-pill">Verifikasi email</span>
        <h1 className="mt-5 text-4xl font-extrabold">Cek email Anda</h1>
        <p className="mt-4 leading-7 text-[color:var(--craft-ink-soft)]">
          Kami sudah mengirim link verifikasi ke <strong>{email || "email Anda"}</strong>. Klik link untuk mengaktifkan akun.
        </p>
        <div className="mt-6 rounded-2xl bg-[color:var(--craft-paper)] p-5 text-sm leading-7 text-[color:var(--craft-ink-soft)]">
          Tidak ada email? Cek folder spam, lalu pakai tombol kirim ulang dari halaman masuk jika akun belum aktif.
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={loginHref} className="btn-primary text-center">
            Sudah verifikasi? Masuk sekarang
          </Link>
          <Link href="/donasi" className="rounded-full border border-[color:var(--craft-line-strong)] px-5 py-3 text-center font-bold text-[color:var(--craft-ink)]">
            Donasi tanpa akun
          </Link>
        </div>
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
  return value.startsWith("/") && !value.startsWith("//") ? value : "/akun/donasi";
}
