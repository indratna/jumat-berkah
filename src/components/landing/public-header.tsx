"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getPublicNavActiveState,
  publicNavCta,
  publicNavLinks,
} from "@/lib/public-nav";

export function PublicHeader({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { activeNavHref, isDonationActive } = getPublicNavActiveState(pathname);
  const activeNavIndex = publicNavLinks.findIndex(
    (link) => link.href === activeNavHref,
  );

  return (
    <header
      className={`flex items-center justify-between gap-4 ${className}`.trim()}
    >
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
        <div className="relative hidden rounded-full bg-[color:var(--craft-paper)]/60 p-1 sm:flex">
          {activeNavIndex >= 0 ? (
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 w-24 rounded-full bg-[color:var(--craft-paper)] shadow-sm ring-1 ring-[color:var(--craft-line-strong)] transition-transform duration-300 ease-out ${
                activeNavIndex === 1 ? "translate-x-24" : "translate-x-0"
              }`}
            />
          ) : null}
          {publicNavLinks.map((link) => {
            const isActive = activeNavHref === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative z-10 inline-flex min-h-9 w-24 items-center justify-center rounded-full px-4 font-semibold transition-[color,transform] duration-300 ease-out hover:-translate-y-0.5 ${
                  isActive
                    ? "text-[color:var(--craft-leaf)]"
                    : "text-[color:var(--craft-ink)] hover:text-[color:var(--craft-leaf)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <Link
          href={publicNavCta.href}
          aria-current={isDonationActive ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-full px-5 font-bold transition-[background-color,color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 ${
            isDonationActive
              ? "bg-[color:var(--craft-leaf-strong)] text-[color:var(--craft-cream)] shadow-md ring-1 ring-[color:var(--craft-leaf)]"
              : "bg-[color:var(--craft-leaf)] text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)] hover:shadow-md"
          }`}
        >
          {publicNavCta.label}
        </Link>
      </nav>
    </header>
  );
}
