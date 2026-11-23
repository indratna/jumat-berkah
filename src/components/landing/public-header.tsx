import Image from "next/image";
import Link from "next/link";

import { PublicHeaderNav } from "./public-header-nav";

/**
 * The logo and header shell render on the server; only the navigation is a
 * client island so the menu state does not hydrate the whole header.
 */
export function PublicHeader({ className = "" }: { className?: string }) {
  return (
    <header
      className={`flex items-center justify-between gap-4 ${className}`.trim()}
    >
      <Link
        href="/"
        className="inline-flex min-h-11 min-w-0 flex-1 items-center gap-2 text-[color:var(--craft-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--craft-leaf)] sm:gap-3"
      >
        <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-2xl ring-1 ring-[color:var(--craft-line-strong)]/40 sm:size-10">
          <Image
            src="/branding/logo-mark.png"
            alt="Logo Jumat Berkah"
            width={40}
            height={40}
            sizes="40px"
            priority
            className="size-full object-cover"
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-extrabold tracking-tight sm:text-base">
            Jumat Berkah Karyo
          </span>
          <span className="hidden truncate text-xs font-semibold text-[color:var(--craft-ink-soft)] sm:block">
            Jumat Berkah: Donasi Mudah, Laporan Terbuka
          </span>
        </span>
      </Link>
      <PublicHeaderNav />
    </header>
  );
}
