import Link from "next/link";
import { cookies, headers } from "next/headers";

import { PublicHeader } from "@/components/landing/public-header";
import { DONOR_SESSION_COOKIE, getDonorUser } from "@/lib/auth";
import { getBetterAuthDonorUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";

import { DonationStatusView } from "./donation-status-view";
import { DonorSignupCta } from "./donor-signup-cta";

type DonationStatusPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

type DonationSnapshotRecord = {
  orderId: string;
  amount: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  donorName: string | null;
  donorEmail: string | null;
  userId: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
};

export const metadata = {
  title: "Status Donasi",
  description: "Pantau status pembayaran donasi Jumat Berkah Anda.",
};

export default async function DonationStatusPage({
  params,
}: DonationStatusPageProps) {
  const { orderId } = await params;
  const prisma = getPrisma();

  let donation: DonationSnapshotRecord | null = null;
  let loadFailed = false;

  try {
    donation = await prisma.donation.findUnique({
      where: { orderId },
      select: {
        orderId: true,
        amount: true,
        status: true,
        createdAt: true,
        paidAt: true,
        donorName: true,
        donorEmail: true,
        userId: true,
        isAnonymous: true,
        showNamePublicly: true,
      },
    });
  } catch (error) {
    console.error("Donation status page failed to load", error);
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <StatusPageShell>
        <section className="craft-card-strong px-6 py-8 text-center sm:px-8">
          <span className="craft-pill mx-auto">Gangguan sementara</span>
          <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
            Status donasi belum bisa dimuat.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--craft-ink-soft)]">
            Data pembayaran sedang tidak dapat diakses. Donasi Anda tetap
            tercatat di sistem Midtrans dan laporan akan diperbarui setelah
            layanan pulih.
          </p>
          <a
            href={`/donasi/status/${encodeURIComponent(orderId)}`}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--craft-leaf)] px-6 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
          >
            Muat ulang halaman
          </a>
        </section>
      </StatusPageShell>
    );
  }

  if (!donation) {
    return (
      <StatusPageShell>
        <section className="craft-card-strong px-6 py-8 text-center sm:px-8">
          <span className="craft-pill mx-auto">Tidak ditemukan</span>
          <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
            Donasi dengan Order ID ini tidak ada.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--craft-ink-soft)]">
            Periksa kembali tautan atau Order ID dari pesan konfirmasi Anda. Jika
            baru saja berdonasi, buka tautan status yang tampil setelah
            pembayaran.
          </p>
          <Link
            href="/donasi"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--craft-leaf)] px-6 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
          >
            Kembali ke halaman donasi
          </Link>
        </section>
      </StatusPageShell>
    );
  }

  const cookieStore = await cookies();
  const donor =
    (await getDonorUser(cookieStore.get(DONOR_SESSION_COOKIE)?.value)) ??
    (await getBetterAuthDonorUser(await headers()));

  return (
    <StatusPageShell>
      <DonationStatusView
        initialSnapshot={{
          orderId: donation.orderId,
          amount: donation.amount,
          status: donation.status,
          createdAt: donation.createdAt.toISOString(),
          paidAt: donation.paidAt?.toISOString() ?? null,
        }}
        receiptName={getReceiptDonorName(donation)}
      />

      {!donor && !donation.userId ? (
        <DonorSignupCta
          donorEmail={donation.donorEmail}
          donorName={donation.donorName}
        />
      ) : null}

      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-[color:var(--craft-ink)] underline decoration-[color:var(--craft-amber)] decoration-2 underline-offset-4 hover:decoration-[color:var(--craft-leaf)]"
      >
        Kembali ke beranda
      </Link>
    </StatusPageShell>
  );
}

function StatusPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-craft landing-noise min-h-screen">
      <main
        id="main-content"
        className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 lg:py-12"
      >
        <PublicHeader />
        {children}
      </main>
    </div>
  );
}

function getReceiptDonorName(input: {
  donorName: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
}) {
  if (input.isAnonymous || !input.showNamePublicly || !input.donorName) {
    return "Anonim";
  }

  return input.donorName;
}