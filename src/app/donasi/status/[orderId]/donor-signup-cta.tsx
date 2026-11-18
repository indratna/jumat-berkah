import Link from "next/link";

export function DonorSignupCta({
  donorEmail,
  donorName,
}: {
  donorEmail: string | null;
  donorName: string | null;
}) {
  if (!donorEmail) {
    return null;
  }

  const signupHref = `/daftar?email=${encodeURIComponent(donorEmail)}&name=${encodeURIComponent(donorName ?? "")}&next=/akun/donasi`;
  const loginHref = `/masuk?email=${encodeURIComponent(donorEmail)}&next=/akun/donasi`;

  return (
    <section className="craft-card px-5 py-6 sm:px-6">
      <span className="craft-pill">Akun donatur</span>
      <h2 className="mt-3 text-xl font-bold text-[color:var(--craft-ink)]">
        Simpan donasi ini ke akun
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        Kami bisa hubungkan donasi ini ke akun Anda. Daftar dengan email yang
        sama: <strong className="break-all">{donorEmail}</strong>.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        <li>Riwayat semua donasi tersimpan otomatis</li>
        <li>Tidak perlu isi nama dan email lagi</li>
        <li>Pengingat opsional saat program Jumat aktif</li>
      </ul>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Link
          href={signupHref}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-center text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
        >
          Daftar dengan email ini
        </Link>
        <Link
          href={loginHref}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-center text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
        >
          Sudah punya akun? Masuk
        </Link>
      </div>
    </section>
  );
}