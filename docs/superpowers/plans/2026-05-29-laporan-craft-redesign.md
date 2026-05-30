# Laporan Craft Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `/laporan` to match the craft aesthetic (cream + olive + amber + Plus Jakarta Sans) without changing data, filters, exports, donor privacy, or business logic.

**Architecture:** Wrap the existing server component with `landing-craft landing-noise`. Reuse all current data helpers (`getPublicReport`, `parseReportDateRange`, `getWeeklyTargetProgress`, `getPublishedDistributionReportForCurrentCycle`). Re-skin sections using the craft tokens already in `globals.css`. Print stylesheet, export buttons, and filter form remain functional.

**Tech Stack:** Next.js App Router, React server components, TypeScript, Tailwind CSS.

---

## Constraints

- Do not change API routes, schema, payment, or privacy logic.
- Keep existing filter form behaviour: `from`, `to`, `period=jumat`, default empty.
- Keep print stylesheet (`print-hide`, `print:` classes) working so PDF print still succeeds.
- Keep PDF/CSV export buttons (`/api/reports/public/export?format=pdf|csv`).
- Keep donor privacy: never display donor email/phone; reuse `donorName` from server (already public-safe).
- Keep `PrintButton` client component as-is.

## Tasks

### Task 1: Wrap layout in craft shell

**Files:**
- Modify: `src/app/laporan/page.tsx`

- [x] **Step 1: Wrap with landing-craft**

Replace top-level `<main className="page-shell ...">` with `<div className="landing-craft landing-noise min-h-screen">` containing the existing header + sections inside a craft `<main>`. Add header (brand link + nav: Beranda, Laporan, Tentang, CTA Donasi) consistent with `/` and `/tentang`.

- [x] **Step 2: Print stylesheet preserved**

Keep `print:bg-white print:px-0 print:py-0` on `<main>`. Add `print:bg-white` on the wrapper. Verify print classes still hide filter and export buttons via `print-hide`.

### Task 2: Re-skin hero + filter card

**Files:**
- Modify: `src/app/laporan/page.tsx`

- [x] **Step 1: Hero copy**

Replace `panel` block with two-column layout: left column kicker `Laporan Publik`, h1 display dengan kata `transparansi` italic, paragraph singkat. Right column `craft-card-strong` containing the existing form: 2 date inputs, `Terapkan Filter`, `Lihat Siklus Jumat Ini`, plus a 3-button group (`Cetak`, `Unduh PDF`, `Unduh CSV`).

- [x] **Step 2: Form styling**

Use craft inputs: rounded-xl, border `--craft-line-strong`, bg `--craft-paper`, focus ring amber. CTA primary leaf, secondary outline ink.

### Task 3: Re-skin distribution & target cards

**Files:**
- Modify: `src/app/laporan/page.tsx`

- [x] **Step 1: Distribution story card**

Wrap the existing distribution block in `craft-card`. Title `craft-num` italic optional, pills for periode/lokasi/paket. Foto thumbnails in 3-column grid with `aspect-[16/10]` and rounded-2xl.

- [x] **Step 2: Friday target card**

Use `craft-card-strong` with progress bar gradient (`linear-gradient(--craft-leaf, --craft-amber)`) consistent with landing target strip.

### Task 4: Re-skin summary + lists + chart + timeline

**Files:**
- Modify: `src/app/laporan/page.tsx`

- [x] **Step 1: Summary cards**

4 `craft-card` summary kotak dengan `craft-num` numerik besar dan label kicker. Pertahankan grid 2/4 kolom.

- [x] **Step 2: Donations & expenses panels**

Reuse existing data, ganti `panel` jadi `craft-card`. Rows divider tipis `--craft-line`. Tipografi sesuai craft. Pertahankan empty state.

- [x] **Step 3: Expense category chart**

Ganti `panel` jadi `craft-card-strong`. Bar progress pakai gradient olive/amber. Persentase tetap dihitung dari `report.expenseCategories`.

- [x] **Step 4: Timeline transparency**

`craft-card` dengan setiap item rounded-2xl bg `--craft-paper`. Label tipe + tanggal pakai pill amber kecil.

### Task 5: Validate

- [x] **Step 1: Run validation**

Run `npm run lint`, `npm test`, `npm run build`. Manual smoke `http://localhost:3037/laporan`, `http://localhost:3037/laporan?period=jumat`, dan filter `from`/`to`. Pastikan PDF dan CSV export tetap mendownload, tombol cetak menampilkan layout A4 yang bersih, dan tidak ada nilai donor privat (email/phone) tampil di publik.