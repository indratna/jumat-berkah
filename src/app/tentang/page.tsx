import Link from "next/link";

import { PublicHeader } from "@/components/landing/public-header";
import { MobileDonationCta } from "@/components/landing/mobile-donation-cta";

const pillars = [
  {
    title: "Tujuan program",
    body: "Memudahkan donatur berdonasi via QRIS dan membantu pengelola mencatat dana masuk serta pengeluaran program dengan rapi.",
  },
  {
    title: "Jadwal siklus",
    body: "Siklus laporan berjalan dari Jumat 00.00 sampai Kamis 23.59 Asia/Jakarta. Penyaluran kegiatan mengikuti jadwal Jumat Berkah.",
  },
  {
    title: "Transparansi",
    body: "Laporan publik menampilkan donasi settlement, pengeluaran yang disetujui, saldo program, target mingguan, dan cerita penyaluran yang sudah dipublikasikan.",
  },
  {
    title: "Privasi donatur",
    body: "Email, nomor WhatsApp, ID internal, dan kontak operasional tidak ditampilkan di laporan publik. Donatur anonim ditampilkan sebagai Anonim.",
  },
];

const principles = [
  {
    title: "Dana publik dijaga terbuka",
    body: "Setiap rupiah yang masuk dan keluar dapat ditelusuri pada laporan publik tanpa membongkar identitas donatur.",
  },
  {
    title: "Tidak ada potongan tersembunyi",
    body: "Aplikasi tidak mengambil potongan administrasi. Biaya penyaluran tercatat sebagai pengeluaran biasa.",
  },
  {
    title: "Audit lengkap",
    body: "Setiap perubahan dana dan persetujuan biaya besar dicatat di audit log internal.",
  },
];

export default function TentangPage() {
  return (
    <div className="landing-craft landing-noise min-h-screen">
      <main
        id="main-content"
        className="mx-auto flex max-w-5xl flex-col gap-16 px-4 pb-32 pt-6 sm:px-6 sm:pb-20 lg:px-8 lg:py-12"
      >
        <PublicHeader />

        <section className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-8">
            <span className="craft-pill">Tentang Program</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Cerita di balik <em>nasi Jumat</em> dan laporan yang terbuka.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)] sm:text-lg">
              Jumat Berkah Karyo adalah program internal kantor untuk
              mengumpulkan donasi dan menyalurkan nasi Jumat ke masjid sekitar.
              Aplikasi ini ada agar setiap rupiah, biaya, dan cerita penyaluran
              dapat dipantau bersama.
            </p>
          </div>
          <div className="craft-card-strong lg:col-span-4">
            <div className="space-y-3 p-6">
              <span className="craft-pill">Aksi cepat</span>
              <Link
                id="hero-cta"
                href="/donasi"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
              >
                Donasi Sekarang
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/laporan?period=jumat"
                className="flex min-h-12 w-full items-center justify-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
              >
                Laporan Jumat Ini
              </Link>
              <p className="text-xs text-[color:var(--craft-ink-soft)]">
                Donasi tidak wajib login. Laporan publik dapat dilihat siapa
                saja.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <span className="craft-pill">Yang kami pegang</span>
              <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
                Empat pilar dasar program
              </h2>
            </div>
            <p className="text-sm text-[color:var(--craft-ink-soft)] sm:max-w-xs">
              Pilar ini menjaga arah program tetap sederhana, terbuka, dan
              hormat pada privasi donatur.
            </p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2">
            {pillars.map((item, index) => (
              <article
                key={item.title}
                className="craft-card flex flex-col gap-3 p-6"
              >
                <span className="craft-num text-4xl italic text-[color:var(--craft-leaf)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base font-bold text-[color:var(--craft-ink)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-[color:var(--craft-ink-soft)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="craft-card-strong p-6 sm:p-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <span className="craft-pill">Prinsip transparansi</span>
              <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
                Bagaimana kami menjaga kepercayaan
              </h2>
            </div>
          </header>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="rounded-2xl bg-[color:var(--craft-paper)] p-5"
              >
                <p className="text-base font-bold text-[color:var(--craft-ink)]">
                  {principle.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--craft-ink-soft)]">
                  {principle.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="craft-card p-6 sm:p-8">
          <span className="craft-pill">Pengelola</span>
          <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
            Dikelola admin Jumat Berkah
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--craft-ink-soft)]">
            Program dikelola admin Jumat Berkah Karyo. Untuk pertanyaan donasi,
            laporan, atau koreksi data publik, hubungi pengelola melalui kontak
            resmi internal program.
          </p>
          <p className="mt-4 max-w-2xl rounded-2xl bg-[color:var(--craft-paper)] p-4 text-sm leading-7 text-[color:var(--craft-ink-soft)]">
            Catatan: laporan publik bersifat ringkasan aman. Admin tetap menjaga
            data kontak donatur hanya untuk kebutuhan operasional dan tidak
            menampilkannya di halaman publik.
          </p>
        </section>
      </main>

      <MobileDonationCta />
    </div>
  );
}
