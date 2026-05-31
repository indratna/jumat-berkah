# Cycle Countdown System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan countdown siklus real-time pada admin dashboard dan landing page, lalu mengotomatisasi perpindahan siklus Jumat→Kamis dengan auto-copy target dan Telegram broadcast idempotent.

**Architecture:** Pertahankan definisi siklus existing di `friday-cycle.ts`, lalu tambah metadata countdown yang dikonsumsi UI. Pusatkan auto-transition target dan public broadcast di service kecil baru agar cron, dashboard, dan landing memakai sumber logika sama. Kerjakan bertahap: utilitas waktu dulu, lalu service transisi, lalu cron route, lalu UI publik/admin, lalu verifikasi dan update `IMPLEMENTATION_PLAN.md`.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Prisma, Node test runner, existing Telegram cron infrastructure.

---

## File Map

### Files to create
- `JumatBerkah/src/components/cycle-countdown.tsx` — komponen client reusable untuk countdown segmented boxes.
- `JumatBerkah/src/lib/weekly-cycle-transition.ts` — service auto-copy target, summary siklus lama, idempotency broadcast.
- `JumatBerkah/src/app/api/cron/telegram/cycle-transition/route.ts` — endpoint cron baru untuk transisi siklus.

### Files to modify
- `JumatBerkah/src/lib/friday-cycle.ts` — tambah metadata deadline countdown dan flag siklus baru.
- `JumatBerkah/src/lib/weekly-target.ts` — teruskan metadata countdown ke progress payload.
- `JumatBerkah/src/lib/landing.ts` — hapus `daysToFriday`, rapikan data landing agar countdown consume dari progress.
- `JumatBerkah/src/lib/telegram-cron.ts` — export runner cron transisi siklus.
- `JumatBerkah/src/app/admin/page.tsx` — ganti label periode statis dengan countdown.
- `JumatBerkah/src/components/landing/landing-hero.tsx` — hapus label periode redundant dari hero aside.
- `JumatBerkah/src/components/landing/landing-target-progress.tsx` — jadikan pusat info countdown publik.
- `JumatBerkah/src/app/page.tsx` — sesuaikan flow props landing bila perlu.
- `JumatBerkah/src/tests/business-rules.test.ts` — test utilitas waktu dan progress metadata.
- `JumatBerkah/src/tests/telegram.test.ts` — test helper/service broadcast transisi.
- `JumatBerkah/IMPLEMENTATION_PLAN.md` — update progress tracker dan work log setelah validasi.

---

### Task 1: Add countdown metadata to Friday cycle

**Files:**
- Modify: `JumatBerkah/src/lib/friday-cycle.ts`
- Test: `JumatBerkah/src/tests/business-rules.test.ts`

- [ ] **Step 1: Add failing tests for deadline and new-cycle window**

Add to `JumatBerkah/src/tests/business-rules.test.ts`:

```ts
import {
  getCurrentFridayCycleRange,
  isWithinNewCycleWindow,
} from "@/lib/friday-cycle";

test("friday cycle exposes Thursday deadline in Jakarta time", () => {
  const cycle = getCurrentFridayCycleRange(
    new Date("2026-06-01T03:00:00.000Z"),
  );

  assert.equal(cycle.fromDate, "2026-05-29");
  assert.equal(cycle.toDate, "2026-06-04");
  assert.equal(cycle.deadlineAtIso, "2026-06-04T23:59:59.999+07:00");
});

test("new-cycle window lasts first 24 hours of Friday cycle", () => {
  assert.equal(
    isWithinNewCycleWindow(new Date("2026-06-05T00:30:00.000+07:00")),
    true,
  );
  assert.equal(
    isWithinNewCycleWindow(new Date("2026-06-05T23:30:00.000+07:00")),
    true,
  );
  assert.equal(
    isWithinNewCycleWindow(new Date("2026-06-06T00:00:00.000+07:00")),
    false,
  );
});
```

- [ ] **Step 2: Run focused test and confirm failure**

Run:

```bash
npm test -- --test-name-pattern="friday cycle exposes Thursday deadline|new-cycle window lasts"
```

Expected: FAIL because fields/helpers do not exist yet.

