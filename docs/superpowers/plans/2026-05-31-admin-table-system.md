# Admin Table System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyamakan visual, struktur, dan interaksi halaman admin bertabel dengan `/admin/donasi` sebagai referensi utama, dimulai dari `/admin/donatur`, lalu `/admin/pengeluaran`, `/admin/audit`, dan `/admin/persetujuan`.

**Architecture:** Buat reusable layer hybrid kecil untuk shell halaman data admin, sticky page bar, table card, footer, action button, dan utility sticky/z-index. Pertahankan renderer kolom, row detail, dan behavior business logic di page masing-masing agar aman dan mudah di-debug. Kerjakan per halaman, validasi visual dan lint per tahap, lalu update `IMPLEMENTATION_PLAN.md` saat selesai.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, existing admin page/server components, existing admin helper functions.

---

## File Map

### Shared files to create
- `JumatBerkah/src/components/admin/admin-data-page-shell.tsx` — wrapper `main` + spacing standar untuk halaman data admin.
- `JumatBerkah/src/components/admin/admin-sticky-page-bar.tsx` — sticky action/title bar standar admin.
- `JumatBerkah/src/components/admin/admin-table-card.tsx` — shell card tabel + slot toolbar/body/footer.
- `JumatBerkah/src/components/admin/admin-table-footer.tsx` — footer pagination/meta yang menggantikan versi lokal berulang.
- `JumatBerkah/src/components/admin/admin-table-action-button.tsx` — tombol aksi compact konsisten, termasuk variant neutral/primary/danger/export.
- `JumatBerkah/src/components/admin/admin-table-styles.ts` — konstanta className bersama untuk sticky header, cell density, z-index helpers.

### Shared files to modify
- `JumatBerkah/src/components/admin/admin-shell.tsx` — pastikan stacking context admin shell tetap selaras dengan sticky table system.
- `JumatBerkah/src/components/admin/notification-bell.tsx` — cek ulang layering setelah standard z-index baru dipakai lintas halaman.

### Page files to modify
- `JumatBerkah/src/app/admin/donatur/page.tsx`
- `JumatBerkah/src/app/admin/pengeluaran/page.tsx`
- `JumatBerkah/src/app/admin/pengeluaran/expense-manager.tsx`
- `JumatBerkah/src/app/admin/audit/page.tsx`
- `JumatBerkah/src/app/admin/persetujuan/page.tsx`

### Docs to modify
- `JumatBerkah/IMPLEMENTATION_PLAN.md`

---

### Task 1: Build reusable admin data-table foundation

**Files:**
- Create: `JumatBerkah/src/components/admin/admin-data-page-shell.tsx`
- Create: `JumatBerkah/src/components/admin/admin-sticky-page-bar.tsx`
- Create: `JumatBerkah/src/components/admin/admin-table-card.tsx`
- Create: `JumatBerkah/src/components/admin/admin-table-footer.tsx`
- Create: `JumatBerkah/src/components/admin/admin-table-action-button.tsx`
- Create: `JumatBerkah/src/components/admin/admin-table-styles.ts`
- Modify: `JumatBerkah/src/components/admin/admin-shell.tsx`
- Modify: `JumatBerkah/src/components/admin/notification-bell.tsx`

- [ ] **Step 1: Write the failing test checklist as code comments in plan scope**

Create target assertions for manual+lint validation:

```txt
Shared foundation must provide:
- page shell with `max-w-6xl space-y-4`
- sticky page bar compatible with admin header (`top-16` baseline)
- reusable footer with arrow pagination and page-size slot support
- reusable action button variants
- reusable sticky header cell classes
- z-index scale that keeps notification bell above sticky tables
```

- [ ] **Step 2: Create style constants file**

Write `JumatBerkah/src/components/admin/admin-table-styles.ts`:

