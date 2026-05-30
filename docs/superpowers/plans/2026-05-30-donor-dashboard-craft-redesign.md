# Donor Dashboard Craft Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/akun/donasi` into a complete, warm, craft-styled donor dashboard with personal metrics, current Friday target progress, Telegram status, profile summary, and card-based donation history.

**Architecture:** Keep all data fetching server-side in `/akun/donasi`. Extract pure dashboard summary/status helpers into `src/app/akun/donasi/dashboard-rules.ts` for TDD coverage, then compose craft UI in the existing server page. Reuse existing donor auth, Telegram link-code, weekly target, and donation status rules without changing payment/webhook behavior.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind craft utilities, Prisma, Better Auth/legacy donor session, node:test.

---

## File Structure

### Files to create

- `src/app/akun/donasi/dashboard-rules.ts` — pure helper functions for donor dashboard metrics, status labels, privacy labels, donor display name, and target display values.
- `src/tests/donor-dashboard.test.ts` — node:test coverage for dashboard rules.

### Files to modify

- `src/app/akun/donasi/page.tsx` — replace old `page-shell` table page with craft donor dashboard.
- `IMPLEMENTATION_PLAN.md` — add Work Log entry after implementation and validation.

### Existing helpers to reuse

- `src/lib/auth.ts` — `DONOR_SESSION_COOKIE`, `getDonorUser`.
- `src/lib/better-auth-guards.ts` — `getBetterAuthDonorUser`.
- `src/lib/telegram-donor.ts` — `createDonorLinkCode`.
- `src/lib/weekly-target.ts` — `getWeeklyTargetProgress`.
- `src/generated/prisma/client` — `DonationStatus`.

---

## Task 1: Dashboard rules with TDD

**Files:**
- Create: `src/app/akun/donasi/dashboard-rules.ts`
- Create: `src/tests/donor-dashboard.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/tests/donor-dashboard.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { DonationStatus } from "@/generated/prisma/client";
import {
  calculateDonorDashboardStats,
  getDonationPrivacyLabel,
  getDonationStatusTone,
  getDonorDisplayName,
  getLatestDonationSummary,
  getTargetDashboardCopy,
} from "@/app/akun/donasi/dashboard-rules";

const baseDonation = {
  id: "donation-1",
  orderId: "JB-20260530-AAAA1111",
  amount: 10000,
  status: DonationStatus.settlement,
  isAnonymous: false,
  showNamePublicly: true,
  message: null,
  createdAt: new Date("2026-05-30T01:00:00.000Z"),
  paidAt: new Date("2026-05-30T02:00:00.000Z"),
};

test("calculateDonorDashboardStats counts only settlement as successful total", () => {
  const stats = calculateDonorDashboardStats([
    baseDonation,
    {
      ...baseDonation,
      id: "donation-2",
      orderId: "JB-20260530-BBBB2222",
      amount: 50000,
      status: DonationStatus.pending,
    },
    {
      ...baseDonation,
      id: "donation-3",
      orderId: "JB-20260530-CCCC3333",
      amount: 25000,
      status: DonationStatus.failure,
    },
  ]);

  assert.equal(stats.totalSuccessful, 10000);
  assert.equal(stats.transactionCount, 3);
  assert.equal(stats.pendingCount, 1);
});

test("getLatestDonationSummary returns latest donation by createdAt", () => {
  const latest = getLatestDonationSummary([
    { ...baseDonation, orderId: "older", createdAt: new Date("2026-05-29T01:00:00.000Z") },
    { ...baseDonation, orderId: "newer", createdAt: new Date("2026-05-30T01:00:00.000Z") },
  ]);

  assert.equal(latest?.orderId, "newer");
});

test("getDonationStatusTone maps statuses to donor-friendly labels", () => {
  assert.deepEqual(getDonationStatusTone(DonationStatus.settlement), {
    label: "Berhasil",
    className: "border-green-200 bg-green-50 text-green-800",
  });
  assert.deepEqual(getDonationStatusTone(DonationStatus.pending), {
    label: "Menunggu",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  });
  assert.deepEqual(getDonationStatusTone(DonationStatus.failure), {
    label: "Gagal",
    className: "border-red-200 bg-red-50 text-red-800",
  });
});

test("getDonationPrivacyLabel follows public donor privacy labels", () => {
  assert.equal(
    getDonationPrivacyLabel({ isAnonymous: true, showNamePublicly: true }),
    "Anonim",
  );
  assert.equal(
    getDonationPrivacyLabel({ isAnonymous: false, showNamePublicly: false }),
    "Nama disamarkan",
  );
  assert.equal(
    getDonationPrivacyLabel({ isAnonymous: false, showNamePublicly: true }),
    "Nama tampil publik",
  );
});

test("getDonorDisplayName prefers trimmed name then email then fallback", () => {
  assert.equal(getDonorDisplayName({ name: " Aditya ", email: "a@example.com" }), "Aditya");
  assert.equal(getDonorDisplayName({ name: null, email: "a@example.com" }), "a@example.com");
  assert.equal(getDonorDisplayName({ name: " ", email: "" }), "Donatur");
});

test("getTargetDashboardCopy handles missing and configured targets", () => {
  assert.deepEqual(
    getTargetDashboardCopy({ targetAmount: 0, collected: 25000, remaining: 0, progressRatio: 0 }),
    {
      hasTarget: false,
      progressPercent: 0,
      title: "Target Jumat belum diatur.",
    },
  );

  assert.deepEqual(
    getTargetDashboardCopy({ targetAmount: 100000, collected: 25000, remaining: 75000, progressRatio: 0.25 }),
    {
      hasTarget: true,
      progressPercent: 25,
      title: "Target Jumat berjalan",
    },
  );
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
node --import tsx --test src/tests/donor-dashboard.test.ts
```