- [ ] **Step 3: Implement metadata in `friday-cycle.ts`**

Update `JumatBerkah/src/lib/friday-cycle.ts`:

```ts
export type FridayCycleRange = {
  from: Date;
  to: Date;
  fromDate: string;
  toDate: string;
  label: string;
  deadlineAt: Date;
  deadlineAtIso: string;
  isNewCycle: boolean;
};

export function getCurrentFridayCycleRange(now = new Date()): FridayCycleRange {
  const today = getJakartaDateParts(now);
  const startDate = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const diffFromFriday = (today.weekdayIndex - FRIDAY_INDEX + 7) % 7;
  startDate.setUTCDate(startDate.getUTCDate() - diffFromFriday);

  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  const fromDate = formatDateInput(startDate);
  const toDate = formatDateInput(endDate);
  const deadlineAtIso = `${toDate}T23:59:59.999+07:00`;

  return {
    from: new Date(`${fromDate}T00:00:00.000+07:00`),
    to: new Date(deadlineAtIso),
    fromDate,
    toDate,
    label: `${fromDate} s.d. ${toDate}`,
    deadlineAt: new Date(deadlineAtIso),
    deadlineAtIso,
    isNewCycle: isWithinNewCycleWindow(now),
  };
}

export function isWithinNewCycleWindow(now: Date): boolean {
  const cycle = getCurrentFridayCycleRangeBase(now);
  return now.getTime() - cycle.from.getTime() < 24 * 60 * 60 * 1000;
}
```

Also split current internal logic into helper `getCurrentFridayCycleRangeBase(now)` to avoid recursive call.

- [ ] **Step 4: Run focused tests and confirm pass**

Run:

```bash
npm test -- --test-name-pattern="friday cycle exposes Thursday deadline|new-cycle window lasts"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/friday-cycle.ts src/tests/business-rules.test.ts
git commit -m "Add cycle countdown metadata"
```

---

### Task 2: Thread countdown metadata through weekly target and landing data

**Files:**
- Modify: `JumatBerkah/src/lib/weekly-target.ts`
- Modify: `JumatBerkah/src/lib/landing.ts`
- Test: `JumatBerkah/src/tests/business-rules.test.ts`

- [ ] **Step 1: Add failing test for progress metadata**

Add to `JumatBerkah/src/tests/business-rules.test.ts`:

```ts
test("weekly target progress preserves countdown metadata", () => {
  const cycle = getCurrentFridayCycleRange(
    new Date("2026-06-01T03:00:00.000Z"),
  );
  const progress = calculateWeeklyTargetProgress({
    cycle,
    target: null,
    collected: 0,
  });

  assert.equal(progress.cycle.deadlineAtIso, "2026-06-04T23:59:59.999+07:00");
  assert.equal(progress.cycle.isNewCycle, false);
});
```

- [ ] **Step 2: Run focused test and confirm failure**

Run:

```bash
npm test -- --test-name-pattern="weekly target progress preserves countdown metadata"
```

Expected: FAIL if metadata not preserved end-to-end.

- [ ] **Step 3: Keep `WeeklyTargetProgress` using enriched `FridayCycleRange`**

Ensure `JumatBerkah/src/lib/weekly-target.ts` keeps:

```ts
export type WeeklyTargetProgress = {
  cycle: FridayCycleRange;
  target: WeeklyTargetRecord | null;
  collected: number;
  remaining: number;
  progressRatio: number;
  reachedTarget: boolean;
};
```

No flattening. Return `input.cycle` untouched from `calculateWeeklyTargetProgress()`.

- [ ] **Step 4: Remove obsolete landing `daysToFriday`**

Update `JumatBerkah/src/lib/landing.ts`:

```ts
export type LandingMetrics = {
  cycle: FridayCycleRange;
  income: number;
  expenses: number;
  periodBalance: number;
  currentBalance: number;
  lastUpdatedAt: Date;
};

export async function getLandingMetrics(
  now = new Date(),
): Promise<LandingMetrics> {
  const { cycle, report } = await getCurrentFridayCycleReport(now);

  return {
    cycle,
    income: report.summary.income,
    expenses: report.summary.expenses,
    periodBalance: report.summary.periodBalance,
    currentBalance: report.summary.currentBalance,
    lastUpdatedAt: now,
  };
}
```

