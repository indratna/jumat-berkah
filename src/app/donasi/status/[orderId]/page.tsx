import Link from "next/link";

import { getPrisma } from "@/lib/db";

type DonationStatusPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function DonationStatusPage({
  params,
}: DonationStatusPageProps) {
  const { orderId } = await params;
  const prisma = getPrisma();
  const donation = await prisma.donation.findUnique({
    where: { orderId },
    select: {
      orderId: true,
      amount: true,
      status: true,
      paidAt: true,
      donorName: true,
      isAnonymous: true,
      showNamePublicly: true,
    },
  });

  if (!donation) {
    return (
      <main className="page-shell text-slate-900">
        <section className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-red-700">
            Tidak ditemukan
          </p>
          <h1 className="mt-4 text-3xl font-bold">Donasi tidak ditemukan.</h1>
          <Link
            href="/donasi"
            className="mt-6 inline-flex rounded-lg bg-green-700 px-5 py-3 font-semibold text-white"
          >
            Kembali Donasi
          </Link>
        </section>
      </main>
    );
  }

  const content = getStatusContent(donation.status);

  return (
    <main className="page-shell text-slate-900">
      <section className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-green-700">
          Status Donasi
        </p>
        <h1 className="mt-4 text-3xl font-bold">{content.title}</h1>
        <p className="mt-3 leading-7 text-slate-600">
          {content.description}
        </p>

        <div className="mt-8 space-y-3 rounded-xl bg-slate-50 p-5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Order ID</span>
            <strong className="text-right">{donation.orderId}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Nominal</span>
            <strong>{formatRupiah(donation.amount)}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Status</span>
            <strong>{donation.status}</strong>
          </div>
        </div>

        {donation.status === "settlement" ? (
          <div className="mt-6 rounded-xl border border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-green-700">
              Badge Terima Kasih
            </p>
            <p className="mt-3 text-lg font-bold">
              🌿 Terima kasih, {getReceiptDonorName(donation)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Donasi {formatRupiah(donation.amount)} untuk Jumat Berkah sudah
              diterima. Order {donation.orderId} aman dibagikan sebagai bukti
              tanpa data kontak pribadi.
            </p>
            <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-950 ring-1 ring-slate-200">
              {buildShareText(donation.orderId, donation.amount)}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/donasi"
            className="rounded-lg bg-green-700 px-5 py-3 text-center font-semibold text-white"
          >
            Donasi Lagi
          </Link>
          <Link
            href="/laporan"
            className="rounded-lg border border-slate-300 px-5 py-3 text-center font-semibold text-green-700"
          >
            Lihat Laporan
          </Link>
        </div>
      </section>
    </main>
  );
}

function getStatusContent(status: string) {
  if (status === "settlement") {
    return {
      title: "Pembayaran berhasil. Terima kasih.",
      description: "Donasi sudah diterima dan akan masuk laporan pemasukan.",
    };
  }

  if (status === "expire") {
    return {
      title: "Pembayaran kedaluwarsa.",
      description: "Silakan buat donasi baru jika masih ingin berdonasi.",
    };
  }

  if (["cancel", "deny", "failure"].includes(status)) {
    return {
      title: "Pembayaran gagal.",
      description: "Pembayaran belum berhasil. Silakan coba buat donasi baru.",
    };
  }

  return {
    title: "Menunggu pembayaran.",
    description:
      "Donasi sudah dicatat. Status akan berubah setelah Midtrans mengirim konfirmasi pembayaran.",
  };
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

function buildShareText(orderId: string, amount: number) {
  return `Alhamdulillah, donasi ${formatRupiah(amount)} untuk Jumat Berkah sudah diterima. Order: ${orderId}. Semoga menjadi berkah.`;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
