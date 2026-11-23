import { Suspense } from "react";

import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero, LandingHeroFigure } from "@/components/landing/landing-hero";
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
import { MobileDonationCta } from "@/components/landing/mobile-donation-cta";
import { PublicHeader } from "@/components/landing/public-header";

// The landing tree has no cookies/headers/searchParams reads, so it can be
// cached. Keep this in sync with the Friday-cycle caveat in the plan: data may
// be up to 60 seconds stale around the weekly boundary.
export const revalidate = 60;

export default function Home() {
  return (
    <div className="landing-craft landing-noise min-h-screen">
      <main
        id="main-content"
        className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-32 pt-6 sm:px-6 sm:pb-20 lg:px-8 lg:py-12"
      >
        <PublicHeader />

        {/*
          Mobile order is intentional: headline and quick amounts first, then the
          target card, then the illustration. On desktop the illustration moves
          back under the hero while the target card sticks in the right column.
        */}
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 lg:row-start-1">
            <LandingHero />
          </div>
          <div className="lg:col-span-5 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-8">
              <Suspense fallback={<TargetCardSkeleton />}>
                <LandingTargetSection />
              </Suspense>
            </div>
          </div>
          <div className="lg:col-span-7 lg:row-start-2">
            <LandingHeroFigure />
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

      <MobileDonationCta />
    </div>
  );
}