```ts
export const adminTableStyles = {
  pageShell: "mx-auto max-w-6xl space-y-4",
  stickyPageBar:
    "sticky top-16 z-30 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between",
  tableCard: "rounded-2xl border border-slate-200 bg-white shadow-sm",
  toolbar: "grid gap-3 border-b border-slate-100 bg-white p-5",
  footer:
    "flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5 text-sm",
  meta: "text-sm text-slate-600",
  emptyState: "p-6 text-sm text-slate-500",
  stickyHeadCell:
    "sticky top-[8.75rem] z-20 bg-slate-50 px-4 py-3 font-semibold shadow-[0_1px_0_0_rgba(226,232,240,1)]",
  headCell: "px-4 py-3 font-semibold",
  bodyCell: "px-4 py-4",
  compactAction:
    "inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600",
} as const;
```

- [ ] **Step 3: Create `AdminDataPageShell`**

Write `JumatBerkah/src/components/admin/admin-data-page-shell.tsx`:

```tsx
import { adminTableStyles } from "@/components/admin/admin-table-styles";

export function AdminDataPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className={adminTableStyles.pageShell}>{children}</main>;
}
```

- [ ] **Step 4: Create `AdminStickyPageBar`**

Write `JumatBerkah/src/components/admin/admin-sticky-page-bar.tsx`:

```tsx
import { adminTableStyles } from "@/components/admin/admin-table-styles";

export function AdminStickyPageBar({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className={adminTableStyles.stickyPageBar}>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
```

- [ ] **Step 5: Create `AdminTableCard`**

Write `JumatBerkah/src/components/admin/admin-table-card.tsx`:

```tsx
import { adminTableStyles } from "@/components/admin/admin-table-styles";

export function AdminTableCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className={adminTableStyles.tableCard}>{children}</section>;
}
```

- [ ] **Step 6: Create `AdminTableActionButton`**

Write `JumatBerkah/src/components/admin/admin-table-action-button.tsx`:

```tsx
import Link from "next/link";

import { adminTableStyles } from "@/components/admin/admin-table-styles";

type Variant = "neutral" | "danger" | "export";

export function AdminTableActionButton({
  href,
  children,
  ariaLabel,
  variant = "neutral",
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel: string;
  variant?: Variant;
}) {
  const variantClass =
    variant === "danger"
      ? "hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      : adminTableStyles.compactAction;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={variant === "danger" ? `${adminTableStyles.compactAction} ${variantClass}` : adminTableStyles.compactAction}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 7: Create `AdminTableFooter`**

Write `JumatBerkah/src/components/admin/admin-table-footer.tsx`:

```tsx
import Link from "next/link";

import { adminTableStyles } from "@/components/admin/admin-table-styles";

