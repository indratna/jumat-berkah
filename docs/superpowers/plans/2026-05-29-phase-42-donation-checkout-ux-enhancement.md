# Phase 42 Donation Checkout UX Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `/donasi` from Midtrans redirect-only handoff to Snap popup with safe redirect fallback, while keeping webhook/server state as the only final source of payment status.

**Architecture:** Keep server-side donation creation and Midtrans transaction creation unchanged in `src/app/api/donations/route.ts` and `src/lib/midtrans.ts`. Add a small client-side checkout helper that decides whether to open `window.snap.pay()` or fallback to `redirectUrl`, then route donor safely after popup callbacks. Extract popup-facing logic into testable helper functions so fallback and callback rules can be covered in existing `node:test` tests, while browser-only popup behavior is verified manually without adding a new UI test stack.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, Node `test`, Midtrans Snap JS.

---

## File Structure

### Files to modify
- `src/app/donasi/donation-form.tsx`
  - Keep existing form fields, request payload, and validation error handling.
  - Replace redirect-only post-submit branch with popup-or-fallback handoff.
- `src/app/donasi/page.tsx`
  - Mount the Snap script loader close to the form so `/donasi` is self-contained.
- `IMPLEMENTATION_PLAN.md`
  - Mark Phase 42 progress and add Work Log entry after implementation and validation.
- `PRD.md`
  - Sync final donor-facing checkout behavior if popup/fallback flow becomes the implemented product behavior.
- `TECHNICAL_SPEC.md`
  - Update small implementation details if Phase 42 locks concrete browser/env behavior beyond the current roadmap wording.
- `.env.example`
  - Add `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` placeholder if it is not already documented.
  - Add one explicit public browser-safe mode flag only if the chosen implementation needs it, instead of trying to read server-only `MIDTRANS_IS_PRODUCTION` directly in the client.
- `docs/ENV_SETUP.md`
  - Document `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` and popup-vs-redirect fallback behavior if env guidance changes.
  - Document how browser-safe Midtrans mode is derived if a new public env or server-provided prop is introduced.

### Files to create
- `src/app/donasi/snap-checkout.ts`
  - Pure helper logic for popup callback routing and redirect fallback decisions.
- `src/app/donasi/snap-types.ts`
  - Narrow TypeScript types for `window.snap.pay()` options and the payment handoff object used by the client.
- `src/app/donasi/midtrans-snap-script.tsx`
  - Small client component that loads Midtrans Snap JS safely with `next/script`.

### Files to test
- `src/tests/donation-checkout.test.ts`
  - New unit tests for helper logic: callback routing, popup-availability detection, and fallback behavior.

### Manual verification focus
- `/donasi`
  - Verify popup open, popup close behavior, redirect fallback, and status-page handoff in a real browser.

## Constraints

- Do not change `/api/donations` request validation rules.
- Do not change Midtrans webhook logic or treat popup callback as settlement.
- Do not remove `redirectUrl`; keep it as required fallback.
- Do not add new dependencies such as Playwright, Vitest, or Testing Library in this phase.
- Keep Indonesian copy and low-friction donation flow.
- If Snap script cannot be loaded, donor must still be able to pay via redirect flow.
- Keep Phase 42 focused on checkout handoff only; do not mix it with further public-page visual polish.
- `onClose` UX decision for this phase is explicit: donor is redirected to `/donasi/status/[orderId]` so they immediately land on a safe server-backed status page.
- Client code must not read server-only `MIDTRANS_IS_PRODUCTION` directly. The implementation must choose one explicit safe source for browser mode: either a new `NEXT_PUBLIC_*` env or a server-provided prop passed into the script loader.

## Tasks

### Task 1: Define testable popup handoff helpers

**Files:**
- Create: `src/app/donasi/snap-types.ts`
- Create: `src/app/donasi/snap-checkout.ts`
- Test: `src/tests/donation-checkout.test.ts`

- [ ] **Step 1: Write the failing test for callback destination mapping**

Create `src/tests/donation-checkout.test.ts` with this first test:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDonationStatusUrl,
  canUseSnapPopup,
  resolveFallbackRedirect,
  resolveSnapCallbackDestination,
} from "@/app/donasi/snap-checkout";

