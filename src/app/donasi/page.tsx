import { cookies, headers } from "next/headers";

import { DONOR_SESSION_COOKIE, getDonorUser } from "@/lib/auth";
import { getBetterAuthDonorUser } from "@/lib/better-auth-guards";
import { DonationForm } from "./donation-form";

export default async function DonationPage() {
  const cookieStore = await cookies();
  const legacyDonor = await getDonorUser(
    cookieStore.get(DONOR_SESSION_COOKIE)?.value,
  );
  const donor = legacyDonor ?? (await getBetterAuthDonorUser(await headers()));

  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-12 text-emerald-950 sm:py-16">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-5 rounded-3xl bg-emerald-900 p-8 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Donasi Jumat Berkah
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Isi nominal, pilih anonim bila perlu, lalu lanjut ke pembayaran.
          </h1>
          <p className="leading-7 text-emerald-50/80">
            Fase ini menyimpan donasi awal dengan status pending. QRIS Midtrans
            akan dihubungkan pada fase pembayaran berikutnya.
          </p>
          <div className="rounded-2xl bg-white/10 p-4 text-sm text-emerald-50">
            Minimal donasi Rp1.000. Email dan WhatsApp bersifat opsional dan
            tidak akan ditampilkan pada laporan publik.
          </div>
        </div>

        <DonationForm donor={donor} />
      </section>
    </main>
  );
}
