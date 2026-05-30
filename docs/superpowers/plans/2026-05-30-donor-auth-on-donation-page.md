# Donor Auth on Donation Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional donor login/signup choices on `/donasi`, post-donation signup CTA on status page, verified email/password signup, donation history linking, and admin-safe donor session handling.

**Architecture:** Keep donation anonymous flow unchanged. Add focused auth UI components and pure resolver helpers around existing routes. Use Better Auth for Google/email-password signup, require email verification for email-password, and attach guest donations to donor accounts only after verified email ownership.

**Tech Stack:** Next.js App Router, React, TypeScript, Better Auth, Prisma, PostgreSQL, node:test, Tailwind/craft CSS utilities.

---

## File Structure

### Files to create

- `src/app/donasi/donor-auth-banner.tsx` — server banner component for anonymous, donor, and hidden admin states.
- `src/app/donasi/donor-auth-banner-rules.ts` — pure resolver for banner variant; unit-tested.
- `src/app/donasi/donor-auth-logout-button.tsx` — client donor logout button.
- `src/app/daftar/page.tsx` — donor signup page.
- `src/app/daftar/donor-signup-form.tsx` — client signup form with Google + email/password.
- `src/app/cek-email/page.tsx` — post-signup email verification instruction page.
- `src/app/donasi/status/[orderId]/donor-signup-cta.tsx` — server CTA component on status page.
- `src/tests/donor-auth-banner.test.ts` — banner resolver tests.
- `src/tests/donor-signup-email.test.ts` — email verification template tests.
- `src/tests/donation-account-linking.test.ts` — donation linking helper tests.

### Files to modify

- `src/app/donasi/page.tsx` — resolve admin first, donor second, render banner, prevent admin donor prefill.
- `src/app/donasi/donation-form.tsx` — remove old inline `Masuk sebagai ...` block and no longer receive auth copy responsibility.
- `src/app/masuk/page.tsx` and `src/app/masuk/donor-login-form.tsx` — support `email` and `next` query params; show unverified email retry copy.
- `src/app/donasi/status/[orderId]/page.tsx` — select donor email/name, resolve login state, render status CTA.
- `src/lib/better-auth.ts` — require email verification and add user-create/verify hooks.
- `src/lib/email.ts` — add email verification template.
- `src/lib/donations.ts` — add `attachOrphanDonationsToUser` helper.
- `PRD.md`, `TECHNICAL_SPEC.md`, `IMPLEMENTATION_PLAN.md` — canonical docs update after implementation/validation.

---

## Task 1: Banner resolver rules

**Files:**
- Create: `src/app/donasi/donor-auth-banner-rules.ts`
- Test: `src/tests/donor-auth-banner.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/tests/donor-auth-banner.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { resolveDonorAuthBannerVariant } from "@/app/donasi/donor-auth-banner-rules";

const user = { id: "user-1", name: "Aditya", email: "aditya@example.com" };

test("anonymous donor sees auth choices", () => {
  assert.equal(
    resolveDonorAuthBannerVariant({ adminUser: null, donorUser: null }),
    "anonymous",
  );
});

test("donor sees logged in banner", () => {
  assert.equal(
    resolveDonorAuthBannerVariant({ adminUser: null, donorUser: user }),
    "logged-in",
  );
});

test("admin hides donor banner", () => {
  assert.equal(
    resolveDonorAuthBannerVariant({ adminUser: user, donorUser: null }),
    "hidden",
  );
});

test("admin wins when admin and donor are both present", () => {
  assert.equal(
    resolveDonorAuthBannerVariant({ adminUser: user, donorUser: user }),
    "hidden",
  );
});
```

- [ ] **Step 2: Run test to verify fail**

```bash
node --import tsx --test src/tests/donor-auth-banner.test.ts
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement resolver**

Create `src/app/donasi/donor-auth-banner-rules.ts`:

```ts
export type DonorAuthBannerUser = {
  id: string;
  name: string | null;
  email: string;
};

export type DonorAuthBannerVariant = "anonymous" | "logged-in" | "hidden";