Delete `getDaysToNextFriday()` from same file.

- [ ] **Step 5: Run business rules tests**

Run:

```bash
npm test -- src/tests/business-rules.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/weekly-target.ts src/lib/landing.ts src/tests/business-rules.test.ts
git commit -m "Expose cycle countdown data"
```

---

### Task 3: Build weekly cycle transition service

**Files:**
- Create: `JumatBerkah/src/lib/weekly-cycle-transition.ts`
- Modify: `JumatBerkah/src/lib/telegram-cron.ts`
- Test: `JumatBerkah/src/tests/telegram.test.ts`

- [ ] **Step 1: Add failing tests for transition decisions and message format**

Add to `JumatBerkah/src/tests/telegram.test.ts`:

```ts
import {
  buildCycleTransitionBroadcastMessage,
  shouldCreateNextCycleTarget,
} from "@/lib/weekly-cycle-transition";

test("next cycle target is created only when previous target exists and new target missing", () => {
  assert.equal(
    shouldCreateNextCycleTarget({ hasPreviousTarget: true, hasCurrentTarget: false }),
    true,
  );
  assert.equal(
    shouldCreateNextCycleTarget({ hasPreviousTarget: true, hasCurrentTarget: true }),
    false,
  );
  assert.equal(
    shouldCreateNextCycleTarget({ hasPreviousTarget: false, hasCurrentTarget: false }),
    false,
  );
});

test("cycle transition broadcast includes previous and new cycle summary", () => {
  const text = buildCycleTransitionBroadcastMessage({
    previousCycleLabel: "2026-05-29 s.d. 2026-06-04",
    previousTargetAmount: 1_500_000,
    previousCollected: 1_200_000,
    previousPercent: 80,
    currentCycleLabel: "2026-06-05 s.d. 2026-06-11",
    currentTargetAmount: 1_500_000,
    donationUrl: "https://jumatberkah.example/donasi",
  });

  assert.match(text, /Siklus Jumat Berkah Selesai/i);
  assert.match(text, /80%/);
  assert.match(text, /2026-06-05 s.d. 2026-06-11/);
  assert.match(text, /https:\/\/jumatberkah\.example\/donasi/);
});
```

- [ ] **Step 2: Run focused Telegram tests and confirm failure**

Run:

```bash
npm test -- --test-name-pattern="next cycle target is created|cycle transition broadcast includes"
```

Expected: FAIL because service does not exist yet.

- [ ] **Step 3: Create pure helpers and transition orchestration**

Create `JumatBerkah/src/lib/weekly-cycle-transition.ts` with:

```ts
import { DonationStatus, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { getCurrentFridayCycleRange } from "@/lib/friday-cycle";
import {
  formatRupiah,
  getTelegramPublicChannelId,
  safeSendTelegramMessage,
} from "@/lib/telegram";

export const WEEKLY_CYCLE_TRANSITION_ACTION = "weekly_target.transition";
export const WEEKLY_CYCLE_TRANSITION_BROADCAST_ACTION =
  "telegram.broadcast.weekly_cycle_transition";

export function shouldCreateNextCycleTarget(input: {
  hasPreviousTarget: boolean;
  hasCurrentTarget: boolean;
}) {
  return input.hasPreviousTarget && !input.hasCurrentTarget;
}

export function buildCycleTransitionBroadcastMessage(input: {
  previousCycleLabel: string;
  previousTargetAmount: number | null;
  previousCollected: number;
  previousPercent: number;
  currentCycleLabel: string;
  currentTargetAmount: number | null;
  donationUrl: string;
}) {
  const previousTarget =
    input.previousTargetAmount === null
      ? "Belum diatur"
      : formatRupiah(input.previousTargetAmount);
  const currentTarget =
    input.currentTargetAmount === null
      ? "Belum diatur"
      : formatRupiah(input.currentTargetAmount);

  return [
    "📊 Siklus Jumat Berkah Selesai!",
    "",
    `Periode: ${input.previousCycleLabel}`,
    `Target: ${previousTarget}`,
    `Terkumpul: ${formatRupiah(input.previousCollected)} (${input.previousPercent}%)`,
    "",
    "🆕 Siklus baru dimulai!",
    `Periode: ${input.currentCycleLabel}`,
    `Target pekan ini: ${currentTarget}`,
    "",
    "Yuk berdonasi 🙏",
    `👉 ${input.donationUrl}`,
  ].join("\n");
}
```

