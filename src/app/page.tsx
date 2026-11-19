import Link from "next/link";
import { Suspense } from "react";

import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import {
  SocialProofSkeleton,
  StoriesSkeleton,
  TargetCardSkeleton,
} from "@/components/landing/landing-skeletons";
import { LandingSocialProofSection } from "@/components/landing/landing-social-proof-section";
import { LandingStoriesSection } from "@/components/landing/landing-stories-section";
import { LandingTargetSection } from "@/components/landing/landing-target-section";
import { LandingTransparency } from "@/components/landing/landing-transparency";
import { PublicHeader } from "@/components/landing/public-header";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="landing-craft landing-noise min-h-screen">
      <main
        id="main-content"
        className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-32 pt-6 sm:px-6 sm:pb-20 lg:px-8 lg:py-12"
      >
        <PublicHeader />

        <div className="grid items-stretch gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <LandingHero />
          </div>
          <div className="lg:col-span-5">
            <Suspense fallback={<TargetCardSkeleton />}>
              <LandingTargetSection />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<SocialProofSkeleton />}>
          <LandingSocialProofSection />
        </Suspense>

        <Suspense fallback={<StoriesSkeleton />}>
          <LandingStoriesSection />
        </Suspense>

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