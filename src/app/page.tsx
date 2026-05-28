import Link from "next/link";

const steps = [
  "Isi data donasi.",
  "Bayar melalui QRIS Midtrans.",
  "Status diperbarui otomatis.",
  "Laporan publik ikut terbarui.",
];

const highlights = [
  ["Donasi cepat", "Tanpa wajib login untuk donatur publik."],
  ["Privasi aman", "Email dan WhatsApp tidak tampil di laporan publik."],
  ["Laporan jelas", "Pemasukan, pengeluaran, dan saldo bisa dicek."],
];

export default function Home() {
  return (
    <main id="main-content" className="page-shell text-slate-900">
      <section className="mx-auto max-w-6xl space-y-4">
        <nav
          aria-label="Navigasi utama"
          className="panel flex items-center justify-between gap-4 px-4 py-3"
        >
          <Link href="/" className="flex min-w-0 items-center gap-3 font-bold">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-green-700 text-sm text-white">
              JB
            </span>
            <span className="truncate">Jumat Berkah Karyo</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/laporan"
              className="btn-outline hidden px-3 py-2 sm:inline-flex"
            >
              Laporan
            </Link>
            <Link href="/donasi" className="btn-primary px-3 py-2">
              Donasi
            </Link>
          </div>
        </nav>

        <div className="panel p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <p className="kicker">Program Sosial Internal</p>
              <h1 className="heading-balance mt-4 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Donasi Jumat Berkah dengan pencatatan yang rapi dan transparan.
              </h1>
              <p className="body-muted mt-4 max-w-2xl text-base">
                Aplikasi ini membantu donatur berdonasi lewat QRIS dan membantu
                admin memantau pemasukan, pengeluaran, serta saldo program.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link href="/donasi" className="btn-primary text-center">
                  Donasi Sekarang
                </Link>
                <Link href="/laporan" className="btn-outline text-center">
                  Lihat Laporan
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-900">Alur Singkat</p>
              <div className="mt-4 space-y-3">
                {steps.map((item, index) => (
                  <div key={item} className="flex gap-3 text-sm text-slate-700">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md border border-slate-200 bg-white font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <p className="pt-1">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {highlights.map(([title, description]) => (
            <div key={title} className="panel p-5">
              <p className="font-bold text-slate-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
