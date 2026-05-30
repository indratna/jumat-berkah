import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { DONOR_SESSION_COOKIE, getDonorUser } from "@/lib/auth";
import { getBetterAuthDonorUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import { createDonorLinkCode } from "@/lib/telegram-donor";
import { getWeeklyTargetProgress } from "@/lib/weekly-target";
import {
  calculateDonorDashboardStats,
  getDonationPrivacyLabel,
  getDonationStatusTone,
  getDonorDisplayName,
  getLatestDonationSummary,
  getTargetDashboardCopy,
  type DashboardDonation,
} from "./dashboard-rules";
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
    take: 10,
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

  const weeklyTargetProgress = await getWeeklyTargetProgress();
  const targetAmount = weeklyTargetProgress.target?.targetAmount ?? 0;
  const targetCopy = getTargetDashboardCopy({
    targetAmount,
    collected: weeklyTargetProgress.collected,
    remaining: weeklyTargetProgress.remaining,
    progressRatio: weeklyTargetProgress.progressRatio,
  });

  const displayName = getDonorDisplayName({
    name: donor.name,
    email: donor.email,
  });
  const stats = calculateDonorDashboardStats(donations as DashboardDonation[]);
  const latestDonation = getLatestDonationSummary(
    donations as DashboardDonation[],
  );

  return (
    <main className="landing-craft landing-noise min-h-screen text-[color:var(--craft-ink)]">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-base font-extrabold tracking-tight text-[color:var(--craft-ink)]"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-[color:var(--craft-leaf)] text-sm font-bold text-[color:var(--craft-cream)]">
              JB
            </span>
            <span>Jumat Berkah Karyo</span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/donasi"
              className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
            >
              Donasi Lagi
            </Link>
            <Link
              href="/akun/profil"
              className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
            >
              Profil
            </Link>
            <DonorLogoutButton />
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
          <div className="craft-card-strong p-6 sm:p-8">
            <span className="craft-pill">Dashboard donatur</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Assalamu’alaikum, {displayName}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)]">
              Terima kasih sudah ikut menjaga Jumat Berkah tetap berjalan. Di
              sini Anda bisa melihat riwayat donasi, status pembayaran, dan
              pengaturan akun donatur.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/donasi"
                className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
              >
                Donasi Lagi Jumat Ini
              </Link>
              <Link
                href="/laporan?period=jumat"
                className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
              >
                Lihat laporan publik
              </Link>
            </div>
          </div>

          <TargetCard
            targetCopy={targetCopy}
            targetAmount={targetAmount}
            collected={weeklyTargetProgress.collected}
            remaining={weeklyTargetProgress.remaining}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total berhasil"
            value={formatRupiah(stats.totalSuccessful)}
          />
          <MetricCard
            label="Transaksi"
            value={String(stats.transactionCount)}
          />
          <MetricCard label="Menunggu" value={String(stats.pendingCount)} />
          <MetricCard
            label="Donasi terakhir"
            value={
              latestDonation ? formatRupiah(latestDonation.amount) : "Belum ada"
            }
            detail={
              latestDonation
                ? getDonationStatusTone(latestDonation.status).label
                : "Mulai donasi pertama"
            }
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <TelegramCard donorTelegram={donorTelegram} />
          <ProfileSummaryCard displayName={displayName} email={donor.email} />
        </section>

        <section className="craft-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="craft-pill">Riwayat</span>
              <h2 className="mt-3 text-2xl font-extrabold text-[color:var(--craft-ink)]">
                Donasi terbaru Anda
              </h2>
            </div>
            <Link
              href="/donasi"
              className="inline-flex min-h-10 items-center rounded-full border border-[color:var(--craft-line-strong)] px-4 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
            >
              Donasi Lagi
            </Link>
          </div>

          {donations.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {donations.map((donation) => (
                <DonationHistoryCard key={donation.id} donation={donation} />
              ))}
            </div>
          ) : (
            <EmptyDonationState />
          )}
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="craft-card p-5">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--craft-leaf)]">
        {label}
      </p>
      <p className="craft-num mt-4 text-3xl italic text-[color:var(--craft-ink)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          {detail}
        </p>
      ) : null}
    </article>
  );
}