export function AdminTableFooter({
  page,
  totalPages,
  hrefBuilder,
  pageSizeControl,
  totalLabel,
}: {
  page: number;
  totalPages: number;
  hrefBuilder: (page: number) => string;
  pageSizeControl?: React.ReactNode;
  totalLabel?: React.ReactNode;
}) {
  return (
    <div className={adminTableStyles.footer}>
      <div className="flex items-center gap-3">
        {pageSizeControl}
        {totalLabel ? <span className={adminTableStyles.meta}>{totalLabel}</span> : null}
      </div>
      <div className="flex items-center gap-3">
        <Link
          aria-disabled={page <= 1}
          className="btn-outline"
          href={`?${hrefBuilder(Math.max(1, page - 1))}`}
        >
          ←
        </Link>
        <span className={adminTableStyles.meta}>
          Halaman {page} / {totalPages}
        </span>
        <Link
          aria-disabled={page >= totalPages}
          className="btn-outline"
          href={`?${hrefBuilder(Math.min(totalPages, page + 1))}`}
        >
          →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Align shell layering with shared z-index rules**

Update `JumatBerkah/src/components/admin/admin-shell.tsx` header to preserve top-level overlay precedence:

```tsx
<header className="sticky top-0 z-[60] border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
```

Keep `NotificationBell` in same header action cluster.

- [ ] **Step 9: Keep notification popover above all future sticky tables**

Retain/confirm this class in `JumatBerkah/src/components/admin/notification-bell.tsx`:

```tsx
<div className="absolute right-0 top-11 z-[70] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
```

- [ ] **Step 10: Run lint on shared foundation**

Run:

```bash
npx eslint src/components/admin/admin-data-page-shell.tsx src/components/admin/admin-sticky-page-bar.tsx src/components/admin/admin-table-card.tsx src/components/admin/admin-table-footer.tsx src/components/admin/admin-table-action-button.tsx src/components/admin/admin-table-styles.ts src/components/admin/admin-shell.tsx src/components/admin/notification-bell.tsx --max-warnings 999
```

Expected: PASS.

- [ ] **Step 11: Commit foundation**

```bash
git add src/components/admin/admin-data-page-shell.tsx src/components/admin/admin-sticky-page-bar.tsx src/components/admin/admin-table-card.tsx src/components/admin/admin-table-footer.tsx src/components/admin/admin-table-action-button.tsx src/components/admin/admin-table-styles.ts src/components/admin/admin-shell.tsx src/components/admin/notification-bell.tsx
git commit -m "Create shared admin table shell"
```

### Task 2: Migrate `/admin/donatur` to the shared admin table system

**Files:**
- Modify: `JumatBerkah/src/app/admin/donatur/page.tsx`
- Reuse: `JumatBerkah/src/components/admin/admin-data-page-shell.tsx`
- Reuse: `JumatBerkah/src/components/admin/admin-sticky-page-bar.tsx`
- Reuse: `JumatBerkah/src/components/admin/admin-table-card.tsx`
- Reuse: `JumatBerkah/src/components/admin/admin-table-footer.tsx`
- Reuse: `JumatBerkah/src/components/admin/admin-table-action-button.tsx`
- Reuse: `JumatBerkah/src/components/admin/admin-table-styles.ts`

- [ ] **Step 1: Snapshot current donor page behaviors to preserve**

Checklist:

```txt
Must preserve:
- donor search/filter/sort/page size
- CSV export
- donor detail mode query (`view` / `edit` / `merge`)
- donor action buttons
- summary footer content
- modal/detail behavior
```

- [ ] **Step 2: Replace top intro card with sticky page bar**

In `JumatBerkah/src/app/admin/donatur/page.tsx`, replace intro section with:

```tsx
<AdminDataPageShell>
  <AdminStickyPageBar
    title="Kontak operasional donatur."
    description="Email dan nomor WhatsApp hanya tampil di admin. Total donasi hanya menghitung status settlement agar tidak mencampur pembayaran pending atau gagal."
    actions={null}
  />
```

Import:

```tsx
import { AdminDataPageShell } from "@/components/admin/admin-data-page-shell";
import { AdminStickyPageBar } from "@/components/admin/admin-sticky-page-bar";
import { AdminTableCard } from "@/components/admin/admin-table-card";
import { AdminTableFooter } from "@/components/admin/admin-table-footer";
import { AdminTableActionButton } from "@/components/admin/admin-table-action-button";
import { adminTableStyles } from "@/components/admin/admin-table-styles";
```

- [ ] **Step 3: Wrap donor table area in shared table card**

Replace outer section shell with:

```tsx
<AdminTableCard>
  <TableToolbar filters={filters} />
  {donors.items.length > 0 ? (
    <div>
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
```

Remove ad-hoc `overflow-hidden` on the outer card unless needed for modal safety.

- [ ] **Step 4: Convert donor table headers to sticky shared head cells**

Use:

```tsx
<th className={adminTableStyles.stickyHeadCell}>Donatur</th>
<th className={adminTableStyles.stickyHeadCell}>Kontak</th>
<th className={adminTableStyles.stickyHeadCell}>Settlement</th>
<th className={adminTableStyles.stickyHeadCell}>Label</th>
<th className={adminTableStyles.stickyHeadCell}>Consent WA</th>
<th className={adminTableStyles.stickyHeadCell}>Aktivitas</th>
<th className={adminTableStyles.stickyHeadCell}>Aksi</th>
```

- [ ] **Step 5: Align donor body cells to shared density**

Update donor body cells to use shared density pattern:

```tsx
<td className={adminTableStyles.bodyCell}>...</td>
```

Keep donor-specific inner content unchanged.

- [ ] **Step 6: Convert donor action links to shared compact buttons**

Inside `DonorActionButtons`, replace local link styles with `AdminTableActionButton`:

```tsx
<div className="flex flex-wrap gap-2">
  <AdminTableActionButton
    href={`?${buildDetailHref(query, donorKey, "view")}`}
    ariaLabel="Lihat"
  >
    Lihat
  </AdminTableActionButton>
```

Use same pattern for `Edit` and `Gabungkan`.

- [ ] **Step 7: Move donor page meta into shared footer**

Remove the top meta row:

```tsx
<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 text-sm text-slate-600">
```

and replace bottom footer with shared footer:

```tsx
<AdminTableFooter
  page={donors.page}
  totalPages={donors.totalPages}
  hrefBuilder={(page) => buildPageHref(pageQuery, page)}
  totalLabel={`Total ${donors.total} donatur`}
/>
```

Add helper:

```tsx
function buildPageHref(query: URLSearchParams, page: number) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  return nextQuery.toString();
}
```

- [ ] **Step 8: Keep empty state in shared tone**

Use:

```tsx
<div className={adminTableStyles.emptyState}>
  Belum ada donatur yang cocok dengan filter ini.
</div>
```

- [ ] **Step 9: Run lint for donor page**

Run:

```bash
npx eslint src/app/admin/donatur/page.tsx --max-warnings 999
```

Expected: PASS.

- [ ] **Step 10: Manually verify donor page**

Check in browser:

```txt
- sticky page bar sits below admin header
- sticky donor table header stays visible on scroll
- donor action buttons match donation page compact style
- detail modal open/view/edit/merge still works
- CSV export still downloads
- no overlap with notification bell popover
```

- [ ] **Step 11: Commit donor migration**

```bash
git add src/app/admin/donatur/page.tsx
git commit -m "Align donor admin table layout"
```

### Task 3: Migrate `/admin/pengeluaran` and its table manager

**Files:**
- Modify: `JumatBerkah/src/app/admin/pengeluaran/page.tsx`
- Modify: `JumatBerkah/src/app/admin/pengeluaran/expense-manager.tsx`
- Reuse: shared admin table components from Task 1

- [ ] **Step 1: Preserve expense-specific behaviors**

Checklist:

```txt
Must preserve:
- category tabs
- expense form create/edit/delete
- main expense table
- import preview table
- summary footer metrics
- existing server data flow from `getAdminExpenses`
```

- [ ] **Step 2: Replace expense intro hero with sticky page bar**

In `JumatBerkah/src/app/admin/pengeluaran/page.tsx`, use:

```tsx
<AdminDataPageShell>
  <AdminStickyPageBar
    title="Kelola pengeluaran program."
    description="Catat bahan makanan, beras, gas, kemasan, transportasi, dan operasional lain. Semua perubahan masuk audit log dan langsung memengaruhi laporan publik."
    actions={null}
  />
```

Keep `AdminTopTabs` below it.

- [ ] **Step 3: Replace expense table shell with shared card**

Wrap main expenses area with:

```tsx
<AdminTableCard>
  <TableToolbar filters={filters} />
  <div className="p-0">
    <ExpenseManager ... />
  </div>
```

Remove `AdminSummaryFooter` from this page once shared footer takes over totals.

- [ ] **Step 4: Simplify expense toolbar to match donation rhythm**

Inside `TableToolbar`, remove top-level sort/page-size clutter from the first visual row by grouping fields in the same compact grid. Keep all existing fields, but use `lg:grid-cols-12` and spans mirroring `/admin/donasi`.

Target grid:

```tsx
<form className="grid gap-3 border-b border-slate-100 bg-white p-5 lg:grid-cols-12">
```

Map fields:
- `q` → `lg:col-span-3`
- `category` → `lg:col-span-2`
- `from` → `lg:col-span-2`
- `to` → `lg:col-span-2`
- `sort` → `lg:col-span-1`
- `direction` → `lg:col-span-1`
- `pageSize` → `lg:col-span-1`
- `button` stays natural width below/inline if grid wrap needed

- [ ] **Step 5: Convert expense list table headers/cells to shared style**

In `JumatBerkah/src/app/admin/pengeluaran/expense-manager.tsx`, update main table:

```tsx
<thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
  <tr>
    <th className={adminTableStyles.stickyHeadCell}>Tanggal</th>
    <th className={adminTableStyles.stickyHeadCell}>Kategori</th>
    <th className={adminTableStyles.stickyHeadCell}>Deskripsi</th>
    <th className={adminTableStyles.stickyHeadCell}>Nominal</th>
    <th className={adminTableStyles.stickyHeadCell}>Aksi</th>
  </tr>
</thead>
```

Use `adminTableStyles.bodyCell` for cells where possible.

- [ ] **Step 6: Convert expense action buttons to shared compact actions**

In `ExpenseManager`, replace local button/link classes for edit/delete/actions with `AdminTableActionButton`-aligned styling. If action is a `<button>`, mirror class from `adminTableStyles.compactAction` directly.

Example:

```tsx
<button
  type="button"
  className={adminTableStyles.compactAction}
  onClick={() => onEdit(expense)}
>
  Edit
</button>
```

- [ ] **Step 7: Restyle import preview table into the same design dialect**

In `ImportPreviewTable`, keep non-sticky table but align:

```tsx
<div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
```

Use same head typography and cell density. Keep preview-specific logic unchanged.

- [ ] **Step 8: Replace expense footer with shared footer**

In `page.tsx`, replace local footer with:

```tsx
<AdminTableFooter
  page={expenses.page}
  totalPages={expenses.totalPages}
  hrefBuilder={(page) => buildPageHref(pageQuery, page, filters.pageSize)}
  totalLabel={`Total ${expenses.total} pengeluaran`}
/>
```

Add helper:

```tsx
function buildPageHref(query: URLSearchParams, page: number, pageSize: number) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  nextQuery.set("pageSize", String(pageSize));
  return nextQuery.toString();
}
```

- [ ] **Step 9: Run lint for expense files**

Run:

```bash
npx eslint src/app/admin/pengeluaran/page.tsx src/app/admin/pengeluaran/expense-manager.tsx --max-warnings 999
```

Expected: PASS.

- [ ] **Step 10: Manually verify expense page**

Check in browser:

```txt
- sticky page bar looks like donation page
- expense table header sticks cleanly
- import preview visually matches same system
- edit/delete/create still works
- category tabs still work
- one primary page scroll only
```

- [ ] **Step 11: Commit expense migration**

```bash
git add src/app/admin/pengeluaran/page.tsx src/app/admin/pengeluaran/expense-manager.tsx
git commit -m "Align expense admin table layout"
```

### Task 4: Migrate `/admin/audit` and `/admin/persetujuan` into the shared admin data system

**Files:**
- Modify: `JumatBerkah/src/app/admin/audit/page.tsx`
- Modify: `JumatBerkah/src/app/admin/persetujuan/page.tsx`
- Reuse: shared admin table components from Task 1

- [ ] **Step 1: Preserve audit and approval page special behaviors**

Checklist:

```txt
Must preserve audit page:
- filters
- expandable details
- JSON before/after blocks
- read-only semantics

Must preserve approvals page:
- pending approvals list
- recent approval timeline
- progress bar
- audit link CTA
- read-only semantics
```

- [ ] **Step 2: Convert audit intro card to sticky page bar**

In `JumatBerkah/src/app/admin/audit/page.tsx`, replace top intro block with:

```tsx
<AdminDataPageShell>
  <AdminStickyPageBar
    title="Jejak perubahan sistem."
    description="Lihat aktivitas operasional penting secara read-only. Data audit tidak bisa diubah dari halaman ini."
    actions={null}
  />
```

- [ ] **Step 3: Convert audit card shell and footer to shared components**

Use:

```tsx
<AdminTableCard>
  <AuditToolbar ... />
```

Replace local top meta line and old footer with:

```tsx
<AdminTableFooter
  page={logs.page}
  totalPages={logs.totalPages}
  hrefBuilder={(page) => withPageHref(pageQuery, page, filters.pageSize)}
  totalLabel={`Total ${logs.total} log audit`}
/>
```

Add helper:

```tsx
function withPageHref(query: URLSearchParams, page: number, pageSize: number) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.set("page", String(page));
  nextQuery.set("pageSize", String(pageSize));
  return nextQuery.toString();
}
```

- [ ] **Step 4: Align audit toolbar rhythm to donation standard**

Refactor `AuditToolbar` to `lg:grid-cols-12` with compact field spans matching donation/expense pages. Keep all existing fields and options.

- [ ] **Step 5: Make audit list feel like table-system, not custom island**

Keep `<details>` interaction, but wrap each summary row in table-like spacing/hierarchy:

```tsx
<details key={log.id} className="group border-b border-slate-100 px-4 py-4 open:bg-slate-50/70">
```

Keep JSON blocks, but align heading/body spacing to page system.

- [ ] **Step 6: Convert approvals page top intro to sticky page bar**

In `JumatBerkah/src/app/admin/persetujuan/page.tsx`, use:

```tsx
<AdminDataPageShell>
  <AdminStickyPageBar
    title="Pantau approval besar."
    description="Daftar ini read-only. Approval tetap berjalan lewat tombol Telegram multi-admin supaya guard yang sudah ada tetap konsisten."
    actions={null}
  />
```

- [ ] **Step 7: Wrap both approval sections with shared visual grammar**

Keep two sections, but ensure both use `AdminTableCard` and same internal heading spacing, empty state tone, and footer/action rhythm.

First section shell:

```tsx
<AdminTableCard>
  <div className="border-b border-slate-100 p-5">
```

Second section shell same pattern.

- [ ] **Step 8: Align approvals rows and CTA button style**

Update pending/recent rows to use the same density rhythm as table rows (`p-4` or `p-5`, consistent text hierarchy). Replace bottom CTA with compact action/button grammar if it feels oversized.

Target CTA class:

```tsx
className="inline-flex h-10 items-center justify-center rounded-xl bg-green-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
```

- [ ] **Step 9: Run lint for audit and approvals**

Run:

```bash
npx eslint src/app/admin/audit/page.tsx src/app/admin/persetujuan/page.tsx --max-warnings 999
```

Expected: PASS.

- [ ] **Step 10: Manually verify audit and approvals**

Check in browser:

```txt
- audit page now feels same family as donation page
- expand/collapse still works
- approvals sections feel same system despite hybrid layout
- progress bar still renders correctly
- audit CTA still routes correctly
- sticky/layering doesn’t cover notification popover
```

- [ ] **Step 11: Update implementation tracker and commit final migration**

Update `JumatBerkah/IMPLEMENTATION_PLAN.md` with:
- current work log entry
- progress summary
- validation commands run

Then commit:

```bash
git add src/app/admin/audit/page.tsx src/app/admin/persetujuan/page.tsx IMPLEMENTATION_PLAN.md
git commit -m "Standardize admin table pages"
```

---

## Self-Review

### Spec coverage
- `/admin/donatur` covered in Task 2.
- `/admin/pengeluaran` + preview import covered in Task 3.
- `/admin/audit` covered in Task 4.
- `/admin/persetujuan` covered in Task 4.
- hybrid reusable layer covered in Task 1.
- sticky/layering and notification overlap guard covered in Task 1 and manual verification steps.
- no business logic/payment/webhook changes preserved in all tasks.

### Placeholder scan
- No `TODO`, `TBD`, or “similar to previous” placeholders.
- Every task names exact files and commands.
- Code steps contain concrete snippets.

### Type consistency
- Shared component names are consistent across tasks:
  - `AdminDataPageShell`
  - `AdminStickyPageBar`
  - `AdminTableCard`
  - `AdminTableFooter`
  - `AdminTableActionButton`
  - `adminTableStyles`
- Footer helper names are local per page and explicitly defined in each task.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-31-admin-table-system.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
