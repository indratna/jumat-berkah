# InApp-Inspired UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply an InApp-inspired visual refresh to Jumat Berkah Karyo while keeping public pages warm and admin pages neutral, compact, and data-first.

**Architecture:** Keep the existing Next.js App Router, TypeScript, and Tailwind CSS architecture. Implement visual changes through shared CSS utilities and existing frontend components first, then update page-level markup/classes without touching backend logic, API contracts, auth, payment, database, or business rules.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, existing Prisma/PostgreSQL backend unchanged.

---

## Reference Documents

- Design spec: `docs/superpowers/specs/2026-05-28-inapp-inspired-ui-refresh-design.md`
- Project rules: `AGENTS.md`
- Progress tracker: `IMPLEMENTATION_PLAN.md`
- Product scope: `PRD.md`
- Technical constraints: `TECHNICAL_SPEC.md`
- Visual reference source: `D:\inapp-1.0.0`

## File Structure and Responsibilities

### Core visual foundation

- Modify `src/app/globals.css`
  - Owns global visual tokens/utilities: background, focus states, reusable panel/button/field/table classes, reduced motion, print rules.

### Admin shared components

- Modify `src/components/admin/admin-sidebar.tsx`
  - Owns admin navigation grouping, InApp-style sidebar layout, active/hover style if current route logic is added safely.
- Modify `src/components/admin/admin-status-badge.tsx`
  - Owns donation status visual mapping.
- Modify `src/components/admin/admin-summary-footer.tsx`
  - Owns reusable summary footer surface if used on admin lists.
- Modify `src/components/admin/admin-top-tabs.tsx`
  - Owns tab navigation styling if used on admin pages.
- Modify `src/app/admin/layout.tsx`
  - Owns admin shell spacing around sidebar/content.

### Admin pages

- Modify `src/app/admin/page.tsx`
- Modify `src/app/admin/donasi/page.tsx`
- Modify `src/app/admin/pengeluaran/page.tsx`
- Modify `src/app/admin/pengeluaran/expense-manager.tsx`
- Modify `src/app/admin/donatur/page.tsx`
- Modify `src/app/admin/penyaluran/page.tsx`
- Modify `src/app/admin/penyaluran/distribution-report-form.tsx`
- Modify `src/app/admin/audit/page.tsx`
- Modify `src/app/admin/persetujuan/page.tsx`
- Modify `src/app/admin/weekly-target-form.tsx`
- Modify `src/app/admin/auto-submit-select.tsx`

### Public/account pages

- Modify `src/app/page.tsx`
- Modify `src/app/donasi/page.tsx`
- Modify `src/app/donasi/donation-form.tsx`
- Modify `src/app/donasi/status/[orderId]/page.tsx`
- Modify `src/app/laporan/page.tsx`
- Modify `src/app/laporan/loading.tsx`
- Modify `src/app/laporan/error.tsx`
- Modify `src/app/login/page.tsx`
- Modify `src/app/login/admin-login-form.tsx`
- Modify `src/app/masuk/page.tsx`
- Modify `src/app/masuk/donor-login-form.tsx`
- Modify `src/app/akun/donasi/page.tsx`
- Modify `src/app/akun/profil/page.tsx`
- Modify `src/app/akun/profil/profile-form.tsx`
- Modify `src/app/akun/profil/password-change-form.tsx`
- Modify `src/app/lupa-password/page.tsx`
- Modify `src/app/lupa-password/password-reset-request-form.tsx`
- Modify `src/app/reset-password/page.tsx`
- Modify `src/app/reset-password/reset-password-form.tsx`
- Modify `src/app/tentang/page.tsx`

### Documentation/progress

- Modify `IMPLEMENTATION_PLAN.md`
  - Add Work Log entry after validation passes.

## Safety Rules for Every Task

- Do not edit API routes.
- Do not edit Prisma schema or migrations.
- Do not edit auth/payment/report calculation libraries.
- Do not change form field names, action URLs, server actions, validation logic, or route paths.
- Do not add dependencies.
- Keep all user-facing copy Indonesian.
- Keep public privacy rules intact: no donor email/phone, anonymous displays as `Anonim`.

---

### Task 1: Prepare Baseline and Current UI Inventory

**Files:**
- Read-only: `src/app/globals.css`
- Read-only: `src/components/admin/admin-sidebar.tsx`
- Read-only: `src/app/admin/layout.tsx`
- Read-only: page files listed above