export function resolveDonorAuthBannerVariant(input: {
  adminUser: DonorAuthBannerUser | null;
  donorUser: DonorAuthBannerUser | null;
}): DonorAuthBannerVariant {
  if (input.adminUser) {
    return "hidden";
  }

  if (input.donorUser) {
    return "logged-in";
  }

  return "anonymous";
}
```

- [ ] **Step 4: Verify pass**

```bash
node --import tsx --test src/tests/donor-auth-banner.test.ts
```

Expected: PASS 4/4.

- [ ] **Step 5: Commit**

```bash
git add src/app/donasi/donor-auth-banner-rules.ts src/tests/donor-auth-banner.test.ts
git commit -m "Add donor auth banner rules"
```

---

## Task 2: Donation page auth banner UI

**Files:**
- Create: `src/app/donasi/donor-auth-banner.tsx`
- Create: `src/app/donasi/donor-auth-logout-button.tsx`
- Modify: `src/app/donasi/page.tsx`
- Modify: `src/app/donasi/donation-form.tsx`

- [ ] **Step 1: Create logout client button**

Create `src/app/donasi/donor-auth-logout-button.tsx`:

```tsx
"use client";

import { authClient } from "@/lib/auth-client";

export function DonorAuthLogoutButton() {
  async function handleLogout() {
    await Promise.allSettled([
      fetch("/api/auth/donor/logout", { method: "POST" }),
      authClient.signOut(),
    ]);
    window.location.href = "/donasi";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex min-h-10 items-center rounded-full border border-[color:var(--craft-line-strong)] px-4 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
    >
      Logout
    </button>
  );
}
```

- [ ] **Step 2: Create banner component**

Create `src/app/donasi/donor-auth-banner.tsx`:

```tsx
import Link from "next/link";

import type { DonorAuthBannerUser, DonorAuthBannerVariant } from "./donor-auth-banner-rules";
import { DonorAuthLogoutButton } from "./donor-auth-logout-button";

