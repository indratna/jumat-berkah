import { HeroAmountPicker } from "@/components/landing/hero-amount-picker";

export function LandingHero() {
  return (
    <section className="flex flex-col">
      <span className="craft-pill self-start">
        <span className="size-1.5 rounded-full bg-current" />
        Program Sosial Kantor
      </span>
      <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:mt-6 sm:text-5xl lg:text-[3.6rem]">
        Sediakan <em>nasi Jumat</em> untuk masjid sekitar kantor.
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)] sm:mt-5 sm:text-lg">
        Donasi via QRIS untuk nasi Jumat di masjid sekitar kantor. Status donasi
        otomatis setelah pembayaran berhasil, dan laporan terbuka untuk siapa
        saja.
      </p>

      <HeroAmountPicker />

      <p className="mt-4 max-w-xl text-xs leading-5 text-[color:var(--craft-ink-soft)]">
        Nama Anda hanya tampil di laporan publik jika Anda mengizinkannya. Email
        dan nomor WhatsApp tidak pernah ditampilkan.
      </p>
    </section>
  );
}

export function LandingHeroFigure() {
  return (
    <figure className="overflow-hidden rounded-[1.5rem] border border-[color:var(--craft-line)] bg-[color:var(--craft-cream-strong)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-placeholder.svg"
        alt="Ilustrasi nasi Jumat, kotak makan, dan masjid sekitar kantor"
        width={1200}
        height={800}
        loading="lazy"
        decoding="async"
        className="aspect-[3/2] w-full object-cover"
      />
      <figcaption className="border-t border-[color:var(--craft-line)] bg-[color:var(--craft-paper)] px-4 py-2.5 text-xs leading-5 text-[color:var(--craft-ink-soft)]">
        Ilustrasi sementara. Foto penyaluran asli akan dipasang di sini.
      </figcaption>
    </figure>
  );
}