Expected: FAIL because `@/app/akun/donasi/dashboard-rules` does not exist.

- [ ] **Step 3: Implement dashboard rules**

Create `src/app/akun/donasi/dashboard-rules.ts`:

```ts
import { DonationStatus } from "@/generated/prisma/client";

export type DashboardDonation = {
  id: string;
  orderId: string;
  amount: number;
  status: DonationStatus;
  isAnonymous: boolean;
  showNamePublicly: boolean;
  message: string | null;
  createdAt: Date;
  paidAt: Date | null;
};

export type DonorDashboardStats = {
  totalSuccessful: number;
  transactionCount: number;
  pendingCount: number;
};

export function calculateDonorDashboardStats(
  donations: DashboardDonation[],
): DonorDashboardStats {
  return {
    totalSuccessful: donations
      .filter((donation) => donation.status === DonationStatus.settlement)
      .reduce((total, donation) => total + donation.amount, 0),
    transactionCount: donations.length,
    pendingCount: donations.filter(
      (donation) => donation.status === DonationStatus.pending,
    ).length,
  };
}

export function getLatestDonationSummary(donations: DashboardDonation[]) {
  return [...donations].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  )[0] ?? null;
}

export function getDonationStatusTone(status: DonationStatus) {
  if (status === DonationStatus.settlement) {
    return {
      label: "Berhasil",
      className: "border-green-200 bg-green-50 text-green-800",
    };
  }

  if (status === DonationStatus.pending) {
    return {
      label: "Menunggu",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (status === DonationStatus.expire) {
    return {
      label: "Kedaluwarsa",
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (status === DonationStatus.refund) {
    return {
      label: "Refund",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  return {
    label: "Gagal",
    className: "border-red-200 bg-red-50 text-red-800",
  };
}

export function getDonationPrivacyLabel(input: {
  isAnonymous: boolean;
  showNamePublicly: boolean;
}) {
  if (input.isAnonymous) {
    return "Anonim";
  }

  return input.showNamePublicly ? "Nama tampil publik" : "Nama disamarkan";
}

export function getDonorDisplayName(input: {
  name: string | null;
  email: string;
}) {
  const name = input.name?.trim();
  if (name) {
    return name;
  }

  const email = input.email.trim();
  return email || "Donatur";
}

export function getTargetDashboardCopy(input: {
  targetAmount: number;
  collected: number;
  remaining: number;
  progressRatio: number;
}) {
  if (input.targetAmount <= 0) {
    return {
      hasTarget: false,
      progressPercent: 0,
      title: "Target Jumat belum diatur.",
    };
  }

  return {
    hasTarget: true,
    progressPercent: Math.round(input.progressRatio * 100),
    title: "Target Jumat berjalan",
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
node --import tsx --test src/tests/donor-dashboard.test.ts
```

