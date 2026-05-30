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
    <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-5 text-green-950">
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-green-700">
        Akun donatur
      </p>
      <h2 className="mt-2 text-xl font-bold">Simpan donasi ini ke akun</h2>
      <p className="mt-2 text-sm leading-6">
        Kami bisa hubungkan donasi ini ke akun Anda. Daftar dengan email yang sama: <strong>{donorEmail}</strong>.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
        <li>Riwayat semua donasi tersimpan otomatis</li>
        <li>Tidak perlu isi nama dan email lagi</li>
        <li>Pengingat opsional saat program Jumat aktif</li>
      </ul>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Link href={signupHref} className="rounded-lg bg-green-700 px-5 py-3 text-center font-semibold text-white">
          Daftar dengan email ini
        </Link>
        <Link href={loginHref} className="rounded-lg border border-green-300 px-5 py-3 text-center font-semibold text-green-800">
          Sudah punya akun? Masuk
        </Link>
      </div>
    </div>
  );
}
