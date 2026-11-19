import Link from "next/link";

import { CycleCountdown } from "@/components/cycle-countdown";
import {
  PRESET_DONATION_AMOUNTS,
  buildDonationHref,
} from "@/lib/donation-amount";
import { formatRupiah } from "@/lib/format";
import { estimatePortionCount } from "@/lib/portion-estimate";
import type { WeeklyTargetProgress } from "@/lib/weekly-target";

const JAKARTA_TIME_ZONE = "Asia/Jakarta";
const LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--craft-ink-soft)]";

function formatDistributionFriday(cycleToDate: string): string {
  // Cycle ends Thursday (cycleToDate). The Nasi Jumat Berkah is served the next day (Friday).
  const distributionDate = new Date(`${cycleToDate}T00:00:00+07:00`);
  distributionDate.setUTCDate(distributionDate.getUTCDate() + 1);

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(distributionDate);
}

function formatCycleDeadline(cycleToDate: string): string {
  const deadlineDate = new Date(`${cycleToDate}T00:00:00+07:00`);

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(deadlineDate);
}

function formatPortions(amount: number, costPerPortion: number | null) {
  const portions = estimatePortionCount({ amount, costPerPortion });

  if (portions === null || portions <= 0) {
    return null;
  }

  return `≈ ${new Intl.NumberFormat("id-ID").format(portions)} porsi`;
}

export function LandingTargetProgress({
  progress,
  collectedPercent,
  costPerPortion,
}: {
  progress: WeeklyTargetProgress;
  collectedPercent: number;
  costPerPortion: number | null;
}) {
  const targetAmount = progress.target?.targetAmount ?? 0;
  const hasTarget = targetAmount > 0;
  const cappedPercent = Math.min(collectedPercent, 100);
  const distributionDateLabel = formatDistributionFriday(progress.cycle.toDate);
  const deadlineLabel = formatCycleDeadline(progress.cycle.toDate);
  const targetPortions = hasTarget
    ? formatPortions(targetAmount, costPerPortion)
    : null;
  const collectedPortions = formatPortions(progress.collected, costPerPortion);

  return (
    <section
      className="craft-card-strong overflow-hidden"
      aria-labelledby="target-minggu-ini"
    >
      <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
        <div>
          <span className="craft-pill">Target Minggu Ini</span>
          <h2
            id="target-minggu-ini"
            className="mt-4 text-2xl font-bold leading-tight sm:text-3xl"
          >
            {hasTarget
              ? "Pantau pencapaian dana siklus Jumat."
              : progress.collected > 0
                ? "Donasi minggu ini sudah berjalan."
                : "Jadilah donatur pertama minggu ini."}
          </h2>
          {progress.cycle.isNewCycle ? (
            <span className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              Siklus baru dimulai
            </span>
          ) : null}
          <div className="mt-4">
            <CycleCountdown
              deadlineAtIso={progress.cycle.deadlineAtIso}
              deadlineLabel={deadlineLabel}
              label="Sisa waktu donasi siklus ini"
              tone="public"
            />
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            {hasTarget
              ? `Donasi yang masuk akan digunakan untuk Nasi Jumat Berkah ${distributionDateLabel}.`
              : `Donasi ditutup ${deadlineLabel}. Nasi dimasak dan disalurkan ${distributionDateLabel}.`}
          </p>
        </div>

        {hasTarget ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3">
              <p className={LABEL_CLASS}>Progress</p>
              <p className="craft-num text-3xl text-[color:var(--craft-leaf)] sm:text-4xl">
                {collectedPercent}%
              </p>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full"
              role="progressbar"
              aria-label="Pencapaian target dana minggu ini"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={cappedPercent}
              aria-valuetext={`${collectedPercent}% dari target ${formatRupiah(targetAmount)}`}
              style={{ background: "rgba(15, 42, 31, 0.08)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{
                  width: `${cappedPercent}%`,
                  background:
                    "linear-gradient(90deg, var(--craft-leaf), var(--craft-amber))",
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
              <Stat
                label="Target"
                value={formatRupiah(targetAmount)}
                hint={targetPortions}
              />
              <Stat
                label="Terkumpul"
                value={formatRupiah(progress.collected)}
                hint={collectedPortions}
              />
              <div className="col-span-2 rounded-2xl bg-[color:var(--craft-paper)] px-3 py-3">
                <p className={LABEL_CLASS}>
                  {progress.reachedTarget ? "Status" : "Sisa menuju target"}
                </p>
                <p className="craft-num mt-1 text-base text-[color:var(--craft-ink)] sm:text-lg">
                  {progress.reachedTarget
                    ? "Target tercapai"
                    : formatRupiah(progress.remaining)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {progress.collected > 0 ? (
              <div className="rounded-2xl bg-[color:var(--craft-paper)] px-4 py-3">
                <p className={LABEL_CLASS}>Terkumpul minggu ini</p>
                <p className="craft-num mt-1 text-xl text-[color:var(--craft-ink)]">
                  {formatRupiah(progress.collected)}
                </p>
                {collectedPortions ? (
                  <p className="mt-1 text-xs text-[color:var(--craft-ink-soft)]">
                    {collectedPortions}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <p className={LABEL_CLASS}>Pilih nominal cepat</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_DONATION_AMOUNTS.map((preset) => (
                  <Link
                    key={preset}
                    href={buildDonationHref(preset)}
                    className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-4 text-sm font-semibold text-[color:var(--craft-ink)] transition hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
                  >
                    {formatRupiah(preset)}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/donasi"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
            >
              Donasi Sekarang
              <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string | null;
}) {
  return (
    <div className="rounded-2xl bg-[color:var(--craft-paper)] px-3 py-3">
      <p className={LABEL_CLASS}>{label}</p>
      <p className="craft-num mt-1 text-base text-[color:var(--craft-ink)] sm:text-lg">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[color:var(--craft-ink-soft)]">{hint}</p>
      ) : null}
    </div>
  );
}