Expected: PASS 6/6.

- [ ] **Step 5: Commit**

```bash
git add src/app/akun/donasi/dashboard-rules.ts src/tests/donor-dashboard.test.ts
git commit -m "Add donor dashboard rules"
```

---

## Task 2: Fetch dashboard data server-side

**Files:**
- Modify: `src/app/akun/donasi/page.tsx`

- [ ] **Step 1: Import new helpers and weekly target progress**

At top of `src/app/akun/donasi/page.tsx`, add imports:

```ts
import {
  calculateDonorDashboardStats,
  getDonationPrivacyLabel,
  getDonationStatusTone,
  getDonorDisplayName,
  getLatestDonationSummary,
  getTargetDashboardCopy,
  type DashboardDonation,
} from "./dashboard-rules";
import { getWeeklyTargetProgress } from "@/lib/weekly-target";
```

- [ ] **Step 2: Update donation query to use typed shape**

Keep existing donor auth guard. Change donation select to keep the same fields and cast result into `DashboardDonation[]` naturally through TypeScript:

```ts
  const donations = await prisma.donation.findMany({
    where: { userId: donor.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      orderId: true,
      amount: true,
      status: true,
      isAnonymous: true,
      showNamePublicly: true,
      message: true,
      createdAt: true,
      paidAt: true,
    },
  });
```

- [ ] **Step 3: Fetch weekly target progress**

After donation query, add:

```ts
  const weeklyTargetProgress = await getWeeklyTargetProgress();
  const targetAmount = weeklyTargetProgress.target?.targetAmount ?? 0;
  const targetCopy = getTargetDashboardCopy({
    targetAmount,
    collected: weeklyTargetProgress.collected,
    remaining: weeklyTargetProgress.remaining,
    progressRatio: weeklyTargetProgress.progressRatio,
  });
```

- [ ] **Step 4: Calculate donor dashboard values**

Add:

```ts
  const displayName = getDonorDisplayName({
    name: donor.name,
    email: donor.email,
  });
  const stats = calculateDonorDashboardStats(donations);
  const latestDonation = getLatestDonationSummary(donations);
```

- [ ] **Step 5: Run TypeScript check through build**

Run:

```bash
npm run build
```

Expected: PASS. Known warning: local low-entropy `BETTER_AUTH_SECRET` may appear.

- [ ] **Step 6: Commit**

```bash
git add src/app/akun/donasi/page.tsx
git commit -m "Fetch donor dashboard data"
```

---

## Task 3: Replace old page shell with craft dashboard layout

**Files:**
- Modify: `src/app/akun/donasi/page.tsx`

- [ ] **Step 1: Replace `<main>` wrapper**

Replace old `page-shell` wrapper with:

```tsx
  return (
    <main className="landing-craft landing-noise min-h-screen text-[color:var(--craft-ink)]">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* header, hero, cards, and history sections go here */}
      </section>
    </main>
  );
```

- [ ] **Step 2: Add craft header**

Inside section, add:

