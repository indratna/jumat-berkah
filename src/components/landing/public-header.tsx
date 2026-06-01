"use client";

import { useEffect, useRef, useState } from "react";

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header
      className={`flex items-center justify-between gap-4 ${className}`.trim()}
    >
      <Link
        href="/"
        className="inline-flex min-w-0 items-center gap-3 text-[color:var(--craft-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--craft-leaf)]"
        aria-label="Beranda Jumat Berkah Karyo"
      >
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl ring-1 ring-[color:var(--craft-line-strong)]/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-mark.png"
            alt="Logo Jumat Berkah"
            className="size-full object-cover"
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-extrabold tracking-tight">
            Jumat Berkah Karyo
          </span>
          <span className="block truncate text-[11px] font-semibold text-[color:var(--craft-ink-soft)] sm:text-xs">
            Jumat Berkah: Donasi Mudah, Laporan Terbuka
          </span>
        </span>
      </Link>
      <nav
        ref={menuRef}
        aria-label="Navigasi utama"
        className="relative flex shrink-0 items-center gap-2 text-sm"
      >
        {/* Mobile hamburger button */}
        <button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label="Buka menu navigasi"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-cream)]/80 text-[color:var(--craft-ink)] shadow-sm transition-colors hover:bg-[color:var(--craft-leaf)] hover:text-[color:var(--craft-cream)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--craft-leaf)] sm:hidden"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileMenuOpen ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="absolute right-0 top-full z-50 mt-2 min-w-[10rem] overflow-hidden rounded-2xl border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-cream)] shadow-lg sm:hidden"
          >
            {publicNavLinks.map((link) => {
              const isActive = activeNavHref === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    if (pathname !== link.href) {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className={`block px-5 py-3 font-bold transition-colors ${
                    isActive
                      ? "bg-[color:var(--craft-leaf)] text-[color:var(--craft-cream)]"
                      : "text-[color:var(--craft-ink)] hover:bg-[color:var(--craft-leaf)]/10 hover:text-[color:var(--craft-leaf)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
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