- [ ] **Step 1: Run baseline validation**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected:

- Lint passes.
- Tests pass.
- Build passes or only shows existing unrelated `BETTER_AUTH_SECRET` entropy warning.

- [ ] **Step 2: Inspect current UI classes**

Search for these patterns to find stale promotional styling:

```bash
grep -R "font-black\|radial\|from-\|to-\|backdrop-blur\|shadow-2xl\|rounded-full" src/app src/components -n
```

Expected:

- Identify UI-only candidates to simplify.
- Do not modify anything in this step.

- [ ] **Step 3: Record implementation start in `IMPLEMENTATION_PLAN.md`**

Add a Work Log entry under `2026-05-28` before coding:

```markdown
- Started InApp-inspired UI refresh planning/execution. Scope is frontend UI/UX only: adapt InApp admin layout patterns into existing Tailwind UI, keep public pages warm nonprofit, keep admin pages neutral office-dashboard, and avoid backend/auth/payment/database/business logic changes.
```

- [ ] **Step 4: Commit is skipped unless user asks**

Do not run `git commit`. This project/session requires no commits unless explicitly requested by the user.

---

### Task 2: Refine Global Visual Utilities

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update root tokens carefully**

In `src/app/globals.css`, keep existing structure but align tokens to neutral slate + green.

Use these values:

```css
:root {
    --background: #f8fafc;
    --foreground: #0f172a;
    --surface: #ffffff;
    --muted: #64748b;
    --line: #e2e8f0;
    --brand: #166534;
    --brand-dark: #14532d;
}
```

Expected:

- App background becomes closer to InApp neutral office surface.
- Brand shifts from teal to green for Jumat Berkah fit.

- [ ] **Step 2: Strengthen reusable classes**

Ensure these classes exist or update existing ones to this shape:

```css
.panel {
    border: 1px solid var(--line);
    border-radius: 1rem;
    background: var(--surface);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.kicker {
    color: var(--brand);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.body-muted {
    color: #475569;
    line-height: 1.65;
}

.field {
    min-height: 2.75rem;
    width: 100%;
    border-radius: 0.75rem;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    padding: 0.625rem 0.75rem;
    font-size: 0.925rem;
}

.btn-primary,
.btn-outline {
    min-height: 2.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
```

Expected:

- Inputs/buttons meet 44px touch target.
- Existing components using these classes improve globally.

- [ ] **Step 3: Run focused lint**

Run:

```bash
npm run lint
```

Expected: pass.

---

### Task 3: Rework Admin Shell and Shared Components

**Files:**
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx`
- Modify: `src/components/admin/admin-status-badge.tsx`
- Modify: `src/components/admin/admin-summary-footer.tsx`
- Modify: `src/components/admin/admin-top-tabs.tsx`

- [ ] **Step 1: Update admin layout shell spacing**

In `src/app/admin/layout.tsx`, keep auth checks unchanged. Only update returned classes to this pattern:

```tsx
return (
  <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
    <AdminSidebar />

    <main
      id="main-content"
      className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6"
    >
      {children}
    </main>
  </div>
);
```

Expected:

- Content uses a real `main` landmark.
- Desktop spacing becomes more compact and InApp-like.

- [ ] **Step 2: Update admin sidebar visual style**

In `src/components/admin/admin-sidebar.tsx`, keep `adminNavGroups` hrefs unchanged. Update the `<aside>` class to:

```tsx
<aside className="border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-3 lg:py-4">
```

Update logo tile class to green:

```tsx
<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-green-700 text-sm font-bold text-white">
  JB
</div>
```

Update nav item link class to:

```tsx
className="block min-w-0 rounded-lg px-3 py-2 text-slate-700 hover:bg-green-50 hover:text-green-800 focus-visible:bg-green-50 focus-visible:text-green-800"
```

Expected:

- Sidebar matches InApp width/density.
- Active-route highlighting is not added yet because current component is server-shared and no current pathname is available without converting to client component. Avoid behavior change in this task.

- [ ] **Step 3: Update status badge colors**

In `src/components/admin/admin-status-badge.tsx`, update `toneClasses` to use green for settlement:

```ts
const toneClasses: Record<StatusTone, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  settlement: "bg-green-50 text-green-700 ring-green-200",
  failed: "bg-rose-50 text-rose-800 ring-rose-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
};
```

Update badge class to less shouty text:

```tsx
className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[meta.tone]}`}
```

Expected:

- Status remains text-visible.
- Settlement now aligns with Jumat Berkah green.

- [ ] **Step 4: Normalize admin top tabs and summary footer**

Open `src/components/admin/admin-top-tabs.tsx` and `src/components/admin/admin-summary-footer.tsx`. Replace any heavy gradients/shadows with:

```tsx
"rounded-xl border border-slate-200 bg-white shadow-sm"
```

For selected/active tab classes use:

```tsx
"bg-green-50 text-green-800 ring-1 ring-green-200"
```

For inactive tab classes use:

```tsx
"text-slate-600 hover:bg-slate-100 hover:text-slate-950"
```

Expected:

- Shared admin nav components match sidebar style.

- [ ] **Step 5: Run focused validation**

Run:

```bash
npm run lint
npm test
```

Expected: pass.

---

### Task 4: Apply InApp-Inspired Admin Page Styling

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/donasi/page.tsx`
- Modify: `src/app/admin/pengeluaran/page.tsx`
- Modify: `src/app/admin/pengeluaran/expense-manager.tsx`
- Modify: `src/app/admin/donatur/page.tsx`
- Modify: `src/app/admin/penyaluran/page.tsx`
- Modify: `src/app/admin/penyaluran/distribution-report-form.tsx`
- Modify: `src/app/admin/audit/page.tsx`
- Modify: `src/app/admin/persetujuan/page.tsx`
- Modify: `src/app/admin/weekly-target-form.tsx`
- Modify: `src/app/admin/auto-submit-select.tsx`

- [ ] **Step 1: Standardize admin page header pattern**

For each admin page, use this structure around existing title/copy/actions without changing data fetching:

```tsx
<header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
  <div className="min-w-0">
    <p className="kicker">Admin</p>
    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
      PAGE_TITLE_HERE
    </h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
      PAGE_DESCRIPTION_HERE
    </p>
  </div>
  ACTIONS_IF_EXISTING
</header>
```

Expected:

- Admin pages stop looking like public landing sections.
- Existing actions remain in same route/component.

- [ ] **Step 2: Standardize admin metric cards**

For stat/summary cards on `src/app/admin/page.tsx`, use this visual pattern while keeping current values/calculations:

```tsx
<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
    LABEL_HERE
  </p>
  <p className="mt-2 numeric text-2xl font-bold tracking-tight text-slate-950">
    VALUE_HERE
  </p>
  <p className="mt-1 text-sm text-slate-600">SUPPORTING_TEXT_HERE</p>
</div>
```

Expected:

- Cards follow InApp metric card hierarchy.
- Money values remain integer Rupiah formatted by existing helpers.

- [ ] **Step 3: Standardize table containers**

For admin tables/lists, wrap tables in:

```tsx
<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="overflow-x-auto">
    TABLE_HERE
  </div>
</div>
```

Use table classes:

```tsx
className="min-w-full divide-y divide-slate-200 text-sm"
```

Use header row/cell classes:

```tsx
className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
```

Use body row classes:

```tsx
className="divide-y divide-slate-100 bg-white"
```

Expected:

- Dense admin data becomes readable and mobile-safe.
- Only table presentation changes.

- [ ] **Step 4: Standardize admin form controls**

In admin forms (`expense-manager.tsx`, `distribution-report-form.tsx`, `weekly-target-form.tsx`, filters), prefer existing `.field`, `.btn-primary`, `.btn-outline` classes where safe.

For inline selects in `auto-submit-select.tsx`, use:

```tsx
className="field min-w-40 text-sm"
```

Expected:

- Forms meet 44px control height.
- Existing submit handlers/state remain untouched.

- [ ] **Step 5: Remove remaining promotional styling in admin only**

Replace admin-only patterns:

- `font-black` → `font-bold`
- `shadow-2xl` → `shadow-sm`
- `rounded-[2rem]` or larger decorative radius → `rounded-2xl`
- full panel gradients → `bg-white border border-slate-200`
- teal success classes → green success classes where semantic settlement/success

Expected:

- Admin UI becomes office-dashboard style.

- [ ] **Step 6: Run validation**

Run:

```bash
npm run lint
npm test
```

Expected: pass.

---

### Task 5: Apply Warm Nonprofit Public Page Styling

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/donasi/page.tsx`
- Modify: `src/app/donasi/donation-form.tsx`
- Modify: `src/app/donasi/status/[orderId]/page.tsx`
- Modify: `src/app/laporan/page.tsx`
- Modify: `src/app/laporan/loading.tsx`
- Modify: `src/app/laporan/error.tsx`
- Modify: `src/app/tentang/page.tsx`

