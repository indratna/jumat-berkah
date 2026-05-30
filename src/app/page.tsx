import Link from "next/link";

import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingStories } from "@/components/landing/landing-stories";
import { LandingTargetProgress } from "@/components/landing/landing-target-progress";
import { LandingTransparency } from "@/components/landing/landing-transparency";
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
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-base font-extrabold tracking-tight text-[color:var(--craft-ink)]"
            aria-label="Beranda Jumat Berkah Karyo"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-[color:var(--craft-leaf)] text-sm font-bold text-[color:var(--craft-cream)]">
              JB
            </span>
            <span>Jumat Berkah Karyo</span>
          </Link>
          <nav
            aria-label="Navigasi utama"
            className="flex items-center gap-2 text-sm"
          >
            <Link
              href="/laporan"
              className="hidden min-h-11 items-center rounded-full px-4 font-semibold text-[color:var(--craft-ink)] hover:text-[color:var(--craft-leaf)] sm:inline-flex"
            >
              Laporan
            </Link>
            <Link
              href="/tentang"
              className="hidden min-h-11 items-center rounded-full px-4 font-semibold text-[color:var(--craft-ink)] hover:text-[color:var(--craft-leaf)] sm:inline-flex"
            >
              Tentang
            </Link>
            <Link
              href="/donasi"
              className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
            >
              Donasi
            </Link>
          </nav>
        </header>

        <LandingHero metrics={metrics} collectedPercent={collectedPercent} />

        <LandingTargetProgress
          progress={progress}
          metrics={metrics}
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
