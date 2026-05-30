# Landing Page Modern Craft Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current flat landing page with a craft-inspired modern Indonesian design (warm cream background, olive green brand, expressive Plus Jakarta Sans display, asymmetric bento sections) while keeping all data sourced from existing helpers.

**Architecture:** Reuse `src/lib/landing.ts` for data. Replace existing landing components with redesigned variants under `src/components/landing/`. Add scoped CSS tokens for craft palette in `src/app/globals.css` (no clash with admin tokens). Keep `/admin` untouched.

**Tech Stack:** Next.js App Router, React server components, TypeScript, Tailwind CSS, Plus Jakarta Sans + Inter via Google Fonts.

---

## Design tokens (scoped to landing only)

Add to `src/app/globals.css` under a new selector `.landing-craft` so they don’t leak into `/admin`:

- `--craft-cream: #f7f1e6`
- `--craft-cream-strong: #ede3cc`
- `--craft-ink: #0f2a1f`
- `--craft-leaf: #1f5d3f`
- `--craft-leaf-strong: #14432d`
- `--craft-amber: #e0a458`
- `--craft-paper: #fbf8f1`
- `--craft-line: rgba(15, 42, 31, 0.12)`
- `--craft-line-strong: rgba(15, 42, 31, 0.32)`
- font tokens: `--craft-display: "Plus Jakarta Sans", system-ui`, `--craft-body: "Inter", system-ui`.
- helper class `.landing-noise` adds an SVG noise background.

Dark mode override: when `html.dark .landing-craft` apply darker olive bg `#0d1f17`, ink `#f7f1e6`, leaf `#86d8a8`. Keep contrast AA.

Utility classes added once:

- `.craft-card` rounded-2xl border `1px solid var(--craft-line)` bg `var(--craft-paper)` shadow `0 12px 24px -16px rgba(15,42,31,0.18)`.
- `.craft-pill` rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] bg `rgba(224,164,88,0.18)` text amber-900.
- `.craft-num` `font-feature-settings: "tnum"; letter-spacing: -0.02em`.

## Tasks

### Task 1: Craft tokens + fonts

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [x] **Step 1: Add craft tokens**

Append a `.landing-craft` block + utilities (`.craft-card`, `.craft-pill`, `.craft-num`, `.landing-noise`) and dark-mode override.

- [x] **Step 2: Load fonts**

Use `next/font/google` for `Plus_Jakarta_Sans` (weights 400/600/700/800, subsets latin) and `Inter` (weights 400/500/600). Expose CSS variables `--font-display` and `--font-body` on `<html>`.

### Task 2: Section components (replace existing)

**Files:**
- Modify: `src/components/landing/landing-hero.tsx`
- Modify: `src/components/landing/landing-target-progress.tsx`
- Modify: `src/components/landing/landing-how-it-works.tsx`
- Modify: `src/components/landing/landing-stories.tsx`
- Modify: `src/components/landing/landing-transparency.tsx`
- Modify: `src/components/landing/landing-faq.tsx`
- Modify: `src/components/landing/landing-footer.tsx`

- [x] **Step 1: Hero (asymmetric bento)**

Left column (lg:col-span-7): kicker line + dot, h1 display dengan kata `nasi Jumat` italic, paragraph singkat, CTA primary `Donasi Sekarang` (leaf bg, ink text, amber underline) + secondary `Lihat Cerita`. Right column (lg:col-span-5) `craft-card` cream-strong: chip period, tiga KPI angka besar pakai `craft-num`, sub-pill % terkumpul.

- [x] **Step 2: Target strip**

Full-width band cream-strong dengan border atas+bawah `--craft-line-strong`. Judul kecil + bar progress hijau (rounded-full). Tiga stat di bawah: Target, Terkumpul, Sisa hari.

- [x] **Step 3: How it works**

3 `craft-card` dengan nomor display italic besar, judul, deskripsi pendek, ikon SVG outline (Lucide via inline SVG to avoid extra deps).

- [x] **Step 4: Stories bento**

Grid `lg:grid-cols-3 lg:grid-rows-2`. Kartu pertama `lg:col-span-2 lg:row-span-2` dengan foto cover dominan, judul display, ringkasan, tanggal pill amber. Dua kartu lain di kolom kanan tumpuk vertikal. Foto pakai `<img loading="lazy">`. Tetap empty state kalau kosong.

- [x] **Step 5: Transparency**

3 `craft-card` ramping. Tiap kartu: judul, deskripsi 1 baris, ikon kecil.

- [x] **Step 6: FAQ**

List `<details>` dengan summary tebal, divider tipis `--craft-line`. Saat open, summary chevron putar (rotate 90deg via class `[&[open]>summary>svg]:rotate-90`).

- [x] **Step 7: Footer**

Latar `--craft-leaf-strong`, teks cream. 3 kolom: brand+description, link Donasi/Laporan/Tentang, catatan privasi singkat. Bagian bawah copyright tahun berjalan dengan garis cream tipis.

### Task 3: Page composition

**Files:**
- Modify: `src/app/page.tsx`

- [x] **Step 1: Wrap landing-craft**

Root wrapper `<div className="landing-craft landing-noise min-h-screen">`. Header transparan + nav (Laporan, Tentang, CTA `Donasi`).

- [x] **Step 2: Compose order**

Hero → Target strip → Stories → How it works → Transparency → FAQ → Footer.

- [x] **Step 3: Sticky bottom CTA mobile**

Bar tipis bg `--craft-leaf` text cream `Donasi Sekarang`.

### Task 4: Validate

- [x] **Step 1: Run validation**

Run `npm run lint`, `npm test`, `npm run build`. Manual smoke `http://localhost:3037/` di 375px dan desktop, verifikasi: tipografi display Plus Jakarta Sans muncul, palet krem+olive, kartu rounded-2xl, KPI live, stories bento tampil, sticky CTA hanya di mobile, focus ring terlihat, tanpa horizontal scroll, prefers-reduced-motion menonaktifkan animasi.