Then add `runWeeklyCycleTransition(now = new Date())` to same file. Flow:
- hitung current cycle dan previous cycle
- query `weeklyTarget` previous/current
- copy target previous ke current hanya bila current belum ada
- hitung total settlement previous cycle
- hitung `previousPercent` dari previous target bila ada, selain itu `0`
- cek audit log `WEEKLY_CYCLE_TRANSITION_BROADCAST_ACTION` dengan `entityId = currentCycle.fromDate`
- kirim Telegram public message hanya sekali per current cycle
- simpan audit log transisi target dan audit log broadcast

Donation URL for message should read `process.env.NEXT_PUBLIC_APP_URL` when present and build `${NEXT_PUBLIC_APP_URL}/donasi`. If env missing, use absolute fallback `https://jumatberkah.example/donasi` in tests only, and in runtime use `https://jumatberkah.example/donasi` until project defines production public URL constant.

- [ ] **Step 4: Add cron runner export in `telegram-cron.ts`**

Add:

```ts
import { runWeeklyCycleTransition } from "@/lib/weekly-cycle-transition";

export async function runWeeklyCycleTransitionCron(now = new Date()) {
  return runWeeklyCycleTransition(now);
}
```

Keep this separate from `runWeeklyTelegramCron()`.

- [ ] **Step 5: Run Telegram tests**

Run:

```bash
npm test -- src/tests/telegram.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/weekly-cycle-transition.ts src/lib/telegram-cron.ts src/tests/telegram.test.ts
git commit -m "Add weekly cycle transition service"
```

---

### Task 4: Add cron route for cycle transition

**Files:**
- Create: `JumatBerkah/src/app/api/cron/telegram/cycle-transition/route.ts`
- Modify: `JumatBerkah/src/lib/telegram-cron.ts`

- [ ] **Step 1: Mirror existing cron route contract**

Use `src/app/api/cron/telegram/daily/route.ts` and `src/app/api/cron/telegram/weekly/route.ts` as exact pattern.

- [ ] **Step 2: Create route file**

Write `JumatBerkah/src/app/api/cron/telegram/cycle-transition/route.ts`:

```ts
import { NextResponse } from "next/server";

import {
  getCronSecretFromHeaders,
  runWeeklyCycleTransitionCron,
  verifyCronSecret,
} from "@/lib/telegram-cron";

export async function GET(request: Request) {
  if (!verifyCronSecret(getCronSecretFromHeaders(request.headers))) {
    return NextResponse.json(
      { errors: { auth: "Cron secret tidak valid." } },
      { status: 401 },
    );
  }

  const result = await runWeeklyCycleTransitionCron();
  return NextResponse.json({ ok: true, ...result });
}
```

- [ ] **Step 3: Run lint on cron files**

Run:

```bash
npx eslint src/app/api/cron/telegram/cycle-transition/route.ts src/lib/telegram-cron.ts src/lib/weekly-cycle-transition.ts
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/telegram/cycle-transition/route.ts src/lib/telegram-cron.ts
git commit -m "Add cycle transition cron route"
```

---

### Task 5: Build shared countdown component

**Files:**
- Create: `JumatBerkah/src/components/cycle-countdown.tsx`

- [ ] **Step 1: Define component API**

Use this exact interface:

```ts
type CycleCountdownProps = {
  deadlineAtIso: string;
  label?: string;
  tone?: "public" | "admin";
};
```

Rendered output must include 4 segments: `Hari`, `Jam`, `Menit`, `Detik`.

- [ ] **Step 2: Create component**

