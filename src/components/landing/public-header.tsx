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
        className="inline-flex min-w-0 items-center gap-3 text-base font-extrabold tracking-tight text-[color:var(--craft-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--craft-leaf)]"
        aria-label="Beranda Jumat Berkah Karyo"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[color:var(--craft-leaf)] text-sm font-bold text-[color:var(--craft-cream)]">
          JB
        </span>
        <span className="truncate">Jumat Berkah Karyo</span>
      </Link>
      <nav
        aria-label="Navigasi utama"
        className="flex shrink-0 items-center gap-2 text-sm"
      >
        <div className="relative hidden rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-cream)]/80 p-1 shadow-sm sm:flex">
          {activeNavIndex >= 0 ? (
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 w-[6.5rem] rounded-full bg-[color:var(--craft-leaf)] shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${
                activeNavIndex === 1 ? "translate-x-[6.5rem]" : "translate-x-0"
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
                className={`relative z-10 inline-flex min-h-10 w-[6.5rem] items-center justify-center rounded-full px-4 font-bold transition-[color,transform] duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--craft-leaf)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  isActive
                    ? "text-[color:var(--craft-cream)]"
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
          className={`inline-flex min-h-12 items-center rounded-full px-6 font-bold shadow-sm transition-[background-color,color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--craft-leaf)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
            isDonationActive
              ? "bg-[color:var(--craft-leaf-strong)] text-[color:var(--craft-cream)] ring-1 ring-[color:var(--craft-leaf)]"
              : "bg-[color:var(--craft-leaf)] text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)] hover:shadow-md"
          }`}
        >
          {publicNavCta.label}
        </Link>
      </nav>
    </header>
  );
}
