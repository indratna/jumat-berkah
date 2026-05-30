# Public Landing Header Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify top navigation for public landing-family pages and add animated active-pill navigation.

**Architecture:** Create one shared landing header component used by `/`, `/tentang`, `/laporan`, and `/donasi`. Keep page bodies unchanged. Use a small pure helper for active nav state, covered with TDD, and a client component for pathname-based styling.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, node:test.

---

## File Structure

### Create

- `src/components/landing/public-header.tsx` — shared landing header with brand, nav links, CTA, and animated active-pill styles.
- `src/lib/public-nav.ts` — shared nav config and pure active-state helper.

### Modify

- `src/app/page.tsx` — replace duplicated header with `PublicHeader`.
- `src/app/tentang/page.tsx` — replace duplicated header with `PublicHeader`.
- `src/app/laporan/page.tsx` — replace duplicated print-hidden header with `PublicHeader className="print-hide"`.
- `src/app/donasi/page.tsx` — replace duplicated header with `PublicHeader`.
- `src/tests/business-rules.test.ts` — add TDD coverage for active nav helper.
- `IMPLEMENTATION_PLAN.md` — add Work Log entry after validation.

---

## Task 1: TDD shared public nav state

**Files:**
- Modify: `src/tests/business-rules.test.ts`
- Create: `src/lib/public-nav.ts`

- [ ] **Step 1: Write failing tests**

Add import:

```ts
import { getPublicNavActiveState } from "@/lib/public-nav";
```

Add tests:

```ts
test("public landing nav active state follows landing-family routes", () => {
  assert.deepEqual(getPublicNavActiveState("/laporan"), {
    activeNavHref: "/laporan",
    isDonationActive: false,
  });
  assert.deepEqual(getPublicNavActiveState("/tentang"), {
    activeNavHref: "/tentang",
    isDonationActive: false,
  });
  assert.deepEqual(getPublicNavActiveState("/"), {
    activeNavHref: null,
    isDonationActive: false,
  });
  assert.deepEqual(getPublicNavActiveState("/donasi"), {
    activeNavHref: null,
    isDonationActive: true,
  });
});
```

- [ ] **Step 2: Verify red**

Run:

```bash
npm test -- src/tests/business-rules.test.ts
```

Expected: FAIL because `@/lib/public-nav` does not exist.

- [ ] **Step 3: Implement helper**

Create `src/lib/public-nav.ts`:

```ts
export const publicNavLinks = [
  { href: "/laporan", label: "Laporan" },
  { href: "/tentang", label: "Tentang" },
] as const;

export const publicNavCta = {
  href: "/donasi",
  label: "Donasi Sekarang",
} as const;

export function getPublicNavActiveState(pathname: string) {
  const activeNavHref = publicNavLinks.find((link) => link.href === pathname)?.href ?? null;

  return {
    activeNavHref,
    isDonationActive: pathname === publicNavCta.href,
  };
}
```

- [ ] **Step 4: Verify green**

Run:

```bash
npm test -- src/tests/business-rules.test.ts
```

Expected: PASS.

---

## Task 2: Build shared public header

**Files:**
- Create: `src/components/landing/public-header.tsx`

- [ ] **Step 1: Create shared component**

Create `src/components/landing/public-header.tsx`:

```tsx
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

  return (
    <header className={`flex items-center justify-between gap-4 ${className}`.trim()}>
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
      <nav aria-label="Navigasi utama" className="flex items-center gap-2 text-sm">
        {publicNavLinks.map((link) => {
          const isActive = activeNavHref === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`hidden min-h-11 items-center rounded-full px-4 font-semibold transition-[background-color,color,box-shadow,transform] duration-300 ease-out sm:inline-flex ${
                isActive
                  ? "bg-[color:var(--craft-paper)] text-[color:var(--craft-leaf)] shadow-sm ring-1 ring-[color:var(--craft-line-strong)]"
                  : "text-[color:var(--craft-ink)] hover:bg-[color:var(--craft-paper)] hover:text-[color:var(--craft-leaf)] hover:shadow-sm"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
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
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

---

## Task 3: Replace page headers

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/tentang/page.tsx`
- Modify: `src/app/laporan/page.tsx`
- Modify: `src/app/donasi/page.tsx`

- [ ] **Step 1: Replace duplicated headers**

For each page, remove duplicated top `<header>` block and render:

```tsx
<PublicHeader />
```

For `/laporan`, preserve print hiding:

```tsx
<PublicHeader className="print-hide" />
```

- [ ] **Step 2: Remove unused `Link` imports**

Keep `Link` imports only where page body still uses `Link` outside header. Current pages still need `Link` in `/`, `/tentang`, and `/donasi`; `/laporan` does not need `Link` if all remaining links are plain `<a>`.

- [ ] **Step 3: Run validation**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: all PASS.

---

## Task 4: Manual smoke and docs

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Manual smoke**

Open:

```txt
http://localhost:3037/
http://localhost:3037/tentang
http://localhost:3037/laporan
http://localhost:3037/donasi
```

Verify:

- all 4 pages show identical header structure
- brand links to `/`
- `Laporan` links to `/laporan`
- `Tentang` links to `/tentang`
- `Donasi Sekarang` links to `/donasi`
- active pill appears on `/laporan`
- active pill appears on `/tentang`
- CTA active state appears on `/donasi`
- mobile layout remains stable

- [ ] **Step 2: Update Work Log**

Under `2026-05-30`, add:

```md
- Unified public landing-family headers for `/`, `/tentang`, `/laporan`, and `/donasi` with shared `PublicHeader`, consistent `Laporan`/`Tentang`/`Donasi Sekarang` navigation, and animated active-pill styling. Added TDD coverage for public nav active-state helper. Validation passed: `npm run lint`, `npm test` (117/117), `npm run build`.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-05-30-public-landing-header-unification-design.md docs/superpowers/plans/2026-05-30-public-landing-header-unification.md src/components/landing/public-header.tsx src/lib/public-nav.ts src/app/page.tsx src/app/tentang/page.tsx src/app/laporan/page.tsx src/app/donasi/page.tsx src/tests/business-rules.test.ts IMPLEMENTATION_PLAN.md
git commit -m "Unify public landing navigation"
```

---

## Self-Review

- Spec coverage: all 4 scoped pages, shared header, active-pill animation, CTA consistency, and validation covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: helper returns `activeNavHref` and `isDonationActive`; component uses same names.
- Scope check: excludes donor/admin/auth/status pages and body content changes.