Write `JumatBerkah/src/components/cycle-countdown.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type CycleCountdownProps = {
  deadlineAtIso: string;
  label?: string;
  tone?: "public" | "admin";
};

type CountdownState = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const ZERO_STATE: CountdownState = {
  days: "00",
  hours: "00",
  minutes: "00",
  seconds: "00",
};

function getCountdownState(deadlineAtIso: string): CountdownState {
  const diff = Math.max(new Date(deadlineAtIso).getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function CycleCountdown({
  deadlineAtIso,
  label,
  tone = "public",
}: CycleCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<CountdownState>(ZERO_STATE);

  useEffect(() => {
    setMounted(true);
    setState(getCountdownState(deadlineAtIso));
    const timer = window.setInterval(() => {
      setState(getCountdownState(deadlineAtIso));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadlineAtIso]);

  const toneClass = useMemo(
    () =>
      tone === "admin"
        ? "border-slate-200 bg-white text-slate-950"
        : "border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] text-[color:var(--craft-ink)]",
    [tone],
  );

  const parts = mounted ? state : ZERO_STATE;

  return (
    <div>
      {label ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p> : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="off">
        {[
          { label: "Hari", value: parts.days },
          { label: "Jam", value: parts.hours },
          { label: "Menit", value: parts.minutes },
          { label: "Detik", value: parts.seconds },
        ].map((part) => (
          <div key={part.label} className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">{part.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{part.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run lint on component**

Run:

```bash
npx eslint src/components/cycle-countdown.tsx
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/cycle-countdown.tsx
git commit -m "Add shared cycle countdown component"
```

---

### Task 6: Replace admin period label with countdown

**Files:**
- Modify: `JumatBerkah/src/app/admin/page.tsx`
- Create or use: `JumatBerkah/src/components/cycle-countdown.tsx`

- [ ] **Step 1: Replace static period line in admin dashboard**

In `JumatBerkah/src/app/admin/page.tsx`, replace this block:

```tsx
<p className="mt-1 text-xs text-slate-500">
  Periode {progress.cycle.label}
</p>
```

With:

```tsx
<div className="mt-3">
  <CycleCountdown
    deadlineAtIso={progress.cycle.deadlineAtIso}
    label="Sisa waktu siklus"
    tone="admin"
  />
</div>
<p className="mt-3 text-xs text-slate-500">
  Periode {progress.cycle.label}
</p>
```

Keep period text as secondary context only, not main signal.

- [ ] **Step 2: Import countdown component**

Add import:

```ts
import { CycleCountdown } from "@/components/cycle-countdown";
```

- [ ] **Step 3: Run lint on admin page**

Run:

```bash
npx eslint src/app/admin/page.tsx src/components/cycle-countdown.tsx
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx src/components/cycle-countdown.tsx
git commit -m "Show cycle countdown on admin dashboard"
```

---

### Task 7: Consolidate landing cycle display into one countdown area

**Files:**
- Modify: `JumatBerkah/src/components/landing/landing-hero.tsx`
- Modify: `JumatBerkah/src/components/landing/landing-target-progress.tsx`
- Modify: `JumatBerkah/src/app/page.tsx`
- Create or use: `JumatBerkah/src/components/cycle-countdown.tsx`

- [ ] **Step 1: Remove redundant period text from hero aside**

In `JumatBerkah/src/components/landing/landing-hero.tsx`, replace:

```tsx
<div className="flex items-center justify-between gap-3">
  <span className="craft-pill">Siklus berjalan</span>
  <span className="text-xs font-semibold tracking-widest text-[color:var(--craft-ink-soft)]">
    {metrics.cycle.label}
  </span>
</div>
```

With:

```tsx
<div className="flex items-center justify-between gap-3">
  <span className="craft-pill">Siklus berjalan</span>
  <span className="text-xs font-semibold tracking-widest text-[color:var(--craft-ink-soft)]">
    Progress aktif
  </span>
