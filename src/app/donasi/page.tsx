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

import { PublicHeader } from "@/components/landing/public-header";
import {
  parseDonationAmount,
  validateDonationAmount,
} from "@/lib/donation-amount";

import { DonationForm } from "./donation-form";
import { DonorAuthBanner } from "./donor-auth-banner";
import { resolveDonorAuthBannerVariant } from "./donor-auth-banner-rules";
import { ResumeDonationBanner } from "./resume-donation-banner";

const trustPoints = [
  "Minimal donasi mulai Rp1.000.",
  "Nama dapat disamarkan sebagai Anonim.",
  "Status pembayaran diperbarui otomatis setelah QRIS berhasil.",
];

const reassuranceItems = [
  "Email dan nomor WhatsApp donatur tidak pernah ditampilkan di laporan publik.",
  "Nama hanya tampil di laporan publik jika Anda mengizinkan. Donasi anonim tampil sebagai Anonim.",
  "Donasi dihitung sebagai pemasukan hanya setelah pembayaran terkonfirmasi.",
];

type DonationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveInitialAmount(
  searchParams: Record<string, string | string[] | undefined>,
): number | null {
  const raw = Array.isArray(searchParams.nominal)
    ? searchParams.nominal[0]
    : searchParams.nominal;

  if (!raw) {
    return null;
  }

  const amount = parseDonationAmount(raw);
  return amount !== null && validateDonationAmount(amount) === null
    ? amount
    : null;
}

export default async function DonationPage({
  searchParams,
}: DonationPageProps) {
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
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialAmount = resolveInitialAmount(resolvedSearchParams);

  return (
    <div className="landing-craft landing-noise min-h-screen">
      <main
        id="main-content"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 text-[color:var(--craft-ink)] sm:px-6 lg:px-8 lg:py-12"
      >
        <PublicHeader />

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-8">
          <div className="space-y-6 lg:col-start-1 lg:row-start-1">
            <div>
              <span className="craft-pill">Donasi Jumat Berkah</span>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:mt-5 sm:text-5xl lg:text-[3.35rem]">
                Bantu isi <em>nasi Jumat</em> dengan donasi yang singkat dan
                aman.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)] sm:mt-5 sm:text-lg">
                Isi nominal, lengkapi data seperlunya, lalu lanjutkan ke QRIS.
                Status donasi diperbarui otomatis setelah pembayaran berhasil.
              </p>
            </div>
          </div>

          {/* Form comes before the supporting card on mobile so donors reach it fast. */}
          <div className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <ResumeDonationBanner />
            <DonationForm
              donor={donor}
              initialAmount={initialAmount}
              snapClientKey={midtransClientKey}
              snapIsProduction={midtransIsProduction}
              authBanner={
                <DonorAuthBanner variant={bannerVariant} donor={donor} />
              }
            />
          </div>

          <div className="craft-card space-y-4 p-6 lg:col-start-1 lg:row-start-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.1em] text-[color:var(--craft-leaf)]">
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