```tsx
<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <Link href="/" className="inline-flex items-center gap-3 text-base font-extrabold tracking-tight text-[color:var(--craft-ink)]">
    <span className="grid size-10 place-items-center rounded-2xl bg-[color:var(--craft-leaf)] text-sm font-bold text-[color:var(--craft-cream)]">
      JB
    </span>
    <span>Jumat Berkah Karyo</span>
  </Link>
  <div className="flex flex-wrap gap-2">
    <Link href="/donasi" className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]">
      Donasi Lagi
    </Link>
    <Link href="/akun/profil" className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]">
      Profil
    </Link>
    <DonorLogoutButton />
  </div>
</header>
```

- [ ] **Step 3: Add personal hero and target card**

Below header, add a two-column grid:

```tsx
<section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
  <div className="craft-card-strong p-6 sm:p-8">
    <span className="craft-pill">Dashboard donatur</span>
    <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
      Assalamu’alaikum, {displayName}
    </h1>
    <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)]">
      Terima kasih sudah ikut menjaga Jumat Berkah tetap berjalan. Di sini Anda bisa melihat riwayat donasi, status pembayaran, dan pengaturan akun donatur.
    </p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link href="/donasi" className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]">
        Donasi Lagi Jumat Ini
      </Link>
      <Link href="/laporan?period=jumat" className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]">
        Lihat laporan publik
      </Link>
    </div>
  </div>

  <TargetCard
    targetCopy={targetCopy}
    targetAmount={targetAmount}
    collected={weeklyTargetProgress.collected}
    remaining={weeklyTargetProgress.remaining}
  />
</section>
```

- [ ] **Step 4: Add KPI bento grid**

Add:

```tsx
<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <MetricCard label="Total berhasil" value={formatRupiah(stats.totalSuccessful)} />
  <MetricCard label="Transaksi" value={String(stats.transactionCount)} />
  <MetricCard label="Menunggu" value={String(stats.pendingCount)} />
  <MetricCard
    label="Donasi terakhir"
    value={latestDonation ? formatRupiah(latestDonation.amount) : "Belum ada"}
    detail={latestDonation ? getDonationStatusTone(latestDonation.status).label : "Mulai donasi pertama"}
  />
</section>
```

- [ ] **Step 5: Add account bento section**

Add two cards:

```tsx
<section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
  <TelegramCard donorTelegram={donorTelegram} />
  <ProfileSummaryCard displayName={displayName} email={donor.email} />
</section>
```

- [ ] **Step 6: Add donation card list section**

Add:

```tsx
<section className="craft-card p-5 sm:p-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <span className="craft-pill">Riwayat</span>
      <h2 className="mt-3 text-2xl font-extrabold text-[color:var(--craft-ink)]">
        Donasi terbaru Anda
      </h2>
    </div>
    <Link href="/donasi" className="inline-flex min-h-10 items-center rounded-full border border-[color:var(--craft-line-strong)] px-4 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]">
      Donasi Lagi
    </Link>
  </div>

  {donations.length > 0 ? (
    <div className="mt-5 grid gap-3">
      {donations.map((donation) => (
        <DonationHistoryCard key={donation.id} donation={donation} />
      ))}
    </div>
  ) : (
    <EmptyDonationState />
  )}
</section>
```

- [ ] **Step 7: Remove old table UI**

Delete old table markup, old `SummaryCard`, old `StatusBadge`, and old inline `getPrivacyLabel` if replaced by imported helper.

