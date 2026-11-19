import Link from "next/link";

import { LandingTargetProgress } from "@/components/landing/landing-target-progress";
import {
  getLandingCostPerPortion,
  getLandingProgress,
} from "@/lib/landing";
import type { WeeklyTargetProgress } from "@/lib/weekly-target";

type TargetSectionData = {
  progress: WeeklyTargetProgress;
  costPerPortion: number | null;
};

export async function LandingTargetSection() {
  let data: TargetSectionData | null = null;

  try {
    const [progress, costPerPortion] = await Promise.all([
      getLandingProgress(),
      getLandingCostPerPortion(),
    ]);
    data = { progress, costPerPortion };
  } catch (error) {
    console.error("Landing target section failed", error);
  }

  if (!data) {
    return <TargetErrorCard />;
  }

  return (
    <LandingTargetProgress
      progress={data.progress}
      collectedPercent={Math.round(data.progress.progressRatio * 100)}
      costPerPortion={data.costPerPortion}
    />
  );
}

function TargetErrorCard() {
  return (
    <section className="craft-card-strong flex flex-col gap-3 p-6 text-center sm:p-8">
      <span className="craft-pill mx-auto">Target Minggu Ini</span>
      <h2 className="mt-2 text-2xl font-bold leading-tight">
        Data target belum bisa dimuat.
      </h2>
      <p className="text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        Donasi tetap bisa dilakukan. Coba muat ulang halaman untuk melihat
        pencapaian terbaru.
      </p>
      <Link
        href="/"
        className="mx-auto mt-2 inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
      >
        Muat ulang
      </Link>
    </section>
  );
}