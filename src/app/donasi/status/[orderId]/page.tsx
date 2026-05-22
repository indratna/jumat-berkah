import Link from "next/link";

import { getPrisma } from "@/lib/db";

type DonationStatusPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function DonationStatusPage({ params }: DonationStatusPageProps) {
  const { orderId } = await params;
  const prisma = getPrisma();
  const donation = await prisma.donation.findUnique({
    where: { orderId },
    select: {
      orderId: true,
      amount: true,
      status: true,
      paidAt: true,
    },
  });

  if (!donation) {
    return (
      <main className="min-h-screen bg-emerald-50 px-6 py-16 text-emerald-950">
        <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
            Tidak ditemukan
          </p>
          <h1 className="mt-4 text-3xl font-bold">Donasi tidak ditemukan.</h1>
          <Link href="/donasi" className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-3 font-semibold text-white">
            Kembali Donasi
          </Link>
        </section>
      </main>
    );
  }

  const content = getStatusContent(donation.status);

  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-16 text-emerald-950">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Status Donasi
        </p>
        <h1 className="mt-4 text-3xl font-bold">{content.title}</h1>
        <p className="mt-3 leading-7 text-emerald-900/75">{content.description}</p>

        <div className="mt-8 space-y-3 rounded-2xl bg-emerald-50 p-5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-emerald-900/70">Order ID</span>
            <strong className="text-right">{donation.orderId}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-900/70">Nominal</span>
            <strong>{formatRupiah(donation.amount)}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-900/70">Status</span>
            <strong>{donation.status}</strong>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/donasi" className="rounded-full bg-emerald-700 px-5 py-3 text-center font-semibold text-white">
            Donasi Lagi
          </Link>
          <Link href="/laporan" className="rounded-full border border-emerald-200 px-5 py-3 text-center font-semibold text-emerald-800">
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
    description: "Donasi sudah dicatat. Status akan berubah setelah Midtrans mengirim konfirmasi pembayaran.",
  };
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