export function DonorAuthBanner({
  variant,
  donor,
}: {
  variant: DonorAuthBannerVariant;
  donor: DonorAuthBannerUser | null;
}) {
  if (variant === "hidden") {
    return null;
  }

  if (variant === "logged-in" && donor) {
    return (
      <div className="craft-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--craft-leaf)]">
            Akun donatur aktif
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-[color:var(--craft-ink)]">
            Selamat datang, {donor.name ?? donor.email}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            Donasi ini akan masuk ke riwayat akun Anda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/akun/donasi" className="inline-flex min-h-10 items-center rounded-full bg-[color:var(--craft-leaf)] px-4 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]">
            Lihat riwayat donasi
          </Link>
          <DonorAuthLogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="craft-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--craft-leaf)]">
          Akun donatur
        </p>
        <h2 className="mt-2 text-xl font-extrabold text-[color:var(--craft-ink)]">
          Sudah punya akun?
        </h2>
        <p className="mt-1 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          Masuk agar nama dan email tidak perlu diisi ulang.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/masuk?next=/donasi" className="inline-flex min-h-10 items-center rounded-full bg-[color:var(--craft-leaf)] px-4 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]">
          Masuk
        </Link>
        <Link href="/daftar?next=/donasi" className="inline-flex min-h-10 items-center rounded-full border border-[color:var(--craft-line-strong)] px-4 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]">
          Daftar
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Modify `/donasi/page.tsx`**

Resolve admin first, then donor only if not admin. Render `DonorAuthBanner` above `<DonationForm />`.

- [ ] **Step 4: Modify `DonationForm`**

Remove the old `donor ? <div>Masuk sebagai...</div> : null` block. Keep donor prop only for form prefill.

- [ ] **Step 5: Run validation**

```bash
npm run lint
node --import tsx --test src/tests/donor-auth-banner.test.ts
```

Expected: lint clean, tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/donasi/donor-auth-banner.tsx src/app/donasi/donor-auth-logout-button.tsx src/app/donasi/page.tsx src/app/donasi/donation-form.tsx
git commit -m "Add donor auth banner on donation page"
```

---

## Task 3: Email verification template and Better Auth hooks

**Files:**
- Modify: `src/lib/email.ts`
- Modify: `src/lib/better-auth.ts`
- Test: `src/tests/donor-signup-email.test.ts`

- [ ] **Step 1: Write failing email template test**

Create `src/tests/donor-signup-email.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { buildEmailVerificationEmail } from "@/lib/email";

test("buildEmailVerificationEmail returns Indonesian verification email", () => {
  const email = buildEmailVerificationEmail({
    email: "donor@example.com",
    url: "https://example.com/verify?token=abc",
  });

  assert.deepEqual(email.to, ["donor@example.com"]);
  assert.equal(email.subject, "Verifikasi email donatur Jumat Berkah Karyo");
  assert.match(email.text, /Verifikasi email/);
  assert.match(email.text, /https:\/\/example\.com\/verify\?token=abc/);
  assert.match(email.html ?? "", /Verifikasi email/);
});
```

- [ ] **Step 2: Run failing test**

```bash
node --import tsx --test src/tests/donor-signup-email.test.ts
```

Expected: FAIL because export does not exist.

- [ ] **Step 3: Add email template**

Add to `src/lib/email.ts` near `buildPasswordResetEmail`:

```ts
export function buildEmailVerificationEmail(input: {
  email: string;
  url: string;
}): EmailMessage {
  const subject = "Verifikasi email donatur Jumat Berkah Karyo";
  const text = [
    "Assalamu'alaikum.",
    "",
    "Verifikasi email akun donatur Jumat Berkah Anda.",
    "Klik tautan berikut untuk mengaktifkan akun:",
    input.url,
    "",
    "Tautan berlaku 1 jam. Abaikan email ini jika Anda tidak membuat akun donatur.",
  ].join("\n");

  return {
    to: [input.email],
    subject,
    text,
    html: renderBasicHtml(subject, text),
  };
}
```

- [ ] **Step 4: Update Better Auth config**

In `src/lib/better-auth.ts`, configure email verification using existing `safeSendEmail` pattern. Keep non-production console URL fallback.

- [ ] **Step 5: Verify**

```bash
node --import tsx --test src/tests/donor-signup-email.test.ts
npm run lint
```

Expected: PASS and lint clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email.ts src/lib/better-auth.ts src/tests/donor-signup-email.test.ts
git commit -m "Add donor email verification email"
```

---

## Task 4: Donation account linking helper

**Files:**
- Modify: `src/lib/donations.ts`
- Test: `src/tests/donation-account-linking.test.ts`

- [ ] **Step 1: Write tests for pure matching helper**

Add testable pure helper `normalizeDonationAccountEmail` and `shouldAttachDonationToUser` to avoid Prisma mocks.

Create `src/tests/donation-account-linking.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeDonationAccountEmail,
  shouldAttachDonationToUser,
} from "@/lib/donations";

test("normalizeDonationAccountEmail lowercases and trims valid email", () => {
  assert.equal(normalizeDonationAccountEmail(" Donor@Example.COM "), "donor@example.com");
});

test("normalizeDonationAccountEmail returns null for empty values", () => {
  assert.equal(normalizeDonationAccountEmail("   "), null);
  assert.equal(normalizeDonationAccountEmail(null), null);
});

test("shouldAttachDonationToUser requires matching orphan email", () => {
  assert.equal(
    shouldAttachDonationToUser({
      donationEmail: "donor@example.com",
      existingUserId: null,
      accountEmail: "donor@example.com",
    }),
    true,
  );
  assert.equal(
    shouldAttachDonationToUser({
      donationEmail: "other@example.com",
      existingUserId: null,
      accountEmail: "donor@example.com",
    }),
    false,
  );
  assert.equal(
    shouldAttachDonationToUser({
      donationEmail: "donor@example.com",
      existingUserId: "existing-user",
      accountEmail: "donor@example.com",
    }),
    false,
  );
});
```

- [ ] **Step 2: Run failing test**

```bash
node --import tsx --test src/tests/donation-account-linking.test.ts
```

Expected: FAIL because exports do not exist.

- [ ] **Step 3: Implement helpers and Prisma update function**

Add to `src/lib/donations.ts`:

```ts
export function normalizeDonationAccountEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : null;
}

export function shouldAttachDonationToUser(input: {
  donationEmail: string | null;
  existingUserId: string | null;
  accountEmail: string;
}) {
  const donationEmail = normalizeDonationAccountEmail(input.donationEmail);
  const accountEmail = normalizeDonationAccountEmail(input.accountEmail);

  return Boolean(donationEmail && accountEmail && donationEmail === accountEmail && !input.existingUserId);
}

export async function attachOrphanDonationsToUser(input: {
  userId: string;
  email: string;
}) {
  const email = normalizeDonationAccountEmail(input.email);

  if (!email) {
    return { attachedCount: 0 };
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const result = await prisma.donation.updateMany({
    where: {
      donorEmail: { equals: email, mode: "insensitive" },
      userId: null,
    },
    data: { userId: input.userId },
  });

  if (result.count > 0) {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.userId,
        action: "donor_account_attached_donations",
        entityType: "user",
        entityId: input.userId,
        metadata: { attachedCount: result.count, email },
      },
    });
  }

  return { attachedCount: result.count };
}
```

- [ ] **Step 4: Wire hooks in Better Auth**

Call `attachOrphanDonationsToUser` from Better Auth user create hook for verified Google users and email verification hook for email/password users.

- [ ] **Step 5: Verify**

```bash
node --import tsx --test src/tests/donation-account-linking.test.ts
npm run lint
```

Expected: PASS and lint clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/donations.ts src/lib/better-auth.ts src/tests/donation-account-linking.test.ts
git commit -m "Link verified donor accounts to guest donations"
```

---

## Task 5: Donor signup page

**Files:**
- Create: `src/app/daftar/page.tsx`
- Create: `src/app/daftar/donor-signup-form.tsx`

- [ ] **Step 1: Create signup form**

Build client form with Google button, name/email/password fields, inline errors, query-prefill props, and redirect to `/cek-email` after email signup.

- [ ] **Step 2: Create page**

Server page reads `searchParams` (`email`, `name`, `next`) and passes safe strings into form. Add `metadata` with `robots: { index: false, follow: false }`.

- [ ] **Step 3: Verify UI compiles**

```bash
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/daftar/page.tsx src/app/daftar/donor-signup-form.tsx
git commit -m "Add donor signup page"
```

---

## Task 6: Check-email page and login query support

**Files:**
- Create: `src/app/cek-email/page.tsx`
- Modify: `src/app/masuk/page.tsx`
- Modify: `src/app/masuk/donor-login-form.tsx`

- [ ] **Step 1: Add check-email page**

Render email from query and provide resend/link-to-login actions.

- [ ] **Step 2: Add login query support**

Allow `/masuk?email=x&next=y` to prefill email and redirect to `next` after successful login. Keep default `/akun/donasi`.

- [ ] **Step 3: Handle unverified login error**

When Better Auth email login returns unverified error, show Indonesian copy and a resend verification button.

- [ ] **Step 4: Verify**

```bash
npm run lint
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/cek-email/page.tsx src/app/masuk/page.tsx src/app/masuk/donor-login-form.tsx
git commit -m "Add donor email verification handoff"
```

---

## Task 7: Status page signup CTA

**Files:**
- Create: `src/app/donasi/status/[orderId]/donor-signup-cta.tsx`
- Modify: `src/app/donasi/status/[orderId]/page.tsx`

- [ ] **Step 1: Create CTA component**

Render CTA only with donor email/name props. Do not include donor phone.

- [ ] **Step 2: Modify status page query**

Select `donorEmail`, `donorName`, and resolve auth state. Do not render CTA for logged-in donor.

- [ ] **Step 3: Verify**

```bash
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/donasi/status/[orderId]/donor-signup-cta.tsx src/app/donasi/status/[orderId]/page.tsx
git commit -m "Add post-donation signup CTA"
```

---

## Task 8: Canonical docs and final validation

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`
- Modify: `PRD.md`
- Modify: `TECHNICAL_SPEC.md`

- [ ] **Step 1: Update PRD**

Add donor signup/login optional behavior to `8.6 Login Opsional Donatur` and roadmap section.

- [ ] **Step 2: Update technical spec**

Add route structure, Better Auth email verification rules, donation linking rules, and admin session hygiene rule.

- [ ] **Step 3: Update implementation plan**

Add/complete phase tasks, Work Log, Decision Log, and blockers if email provider smoke is unavailable.

- [ ] **Step 4: Run validation**

```bash
npm run lint
npm test
npm run build
```

Expected: PASS. Known warning: local low-entropy `BETTER_AUTH_SECRET` may appear during test/build.

- [ ] **Step 5: Manual smoke**

Verify anonymous banner, donor banner, admin-hidden banner, signup page, check-email page, status CTA, and unchanged donation payment flow.

- [ ] **Step 6: Commit**

```bash
git add IMPLEMENTATION_PLAN.md PRD.md TECHNICAL_SPEC.md
git commit -m "Document donor signup donation flow implementation"
```

---

## Self-Review

- Spec coverage: banner states, signup page, email verification, status CTA, donation linking, admin session hygiene, tests, docs, and validation are covered.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: resolver variant names are consistent: `anonymous`, `logged-in`, `hidden`.
- Scope check: no mandatory login, no recurring donation, no payment/webhook changes.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-30-donor-auth-on-donation-page.md`.

Two execution options:

1. Subagent-Driven (recommended) — dispatch a fresh subagent per task, review between tasks, faster iteration.
2. Inline Execution — execute tasks in this session using executing-plans, batch execution with checkpoints.
