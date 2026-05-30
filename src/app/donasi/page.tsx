import { cookies, headers } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  DONOR_SESSION_COOKIE,
  getDonorUser,
  requireAdminUser,
} from "@/lib/auth";
import {
  getBetterAuthDonorUser,
  requireBetterAuthAdminUser,
} from "@/lib/better-auth-guards";
import Link from "next/link";

import { DonationForm } from "./donation-form";
import { DonorAuthBanner } from "./donor-auth-banner";
import { resolveDonorAuthBannerVariant } from "./donor-auth-banner-rules";
import { MidtransSnapScript } from "./midtrans-snap-script";

const trustPoints = [
  "Minimal donasi mulai Rp1.000.",
  "Nama dapat disamarkan sebagai Anonim.",
  "Status pembayaran diperbarui otomatis setelah QRIS berhasil.",
];

const reassuranceItems = [
  "Privasi donor dijaga. Email dan WhatsApp tidak ditampilkan di laporan publik.",
  "Kontak bersifat opsional, dipakai hanya untuk kebutuhan operasional yang relevan.",
  "Pembayaran QRIS diproses melalui Midtrans, sementara status akhir diverifikasi server.",
];

export default async function DonationPage() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const admin =
    legacyAdmin ?? (await requireBetterAuthAdminUser(requestHeaders));
  const legacyDonor = await getDonorUser(
    cookieStore.get(DONOR_SESSION_COOKIE)?.value,
  );
  const donor = admin
    ? null
    : (legacyDonor ?? (await getBetterAuthDonorUser(requestHeaders)));
  const bannerVariant = resolveDonorAuthBannerVariant({
    adminUser: admin,
    donorUser: donor,
  });

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? null;
  const midtransIsProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  return (
    <div className="landing-craft landing-noise min-h-screen">
      <main
        id="main-content"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 text-[color:var(--craft-ink)] sm:px-6 lg:px-8 lg:py-12"
      >
        <MidtransSnapScript
          clientKey={midtransClientKey}
          isProduction={midtransIsProduction}
        />
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-base font-extrabold tracking-tight text-[color:var(--craft-ink)]"
            aria-label="Beranda Jumat Berkah Karyo"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-[color:var(--craft-leaf)] text-sm font-bold text-[color:var(--craft-cream)]">
              JB
            </span>
            <span>Jumat Berkah Karyo</span>
          </Link>
          <nav
            aria-label="Navigasi utama"
            className="flex items-center gap-2 text-sm"
          >
            <Link
              href="/"
              className="hidden min-h-11 items-center rounded-full px-4 font-semibold text-[color:var(--craft-ink)] hover:text-[color:var(--craft-leaf)] sm:inline-flex"
            >
              Beranda
            </Link>
            <Link
              href="/laporan"
              className="hidden min-h-11 items-center rounded-full px-4 font-semibold text-[color:var(--craft-ink)] hover:text-[color:var(--craft-leaf)] sm:inline-flex"
            >
              Laporan
            </Link>
            <Link
              href="/tentang"
              className="hidden min-h-11 items-center rounded-full px-4 font-semibold text-[color:var(--craft-ink)] hover:text-[color:var(--craft-leaf)] sm:inline-flex"
            >
              Tentang
            </Link>
            <Link
              href="/donasi"
              className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
            >
              Donasi
            </Link>
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-8">
          <div className="space-y-6 lg:sticky lg:top-10">
            <div>
              <span className="craft-pill">Donasi Jumat Berkah</span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.35rem]">
                Bantu isi <em>nasi Jumat</em> dengan donasi yang singkat dan
                aman.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)] sm:text-lg">
                Isi nominal, lengkapi data seperlunya, lalu lanjutkan ke QRIS.
                Donasi akan tercatat sebagai pending lebih dulu dan otomatis
                diperbarui setelah pembayaran berhasil.
              </p>
            </div>

            <div className="craft-card space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--craft-leaf)]">
                    Alasan cepat
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-[color:var(--craft-ink)]">
                    Donasi dibuat ringkas, tapi tetap transparan.
                  </h2>
                </div>
                <span className="craft-num text-4xl italic text-[color:var(--craft-leaf)]">
                  03
                </span>
              </div>
              <div className="space-y-3">
                {trustPoints.map((point, index) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl bg-[color:var(--craft-paper)] px-4 py-3"
                  >
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--craft-amber)]/20 text-xs font-extrabold text-[color:var(--craft-leaf)]">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-[color:var(--craft-ink-soft)]">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/laporan?period=jumat"
                className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
              >
                Lihat laporan Jumat ini
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <DonorAuthBanner variant={bannerVariant} donor={donor} />
            <DonationForm donor={donor} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {reassuranceItems.map((item) => (
            <article key={item} className="craft-card p-5">
              <span className="craft-pill">Catatan</span>
              <p className="mt-3 text-sm leading-7 text-[color:var(--craft-ink-soft)]">
                {item}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