</div>
```

- [ ] **Step 2: Replace public period copy with countdown and new-cycle badge**

In `JumatBerkah/src/components/landing/landing-target-progress.tsx`:
- remove `Periode {progress.cycle.label}. Sisa {metrics.daysToFriday} hari menuju Jumat berikutnya.`
- add `CycleCountdown`
- add conditional badge for `progress.cycle.isNewCycle`

Use this block under intro copy:

```tsx
{progress.cycle.isNewCycle ? (
  <span className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
    Siklus baru dimulai
  </span>
) : null}
<div className="mt-4">
  <CycleCountdown
    deadlineAtIso={progress.cycle.deadlineAtIso}
    label="Sisa waktu donasi siklus ini"
    tone="public"
  />
</div>
<p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--craft-ink-soft)]">
  Periode {progress.cycle.label}. Donasi yang masuk sampai Kamis malam akan dihitung ke siklus ini.
</p>
```

- [ ] **Step 3: Import countdown component and clean props**

Add import in `landing-target-progress.tsx`:

```ts
import { CycleCountdown } from "@/components/cycle-countdown";
```

Remove all `metrics.daysToFriday` usage. Keep `metrics` prop only if still needed for other values. If not needed, simplify props in both `src/components/landing/landing-target-progress.tsx` and `src/app/page.tsx`.

- [ ] **Step 4: Run lint on landing files**

Run:

```bash
npx eslint src/components/landing/landing-hero.tsx src/components/landing/landing-target-progress.tsx src/app/page.tsx src/components/cycle-countdown.tsx
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/landing-hero.tsx src/components/landing/landing-target-progress.tsx src/app/page.tsx src/components/cycle-countdown.tsx
git commit -m "Unify landing cycle countdown display"
```

---

### Task 8: Verify end-to-end and update project tracker

**Files:**
- Modify: `JumatBerkah/IMPLEMENTATION_PLAN.md`
- Validate: project test and build commands

- [ ] **Step 1: Run focused test files**

Run:

```bash
npm test -- src/tests/business-rules.test.ts src/tests/telegram.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run targeted lint for touched files**

Run:

```bash
npx eslint src/lib/friday-cycle.ts src/lib/weekly-target.ts src/lib/landing.ts src/lib/weekly-cycle-transition.ts src/lib/telegram-cron.ts src/app/api/cron/telegram/cycle-transition/route.ts src/components/cycle-countdown.tsx src/app/admin/page.tsx src/components/landing/landing-hero.tsx src/components/landing/landing-target-progress.tsx src/app/page.tsx
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Update `IMPLEMENTATION_PLAN.md`**

Update these sections:
- `Current Focus` — mention cycle countdown and auto-transition work
- `Work Log` — summarize admin dashboard countdown, landing consolidation, cron transition, Telegram broadcast
- current phase checklist only if this work is intentionally assigned under current active phase
- blockers only if cron schedule or public URL config blocks completion

Use concise log entry like:

```md
- 2026-05-31 — Added cycle countdown system. Admin dashboard now shows real-time countdown to Kamis 23:59:59 WIB, landing page consolidates cycle urgency into one countdown section, and new cron-driven transition service auto-copies weekly target plus sends idempotent Telegram public broadcast on cycle rollover.
```

- [ ] **Step 6: Commit tracker update after validation**

```bash
git add IMPLEMENTATION_PLAN.md
git commit -m "Update plan for cycle countdown rollout"
```

---

## Self-Review

### Spec coverage
- Countdown admin dashboard: covered in Task 6.
- Countdown landing page: covered in Task 7.
- Hero redundancy removal: covered in Task 7.
- Auto-copy target on cycle rollover: covered in Task 3.
- Progress follows active cycle naturally: covered in Tasks 1-2 and validated by existing progress flow.
- Telegram broadcast on transition: covered in Task 3.
- Cron-based automation: covered in Task 4.
- `Siklus baru dimulai` badge: covered in Task 7.
- Validation and tracker update: covered in Task 8.

### Placeholder scan
- No `TODO`, `TBD`, or vague “handle later” steps remain.
- Every task has exact files and commands.

### Type consistency
- Shared property names used consistently: `deadlineAtIso`, `isNewCycle`, `runWeeklyCycleTransition`, `runWeeklyCycleTransitionCron`.
- Shared component name consistent: `CycleCountdown`.

---

Plan complete and saved to `JumatBerkah/docs/superpowers/plans/2026-05-31-cycle-countdown-system.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?