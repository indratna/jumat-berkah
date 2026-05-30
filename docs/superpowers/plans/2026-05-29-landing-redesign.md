# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/` so it shares the admin dashboard visual language (slate/green tokens, rounded-xl cards, soft shadows, tabular numbers) while improving content with live KPI, weekly cycle progress, distribution stories, transparency principles, and FAQ.

**Architecture:** Keep `/` as a server component that reads live data via existing helpers (`getCurrentFridayCycleReport`, `getWeeklyTargetProgress`, `getPublishedDistributionReportsForLanding`, `getLandingMetrics`). Replace the current single-card layout with composable section components: `LandingHero`, `LandingTargetProgress`, `LandingHowItWorks`, `LandingStories`, `LandingTransparency`, `LandingFaq`, `LandingFooter`. Use the same Tailwind tokens, spacing, and rounded-xl/border-slate-200 patterns as `/admin`.

**Tech Stack:** Next.js App Router, React server components, TypeScript, Tailwind CSS.

---

## Design language reused from admin dashboard

- Surface: `rounded-xl border border-slate-200 bg-white shadow-sm` for primary cards, `rounded-lg border border-slate-200 bg-slate-50` for inset blocks.
- Section headings: `text-xs font-semibold uppercase tracking-[0.14em] text-green-700` kicker, then `text-xl sm:text-2xl font-bold tracking-tight text-slate-950`.
- Body text: `text-sm text-slate-500` (muted), `text-slate-600/700` for paragraph.
- Numerik: `font-variant-numeric: tabular-nums` (`numeric` utility) untuk semua angka donasi.
- Brand color: `text-green-700`, hover `text-green-800`. Warning amber, danger rose, sesuai admin.
- Spacing: 16/20/24 untuk inner card, 24/32/40 untuk section gap.
- Buttons: primary `bg-green-700 hover:bg-green-800 text-white min-h-11`; secondary `border-slate-200 bg-white text-slate-700`.
- Icons: tetap pakai SVG sederhana atau character minimal (sesuai sidebar admin) untuk konsistensi MVP.
- Mobile-first; max width section `max-w-6xl`.
- Dark mode: gunakan token yang sama dengan admin (`dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50`).

## Tasks

### Task 1: Landing data helpers

**Files:**
- Create: `src/lib/landing.ts`

- [x] **Step 1: Add helpers**

Expose `getLandingMetrics()` returning current Friday cycle report summary (income, expenses, balance, period label, lastUpdated), and `getLandingStories()` returning up to 3 published `DistributionReport` rows (cycleStart, title, summary, photoUrls[0]). Reuse `getCurrentFridayCycleReport` and Prisma queries already used in `/laporan`. Hide donor private fields by reusing `getPublicDonorName`.

### Task 2: Section components

**Files:**
- Create: `src/components/landing/landing-hero.tsx`
- Create: `src/components/landing/landing-target-progress.tsx`
- Create: `src/components/landing/landing-how-it-works.tsx`
- Create: `src/components/landing/landing-stories.tsx`
- Create: `src/components/landing/landing-transparency.tsx`
- Create: `src/components/landing/landing-faq.tsx`
- Create: `src/components/landing/landing-footer.tsx`

- [x] **Step 1: Hero**

Server component receives `metrics` and renders kicker, h1, subjudul, primary CTA `Donasi Sekarang`, secondary CTA `Lihat Laporan`, dan 3 KPI cells (Pemasukan siklus, Pengeluaran siklus, Saldo program) menggunakan tokens admin (rounded-xl, border-slate-200, tabular-nums).

- [x] **Step 2: Target progress**

Receives `progress` (target, terkumpul, percent, sisa hari). Render bar progress hijau dengan ring slate-200, kapped 100%. Tampilkan periode siklus.

- [x] **Step 3: How it works**

3 langkah ringkas dengan ikon angka 1/2/3 dalam kotak bulat slate-100. Salin gaya quick action admin dashboard.

- [x] **Step 4: Stories**

Maks 3 kartu cerita penyaluran. `next/image` aspect-ratio 16/9, `loading="lazy"`. Judul + tanggal + ringkasan + link ke `/laporan?period=jumat`.

- [x] **Step 5: Transparency**

3 kartu fitur: Laporan publik real-time, Privasi donatur, Audit lengkap. Pakai pattern card admin.

- [x] **Step 6: FAQ**

List 4 pertanyaan dalam `<details>` semantik (built-in accessible) dengan styling sama: rounded-lg border slate-200 bg-white.

- [x] **Step 7: Footer**

`Jumat Berkah Karyo`, deskripsi singkat, link `Donasi`, `Laporan`, `Tentang`, copyright tahun berjalan. Gunakan `border-t border-slate-200`.

### Task 3: Landing page composition

**Files:**
- Modify: `src/app/page.tsx`

- [x] **Step 1: Compose sections**

Ubah `Home` jadi async server component. Ambil `metrics`, `progress`, `stories` di server lalu render section dalam urutan: Hero → Target → How it works → Stories → Transparency → FAQ → Footer. Hapus nav lokal yang ada; pakai header tipis di Hero.

- [x] **Step 2: Sticky mobile CTA**

Di bawah main, tambah `<div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">` berisi tombol primary `Donasi Sekarang`. Pastikan padding bawah konten utama agar tidak tertutup.

### Task 4: Validate

- [x] **Step 1: Validate**

Run `npm run lint`, `npm test`, `npm run build`. Manual smoke `http://localhost:3037/` di 375px dan desktop, verifikasi: KPI live, target progress, cerita muncul kalau ada, FAQ accordion, footer link aktif, sticky CTA hanya di mobile, tidak ada horizontal scroll. Tidak ada nilai donor privat di publik.
