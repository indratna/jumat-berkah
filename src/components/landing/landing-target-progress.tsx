import { CycleCountdown } from "@/components/cycle-countdown";
import type { WeeklyTargetProgress } from "@/lib/weekly-target";
import { formatRupiah } from "@/lib/format";

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

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

export function LandingTargetProgress({
  progress,
  collectedPercent,
}: {
  progress: WeeklyTargetProgress;
  collectedPercent: number;
}) {
  const targetAmount = progress.target?.targetAmount ?? 0;
  const cappedPercent = Math.min(collectedPercent, 100);
  const distributionDateLabel = formatDistributionFriday(progress.cycle.toDate);

  return (
    <section className="craft-card-strong h-full overflow-hidden">
      <div className="flex h-full flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
        <div>
          <span className="craft-pill">Target Minggu Ini</span>
          <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
            Pantau pencapaian dana siklus Jumat.
          </h2>
          {progress.cycle.isNewCycle ? (
            <span className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Siklus baru dimulai
            </span>
          ) : null}
          <div className="mt-4">
            <CycleCountdown
              deadlineAtIso={progress.cycle.deadlineAtIso}
              label="Sisa waktu donasi siklus ini"
              tone="public"
            />
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            Donasi yang masuk akan digunakan untuk Nasi Jumat Berkah{" "}
            {distributionDateLabel}.
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--craft-ink-soft)]">
              Progress
            </p>
            <p className="craft-num text-3xl text-[color:var(--craft-leaf)] sm:text-4xl">
              {collectedPercent}%
            </p>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full"
            style={{ background: "rgba(15, 42, 31, 0.08)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
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
              value={
                targetAmount > 0 ? formatRupiah(targetAmount) : "Belum diatur"
              }
            />
            <Stat label="Terkumpul" value={formatRupiah(progress.collected)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[color:var(--craft-paper)] px-3 py-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[color:var(--craft-ink-soft)]">
        {label}
      </p>
      <p className="craft-num mt-1 text-base text-[color:var(--craft-ink)] sm:text-lg">
        {value}
      </p>
    </div>
  );
}