function TargetCard({
  targetCopy,
  targetAmount,
  collected,
  remaining,
}: {
  targetCopy: { hasTarget: boolean; progressPercent: number; title: string };
  targetAmount: number;
  collected: number;
  remaining: number;
}) {
  return (
    <article className="craft-card flex flex-col justify-between p-6">
      <div>
        <span className="craft-pill">Jumat ini</span>
        <h2 className="mt-4 text-2xl font-extrabold text-[color:var(--craft-ink)]">
          {targetCopy.title}
        </h2>
        {targetCopy.hasTarget ? (
          <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            Terkumpul {formatRupiah(collected)} dari target{" "}
            {formatRupiah(targetAmount)}.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            Target mingguan belum tersedia. Anda tetap bisa berdonasi kapan
            saja.
          </p>
        )}
      </div>
      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-[color:var(--craft-paper)] ring-1 ring-[color:var(--craft-line)]">
          <div
            className="h-full rounded-full bg-[color:var(--craft-leaf)]"
            style={{ width: `${targetCopy.progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm font-bold text-[color:var(--craft-ink)]">
          <span>{targetCopy.progressPercent}%</span>
          <span>Sisa {formatRupiah(remaining)}</span>
        </div>
      </div>
    </article>
  );
}

function TelegramCard({
  donorTelegram,
}: {
  donorTelegram: {
    telegramChatId: bigint | null;
    telegramReminderOptIn: boolean;
    telegramLinkCode: string | null;
  };
}) {
  return (
    <article className="craft-card p-5 sm:p-6">
      <span className="craft-pill">Telegram</span>
      <h2 className="mt-3 text-2xl font-extrabold text-[color:var(--craft-ink)]">
        Pengingat donatur
      </h2>
      {donorTelegram.telegramChatId ? (
        <p className="mt-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          Telegram sudah terhubung. Reminder Jumat:{" "}
          {donorTelegram.telegramReminderOptIn ? "aktif" : "nonaktif"}.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          <p>Kirim perintah ini ke bot Telegram untuk menghubungkan akun:</p>
          <code className="block rounded-2xl bg-[color:var(--craft-paper)] px-4 py-3 font-mono text-[color:var(--craft-ink)] ring-1 ring-[color:var(--craft-line)]">
            /mulai {donorTelegram.telegramLinkCode}
          </code>
          <p>
            Kode sekali pakai. Setelah terhubung, bot dapat menampilkan riwayat
            donasi akun ini saja.
          </p>
        </div>
      )}
    </article>
  );
}

function ProfileSummaryCard({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  return (
    <article className="craft-card p-5 sm:p-6">
      <span className="craft-pill">Profil</span>
      <h2 className="mt-3 text-2xl font-extrabold text-[color:var(--craft-ink)]">
        Data akun
      </h2>
      <dl className="mt-4 space-y-3 text-sm text-[color:var(--craft-ink-soft)]">
        <div>
          <dt className="font-bold text-[color:var(--craft-ink)]">Nama</dt>
          <dd className="mt-1">{displayName}</dd>
        </div>
        <div>
          <dt className="font-bold text-[color:var(--craft-ink)]">Email</dt>
          <dd className="mt-1 break-all">{email}</dd>
        </div>
      </dl>
      <Link
        href="/akun/profil"
        className="mt-5 inline-flex min-h-10 items-center rounded-full border border-[color:var(--craft-line-strong)] px-4 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
      >
        Edit profil
      </Link>
    </article>
  );
}

function DonationHistoryCard({ donation }: { donation: DashboardDonation }) {
  const tone = getDonationStatusTone(donation.status);

  return (
    <article className="rounded-2xl border border-[color:var(--craft-line)] bg-[color:var(--craft-paper)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold text-[color:var(--craft-ink-soft)]">
            {donation.orderId}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-[color:var(--craft-ink)]">
            {formatRupiah(donation.amount)}
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${tone.className}`}
        >
          {tone.label}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[color:var(--craft-ink-soft)] sm:grid-cols-3">
        <p>{getDonationPrivacyLabel(donation)}</p>
        <p>{formatDate(donation.paidAt ?? donation.createdAt)}</p>
        <Link
          href={`/donasi/status/${donation.orderId}`}
          className="font-bold text-[color:var(--craft-leaf)]"
        >
          Lihat status
        </Link>
      </div>
      {donation.message ? (
        <p className="mt-3 rounded-2xl bg-[color:var(--craft-cream)] p-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          “{donation.message}”
        </p>
      ) : null}
    </article>
  );
}

function EmptyDonationState() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] p-6 text-center">
      <h3 className="text-xl font-extrabold text-[color:var(--craft-ink)]">
        Belum ada donasi yang terhubung.
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        Mulai dari donasi pertama Anda, atau daftar dengan email yang sama agar
        riwayat lama bisa tersambung.
      </p>
      <Link
        href="/donasi"
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
      >
        Donasi Pertama
      </Link>
    </div>
  );
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
