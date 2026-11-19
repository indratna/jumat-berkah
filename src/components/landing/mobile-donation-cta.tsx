"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Mobile-only donation CTA. It stays hidden while the hero CTA is on screen so
 * the same action never appears twice, then appears once the hero scrolls away.
 * The donation page does not render this component, so the Snap payment modal
 * is never covered by it.
 */
export function MobileDonationCta() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showFallback = () => {
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    };

    const heroCta = document.getElementById("hero-cta");

    if (!heroCta || typeof IntersectionObserver === "undefined") {
      return showFallback();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only show after the hero CTA has passed above the viewport.
        setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { rootMargin: "-8px 0px 0px 0px", threshold: 0 },
    );

    observer.observe(heroCta);

    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--craft-line-strong)] bg-[color:var(--craft-leaf)] p-3 md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/donasi"
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-[color:var(--craft-leaf-strong)] px-4 text-sm font-bold text-[color:var(--craft-cream)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--craft-amber)]"
      >
        Donasi Sekarang
      </Link>
    </div>
  );
}