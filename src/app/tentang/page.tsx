export default function TentangPage() {
  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-12 text-emerald-950 sm:py-16">
      <section className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Tentang Program
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Jumat Berkah membantu penyaluran makanan dengan laporan terbuka.
          </h1>
          <p className="mt-5 max-w-3xl leading-7 text-emerald-900/75">
            Program ini mengumpulkan donasi untuk mendukung kegiatan berbagi
            makanan setiap Jumat. Aplikasi dipakai agar donasi, pengeluaran,
            target mingguan, dan cerita penyaluran dapat dilihat publik dengan
            jelas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/donasi"
              className="rounded-full bg-emerald-700 px-5 py-2 font-semibold text-white"
            >
              Donasi Sekarang
            </a>
            <a
              href="/laporan?period=jumat"
              className="rounded-full border border-emerald-700 px-5 py-2 font-semibold text-emerald-800"
            >
              Lihat Laporan Jumat Ini
            </a>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard
            title="Tujuan"
            body="Memudahkan donatur berdonasi via QRIS dan membantu pengelola mencatat dana masuk serta pengeluaran program dengan rapi."
          />
          <InfoCard
            title="Jadwal"
            body="Siklus laporan berjalan dari Jumat pukul 00.00 sampai Kamis pukul 23.59 waktu Asia/Jakarta. Penyaluran kegiatan mengikuti jadwal Jumat Berkah."
          />
          <InfoCard
            title="Transparansi"
            body="Laporan publik menampilkan pemasukan berhasil, pengeluaran disetujui, saldo, target mingguan, dan cerita penyaluran yang sudah dipublikasikan."
          />
          <InfoCard
            title="Privasi Donatur"
            body="Email, nomor WhatsApp, ID internal, dan data kontak operasional tidak ditampilkan di laporan publik. Donatur anonim ditampilkan sebagai Anonim."
          />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
          <h2 className="text-xl font-bold">Pengelola dan Kontak</h2>
          <p className="mt-3 leading-7 text-emerald-900/75">
            Program dikelola admin Jumat Berkah. Untuk pertanyaan donasi,
            laporan, atau koreksi data publik, hubungi pengelola melalui kontak
            resmi internal program.
          </p>
          <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900/70">
            Catatan: laporan publik bersifat ringkasan aman. Admin tetap menjaga
            data kontak donatur hanya untuk kebutuhan operasional.
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-3 leading-7 text-emerald-900/75">{body}</p>
    </div>
  );
}
