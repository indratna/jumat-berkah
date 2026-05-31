import Link from "next/link";

import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingStories } from "@/components/landing/landing-stories";
import { LandingTargetProgress } from "@/components/landing/landing-target-progress";
import { LandingTransparency } from "@/components/landing/landing-transparency";
import { PublicHeader } from "@/components/landing/public-header";
import {
  getLandingMetrics,
  getLandingProgress,
  getLandingStories,
} from "@/lib/landing";

export default async function Home() {
  const [metrics, progress, stories] = await Promise.all([
    getLandingMetrics(),
    getLandingProgress(),
    getLandingStories(3),
  ]);

  const collectedPercent = Math.round(progress.progressRatio * 100);

  return (
    <div className="landing-craft landing-noise min-h-screen">
      <main
        id="main-content"
        className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-32 pt-6 sm:px-6 sm:pb-20 lg:px-8 lg:py-12"
      >
        <PublicHeader />

        <LandingHero metrics={metrics} collectedPercent={collectedPercent} />

        <LandingTargetProgress
          progress={progress}
          collectedPercent={collectedPercent}
        />

        <LandingStories stories={stories} />

        <LandingHowItWorks />

        <LandingTransparency />

        <LandingFaq />

        <LandingFooter />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--craft-line-strong)] bg-[color:var(--craft-leaf)] p-3 md:hidden">
        <Link
          href="/donasi"
          className="flex min-h-11 w-full items-center justify-center rounded-full bg-[color:var(--craft-leaf-strong)] px-4 text-sm font-bold text-[color:var(--craft-cream)]"
        >
          Donasi Sekarang
        </Link>
      </div>
    </div>
  );
}
