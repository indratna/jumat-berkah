import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { DonationStatus } from "@/generated/prisma/client";
import { DONOR_SESSION_COOKIE, getDonorUser } from "@/lib/auth";
import { getBetterAuthDonorUser } from "@/lib/better-auth-guards";
import { createDonorLinkCode } from "@/lib/telegram-donor";
import { getPrisma } from "@/lib/db";
import { DonorLogoutButton } from "./logout-button";

export default async function DonorDonationHistoryPage() {
  const cookieStore = await cookies();
  const legacyDonor = await getDonorUser(
    cookieStore.get(DONOR_SESSION_COOKIE)?.value,
  );
  const donor = legacyDonor ?? (await getBetterAuthDonorUser(await headers()));

  if (!donor) {
    redirect("/masuk");
  }

  const prisma = getPrisma();
  const donorTelegram = await prisma.user.update({
    where: { id: donor.id },
    data: donor.telegramLinkCode
      ? {}
      : { telegramLinkCode: createDonorLinkCode() },
    select: {
      telegramChatId: true,
      telegramReminderOptIn: true,
      telegramLinkCode: true,
    },
  });
  const donations = await prisma.donation.findMany({
    where: { userId: donor.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderId: true,
      amount: true,
      status: true,
      isAnonymous: true,
      showNamePublicly: true,
      message: true,
      createdAt: true,
      paidAt: true,
    },
  });
  const totalSuccessful = donations
    .filter((donation) => donation.status === DonationStatus.settlement)
    .reduce((total, donation) => total + donation.amount, 0);

  return (
    <main className="page-shell text-slate-900">
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-green-700">
                Akun Donatur
              </p>
              <h1 className="mt-4 text-3xl font-bold">
                Riwayat donasi pribadi.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {donor.name ?? "Donatur"} · {donor.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/akun/profil"
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-green-700 transition hover:bg-slate-50"
              >
                Profil
              </Link>
              <DonorLogoutButton />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-green-700">
            Telegram Donatur
          </p>
          {donorTelegram.telegramChatId ? (
            <p className="mt-3 text-sm text-slate-600">
              Telegram sudah terhubung. Reminder Jumat:{" "}
              {donorTelegram.telegramReminderOptIn ? "aktif" : "nonaktif"}.
            </p>
          ) : (
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <p>
                Kirim perintah ini ke bot Telegram untuk menghubungkan akun:
              </p>
              <code className="block rounded-xl bg-slate-50 px-4 py-3 font-mono text-slate-950">
                /mulai {donorTelegram.telegramLinkCode}
              </code>
              <p>
                Kode sekali pakai. Setelah terhubung, bot dapat menampilkan
                riwayat donasi akun ini saja.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total donasi berhasil"
            value={formatRupiah(totalSuccessful)}
          />
          <SummaryCard
            label="Jumlah transaksi"
            value={String(donations.length)}
          />
          <SummaryCard
            label="Donasi pending"
            value={String(
              donations.filter(
                (donation) => donation.status === DonationStatus.pending,
              ).length,
            )}
          />
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          {donations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order ID</th>
                    <th className="px-4 py-3 font-semibold">Nominal</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Privasi</th>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {donations.map((donation) => (
                    <tr
                      key={donation.id}
                      className="border-t border-slate-200 align-top"
                    >
                      <td className="px-4 py-4 font-medium">
                        {donation.orderId}
                      </td>
                      <td className="px-4 py-4">
                        {formatRupiah(donation.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={donation.status} />
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {getPrivacyLabel(donation)}
                      </td>
                      <td className="px-4 py-4">
                        {formatDate(donation.paidAt ?? donation.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/donasi/status/${donation.orderId}`}
                          className="font-semibold text-green-700"
                        >
                          Lihat status
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-sm text-slate-600">
              Belum ada donasi yang terhubung ke akun ini. Donasi baru saat
              login akan muncul di sini.
            </div>
          )}
        </div>

        <Link
          href="/donasi"
          className="inline-flex rounded-lg bg-green-700 px-6 py-3 font-semibold text-white"
        >
          Donasi Lagi
        </Link>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-700/65">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DonationStatus }) {
  return (
    <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-semibold uppercase text-green-700">
      {status}
    </span>
  );
}

function getPrivacyLabel(input: {
  isAnonymous: boolean;
  showNamePublicly: boolean;
}) {
  if (input.isAnonymous) {
    return "Anonim";
  }

  return input.showNamePublicly ? "Nama tampil publik" : "Nama disamarkan";
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