- [ ] **Step 8: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/app/akun/donasi/page.tsx
git commit -m "Redesign donor dashboard layout"
```

---

## Task 4: Add focused page subcomponents in same file

**Files:**
- Modify: `src/app/akun/donasi/page.tsx`

- [ ] **Step 1: Add `MetricCard`**

Add near bottom of `page.tsx`:

```tsx
function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="craft-card p-5">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--craft-leaf)]">
        {label}
      </p>
      <p className="craft-num mt-4 text-3xl italic text-[color:var(--craft-ink)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          {detail}
        </p>
      ) : null}
    </article>
  );
}
```

- [ ] **Step 2: Add `TargetCard`**

Add:

```tsx
function TargetCard({
  targetCopy,
  targetAmount,
  collected,
  remaining,
}: {
  targetCopy: { hasTarget: boolean; progressPercent: number; title: string };
  targetAmount: number;
  collected: number;
  remaining: number;
}) {
  return (
    <article className="craft-card flex flex-col justify-between p-6">
      <div>
        <span className="craft-pill">Jumat ini</span>
        <h2 className="mt-4 text-2xl font-extrabold text-[color:var(--craft-ink)]">
          {targetCopy.title}
        </h2>
        {targetCopy.hasTarget ? (
          <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            Terkumpul {formatRupiah(collected)} dari target {formatRupiah(targetAmount)}.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            Target mingguan belum tersedia. Anda tetap bisa berdonasi kapan saja.
          </p>
        )}
      </div>
      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-[color:var(--craft-paper)] ring-1 ring-[color:var(--craft-line)]">
          <div
            className="h-full rounded-full bg-[color:var(--craft-leaf)]"
            style={{ width: `${targetCopy.progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm font-bold text-[color:var(--craft-ink)]">
          <span>{targetCopy.progressPercent}%</span>
          <span>Sisa {formatRupiah(remaining)}</span>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Add `TelegramCard`**

Add:

```tsx
function TelegramCard({
  donorTelegram,
}: {
  donorTelegram: {
    telegramChatId: bigint | null;
    telegramReminderOptIn: boolean;
    telegramLinkCode: string | null;
  };
}) {
  return (
    <article className="craft-card p-5 sm:p-6">
      <span className="craft-pill">Telegram</span>
      <h2 className="mt-3 text-2xl font-extrabold text-[color:var(--craft-ink)]">
        Pengingat donatur
      </h2>
      {donorTelegram.telegramChatId ? (
        <p className="mt-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          Telegram sudah terhubung. Reminder Jumat: {donorTelegram.telegramReminderOptIn ? "aktif" : "nonaktif"}.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          <p>Kirim perintah ini ke bot Telegram untuk menghubungkan akun:</p>
          <code className="block rounded-2xl bg-[color:var(--craft-paper)] px-4 py-3 font-mono text-[color:var(--craft-ink)] ring-1 ring-[color:var(--craft-line)]">
            /mulai {donorTelegram.telegramLinkCode}
          </code>
          <p>Kode sekali pakai. Setelah terhubung, bot dapat menampilkan riwayat donasi akun ini saja.</p>
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Add `ProfileSummaryCard`**

Add:

```tsx
function ProfileSummaryCard({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  return (
    <article className="craft-card p-5 sm:p-6">
      <span className="craft-pill">Profil</span>
      <h2 className="mt-3 text-2xl font-extrabold text-[color:var(--craft-ink)]">
        Data akun
      </h2>
      <dl className="mt-4 space-y-3 text-sm text-[color:var(--craft-ink-soft)]">
        <div>
          <dt className="font-bold text-[color:var(--craft-ink)]">Nama</dt>
          <dd className="mt-1">{displayName}</dd>
        </div>
        <div>
          <dt className="font-bold text-[color:var(--craft-ink)]">Email</dt>
          <dd className="mt-1 break-all">{email}</dd>
        </div>
      </dl>
      <Link href="/akun/profil" className="mt-5 inline-flex min-h-10 items-center rounded-full border border-[color:var(--craft-line-strong)] px-4 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]">
        Edit profil
      </Link>
    </article>
  );
}
```

- [ ] **Step 5: Add `DonationHistoryCard`**

Add:

```tsx
function DonationHistoryCard({ donation }: { donation: DashboardDonation }) {
  const tone = getDonationStatusTone(donation.status);

  return (
    <article className="rounded-2xl border border-[color:var(--craft-line)] bg-[color:var(--craft-paper)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold text-[color:var(--craft-ink-soft)]">
            {donation.orderId}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-[color:var(--craft-ink)]">
            {formatRupiah(donation.amount)}
          </p>
        </div>
        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${tone.className}`}>
          {tone.label}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[color:var(--craft-ink-soft)] sm:grid-cols-3">
        <p>{getDonationPrivacyLabel(donation)}</p>
        <p>{formatDate(donation.paidAt ?? donation.createdAt)}</p>
        <Link href={`/donasi/status/${donation.orderId}`} className="font-bold text-[color:var(--craft-leaf)]">
          Lihat status
        </Link>
      </div>
      {donation.message ? (
        <p className="mt-3 rounded-2xl bg-[color:var(--craft-cream)] p-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          “{donation.message}”
        </p>
      ) : null}
    </article>
  );
}
```

- [ ] **Step 6: Add `EmptyDonationState`**

Add:

```tsx
function EmptyDonationState() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] p-6 text-center">
      <h3 className="text-xl font-extrabold text-[color:var(--craft-ink)]">
        Belum ada donasi yang terhubung.
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        Mulai dari donasi pertama Anda, atau daftar dengan email yang sama agar riwayat lama bisa tersambung.
      </p>
      <Link href="/donasi" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]">
        Donasi Pertama
      </Link>
    </div>
  );
}
```

- [ ] **Step 7: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: both PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/akun/donasi/page.tsx
git commit -m "Add donor dashboard craft cards"
```

---

## Task 5: Docs, validation, and manual smoke

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Update `IMPLEMENTATION_PLAN.md` Work Log**

Add an entry under `2026-05-30`:

```md
- Implemented donor dashboard craft redesign for `/akun/donasi`. Replaced the old account history table page with a warm craft dashboard: personal salam hero, donor KPI bento, current Friday target aggregate card, Telegram status/link-code card, profile summary, and mobile-first donation history cards. No database schema, payment, webhook, or financial status rules changed. Validation passed: `npm run lint`, `npm test`, `npm run build`. Manual smoke covered donor session dashboard, anonymous redirect to `/masuk`, donation-card links, target fallback/progress, and Telegram linked/unlinked card where local data allowed.
```

- [ ] **Step 2: Run full validation**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: all PASS. Known warning: local low-entropy `BETTER_AUTH_SECRET` may appear.

- [ ] **Step 3: Manual smoke**

Use browser on local dev server:

```txt
http://localhost:3037/akun/donasi
```

Verify:

- Donor session renders craft dashboard.
- Anonymous session redirects to `/masuk`.
- Hero says `Assalamu’alaikum, ...`.
- KPI cards show totals.
- Target card shows progress or `Target Jumat belum diatur.`.
- Telegram card shows `/mulai <kode>` when unlinked.
- Profile card shows name/email only for current donor.
- Donation cards show status, privacy, amount, date, and `Lihat status` links.
- No donor phone appears.
- `Donasi Lagi`, `Profil`, logout, and `Lihat status` work.

- [ ] **Step 4: Commit**

```bash
git add IMPLEMENTATION_PLAN.md
git commit -m "Document donor dashboard redesign"
```

---

## Self-Review

- Spec coverage: all approved sections are mapped to tasks: craft dashboard, personal hero, KPI bento, current Friday target, Telegram status, profile summary, donation cards, empty state, privacy/security, and validation.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: `DashboardDonation`, `DonorDashboardStats`, and helper names are consistent across tests and page plan.
- Scope check: no schema, payment, webhook, admin, WhatsApp, recurring donation, or distribution story work included.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-30-donor-dashboard-craft-redesign.md`.

Two execution options:

1. Subagent-Driven (recommended) — dispatch a fresh subagent per task, review between tasks, faster iteration.
2. Inline Execution — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
