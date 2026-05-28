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
    <main id="main-content" className="page-shell text-slate-900">
      <section className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="panel p-6">
          <p className="kicker">Donasi Jumat Berkah</p>
          <h1 className="heading-balance mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Isi nominal dan lanjutkan ke pembayaran QRIS.
          </h1>
          <p className="body-muted mt-3 text-sm">
            Donasi dibuat sebagai pending, lalu status diperbarui otomatis
            setelah pembayaran berhasil.
          </p>
          <div className="mt-5 space-y-2 border-t border-slate-200 pt-5 text-sm text-slate-600">
            <p>Minimal donasi Rp1.000.</p>
            <p>Email dan WhatsApp opsional.</p>
            <p>Nama dapat disamarkan sebagai Anonim.</p>
          </div>
        </div>

        <DonationForm donor={donor} />
      </section>
    </main>
  );
}
