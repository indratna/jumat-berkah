import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-12 text-emerald-950 sm:py-16">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-emerald-100 sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Jumat Berkah
            </p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Donasi nasi Jumat Berkah dengan QRIS dan laporan terbuka.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-emerald-900/75">
              Bantu pengadaan makanan untuk jamaah masjid belakang kantor.
              Donasi disiapkan lewat QRIS Midtrans, sementara pemasukan dan
              pengeluaran akan dapat dilihat siapa saja.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/donasi"
                className="rounded-full bg-emerald-700 px-6 py-3 text-center font-semibold text-white transition hover:bg-emerald-800"
              >
                Donasi Sekarang
              </Link>
              <Link
                href="/laporan"
                className="rounded-full border border-emerald-200 px-6 py-3 text-center font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                Lihat Laporan
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-emerald-900 p-6 text-white">
            <p className="text-sm font-semibold text-emerald-200">Cara kerja</p>
            <div className="mt-5 space-y-4">
              {[
                "Donatur mengisi nominal dan data opsional.",
                "Sistem mencatat donasi sebagai pending.",
                "Pembayaran QRIS Midtrans masuk pada fase berikutnya.",
                "Laporan publik menampilkan pemasukan dan pengeluaran.",
              ].map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-emerald-950">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-emerald-50/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Donasi publik", "Tanpa wajib login"],
            ["Status awal", "Pending sebelum pembayaran"],
            ["Privasi", "Email dan WhatsApp tidak tampil publik"],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl bg-emerald-50 p-5">
              <p className="font-semibold text-emerald-950">{title}</p>
              <p className="mt-1 text-sm text-emerald-900/70">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