- [ ] **Step 1: Standardize public page shell**

For public pages, use this outer style where page layout allows:

```tsx
<main id="main-content" className="page-shell bg-slate-50">
  <div className="mx-auto max-w-6xl">
    CONTENT_HERE
  </div>
</main>
```

If the page already has `main`, keep one `main` only and update class names.

Expected:

- No duplicate `main` landmarks.
- Public pages have consistent max width.

- [ ] **Step 2: Landing hero style**

In `src/app/page.tsx`, keep existing links and data. Shape hero like:

```tsx
<section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
  <div className="panel p-6 sm:p-8">
    <p className="kicker">Jumat Berkah Karyo</p>
    <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
      EXISTING_HEADLINE
    </h1>
    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
      EXISTING_DESCRIPTION
    </p>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      EXISTING_CTA_LINKS
    </div>
  </div>
  <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
    EXISTING_SUMMARY_CONTENT
  </aside>
</section>
```

Expected:

- Public hero is warm, not flashy.
- Donation/report CTA remains clear.

- [ ] **Step 3: Donation form polish**

In `src/app/donasi/donation-form.tsx`, preserve submit logic and field names. Ensure each input/select/textarea has:

```tsx
className="field"
```

Ensure primary submit button uses:

```tsx
className="btn-primary w-full sm:w-auto"
```

Ensure privacy/helper text uses:

```tsx
className="text-sm leading-6 text-slate-600"
```

Expected:

- Donation remains short and low friction.
- Form labels remain visible.

- [ ] **Step 4: Public report cards/tables polish**

In `src/app/laporan/page.tsx`, keep report calculations and privacy logic unchanged. Use:

```tsx
<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  SECTION_CONTENT
</section>
```

For warm transparency/story panels use amber sparingly:

```tsx
<section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
  STORY_OR_TRUST_CONTENT
</section>
```

Expected:

- Public report stays trustworthy and readable.
- Donor private fields remain absent.

- [ ] **Step 5: Loading/error pages**

In `src/app/laporan/loading.tsx` and `src/app/laporan/error.tsx`, use neutral panels:

```tsx
<div className="page-shell bg-slate-50">
  <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    CONTENT_HERE
  </div>
</div>
```

Expected:

- Data-dependent states match app style.

- [ ] **Step 6: Run validation**

Run:

```bash
npm run lint
npm test
```

Expected: pass.

---

### Task 6: Normalize Auth, Account, and Status Pages

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/login/admin-login-form.tsx`
- Modify: `src/app/masuk/page.tsx`
- Modify: `src/app/masuk/donor-login-form.tsx`
- Modify: `src/app/akun/donasi/page.tsx`
- Modify: `src/app/akun/profil/page.tsx`
- Modify: `src/app/akun/profil/profile-form.tsx`
- Modify: `src/app/akun/profil/password-change-form.tsx`
- Modify: `src/app/lupa-password/page.tsx`
- Modify: `src/app/lupa-password/password-reset-request-form.tsx`
- Modify: `src/app/reset-password/page.tsx`
- Modify: `src/app/reset-password/reset-password-form.tsx`
- Modify: `src/app/donasi/status/[orderId]/page.tsx`

- [ ] **Step 1: Standardize auth page shell**

Use this visual shell on login/reset pages without changing auth logic:

```tsx
<main id="main-content" className="page-shell bg-slate-50">
  <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      CONTENT_HERE
    </section>
  </div>
</main>
```

Expected:

- Login/reset forms are calm and centered.

- [ ] **Step 2: Standardize account page panels**

For `/akun/donasi` and `/akun/profil`, use:

```tsx
<div className="mx-auto max-w-5xl space-y-5">
  <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    PAGE_TITLE_AND_COPY
  </header>
  PAGE_SECTIONS