test("resolveSnapCallbackDestination always returns donation status page for popup callbacks", () => {
  const orderId = "DON-123";

  assert.equal(buildDonationStatusUrl(orderId), "/donasi/status/DON-123");
  assert.equal(
    resolveSnapCallbackDestination({ orderId, callback: "success" }),
    "/donasi/status/DON-123",
  );
  assert.equal(
    resolveSnapCallbackDestination({ orderId, callback: "pending" }),
    "/donasi/status/DON-123",
  );
  assert.equal(
    resolveSnapCallbackDestination({ orderId, callback: "error" }),
    "/donasi/status/DON-123",
  );
  assert.equal(
    resolveSnapCallbackDestination({ orderId, callback: "close" }),
    "/donasi/status/DON-123",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test
```

Expected: FAIL because `@/app/donasi/snap-checkout` does not exist yet.

- [ ] **Step 3: Write minimal popup types**

Create `src/app/donasi/snap-types.ts`:

```ts
export type DonationPaymentHandoff = {
  redirectUrl: string;
  snapToken: string;
};

export type SnapCallbackKind = "success" | "pending" | "error" | "close";

export type SnapPayOptions = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};

export type SnapWindow = Window & {
  snap?: {
    pay: (token: string, options?: SnapPayOptions) => void;
  };
};
```

- [ ] **Step 4: Write minimal callback helper implementation**

Create `src/app/donasi/snap-checkout.ts`:

```ts
import type {
  DonationPaymentHandoff,
  SnapCallbackKind,
  SnapWindow,
} from "./snap-types";

export function buildDonationStatusUrl(orderId: string) {
  return `/donasi/status/${orderId}`;
}

export function resolveSnapCallbackDestination(input: {
  orderId: string;
  callback: SnapCallbackKind;
}) {
  return buildDonationStatusUrl(input.orderId);
}

export function canUseSnapPopup(
  payment: DonationPaymentHandoff | undefined,
  currentWindow: Window | undefined,
) {
  const snapWindow = currentWindow as SnapWindow | undefined;

  return Boolean(payment?.snapToken && snapWindow?.snap?.pay);
}

export function resolveFallbackRedirect(input: {
  payment: DonationPaymentHandoff | undefined;
  orderId: string;
}) {
  return input.payment?.redirectUrl ?? buildDonationStatusUrl(input.orderId);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
npm test
```

Expected: PASS, including the new donation checkout helper test.

- [ ] **Step 6: Commit**

```bash
git add src/app/donasi/snap-types.ts src/app/donasi/snap-checkout.ts src/tests/donation-checkout.test.ts
git commit -m "Add Snap checkout helpers"
```

### Task 2: Cover popup availability and redirect fallback with tests

**Files:**
- Modify: `src/tests/donation-checkout.test.ts`
- Modify: `src/app/donasi/snap-checkout.ts`

- [ ] **Step 1: Write the failing test for popup availability and fallback**

Append these tests to `src/tests/donation-checkout.test.ts`:

```ts
test("canUseSnapPopup requires both snap token and window.snap.pay", () => {
  const payment = {
    snapToken: "snap-token-123",
    redirectUrl: "https://app.midtrans.com/redirect",
  };

  assert.equal(canUseSnapPopup(payment, undefined), false);
  assert.equal(canUseSnapPopup(payment, {} as Window), false);
  assert.equal(
    canUseSnapPopup(payment, {
      snap: { pay: () => undefined },
    } as unknown as Window),
    true,
  );
  assert.equal(
    canUseSnapPopup(
      { snapToken: "", redirectUrl: payment.redirectUrl },
      { snap: { pay: () => undefined } } as unknown as Window,
    ),
    false,
  );
});

test("resolveFallbackRedirect prefers redirect url and falls back to status page", () => {
  assert.equal(
    resolveFallbackRedirect({
      payment: {
        snapToken: "snap-token-123",
        redirectUrl: "https://app.midtrans.com/redirect",
      },
      orderId: "DON-456",
    }),
    "https://app.midtrans.com/redirect",
  );

  assert.equal(
    resolveFallbackRedirect({ payment: undefined, orderId: "DON-456" }),
    "/donasi/status/DON-456",
  );
});
```

- [ ] **Step 2: Run test to verify it fails if helper behavior is incomplete**

Run:

```bash
npm test
```

Expected: PASS immediately only if Task 1 helper already covers this exact behavior. If it passes immediately, do not change the tests; continue because they still lock in the required contract.

- [ ] **Step 3: Refactor helper names only if needed**

If any assertion needs a minimal code tweak, keep `src/app/donasi/snap-checkout.ts` in this exact exported shape:

```ts
export function buildDonationStatusUrl(orderId: string) {
  return `/donasi/status/${orderId}`;
}

export function resolveSnapCallbackDestination(input: {
  orderId: string;
  callback: "success" | "pending" | "error" | "close";
}) {
  return buildDonationStatusUrl(input.orderId);
}

export function canUseSnapPopup(
  payment: { redirectUrl: string; snapToken: string } | undefined,
  currentWindow: Window | undefined,
) {
  const snapWindow = currentWindow as (Window & {
    snap?: { pay: (token: string, options?: object) => void };
  }) | undefined;

  return Boolean(payment?.snapToken && snapWindow?.snap?.pay);
}

export function resolveFallbackRedirect(input: {
  payment: { redirectUrl: string; snapToken: string } | undefined;
  orderId: string;
}) {
  return input.payment?.redirectUrl ?? buildDonationStatusUrl(input.orderId);
}
```

- [ ] **Step 4: Run focused tests to verify pass**

Run:

```bash
npm test
```

Expected: PASS, including the donation checkout helper tests.

- [ ] **Step 5: Commit**

```bash
git add src/tests/donation-checkout.test.ts src/app/donasi/snap-checkout.ts
git commit -m "Test Snap popup fallback rules"
```

### Task 3: Load Midtrans Snap script safely on `/donasi`

**Files:**
- Create: `src/app/donasi/midtrans-snap-script.tsx`
- Modify: `src/app/donasi/page.tsx`

- [ ] **Step 1: Create Snap script loader component**

Create `src/app/donasi/midtrans-snap-script.tsx`:

```tsx
"use client";

import Script from "next/script";

type MidtransSnapScriptProps = {
  clientKey: string | null;
  isProduction: boolean;
};

function getMidtransSnapSrc(isProduction: boolean) {
  return isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export function MidtransSnapScript({
  clientKey,
  isProduction,
}: MidtransSnapScriptProps) {
  if (!clientKey) {
    return null;
  }

  return (
    <Script
      id="midtrans-snap-js"
      src={getMidtransSnapSrc(isProduction)}
      data-client-key={clientKey}
      strategy="afterInteractive"
    />
  );
}
```

- [ ] **Step 2: Mount the script loader on the donation page**

Modify `src/app/donasi/page.tsx` imports and JSX:

```tsx
import { MidtransSnapScript } from "./midtrans-snap-script";
```

Inside the server page, derive browser-safe props explicitly:

```tsx
const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? null;
const midtransIsProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
```

Add the component near the top of `<main>`:

```tsx
<MidtransSnapScript
  clientKey={midtransClientKey}
  isProduction={midtransIsProduction}
/>
```

Place it once only, before the main donation section. This avoids reading server-only env directly from client code.

- [ ] **Step 3: Commit**

```bash
git add src/app/donasi/midtrans-snap-script.tsx src/app/donasi/page.tsx
git commit -m "Load Midtrans Snap script on donation page"
```

### Task 4: Switch `DonationForm` from redirect-only to popup-or-fallback handoff

**Files:**
- Modify: `src/app/donasi/donation-form.tsx`
- Modify: `src/app/donasi/snap-types.ts`
- Modify: `src/app/donasi/snap-checkout.ts`

- [ ] **Step 1: Add narrow payment type imports and navigation helper usage**

At the top of `src/app/donasi/donation-form.tsx`, add:

```ts
import {
  canUseSnapPopup,
  resolveFallbackRedirect,
  resolveSnapCallbackDestination,
} from "./snap-checkout";
import type { DonationPaymentHandoff, SnapWindow } from "./snap-types";
```

Replace the inline `DonationResponse` type with:

```ts
type DonationResponse = {
  orderId: string;
  amount: number;
  status: string;
  payment?: DonationPaymentHandoff;
};
```

- [ ] **Step 2: Replace redirect-only branch with popup-first logic**

Inside `handleSubmit`, replace this block:

```ts
if (donation.payment?.redirectUrl) {
  window.location.href = donation.payment.redirectUrl;
  return;
}

setResult(donation);
setIsSubmitting(false);
```

with:

```ts
const destination = resolveFallbackRedirect({
  payment: donation.payment,
  orderId: donation.orderId,
});

if (canUseSnapPopup(donation.payment, window)) {
  const snapWindow = window as SnapWindow;

  snapWindow.snap?.pay(donation.payment!.snapToken, {
    onSuccess: () => {
      window.location.href = resolveSnapCallbackDestination({
        orderId: donation.orderId,
        callback: "success",
      });
    },
    onPending: () => {
      window.location.href = resolveSnapCallbackDestination({
        orderId: donation.orderId,
        callback: "pending",
      });
    },
    onError: () => {
      window.location.href = resolveSnapCallbackDestination({
        orderId: donation.orderId,
        callback: "error",
      });
    },
    onClose: () => {
      window.location.href = resolveSnapCallbackDestination({
        orderId: donation.orderId,
        callback: "close",
      });
    },
  });
  return;
}

if (donation.payment?.redirectUrl) {
  window.location.href = destination;
  return;
}

setResult(donation);
setIsSubmitting(false);
```

- [ ] **Step 3: Improve safe copy for non-popup fallback state**

Update the success/result box copy at the bottom of the form to say:

```tsx
Donasi pending tersimpan dengan order ID <strong>{result.orderId}</strong>
sebesar <strong>{formatRupiah(result.amount)}</strong>. Jika popup atau
halaman pembayaran tidak terbuka, cek status donasi dari halaman status.
```

- [ ] **Step 4: Keep webhook truth untouched**

Do not add any `fetch` call from popup callbacks. Do not write any client-side `status = "settlement"` logic. Only navigate.

- [ ] **Step 5: Commit**

```bash
git add src/app/donasi/donation-form.tsx src/app/donasi/snap-types.ts src/app/donasi/snap-checkout.ts
git commit -m "Use Snap popup with redirect fallback"
```

### Task 5: Validate full flow and sync canonical documents

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`
- Modify: `PRD.md` if final donor-facing checkout behavior changes from roadmap wording into implemented truth
- Modify: `TECHNICAL_SPEC.md` if actual implementation locks concrete browser/env/payment-handoff details
- Modify: `.env.example` if `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` is required and not yet documented, and if a browser-safe production-mode flag is introduced
- Modify: `docs/ENV_SETUP.md` if env/setup guidance changes

- [ ] **Step 1: Run targeted donation checkout tests**

Run:

```bash
npm test -- --test-name-pattern="resolveSnapCallbackDestination|canUseSnapPopup|resolveFallbackRedirect"
```

Expected: PASS.

- [ ] **Step 2: Run full automated validation**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: all commands pass; existing `BETTER_AUTH_SECRET` low-entropy warning may still appear during test/build and should be documented only if it changes.

- [ ] **Step 3: Manually verify browser flow**

Manual checklist on local app:

1. Open `/donasi`.
2. Submit valid donation with Snap script loaded.
3. Confirm popup opens instead of immediate full-page redirect.
4. Close popup without paying and confirm navigation reaches `/donasi/status/[orderId]`.
5. Temporarily simulate missing `window.snap` by disabling the Snap script or client key and confirm redirect fallback still opens Midtrans hosted payment page.
6. Complete a sandbox payment if env is available and confirm final status still depends on webhook + status page.

- [ ] **Step 4: Sync canonical documents**

Update canonical project docs after implementation and manual verification:

- `IMPLEMENTATION_PLAN.md`
  - Set `Phase 42` status to `Done` only after validation passes.
  - Add Work Log entry describing popup migration, redirect fallback, unchanged webhook truth, and any manual verification blocker.
- `PRD.md`
  - Update donor-facing journey/checkout wording if Snap popup becomes the actual product behavior.
- `TECHNICAL_SPEC.md`
  - Update concrete env names, script-loading direction, fallback behavior, and callback rules if they were finalized in code.
- `.env.example` and `docs/ENV_SETUP.md`
  - Add safe placeholders and maintainer guidance for any newly required public Midtrans client env.
  - If the implementation introduces a browser-safe production-mode flag, document exactly why it exists and keep its name aligned with code.

If manual sandbox payment or popup verification is blocked by missing Midtrans client key/env, record that blocker explicitly instead of claiming completion.

- [ ] **Step 5: Commit**

```bash
git add IMPLEMENTATION_PLAN.md PRD.md TECHNICAL_SPEC.md .env.example docs/ENV_SETUP.md src/tests/donation-checkout.test.ts src/app/donasi/page.tsx src/app/donasi/midtrans-snap-script.tsx src/app/donasi/donation-form.tsx src/app/donasi/snap-checkout.ts src/app/donasi/snap-types.ts
git commit -m "Complete donation checkout popup flow"
```

## Self-Review

- Spec coverage: popup open, callback routing, fallback redirect, unchanged webhook truth, env/documentation follow-up, and canonical-doc sync are all covered by Tasks 1–5.
- Placeholder scan: removed vague placeholders; every task names exact files, commands, and code.
- Type consistency: `DonationPaymentHandoff`, `SnapWindow`, `canUseSnapPopup`, `resolveFallbackRedirect`, and `resolveSnapCallbackDestination` use consistent names across tasks.
- Env precision: the plan now avoids reading server-only `MIDTRANS_IS_PRODUCTION` from client code and instead routes mode through explicit browser-safe configuration.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-29-phase-42-donation-checkout-ux-enhancement.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?