</div>
```

Expected:

- Account pages align with public/admin neutral system.

- [ ] **Step 3: Standardize auth/account form controls**

In form components, keep submit handlers untouched and update classes:

```tsx
className="field"
```

Primary buttons:

```tsx
className="btn-primary w-full"
```

Secondary buttons/links:

```tsx
className="btn-outline w-full"
```

Error text:

```tsx
className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
```

Expected:

- Forms become visually consistent.
- Existing validation messages remain.

- [ ] **Step 4: Donation status page**

In `src/app/donasi/status/[orderId]/page.tsx`, preserve status logic. Use status panel styles:

```tsx
const statusToneClass = {
  settlement: "border-green-200 bg-green-50 text-green-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  failed: "border-rose-200 bg-rose-50 text-rose-800",
  neutral: "border-slate-200 bg-white text-slate-700",
};
```

If existing code has its own mapping, only adapt classes, not status logic.

Expected:

- Status remains clear by text and color.

- [ ] **Step 5: Run validation**

Run:

```bash
npm run lint
npm test
```

Expected: pass.

---

### Task 7: Responsive and Accessibility Pass

**Files:**
- Modify only files changed in Tasks 2–6 if issues are found.

- [ ] **Step 1: Search for risky patterns**

Run:

```bash
grep -R "text-xs.*text-slate-400\|outline-none\|placeholder=.*label\|hover:.*group-hover" src/app src/components -n
```

Expected:

- Review any matches manually.
- Do not remove focus states.

- [ ] **Step 2: Check mobile table containment**

Search table usage:

```bash
grep -R "<table" src/app src/components -n
```

Expected:

- Every admin/public dense table sits inside an `overflow-x-auto` container.
- Whole page should not require horizontal scroll.

- [ ] **Step 3: Check button/input target size**

Search form controls:

```bash
grep -R "<button\|<input\|<select\|<textarea" src/app src/components -n
```

Expected:

- Important controls use `.field`, `.btn-primary`, `.btn-outline`, or equivalent `min-h-11`/`h-11` classes.

- [ ] **Step 4: Run full validation**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected:

- Lint passes.
- Tests pass.
- Build passes or only shows known unrelated `BETTER_AUTH_SECRET` local entropy warning.

---

### Task 8: Update Progress Tracker and Final Review

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Add completion Work Log entry**

After validation passes, add this Work Log entry under `2026-05-28` and adjust details if actual scope differs:

```markdown
- Completed InApp-inspired UI refresh for frontend only. Adapted InApp admin dashboard patterns into the existing Tailwind UI: neutral admin shell/sidebar, compact page headers, calmer metric cards, readable tables/forms, consistent status badges, and warm nonprofit public pages. No backend logic, routes, API, auth, database, payment, or business flow changed. Validation passed: `npm run lint`, `npm test`, `npm run build`. Build may still warn about local `BETTER_AUTH_SECRET` entropy; production follow-up remains to use a strong secret.
```

- [ ] **Step 2: Manual route checklist**

Open and visually review these routes locally:

```txt
/
/donasi
/laporan
/login
/masuk
/admin
/admin/donasi
/admin/pengeluaran
/admin/donatur
/admin/penyaluran
/admin/audit
/admin/persetujuan
/akun/donasi
/akun/profil
/lupa-password
/reset-password
```

Expected:

- No major layout break.
- Admin navigation readable.
- Tables readable.
- Public pages not flashy.
- Forms readable.
- Donation flow still short.

- [ ] **Step 3: Manual responsive checklist**

Review at approximate widths:

```txt
375px
768px
1024px
1440px
```

Expected:

- No horizontal page scroll except table wrappers.
- CTA buttons stack correctly on mobile.
- Sidebar does not hide content on mobile.

- [ ] **Step 4: Final response**

Report:

- Files changed.
- Validation commands and results.
- Any known warnings, especially `BETTER_AUTH_SECRET` if still present.
- Manual routes reviewed or not reviewed.

Do not claim manual browser verification passed unless actually performed.

---

## Self-Review

### Spec Coverage

- Public warm nonprofit direction covered by Task 5.
- Admin InApp-inspired office dashboard covered by Tasks 3 and 4.
- Account/auth/status page normalization covered by Task 6.
- Accessibility and responsive requirements covered by Tasks 2 and 7.
- Implementation boundaries covered in Safety Rules and per-task constraints.
- Validation and progress tracker update covered by Tasks 7 and 8.

### Placeholder Scan

No task contains `TBD`, `TODO`, or unspecified implementation-only placeholders. `CONTENT_HERE`, `PAGE_TITLE_HERE`, and similar markers appear only inside reusable structural examples and are paired with exact instruction to preserve existing content/data/actions.

### Type/Behavior Consistency

No new TypeScript types or runtime functions are introduced by this plan. Existing auth/payment/report/database behavior stays unchanged. Status badge class changes preserve existing `DonationStatus` mapping.
