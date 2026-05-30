# Implementation Plan — Jumat Berkah

## 1. Purpose

Dokumen ini adalah checklist eksekusi dan progress tracker untuk membangun aplikasi Jumat Berkah dengan bantuan AI builder/vibe coder.

AI harus bekerja per fase. Jangan loncat fase. Jangan menandai selesai sebelum acceptance criteria dan validation pass.

## 2. Progress Tracker

### Current Status

Current Phase: Phase 43 — Donor Auth & Session Hygiene  
Overall Progress: 100%  
Last Updated: 2026-05-30  
Current Focus: Phase 43 implemented for optional donor auth banner, signup/check-email flow, verified-email guest donation linking, status-page signup CTA, and admin-safe `/donasi` session hygiene. Automated validation passed; manual browser smoke still needs interactive confirmation.
Blockers: Live provider smoke remains required: Telegram public channel broadcast needs `TELEGRAM_PUBLIC_CHANNEL_ID=-100...` plus bot admin/post permission; production `BETTER_AUTH_SECRET` must be high entropy; Midtrans live QRIS and WhatsApp live send need provider credentials/templates; backup/restore production evidence remains required before stable launch.

### Phase Progress

| Phase | Name | Status | Progress |
|---|---|---|---|
| Phase 0 | Project Setup | Done | 100% |
| Phase 1 | Database Foundation | Done | 100% |
| Phase 2 | Public Landing & Donation Form | Done | 100% |
| Phase 3 | Midtrans Payment | Done | 100% |
| Phase 4 | Midtrans Webhook | Done | 100% |
| Phase 5 | Public Report | Done | 100% |
| Phase 6 | Admin Auth | Done | 100% |
| Phase 7 | Admin Dashboard | Done | 100% |
| Phase 8 | Expense Management | Done | 100% |
| Phase 9 | Optional Donor Login | Done | 100% |
| Phase 10 | Export, QA, Deploy | Done | 100% |
| Phase 11 | Telegram Bot Foundation, Donation Notif & Cloudflare | Done | 100% |
| Phase 12 | Telegram Admin Read Commands | Done | 100% |
| Phase 13 | Telegram Admin Write Commands | Done | 100% |
| Phase 14 | Telegram Scheduled Jobs & Alerts | Done | 100% |
| Phase 15 | Telegram Photo Receipt & Approval | Done | 100% |
| Phase 16 | Telegram Donor Self-Service | Done | 100% |
| Phase 17 | Telegram Public Bot & Broadcast | Done | 100% |
| Phase 18 | Operational & Security Alerts | Done | 100% |
| Phase 19 | Admin UX Redesign | Done | 100% |
| Phase 20 | Deployment Ops Hardening | Done | 100% |
| Phase 21 | Backup & Restore Automation | Done | 100% |
| Phase 22 | Better Auth Migration | Done | 100% |
| Phase 23 | Profile, Password & Account Management | Done | 100% |
| Phase 24 | Email Notifications | Done | 100% |
| Phase 25 | Friday Reporting Cycle | Done | 100% |
| Phase 26 | Weekly Donation Target | Done | 100% |
| Phase 27 | Distribution Story & Photo Report | Done | 100% |
| Phase 28 | Public Transparency Enhancements | Done | 100% |
| Phase 29 | Admin Audit & Approval UI | Done | 100% |
| Phase 30 | Reporting Export Upgrade | Done | 100% |
| Phase 31 | Admin Productivity Tools | Done | 100% |
| Phase 32 | Admin UX & Navigation Cleanup | Done | 100% |
| Phase 33 | Admin Donor Database | Done | 100% |
| Phase 34 | Communication Consent Foundation | Done | 100% |
| Phase 35 | WhatsApp Donation Reminder | Done | 100% |
| Phase 36 | Report Print & Public Report Redesign | Done | 100% |
| Phase 37 | Documentation & Env Setup Guide | Done | 100% |
| Phase 38 | Final QA & Production Readiness Review | Done | 100% |
| Phase 39 | InApp-Inspired UI Refresh | Done | 100% |
| Phase 40 | MVP Launch Readiness Audit | Done | 100% |
| Phase 41 | Dashboard Layout Final Polish | Done | 100% |
| Phase 42 | Donation Checkout UX Enhancement | Done | 100% |
| Phase 43 | Donor Auth & Session Hygiene | Done | 100% |
| Phase 44 | Targeted Refactor | Not Started | 0% |
| Phase 45 | Stable MVP Launch Validation | Not Started | 0% |

Status values:

```txt
Not Started
In Progress
Blocked
Done
```

## 3. Work Log

### 2026-05-30

- Refined Admin Donor Management table actions. Renamed donor table `Detail` column to `Aksi`, split donor modal into three focused actions (`Lihat`/eye for read-only summary, `Edit`/pencil for profile management, `Gabungkan`/link for duplicate merge), and kept existing donor management APIs/payment/webhook/donation fields unchanged. Validation passed: `npm run lint`, `npm test` (121/121), `npm run build`.

- Implemented Admin Donor Management Phase 2 — Donor Merge. Added confirmation-gated donor merge validation, admin-only merge API, merge UI in donor detail, duplicate profile hiding through `mergedIntoId`, label/note metadata merge, and `donor.merged` audit logs. Merge only updates `DonorProfile` metadata and does not mutate donation amount/status/order ID/Midtrans transaction fields, payment flow, webhook behavior, or public report privacy. Validation passed: `npm run lint`, `npm test` (121/121), `npm run build`.

- Implemented Admin Donor Management Phase 1 — Donor CRM Basics. Added `DonorProfile` metadata model/migration separate from `Donation`, donor profile validation/label normalization tests, admin donor profile edit API/UI, WhatsApp consent editing, internal notes, labels, label filtering, filtered CSV export, and audit logs for profile writes/export. Donation amount/status/order ID/Midtrans fields, payment flow, webhook behavior, and public report privacy were not changed. Validation passed: `npm run lint`, `npm test` (120/120), `npm run build`.

- Unified public landing-family headers for `/`, `/tentang`, `/laporan`, and `/donasi` with shared `PublicHeader`, consistent `Laporan`/`Tentang`/`Donasi Sekarang` navigation, and animated desktop active-pill styling. Added TDD coverage for public nav active-state helper. Validation passed: `npm run lint`, `npm test` (117/117), `npm run build`. Manual smoke covered all four pages, active states, CTA links, and mobile header stability.

- Refined `/admin/profil` to match current admin shell instead of donor craft styling. Reused shared initials helper, upgraded hero/summary layout, and kept existing profile update plus password change behavior unchanged. Validation passed: `npm run lint`, `npm test` (116/116), `npm run build`.

- Redesigned donor profile page `/akun/profil` with craft styling to match donor dashboard and public donor flows. Added craft header, personal hero, account summary card, profile edit card, and security card while preserving existing profile update and password change behavior. Added TDD coverage for initials fallback helper. Validation passed: `npm run lint`, `npm test` (116/116), `npm run build`. Manual smoke covered donor profile render, dashboard/back CTA, donor avatar-or-initials fallback, profile update flow, password form render, and anonymous redirect to `/masuk`.

- Implemented donor dashboard craft redesign for `/akun/donasi`. Replaced the old account history table page with a warm craft dashboard: personal salam hero, donor KPI bento, current Friday target aggregate card, Telegram status/link-code card, profile summary, and mobile-first donation history cards. No database schema, payment, webhook, or financial status rules changed. Validation passed: `npm run lint`, `npm test` (115/115), `npm run build`. Manual smoke covered donor session dashboard render, anonymous redirect to `/masuk`, target fallback copy, Telegram unlinked card, and donation card status/detail links in local browser.

- Fixed Phase 43 donor auth modal visual bug after manual review. Root cause: modal is portaled to `document.body`, outside `.landing-craft`, so craft CSS variables/background were missing and the card appeared transparent; page scroll also remained active behind the modal. Added `.landing-craft` scope to the modal overlay, forced a dark overlay background, locked `html`/`body` overflow while modal is open, and hid modal internal scrollbars. Validation passed: `npm run lint`, `npm run build`; browser style check confirmed overlay background `black/75`, solid card background, `body/html` overflow hidden, and no visible internal scrollbar.

- Adjusted Phase 43 donor auth UX after manual review: `/donasi` now opens `Masuk` and `Daftar` in a craft-styled modal instead of navigating away; modal supports Google and email/password flows, switches between masuk/daftar in place, and sends email/password signup to `/cek-email`. Removed the old donor-code login option from `/masuk`, leaving only Google and email/password. `/masuk` and `/daftar` remain fallback direct pages. Validation passed: `npm run lint`, `npm run build`; browser smoke confirmed modal opens on `/donasi`, switches between login/signup, has no nested-form console errors, and `/masuk?next=/donasi` no longer shows donor-code login.

- Adjusted Phase 43 `/masuk` UX after manual review: changed donor login from the older `page-shell`/tabbed layout to the same craft split layout as `/daftar`, with primary `Masuk dengan Google`, email/password login fields visible by default, a `Belum punya akun? Daftar` link, and legacy donor-code login collapsed under a fallback details section. Validation passed: `npm run lint`, `npm run build`; browser snapshot confirmed `/masuk?next=/donasi` matches `/daftar` visual system.

- Adjusted Phase 43 `/donasi` UX after manual review: moved the `Akun donatur` login/signup box inside the `Isi data singkat` donation form card, directly below nominal selection, while preserving anonymous/donor/admin banner variants and donor prefill rules. Validation passed: `npm run lint`, `npm run build`; browser snapshot confirmed placement below nominal on `http://localhost:3037/donasi`.

- Completed Phase 43 — Donor Auth & Session Hygiene. Added `/donasi` donor auth banner with anonymous, logged-in donor, and admin-hidden variants; admin resolution now runs before donor resolution so admin sessions do not receive donor banner or donor prefill. Added `/daftar` donor signup page, `/cek-email` verification handoff page, `/masuk?email=&next=` support, Better Auth required email verification, Indonesian verification email template, verified-email guest donation linking, and `/donasi/status/[orderId]` signup CTA that never exposes donor phone. Payment, webhook, and financial status rules were not changed. Validation passed: `npm run lint`, `npm test` (109/109), and `npm run build` after starting local `jumat-berkah-postgres`; build still warns local `BETTER_AUTH_SECRET` is low entropy. Manual browser smoke completed on `localhost:3037`: anonymous `/donasi` shows auth choices and empty form; donor cookie `/donasi` shows active donor banner and prefills name/email; admin cookie `/donasi` hides donor banner and keeps donor fields empty; `/daftar` renders Google/email signup with query prefill; `/cek-email` renders verification instructions; `/masuk?email=&next=` prefills email; email/password signup redirects to `/cek-email`; unverified email login is blocked with Indonesian copy; guest status page shows signup CTA without phone; donor status page hides CTA; local disposable orphan donation was attached to donor account and appeared in `/akun/donasi`; Snap popup still opens Midtrans sandbox iframe after anonymous donation submit.

- Approved and planned Phase 43 — Donor Auth & Session Hygiene. Scope moves the donor-auth banner, donor signup page, email verification, post-donation signup CTA, verified-email donation linking, and admin-safe `/donasi` session handling into Phase 43. Detailed design lives in `docs/superpowers/specs/2026-05-30-donor-auth-on-donation-page-design.md`; implementation plan lives in `docs/superpowers/plans/2026-05-30-donor-auth-on-donation-page.md`. No application code for this feature has been changed yet.

- Manual sandbox Snap popup smoke for Phase 42 completed on `localhost:3037`. Tes 1 popup happy path: popup Midtrans muncul inline tanpa redirect, simulator QRIS sandbox membayar order `JB-20260530-E2FCD17D`, browser navigate ke `/donasi/status/JB-20260530-E2FCD17D`, status tetap `pending` karena webhook tidak menjangkau localhost (perilaku benar; client callback tidak boleh memutuskan settlement). Tes 2 popup close tanpa bayar: order `JB-20260530-9BC9495F`, popup ditutup, browser navigate ke status page, status `pending`. Tes 3 fallback redirect: `snap.js` di-block dari DevTools, submit form mengarahkan donor ke `https://app.sandbox.midtrans.com/snap/v4/redirection/...` lewat `redirectUrl`. Tes 4 server key tidak bocor: pencarian `Mid-server-...` dan `Mid-client-...` di `.next/static` dan `.next/server/app` keduanya kosong; jaminan Next.js bahwa env tanpa prefix `NEXT_PUBLIC_` tidak masuk client bundle dikonfirmasi. Tambahan: `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` ditambahkan ke `.env.local` setempat dengan value mirror dari `MIDTRANS_CLIENT_KEY`. Phase 42 acceptance criteria semuanya lulus.

- Phase 42 smoke test menemukan satu kasus session hygiene yang berada di luar scope Phase 42: admin yang juga login lewat Better Auth dengan email pribadi yang kebetulan terdaftar sebagai `donor` di tabel `users` mendapat blok prefill "Masuk sebagai ..." pada `/donasi`. Logic resolve donor pada `src/app/donasi/page.tsx` (`getDonorUser` legacy + `getBetterAuthDonorUser`) tidak menyaring kasus ini. Issue dicatat untuk dikerjakan di Phase 43 sebagai bagian dari session hygiene/admin guard fix; bukan bug Phase 42 dan bukan regresi karena logic prefill itu pre-existing.

- Implemented Phase 42 — Donation Checkout UX Enhancement. Added `src/app/donasi/snap-types.ts` with browser Snap typings (`DonationPaymentHandoff`, `SnapCallbackKind`, `SnapPayOptions`, `SnapWindow`) and `src/app/donasi/snap-checkout.ts` with pure helpers `buildDonationStatusUrl`, `resolveSnapCallbackDestination`, `canUseSnapPopup`, `resolveFallbackRedirect`. Helpers locked in by 3 unit tests in `src/tests/donation-checkout.test.ts` covering callback navigation always pointing to `/donasi/status/[orderId]`, popup availability requiring both `snapToken` and `window.snap.pay`, and redirect-fallback ordering. Added `src/app/donasi/midtrans-snap-script.tsx` (`"use client"`) that mounts `next/script` with `strategy="afterInteractive"` for sandbox/production Snap script and renders nothing when client key is missing. `src/app/donasi/page.tsx` now reads `process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` and `process.env.MIDTRANS_IS_PRODUCTION` server-side and passes them as props to `MidtransSnapScript`, so the browser never reads the server-only production flag directly. `src/app/donasi/donation-form.tsx` now prefers `window.snap.pay(snapToken, ...)` after `/api/donations` succeeds: `onSuccess`, `onPending`, `onError`, and `onClose` only navigate to `/donasi/status/[orderId]` and never mutate donation status; redirect to `payment.redirectUrl` is kept as a safe fallback when Snap script or `window.snap.pay` is unavailable. No backend change: `/api/donations`, Midtrans helper, webhook, status mapping, and donor privacy rules untouched. Synced canonical docs: `PRD.md` § 8.3 + § 21.19, `TECHNICAL_SPEC.md` § 9.1 + § 9.2 + § 15.18, and `docs/ENV_SETUP.md` Midtrans table now describe Snap-popup-with-fallback flow and the new browser-safe `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` env. Added `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-your-client-key"` placeholder to `.env.example`. Validation passed: `npm run lint`, `npm test` (101/101), `npm run build` (after starting `jumat-berkah-postgres` Docker container — pre-existing requirement). Manual sandbox Snap popup smoke deferred until live `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` and sandbox QRIS run are available; redirect-only fallback path confirmed by code review and unit tests.

### 2026-05-29

- Added roadmap decision for checkout UX improvement before launch blocker work. Inserted new `Phase 42 — Donation Checkout UX Enhancement` focused on optional Midtrans Snap popup handoff with fallback-safe payment UX, then shifted later phases so security/blocker work becomes Phase 43, targeted refactor becomes Phase 44, and stable MVP launch validation becomes Phase 45. Synced the same roadmap direction into `PRD.md` and `TECHNICAL_SPEC.md`. No application code, payment rules, webhook behavior, or provider configuration changed in this planning update.

- Redesigned public `/donasi` to match the craft landing-page family used by `/`, `/tentang`, and `/laporan`. Replaced the old utility shell with the public craft shell/header, added an editorial hero with trust points and a transparency link, restyled `DonationForm` into a craft card with cream/olive/amber controls, and added a small reassurance strip below the form. `src/app/donasi/page.tsx` still resolves optional donor session prefill, and `src/app/donasi/donation-form.tsx` keeps the same field set, submit handler, request payload, anonymous/public-name behavior, WhatsApp consent logic, error rendering, and Midtrans redirect flow. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Fixed Phase 41 admin dark-mode hydration mismatch on `/admin`. Root cause: `ThemeToggle` read `localStorage` inside the client initial state while server rendered light-mode button text/labels, causing React hydration mismatch when saved theme was dark. Reworked theme state to use `useSyncExternalStore` with a stable server snapshot and client storage subscription, keeping first hydration render consistent while still persisting `admin-theme`. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Fixed admin dark-mode toggle not visibly changing full UI. Root cause: Tailwind v4 dark variant was not explicitly mapped to `html.dark`, and several admin surfaces relied on light utility classes. Added `@custom-variant dark (&:where(.dark, .dark *));` plus global dark overrides for common admin backgrounds, rings, borders, and semantic text tones. Manual browser verification on `http://localhost:3037/admin?from=2026-02-28&to=2026-05-29` confirmed toggle changes `html.dark`, persists `admin-theme`, and updates sidebar/body/card backgrounds. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Adjusted admin sidebar/header layout per review. Dashboard is now a direct sidebar link instead of an expandable group, and the sidebar collapse/expand control moved from the sidebar body into the admin header beside `Jumat Berkah Karyo` as an icon-only button. Added `AdminShell` client wrapper to own sidebar expanded state while keeping `AdminLayout` server-side for auth/notifications. Updated admin navigation reachability test. Manual browser verification on `/admin` confirmed no Dashboard expand button and header toggle changes sidebar width from 252px to 84px. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Replaced admin dashboard date range sliders with a calendar-style range picker placed on the right side of the dashboard hero header. Picker shows compact start/end summary, opens a two-month desktop calendar popover, highlights selected ranges, supports month navigation, and updates `from`/`to` only when `Terapkan` is clicked; `Reset` restores the default 90-day range. Fixed local date formatting to avoid timezone off-by-one URL dates. Manual browser verification confirmed selecting 20 Mar 2026 through 29 May 2026 updates URL to `/admin?from=2026-03-20&to=2026-05-29`. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Fixed dashboard calendar picker clipping and removed the `Periode Dashboard` title from the picker trigger. Root cause: the dashboard hero card still used `overflow-hidden`, which clipped the absolute calendar popover. Manual browser check confirmed card overflow is visible, popup is fully within viewport, and visible date buttons are not clipped. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Refined dashboard calendar picker interaction and spacing after title removal. Removed the leftover empty title row by placing the dropdown arrow absolutely in the trigger, removed the small `pilih` text from every day cell, and added clear popover guidance that changes between `Pilih tanggal mulai` and `Pilih tanggal akhir` so selected dates are visibly reflected immediately. Manual browser check confirmed clicking `10 Mar 2026` highlights the date and updates the picker guidance/range. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Added preset dropdown to dashboard date picker: `Hari Ini`, `7 Hari`, `30 Hari`, `Bulan Ini`, `Bulan Lalu`, `Custom`. Trigger now pairs the preset selector with a calendar range button that shows formatted `dd Mmm yyyy - dd Mmm yyyy`. Selecting a non-`Custom` preset immediately updates the URL `from`/`to`. Selecting `Custom` opens the calendar popover so admin can pick a manual range. Manual browser check on `/admin?from=2026-05-01&to=2026-06-30` confirmed `7 Hari` updates URL to `/admin?from=2026-05-23&to=2026-05-29`, the range button reflects the active range, and `Custom` opens the calendar. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Hid the dashboard calendar range button unless the preset selector is `Custom`, and added a `Hari Ini` button next to `Reset` inside the popover that sets only the end date to today (clamping start to today if it would otherwise be after today). Tracked the active preset in component state so it stays accurate when admin switches between preset and custom selections. Manual browser check on `/admin?from=2026-05-23&to=2026-05-29` confirmed the range button is hidden for `7 Hari`, switching to `Custom` reveals the range button and opens the calendar with `Reset`, `Hari Ini`, and `Terapkan`. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Added admin-only system settings status page at `/admin/pengaturan/sistem`. Server-rendered helper `getSystemSettings()` reads `process.env` and returns sanitized `ok/missing/warning` rows grouped by Aplikasi, Database, Midtrans, Telegram, Email, WhatsApp, and Cron & Ops. The UI never receives token, secret, or chat id values: secrets show only `Aktif`/`Belum diatur`, `ADMIN_EMAIL` is masked, and `BETTER_AUTH_SECRET` shows `Perlu perhatian` when shorter than 32 characters. Added sidebar link `Status Sistem` under the `Pengaturan` group and updated admin navigation reachability test to include the new route. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Added admin-only profile page at `/admin/profil` so the sidebar `Profil Admin` link stays inside the admin shell instead of jumping to the donor `/akun/profil`. The new server page reuses `getCurrentAccountProfile`, `ProfileForm`, and `PasswordChangeForm`, and redirects non-admin sessions to `/akun/profil`. Sidebar nav updated to point at `/admin/profil` and admin navigation reachability test now expects the new route. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Removed the donor contact note above the sidebar logout button and removed the internal `lg:overflow-y-auto` scroll on the admin sidebar nav so the sidebar no longer shows its own scrollbar at desktop widths.

- Removed the `+`/`−` expand indicators from sidebar group buttons; groups still toggle on click. Restyled the admin `Keluar` button with rose background and `font-extrabold` text to make it stand out.

- Added soft polling for admin notifications. New `GET /api/admin/notifications` returns the same payload as the server-rendered bell, guarded by the existing legacy admin cookie or Better Auth admin check. `NotificationBell` now polls every 30 seconds while the tab is visible, refreshes both the items list and unread count, and pauses when the tab is hidden so the dashboard updates without manual reload while staying inexpensive. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Redesigned public landing page `/` to share the admin dashboard visual language. Added `src/lib/landing.ts` with `getLandingMetrics`, `getLandingProgress`, `getLandingStories` reusing existing reporting helpers and respecting public donor privacy. Built section components `LandingHero`, `LandingTargetProgress`, `LandingHowItWorks`, `LandingStories`, `LandingTransparency`, `LandingFaq`, `LandingFooter`, all using slate/green tokens, rounded-xl borders, tabular numbers, and dark-mode pairings consistent with `/admin`. Replaced `src/app/page.tsx` with an async server component that composes the new sections and adds a sticky mobile CTA bar. No backend logic, auth, payment, or business calculation changed. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Fixed landing story cover image runtime error. Root cause: `next/image` rejected external story photo hosts (e.g. `placehold.co`) because they were not whitelisted in `next.config.ts`. Distribution photo URLs are admin-controlled external links that can change over time, so adding a permanent host whitelist is brittle. Switched the story cover to a plain `<img loading="lazy">` inside the existing `aspect-[16/9]` wrapper to allow any approved external URL without remote-image config. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Redesigned landing page `/` with a craft-inspired aesthetic separate from the admin shell. Added scoped craft tokens (cream, olive, amber, ink) and utility classes (`.craft-card`, `.craft-card-strong`, `.craft-pill`, `.craft-num`, `.landing-noise`) to `src/app/globals.css`. Loaded `Plus_Jakarta_Sans` and `Inter` via `next/font/google` and exposed them as `--font-display` and `--font-body`. Rebuilt all `src/components/landing/*` components for an asymmetric bento layout: hero (split with KPI side card), target strip with gradient progress, how-it-works cards with display numbers, stories bento (1 featured + 2 secondary), transparency cards with lucide-style SVGs, FAQ with rotating chevrons, and dark olive footer. Composed `/` with cream noise background and a leaf-green sticky mobile CTA. Admin dashboard remains untouched. No backend, auth, payment, or business logic changed. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Redesigned `/tentang` to match the new craft aesthetic. Replaced the flat `page-shell` layout with the same `landing-craft landing-noise` wrapper used by `/`, added an asymmetric hero pairing with a quick-action card, four-pillar grid using craft cards with display numerals, transparency principles strip, and pengelola card. Reused only static copy and existing public routes; no API, schema, payment, or privacy behavior changed. Validation passed: `npm run lint`, `npm test` (98/98).

- Redesigned `/laporan` to match the craft system while keeping all existing reporting behavior intact. Wrapped the page in the `landing-craft` shell, added public brand/header nav, restyled the hero + filter/export card, distribution story section, Friday target section, four summary cards, donation/pengeluaran panels, category chart, and transparency timeline using cream/olive/amber craft tokens. Existing date filters, `period=jumat`, print layout, PDF/CSV export links, and donor privacy rules were preserved. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. 

### 2026-05-28

- Added follow-up admin polish from review without changing phase order: admin dark-mode toggle, proper persisted admin notification table/API/bell for donation-created and donation-settlement events, dashboard-wide draggable 90-day date range with auto URL refresh, and date-filtered dashboard metrics plus ranking. Applied local Prisma migration 20260529003000_admin_notifications and generated Prisma client. Manual smoke on http://localhost:3037/admin verified dark toggle, bell dropdown, and dashboard range controls after local migration. Validation passed: npx prisma generate, npx prisma migrate dev --name admin_notifications, npm run lint, npm test (98/98), npm run build.

- Completed Phase 41 manual responsive review on local dev server http://localhost:3037 after admin login with local fallback code. Checked /admin at desktop, mobile 375px, tablet 768px, and laptop/desktop widths; verified dashboard ranking/date filters render, sidebar expanded/collapsed states work, mobile nav keeps labels visible, donor detail opens as a popup on /admin/donatur, and /admin/donasi shows auto-refresh control. Automated validation passed after final sidebar mobile fix: npm run lint, npm test (98/98), npm run build. Phase 41 marked Done; next legal phase is Phase 42.

- Expanded Phase 41 based on admin review without changing phase order. Added dashboard top-donor ranking with date filters, donation admin auto-refresh toggle, donor detail modal on donor table, collapsible/expandable admin sidebar with Dashboard/Masuk/Keluar/Pengaturan groups, removed Laporan Publik and Export CSV from sidebar, and updated admin navigation test expectations. No auth, payment, webhook, provider, database schema, or financial calculation behavior changed. Validation passed: npm run lint, npm test (98/98), npm run build. Manual responsive browser review remains before marking Phase 41 Done.

- Completed Phase 41 dashboard layout code pass while keeping scope UI-only. Refined admin dashboard hero spacing, metric cells, target layout columns, quick-action copy, touch target height, keyboard focus rings, and capped the visual progress bar at 100 percent without changing stored progress calculation. No API, auth, payment, webhook, database, financial calculation, provider integration, route, or report behavior changed. Validation passed: npm run lint, npm test (98/98), npm run build. Manual admin responsive browser review remains before Phase 41 can be marked Done.

- Corrected Phase 40 audit handoff wording to comply with `AGENTS.md` phase order. `docs/MVP_LAUNCH_READINESS_AUDIT.md` now requires Phase 41 next and queues Phase 42 findings until Phase 41 acceptance criteria and validation pass, unless `IMPLEMENTATION_PLAN.md` is explicitly updated to reorder phases. No application code changed.

- Completed Phase 40 — MVP Launch Readiness Audit. Added `docs/MVP_LAUNCH_READINESS_AUDIT.md` with security, privacy, Midtrans/payment, financial, Telegram/cron, WhatsApp, ops, and provider readiness findings. No critical code-level blocker was found, but stable MVP launch remains blocked by live provider and production environment checks: Midtrans live QRIS smoke, strong production `BETTER_AUTH_SECRET`, Telegram public channel broadcast smoke, WhatsApp live template smoke, and production backup/restore evidence. No application code, routes, API behavior, auth/payment/webhook/database logic, financial calculations, provider integrations, or UI layout changed. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`.

- Added pre-launch roadmap for Phase 40–44 after the `v2026.05.28` internal checkpoint. Chose audit-first execution before dashboard layout polish, security fixes, targeted refactor, and stable MVP launch validation. No application code, routes, API behavior, auth/payment/webhook/database logic, financial calculations, provider integrations, or UI layout changed in this planning pass.

- Completed pre-push cleanup and light refactor pass. Removed local development artifacts, hardened `.gitignore` for repeatable generated files, audited current tracked changes, applied only low-risk behavior-preserving cleanup, and kept auth/payment/webhook/database/financial/provider behavior unchanged. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.


- Completed plan-aligned Phase 39 code pass and manual visual review. Reopened phase progress because previous completion claim was premature, then aligned global tokens/utilities to slate + green, added 44px `.field`/button utilities, normalized admin shared components/status badges/tabs, strengthened admin shell toward InApp fixed-sidebar/topbar/gray-workspace layout, standardized admin table wrappers/header/body classes and form controls, removed stale teal/backdrop/promotional patterns, and kept backend/auth/payment/database/API/business logic unchanged. Manual browser review used local dev server `http://127.0.0.1:3044`: checked `/`, `/donasi`, `/laporan`, `/login`, `/masuk`, `/lupa-password`, `/reset-password`, `/admin`, `/admin/donasi`, `/admin/pengeluaran`, `/admin/donatur`, `/admin/penyaluran`, `/admin/audit`, and `/admin/persetujuan`; fixed mobile admin nav height so 375px uses compact horizontal nav instead of pushing content too far down. Responsive checks covered 375px, 768px, 1024px, and desktop. Automated validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.

- Strengthened Phase 39 admin UI after `/admin` still looked too close to the old dashboard. Root cause: previous refresh only softened visual tokens and cards, not enough InApp-inspired shell structure. Reworked admin layout into fixed white sidebar, sticky topbar, gray workspace, compact bordered dashboard panels, metric grid cells, denser quick actions, and nav icon blocks while preserving routes/business logic. Also aligned root checkout by adding `turbopack.root`, ignored `.worktrees/**` and generated Prisma output in ESLint, cleared stale `.next`, then revalidated. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.

- Completed Phase 39 — InApp-Inspired UI Refresh in isolated worktree `D:\Project\JumatBerkah\.worktrees\inapp-ui-refresh`. Added approved design spec `docs/superpowers/specs/2026-05-28-inapp-inspired-ui-refresh-design.md` and implementation plan `docs/superpowers/plans/2026-05-28-inapp-inspired-ui-refresh.md`. Adapted InApp-inspired admin dashboard patterns into existing Tailwind UI: neutral admin shell/sidebar, compact office-dashboard admin page, calmer cards/tables/forms/buttons/badges, and warm green/amber public/account styling. No backend logic, routes, API, auth, database, payment, or business flow changed. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret. Added explicit `turbopack.root` in `next.config.ts` so the nested worktree serves its own source instead of the parent checkout.

- Completed corrective UI/UX cleanup after the previous polish pass made the app feel too promotional. Removed gradient-heavy/global effects, reduced oversize headings, normalized cards/buttons/forms/sidebar spacing, converted dark hero blocks back to neutral panels, and made public/admin/donor/account screens more consistent with a simple internal-office dashboard style. No backend logic, routes, API, auth, database, or business flow changed. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.

- Completed post-release UI/UX polish pass for Jumat Berkah Karyo without changing backend logic, routes, API, auth, database, or business flow. Refined global visual tokens, landing page, donation page/form, public report shell/cards, admin sidebar/tabs/summary cards, and admin login styling. Accessibility polish included skip link, stronger focus-visible defaults, improved form attributes/placeholders, reduced-motion-safe transitions, and image dimensions. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.

- Completed Phase 38 — Final QA & Production Readiness Review. Added `docs/FINAL_QA_REVIEW.md` with automated validation results, public/admin/provider smoke review, security/privacy review, navigation review, production env checklist review, and remaining live-provider blockers. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. No code-level critical blocker found. Remaining production sign-off items: Telegram public channel `/broadcast_laporan`, strong production `BETTER_AUTH_SECRET`, Midtrans live QRIS smoke, and WhatsApp live template send.

- Completed Phase 37 — Documentation & Env Setup Guide. Added `docs/FEATURES.md`, `docs/ENV_SETUP.md`, and `docs/PRODUCTION_CHECKLIST.md`; updated `README.md` documentation pointers; aligned WhatsApp env names/routes in `TECHNICAL_SPEC.md`; and added safe missing optional/ops placeholders to `.env.example`. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Manual fresh-maintainer doc pass completed by checking feature/env/checklist coverage against current phase scope. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production checklist now calls this out.

- Completed Phase 36 — Report Print & Public Report Redesign. Redesigned `/laporan` for clearer public hierarchy, added A4 print stylesheet and print button/copy, hid filters/export controls in print, improved PDF export content with category and timeline sections, and added export privacy/totals tests. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Manual print preview/PDF inspection not run in local browser during this session; code-level print/PDF validation passed. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.

- Completed Phase 35 — WhatsApp Donation Reminder. Added server-only WhatsApp Cloud API reminder config/parser, template send utility, opted-in donor recipient query with phone dedupe, admin guarded dry-run/manual endpoint `/api/admin/whatsapp-reminders`, protected cron endpoint `/api/cron/whatsapp/reminders`, Vercel cron schedule, audit logging for dry-run/sent/skipped/failed batches, masked phone responses, README/env docs, and tests for disabled-by-default config, provider gating, phone normalization, and safe send failure. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Manual live send not run because WhatsApp Cloud API env/template is not configured locally. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.

- Completed Phase 34 — Communication Consent Foundation. Added donation-level WhatsApp reminder consent fields and migration with default non-opt-in behavior for existing donors. Added donation form opt-in checkbox with explicit Indonesian consent and opt-out copy; server validation stores opt-in only when WhatsApp number is present. Admin donor database now shows consent badge/detail status and opt-in timestamp. Added tests for default non-opt-in, missing-phone opt-in rejection, and valid phone opt-in. Applied local migration `20260528090000_communication_consent` and updated `prisma.config.ts` to load `.env.local` for Prisma CLI commands. Validation passed: `npx prisma generate`, `npm run lint`, `npm test` (94/94), `npm run build`. Manual smoke passed by user: create donation with/without opt-in and verify `/admin/donatur` consent state. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.

- Completed Phase 33 — Admin Donor Database. Added /admin/donatur with admin-only donor search by name/email/phone, activity filters, donor detail summary, matching donation-history links, and sidebar navigation. Donor aggregation combines registered donor users and guest donation contact fields; settlement totals exclude pending/failed donations. Added donor aggregation/navigation tests. Validation passed: npm run lint, npm test (91/91), npm run build. Manual smoke passed by user: donor search, detail inspection, and public report contact privacy check. Build still warns local BETTER_AUTH_SECRET is low entropy; production follow-up remains to set a strong secret.

- Completed Phase 32 — Admin UX & Navigation Cleanup. Audited current admin routes (`/admin`, `/admin/donasi`, `/admin/pengeluaran`, `/admin/penyaluran`, `/admin/persetujuan`, `/admin/audit`) plus related report/export/profile links. Grouped sidebar into Utama, Operasional, Laporan, and Sistem; shortened labels while keeping every existing admin route reachable. Added navigation reachability test. Validation passed: `npm run lint`, `npm test` (89/89), `npm run build`. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.

- Added post-Phase 31 roadmap based on product review: Phase 32 admin navigation cleanup, Phase 33 admin donor database, Phase 34 communication consent foundation, Phase 35 WhatsApp reminder, Phase 36 report print/public report redesign, Phase 37 documentation/env guide, and Phase 38 final QA/readiness review. Updated `PRD.md`, `TECHNICAL_SPEC.md`, and `IMPLEMENTATION_PLAN.md` only; no code changes in this planning pass.

- Completed Phase 31 — Admin Productivity Tools. Added quick expense templates in `/admin/pengeluaran`, CSV preview/import UI, admin API `/api/admin/expenses/import`, shared CSV validation with per-row errors, transaction-safe all-or-nothing import, row-level and batch audit logs, and CSV validation tests. Validation passed: `npm run lint`, `npm test` (88/88), `npm run build`. Manual smoke passed by user: template expense, sample CSV import, and report balance verification.

- Completed Phase 30 — Reporting Export Upgrade. Added public Friday-cycle PDF and CSV exports at `/api/reports/public/export`, linked both from `/laporan`, and kept totals sourced from centralized public report logic. Documented CSV-only decision for Excel in `docs/REPORT_EXPORTS.md` because no new export dependency was approved. Improved `/donasi/status/[orderId]` with safe receipt/share badge for successful donations. Added export privacy/PDF tests. Validation passed: `npm run lint`, `npm test` (85/85), `npm run build`. Manual PDF smoke passed by user; PDF berhasil digenerate.

- Completed Phase 29 — Admin Audit & Approval UI. Added `/admin/audit` read-only audit dashboard with action/entity/actor/date filters, expandable before/after detail panel, pagination, and admin sidebar link. Added `/admin/persetujuan` read-only monitoring page for pending large-expense approvals and recent Telegram approval timeline. Added admin-only guard test covering `/admin/audit` and `/admin/persetujuan`. Validation passed: `npm run lint`, `npm test` (83/83), `npm run build`. Manual expense create/edit/delete audit UI smoke passed by user.

- Resumed Phase 19 — Admin UX Redesign after later phases had completed. Inventory confirmed existing admin dashboard, donation filters/list/detail, and expense filter/form/edit/delete flows are present. Extracted reusable admin sidebar, top tabs, summary footer, and status badge components; wired consistent badge mapping and quick filters into admin donation/expense pages; centralized admin Rupiah formatting via `src/lib/format.ts`; added status badge mapping test. Code validation passed: `npm run lint`, `npm test` (82/82), `npm run build`. Manual admin smoke remains before marking Phase 19 Done.
- Started Phase 28 — Public Transparency Enhancements. Scope: public-safe timeline, expense category chart, `/tentang` page, empty/error/loading states, and privacy tests; `/broadcast_laporan` public channel smoke from Phase 27 remains deferred to final live validation due channel setup.
- Added public transparency timeline aggregation in `src/lib/reports.ts` from settlement donations, approved expenses, and published distribution reports. Timeline uses `getPublicDonorName`, omits private IDs/contact fields, and limits public output.
- Replaced expense category summary on `/laporan` with simple mobile-friendly bar chart whose totals reuse centralized `summarizeExpenseCategories` report logic.
- Added `Timeline Transparansi` section to `/laporan`, plus `src/app/laporan/loading.tsx` and `src/app/laporan/error.tsx` for loading/error states. Existing empty states remain for donation, expense, category, and timeline panels.
- Added `/tentang` page explaining purpose, Friday schedule, transparency principles, privacy, and contact guidance in Indonesian copy.
- Added public timeline privacy/sort tests. Validation passed: `npm run lint`, `npm test` (81/81), `npm run build`. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.
- Completed Phase 28 — Public Transparency Enhancements for code validation. Manual browser smoke passed by user: `/tentang` is visible, and `/laporan?period=jumat` shows timeline, expense category chart, and distribution story.
- Investigated deferred Telegram `/broadcast_laporan` issue. Local env has `TELEGRAM_BOT_TOKEN` set but `TELEGRAM_PUBLIC_CHANNEL_ID` is missing, so public channel send cannot run yet. Improved bot replies and README setup docs to explicitly require channel ID format `-100...`, bot admin status, and post permission. Validation passed after messaging/docs change: `npm run lint`, `npm test` (81/81).

### 2026-05-28

- Started Phase 27 — Distribution Story & Photo Report. Added `DistributionReport` Prisma model + migration `prisma/migrations/20260528001500_distribution_report` (unique per `cycle_start`, FK ke `users.id`, JSON `photo_urls`, optional `package_count`/`location_summary`, `published_at`).
- Added `src/lib/distribution-report.ts` server helpers: validasi (Jumat cycle, judul/ringkasan wajib, max 6 photo URL https/http), upsert per siklus, list 10 terakhir, getter draft+published untuk public.
- Added `POST /api/admin/distribution-report` admin route guarded by legacy admin cookie atau Better Auth admin role; menulis audit log `distribution_report.created`/`distribution_report.updated`.
- Added admin nav `/admin/penyaluran` dan halaman admin (`page.tsx` + `distribution-report-form.tsx`) untuk membuat/edit cerita, simpan draft, atau publish per siklus berjalan. Form menyertakan panduan privasi penerima manfaat.
- Added public section di `/laporan`: hanya menampilkan cerita yang `publishedAt` ada, ikut periode siklus berjalan, foto link external dengan `loading="lazy"`, tetap tidak menampilkan email/phone donor.
- Updated Telegram `/broadcast_laporan` untuk menyertakan judul cerita penyaluran yang sudah dipublish dan link `${NEXT_PUBLIC_APP_URL}/laporan?period=jumat` saat env tersedia (fallback ke pesan generic).
- Added validation tests untuk distribution report (judul wajib, max 6 foto, harus Jumat).
- Validation passed: `npx prisma generate`, `npm run lint`, `npm test` (79/79), `npm run build`.
- Fixed admin penyaluran form to call `router.refresh()` after save so `Riwayat Cerita` updates immediately; local admin smoke confirmed story save/history works.
- Local public smoke for Phase 27 passed: `/laporan?period=jumat` displays the published distribution story/photos. Telegram `/broadcast_laporan` command attempted send and returned channel-delivery failure because local public channel setup is not ready; public channel smoke deferred to final live validation.
- Completed Phase 27 — Distribution Story & Photo Report for local validation.
- Removed `next/font/google` dependency from root layout and switched to local CSS font fallbacks so production build no longer fails when Google Fonts network fetch is unavailable. Revalidation passed: `npm run lint`, `npm test` (79/79), `npm run build`.
- Local manual smoke for Phase 26 passed: admin form `/admin` saved weekly target for current Jumat cycle, target card showed `Rp500.000` progress, `/laporan?period=jumat` public card displayed target/percentage with no donor private fields exposed. Multi-cycle/historical target editing intentionally out of scope; tracked as future enhancement.
- Updated `prisma/seed-admin.ts` to load env via `@next/env` `loadEnvConfig` so `npm run seed:admin` works with `.env.local` like the Better Auth provisioning script.
- Completed Phase 26 — Weekly Donation Target for local validation. Production smoke deferred to final live validation pass.
- Started Phase 26 — Weekly Donation Target. Added `WeeklyTarget` Prisma model + `prisma/migrations/20260528000000_weekly_target` migration with unique `cycle_start`, FK to `users.id`.
- Added `src/lib/weekly-target.ts` server helpers for cycle-start validation (must be Jakarta Friday), upsert per cycle, and progress calculation using only `settlement` donations.
- Added `POST /api/admin/weekly-target` admin route guarded by legacy admin cookie or Better Auth admin role; writes `weekly_target.created`/`weekly_target.updated` audit logs.
- Added admin dashboard target card + `WeeklyTargetForm` client component for setting/updating the current Jumat cycle target with optional note.
- Added public progress card on `/laporan` showing target, terkumpul, percentage, and note (still hides donor private fields).
- Wired Telegram low-progress reminder into `runDailyTelegramCron`; alert respects threshold (`TELEGRAM_LOW_TARGET_PROGRESS_PERCENT`, default 60), `TELEGRAM_LOW_TARGET_PROGRESS_DAY_OFFSET` (default 1 day before Friday), and once-per-cycle audit cooldown.
- Added validation/progress/low-progress tests (`78/78`).
- Validation passed: `npm run lint`, `npm test` (78/78), `npm run build`, `npx prisma generate`.
- Local manual smoke test for Phase 25 passed: `/laporan?period=jumat` rendered with current Friday-cycle period; protected `GET /api/cron/telegram/weekly` triggered with local `CRON_SECRET` and the rekap siklus Jumat message arrived in the Telegram notify chat.
- Updated `run.bat` to auto-start (or auto-create) the local PostgreSQL Docker container `jumat-berkah-postgres` on port `54329` so manual test runs do not require manual Docker steps.
- Completed Phase 25 — Friday Reporting Cycle for local validation. Production cron/channel smoke test deferred to final live validation pass.

### 2026-05-27

- Started Phase 24 — Email Notifications. Chose Resend HTTP API to avoid extra dependencies; added server-side email utility, `EMAIL_PROVIDER=resend`, `EMAIL_FROM`, `RESEND_API_KEY`, and `ADMIN_EMAIL_NOTIFICATIONS` config docs.
- Added Indonesian password reset email delivery through Better Auth, with local reset URL fallback logging when email is disabled or fails.
- Added settlement admin email on Midtrans `settlement` transitions; email failures are caught and do not break webhook responses.
- Added email template/recipient tests for admin routing, settlement donor privacy, and password reset copy. Validation passed: `npm run lint`, `npm test` (72/72), `npm run build`.
- Wired remaining Phase 24 admin email alerts: repeated failed admin login, large expense/delete expense, invalid Midtrans signature, health/ops alert email copies, and backup failure email hook in `scripts/backup-postgres.sh`.
- Added admin alert email template test and updated README email notification docs.
- Phase 24 code validation passed: `npm run lint`, `npm test` (73/73), `npm run build`, and `sh -n scripts/backup-postgres.sh`.
- Manual Resend smoke tests passed after `.env.local` email config was added: direct admin test email sent, password reset email template sent through Resend, and settlement admin email sent through Resend. One settlement attempt hit Resend `HTTP 429`, then retry succeeded.
- Completed Phase 24 — Email Notifications.
- Started Phase 25 — Friday Reporting Cycle.
- Added centralized `src/lib/friday-cycle.ts` helper for Asia/Jakarta Friday 00:00 through Thursday 23:59:59.999 cycle ranges.
- Added current Jumat cycle report support via `period=jumat` in public report parsing and a `/laporan?period=jumat` UI shortcut.
- Updated Telegram weekly cron to use Friday cycle totals, post to notify chat and public channel when configured, and write audit logs for weekly summary plus channel broadcast result.
- Updated manual `/broadcast_laporan` to use current Friday-cycle public report while keeping the command available.
- Added Friday-cycle boundary tests; validation passed: `npm run lint`, `npm test` (75/75), `npm run build` (first build timed out at 180s, rerun with 300s passed).
- Started Phase 23 — Profile, Password & Account Management. First slice targets `/akun/profil`, admin profile entrypoint, profile update, and account audit logs before password change/reset work.
- Added `/akun/profil` profile page, shared account profile resolver for legacy and Better Auth sessions, profile update API, donor/admin profile entrypoints, Google profile image display allowlist, and `account.profile.updated` audit logs.
- Added profile validation tests; validation passed for Phase 23 first slice: `npm run lint`, `npm test` (67/67), `npm run build`.
- Manual validation passed for `/akun/profil`: profile page opened locally and profile update succeeded.
- Added password change form and `PATCH /api/account/password`; Better Auth changes password with current password verification and `revokeOtherSessions: true`, then writes `account.password.changed` audit log.
- Added password change validation tests; validation passed after password change slice: `npm run lint`, `npm test` (69/69), `npm run build`.
- Manual validation passed for password change from `/akun/profil`; password update succeeded locally.
- Added password reset request page `/lupa-password`, reset callback page `/reset-password`, login reset link, Better Auth reset email hook, 1-hour reset token expiry, reset-session revocation, local development reset URL logging, and `account.password.reset` audit log.
- Validation passed after password reset slice: `npm run lint`, `npm test` (69/69), `npm run build`.
- Manual validation passed for password reset: reset request generated local reset URL, reset callback accepted new password, old password failed, and new password login succeeded.
- Completed Phase 23 — Profile, Password & Account Management.
- Updated `PRD.md` with v1.1+ Production Enhancement Roadmap covering Backup & Ops Safety, Better Auth/account management, email notifications, Friday reporting cycle, weekly donation target, distribution story, transparency enhancements, audit/approval UI, export upgrades, and admin productivity tools.
- Updated `TECHNICAL_SPEC.md` with v1.1+ Technical Addendum for backup/restore, Better Auth architecture, email notification architecture, Friday cycle rules, weekly target model, distribution report model, public transparency rules, audit/approval UI, export upgrade, and admin productivity constraints.
- Drafted roadmap Phase 21–31 after product owner approved feature ideas 1–19; selected Phase 21 Backup & Restore Automation first to protect live data before larger auth and reporting changes.
- Started Phase 20 — Deployment Ops Hardening.
- Added `docker-compose.tunnel.yml` to document/reproduce `jumat-berkah-cloudflared` runtime with `network_mode: host`, `--protocol http2`, and `restart: unless-stopped`.
- Added `scripts/check-jumat-berkah-tunnel.sh` auto-heal script that checks public URL and local origin, then restarts only `jumat-berkah-cloudflared` when public is unhealthy but local origin is healthy.
- Added `docs/DEPLOYMENT_OPS_RUNBOOK.md` with runtime resources, safe health checks/logs, tunnel ownership, cron install, safe restart/deploy commands, forbidden shared-server commands, troubleshooting matrix, and smoke checks.
- Updated deployment docs to point to Cloudflare Tunnel as preferred shared-server path and reference the ops runbook.
- Validation passed for Phase 20 repo changes: `docker compose -f docker-compose.tunnel.yml config` with dummy token, `sh -n scripts/check-jumat-berkah-tunnel.sh`, `npm run lint`, `npm run build`, `npm test` (63/63).
- Added bounded cleanup to `scripts/check-jumat-berkah-tunnel.sh` so `/var/log/jumat-berkah-tunnel-watch.log` compacts after `1048576` bytes and keeps the last 200 lines; documented override/manual cleanup commands in `docs/DEPLOYMENT_OPS_RUNBOOK.md`.
- Validation passed after log cleanup change: `sh -n scripts/check-jumat-berkah-tunnel.sh`, `docker compose -f docker-compose.tunnel.yml config` with dummy token, `npm run lint`, `npm run build`, `npm test` (63/63).
- Completed Phase 20 server validation: applied compose-managed `jumat-berkah-cloudflared` with `network_mode: host` and `restart: unless-stopped`, verified tunnel logs show registered HTTP/2 connection, local/public health checks returned expected results, and only the tunnel container was replaced/restarted.
- Started Phase 21 — Backup & Restore Automation.
- Added `scripts/backup-postgres.sh` for compressed PostgreSQL backups from `jumat-berkah-postgres`, checksum generation, 14-day default retention, backup directory permission hardening, and log file output without database password logging.
- Added `scripts/restore-drill-postgres.sh` to restore one `.sql.gz` backup into temporary `jumat-berkah-postgres-restore-drill`, query `users`, `donations`, and `expenses`, then remove the temporary container.
- Added `docs/BACKUP_RESTORE_RUNBOOK.md` with install steps, manual backup, cron, retention override, restore drill, health checks, forbidden commands, and explicit warning that production restore is not automated.
- Validation passed for Phase 21 repo changes: `sh -n scripts/backup-postgres.sh`, `sh -n scripts/restore-drill-postgres.sh`, `npm run lint`, `npm run build`, `npm test` (63/63).
- Completed Phase 21 server validation: manual backup created `/var/backups/jumat-berkah/jumat-berkah-postgres-20260527T054623Z.sql.gz`, checksum verified `OK`, restore drill queried `users=1`, `donations=1`, `expenses=0`, temporary restore container was removed, app/local/public health checks returned healthy/`200`, and daily root cron was installed for `15 2 * * * /usr/local/bin/jumat-berkah-backup-postgres.sh >/dev/null 2>&1`.
- Started Phase 22 — Better Auth Migration.
- Added `better-auth` dependency and `src/lib/better-auth.ts` server config for PostgreSQL, Google OAuth, email/password, custom auth table names, and trusted origins.
- Added `/api/auth/[...all]` App Router handler using `toNextJsHandler`.
- Added Better Auth database migration for `auth_users`, `auth_sessions`, `auth_accounts`, and `auth_verifications`, kept separate from existing domain `users` table.
- Added `src/lib/auth-authorization.ts` and `src/lib/better-auth-guards.ts` so Better Auth sessions still require app-side `users.role` checks before admin/donor access.
- Added tests proving Google/email-auth success alone does not grant admin access and donor access remains donor-role scoped.
- Validation passed for Phase 22 foundation: `npm run lint`, `npm run build`, `npm test` (65/65). Build emitted expected local placeholder `BETTER_AUTH_SECRET` entropy warnings only; production must set real `BETTER_AUTH_SECRET`.
- Added `docs/BETTER_AUTH_SETUP.md` with local/production env, Google OAuth origins/redirect URIs, role access rules, fallback plan, and auth table notes.
- Added Google login and email/password login UI to admin and donor login pages while keeping legacy code-login fallback forms.
- Updated admin layout and admin APIs for expenses, receipt access, and report export to accept either legacy admin cookie or Better Auth admin session guarded by domain `users.role = admin`.
- Updated donor donation history, donation creation, donation prefill, and `/api/me/donations` to accept Better Auth donor sessions; missing Better Auth user emails are created as domain donor users, while admin-role users are denied donor area.
- Updated admin/donor logout buttons to clear both legacy session cookies and Better Auth sessions.
- Validation passed after UI/guard wiring: `npm run lint`, `npm run build`, `npm test` (65/65). Build still warns if local `BETTER_AUTH_SECRET` is short/low entropy; replace local secret with `openssl rand -base64 32` output if warning persists.
- Fixed local Prisma drift by adding Better Auth models to `prisma/schema.prisma` matching the `auth_*` migration; local `npx prisma migrate status` confirmed database schema is up to date.
- Improved admin/donor login UI to avoid stacked forms: Google remains the primary action, while password/signup/legacy code forms are selected via compact method toggles.
- Local manual validation: `run.bat` started successfully on `http://localhost:3037`, Google login redirect mismatch was fixed by using matching Google OAuth redirect/origin, donor Google login passed, donor `/api/me/donations` passed, admin Google login passed after local domain role setup, admin CSV export passed, and legacy admin/donor code-login fallback passed.
- Validation passed after UI refinement and schema sync: `npm run lint`, `npm run build`, `npm test` (65/65).
- Added `scripts/provision-better-auth-admin.ts` and `npm run seed:better-auth-admin` to provision Better Auth email/password admin accounts, then upsert matching domain `users.role = admin`; documented required temporary env values in `docs/BETTER_AUTH_SETUP.md`.
- Fixed admin provisioning script to load Next.js env files before reading `BETTER_AUTH_URL`, so local `.env.local` values are available when running `npm run seed:better-auth-admin`.
- Fixed admin provisioning script to send `Origin: BETTER_AUTH_URL` to Better Auth signup, avoiding local CLI `HTTP 403` from origin protection.
- Local manual validation passed for admin email/password login after provisioning with an unused local test email; login redirected to `/admin` as expected.
- Validation passed after admin provisioning script addition/fix: `npm run lint`, `npm run build`, `npm test` (65/65).
- Completed Phase 22 local validation; production rollout still requires server env, migration/deploy, and live auth smoke tests.
- Note: `docker compose -f docker-compose.staging.yml config` was not validated locally because `.env.production` is intentionally absent from repo; app compose was previously validated and is already running on server.
- Completed Phase 10 validation after Telegram smoke passed: bot responded quickly to admin/public commands after setting webhook with `max_connections=1` and `drop_pending_updates=true`.
- Validation passed: `npm run lint`, `npm run build`, `npm test` (63/63).
- Marked Phase 10 `Done` (100%) after public deploy, Midtrans sandbox QRIS end-to-end, Telegram webhook smoke, and validation commands passed.
- Validated Midtrans sandbox QRIS end-to-end on public domain: Snap opened, QRIS sandbox payment completed, Midtrans webhook logs stored with `signature_valid = true`, donation status updated to `settlement`, and successful income total became `10000`.
- Observed transient Cloudflare Tunnel public access failure (`502`/`530`) while local app remained healthy at `http://127.0.0.1:3010`.
- Root cause appears operational/network-level: `cloudflared` process stayed running but edge connections closed/degraded, so Docker restart policy did not auto-heal.
- Decided immediate mitigation can be a small cron health check that restarts only `jumat-berkah-cloudflared` when public URL is unhealthy.
- Added future Phase 20 — Deployment Ops Hardening to replace ad-hoc tunnel handling with documented Docker Compose ownership, health checks, restart policy, logs, and deployment runbook after Phase 10 is complete.

### 2026-05-25

- Completed public Docker deployment on office server at `https://berkahkaryo.my.id` using Cloudflare Tunnel `jumat-berkah` and host-local app binding `127.0.0.1:3010`.
- Recreated `jumat-berkah-cloudflared` with `--network host` and `--protocol http2` after QUIC instability and Docker bridge loopback caused Cloudflare `502` responses.
- Verified public smoke test: `/`, `/donasi`, `/laporan`, `/login` return `200`; `/admin`, `/admin/donasi`, `/admin/pengeluaran` return `307` to login for guest access.
- Verified admin login succeeds with `aditya.indratna@imigrasi.go.id`; removed placeholder admin `admin@example.com` from PostgreSQL.
- Confirmed `.env.production` has no placeholder values except Midtrans sandbox/merchant placeholders; payment end-to-end remains pending until real Midtrans credentials are configured.
- Remaining Phase 10 work: configure Midtrans credentials/webhook, configure Telegram bot credentials/webhook, and run payment + Telegram smoke validation.

### 2026-05-24

- Drafted Phase 19 — Admin UX Redesign in `IMPLEMENTATION_PLAN.md` (status `Not Started`, 0%).
- Goal: redesain UI admin (`/admin`, `/admin/donasi`, `/admin/pengeluaran`) dengan sidebar tetap, top tabs status, status badge konsisten, dan footer ringkasan, tetap mengikuti AGENTS §12 (clarity over decoration) dan TECHNICAL_SPEC §11.2.
- Scope dibatasi UI/UX admin saja: tidak menyentuh skema DB, API, business logic laporan, halaman publik, halaman donor, atau bot Telegram.
- Precondition: Phase 10 harus `Done` dulu, Phase 19 dieksekusi setelah live deploy.
- Added Decision Log entries (2026-05-24) menjelaskan kenapa redesign dipisah ke Phase 19 dan batasan adopsi pola dari referensi eksternal.
- No code changes yet; checklist Phase 19 belum ada item yang dicentang.

### 2026-05-22

- Prepared Docker-based server kantor deployment package for Ubuntu server with existing app on `192.168.200.112:3001`; Jumat Berkah binds only to `127.0.0.1:3010` to avoid conflict.
- Added `Dockerfile`, `.dockerignore`, and `docker-compose.staging.yml` with unique container names, network, and volume (`jumat-berkah-app`, `jumat-berkah-postgres`, `jumat-berkah-network`, `jumat_berkah_postgres_data`).
- Added `docs/SERVER_DEPLOYMENT_UBUNTU_CLOUDFLARE_DOCKER.md` with safety rules, Cloudflare DNS/WAF setup, `.env.production` template, Docker Compose commands, migration/seed steps, Nginx reverse proxy, cron, Telegram webhook, Midtrans sandbox webhook, smoke tests, update, and rollback.
- Added `docs/SSH_DEPLOY_SERVER_KANTOR_DOCKER.md` with SSH login options, server pre-checks, upload/clone options, Docker deploy commands, Nginx/Cloudflare steps, webhook setup, smoke tests, logs, restart, and rollback checklist.
- Validated Docker Compose config with dummy env and built Docker image `jumat-berkah:test` successfully.
- Validation passed after Docker package: `npm run lint`, `npm test` (63/63), `npx prisma validate`, `docker compose --env-file .env.production -f docker-compose.staging.yml config` with dummy env, and `docker build -t jumat-berkah:test .`.
- Phase 10 remains Blocked, not Done: actual server deploy still requires domain/subdomain, Cloudflare setup, server command execution, real env secrets, and smoke tests.

- Returned to Phase 10 — Export, QA, Deploy for local production-readiness audit and deploy packaging (no staging deploy attempted without credentials).
- Added `DEPLOYMENT_READINESS.md` with production env checklist, deployment steps, smoke test checklist, current blockers, and local audit results.
- Added `vercel.json` cron schedule package for Telegram daily, weekly, donor reminder, and health cron endpoints.
- Updated cron protection to accept both `X-Cron-Secret` and Vercel Cron `Authorization: Bearer $CRON_SECRET`, keeping Cloudflare/manual compatibility.
- Updated `README.md` and `TECHNICAL_SPEC.md` to document Vercel bearer cron auth and current cron endpoints.
- Local audit results: `npx prisma validate` passed; `npx prisma migrate status` blocked locally because `DATABASE_URL` is not configured in shell/host env; `.env.example` contains required deployment placeholders.
- Validation passed: `npm run lint`, `npm test` (63/63), `npx prisma validate`, `npm run build` (rerun with longer timeout after first build command timed out during TypeScript phase).
- Phase 10 remains Blocked, not Done: staging/production deploy and smoke tests still require user-provided host, database, domain, Midtrans, and optional Telegram credentials.

- Started Phase 18 — Operational & Security Alerts.
- Added `src/lib/telegram-alerts.ts` with alert configuration parsing, threshold/cooldown decisions, failed-login alerting, critical audit alerts, and health-check alerting.
- Admin login failures now write `admin.login.failed` audit logs and trigger Telegram alert after configured threshold/window.
- Admin expense create/delete routes now send critical audit alerts after successful transaction: delete always alerts, create alerts only for large expenses above `TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH`.
- Added protected health check cron endpoint `GET /api/cron/telegram/health` using `X-Cron-Secret`/`CRON_SECRET`; it alerts on database unreachability or missing required env values.
- Added alert cooldown via `TELEGRAM_ALERT_COOLDOWN_MINUTES` to avoid spam.
- Added alert env placeholders to `.env.example` and documented configuration in `README.md`.
- Updated `PRD.md` and `TECHNICAL_SPEC.md` with Phase 18 alert behavior and validation notes.
- Added tests for failed-login threshold/cooldown and critical audit alert decisions; test count now 62.
- Validation passed: `npm run lint`, `npm test` (62/62), `npm run build`.
- Completed Phase 18 — Operational & Security Alerts.

- Started Phase 17 — Telegram Public Bot & Broadcast.
- Added public Telegram commands `/saldo_publik`, `/pengeluaran_publik [n]`, and `/laporan_publik <hari|minggu|bulan>` that run from any chat after webhook secret verification.
- Added per-chat public command rate limiting (5 requests per 60 seconds) before report queries/sends.
- Added admin-only `/broadcast_laporan` command that posts the weekly public report summary to `TELEGRAM_PUBLIC_CHANNEL_ID`.
- Added `TELEGRAM_PUBLIC_CHANNEL_ID` placeholder to `.env.example`.
- Sanitized public Telegram outputs: no donor email/phone, no donor user IDs, no internal expense IDs, no admin-only CSV/search data.
- Updated Telegram help text with public and broadcast commands.
- Updated `PRD.md` and `TECHNICAL_SPEC.md` with Phase 17 command contracts, public privacy rules, and broadcast channel env.
- Added tests for public command parsing, broadcast command parsing, public rate limiting, public/admin command separation, and public channel env parsing; test count now 60.
- Validation passed: `npm run lint`, `npm test` (60/60), `npm run build`.
- Completed Phase 17 — Telegram Public Bot & Broadcast.

- Restructured remaining Telegram-related work into Phases 11–18 to comply with `AGENTS.md` §4 (one phase, one goal, one validation cycle) and §5 (scope control).
- Phase 11 now covers Telegram bot foundation, donation settlement notifications, `/pengeluaran` expense command, and Cloudflare DNS/TLS/webhook setup.
- Phases 12–18 capture admin read commands, admin write commands, scheduled jobs/alerts, photo receipts + approval, donor self-service, public broadcast, and ops/security alerts.
- Added Decision Log entries for the phase split, donor reminder vs auto-donation distinction, and shared bot token strategy.
- Phase 10 staging deploy blocker remains open and does not block Phase 11.
- Started Phase 11 — Telegram Bot Foundation, Donation Notif & Cloudflare.
- Added Telegram environment variables to `.env.example` (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_CHAT_IDS`, `TELEGRAM_NOTIFY_CHAT_ID`, `TELEGRAM_NOTIFY_ENABLED`).
- Built `src/lib/telegram.ts` with server-only helpers: webhook secret verification (timing-safe compare), admin allowlist parsing, notify chat parsing, update parser, `/pengeluaran` command parser with id-ID amount handling, public-safe settlement notification formatter, and `safeSendTelegramMessage` for fire-and-forget sends.
- Added `POST /api/webhooks/telegram` route with secret-token verification, admin allowlist check, expense command handling that reuses `validateExpenseInput` and writes an audit log tagged `channel: telegram`.
- Hooked Midtrans webhook settlement state change to send a single notification to `TELEGRAM_NOTIFY_CHAT_ID` only when `statusChanged === true` and the new status is `settlement`. Notification failures are caught so they never break webhook processing.
- Notification formatter respects privacy: `Anonim` for anonymous or hidden donors, no email/phone exposure.
- Added 24 new tests in `src/tests/telegram.test.ts` covering update parsing, secret verification, admin allowlist behaviour, notify-chat parsing, command parsing edge cases (bot-suffix, dotted thousands, fractional rejection, missing fields), and the settlement notification formatter privacy guarantees.
- Tightened Telegram amount parser to reject fractional inputs like `1500.5` while still accepting id-ID `300.000` form. Added unit tests to lock in this behaviour.
- Updated `README.md` with required Telegram env values, bot setup steps, `setWebhook` instructions, privacy notes, and Cloudflare DNS/TLS/webhook/security notes.
- Validation passed: `npm run lint`, `npm test` (31/31), `npm run build`.
- Completed Phase 11 — Telegram Bot Foundation, Donation Notif & Cloudflare.
- Documentation sync: updated `PRD.md` with Phase 11 scope (Telegram features in MVP scope, new §8.11 Notifikasi & Bot Telegram, role table addition, `/api/webhooks/telegram` endpoint, security/privacy rules, P1 entries, P2 future entries for Phases 12–18, Milestone 6).
- Documentation sync: updated `TECHNICAL_SPEC.md` with Telegram in tech stack, architecture principles, route structure, new §7.6 Telegram Rules, new §8.6 Telegram Webhook contract, new §9A Telegram Integration (env vars, inbound/outbound flows, privacy mapping, audit log markers), new §10.4 Telegram admin chat access, recommended test cases, and deployment notes.
- Doc gap acknowledged retroactively: PRD/SPEC should ideally be updated as part of the same phase commit. Future phases will treat doc sync as part of phase Definition of Done even though `AGENTS.md` §17 only requires `IMPLEMENTATION_PLAN.md` to be updated.
- Revalidated after doc-only changes: `npm run lint`, `npm test`, `npm run build` all pass.
- Started Phase 12 — Telegram Admin Read Commands.
- Added read-only Telegram command parser in `src/lib/telegram.ts` for `/saldo`, `/donasi_terbaru [n]`, `/pengeluaran_terbaru [n]`, `/cari <orderId>`, `/laporan <hari|minggu|bulan>`, and `/csv [from] [to]`.
- Added Telegram `sendDocument` and safe wrapper for CSV export delivery.
- Extended `POST /api/webhooks/telegram` to route allowlisted admin read commands after secret verification and before unknown-command fallback.
- `/saldo` returns current all-time balance, total income, total expenses, today's income, and this week's income.
- `/donasi_terbaru` returns latest settlement donations with public-safe donor names and configurable limit clamped to 20.
- `/pengeluaran_terbaru` returns latest expenses with category, vendor, amount, date, and expense ID.
- `/cari` returns public-safe donation detail by order ID without exposing donor email/phone.
- `/laporan` reuses `getPublicReport` for hari/minggu/bulan summary.
- `/csv` reuses existing admin report export logic and sends CSV as Telegram document.
- Updated `PRD.md` and `TECHNICAL_SPEC.md` to move Telegram read commands from future/P2 detail into implemented Phase 12 scope and document command contracts/access rules.
- Added Phase 12 parser/privacy tests in `src/tests/telegram.test.ts`; test count now 39.
- Validation passed: `npm run lint`, `npm test` (39/39), `npm run build`.
- Completed Phase 12 — Telegram Admin Read Commands.
- Started Phase 13 — Telegram Admin Write Commands.
- Added Telegram callback query parsing and inline keyboard support in `src/lib/telegram.ts`.
- Added `/edit_pengeluaran <id> field=value ...` parser with allowlisted fields (`tanggal`, `kategori`, `nominal`, `deskripsi`, `vendor`, `struk` plus English/internal aliases) and invalid-field detection.
- Added `/hapus_pengeluaran <id>` parser.
- Added safe `answerCallbackQuery` wrapper for Telegram inline confirmation UX.
- Extended `POST /api/webhooks/telegram` with confirmed edit/delete flows using short-lived in-memory pending action state keyed by random token.
- Edit/delete confirmation requires same chat ID and same Telegram user ID as the initiator; expired/unauthorized callbacks do not mutate expense data.
- Confirmed edit revalidates merged expense input with `validateExpenseInput`, updates expense, and writes `expense.updated` audit log with before/after plus `channel: telegram`, `telegramChatId`, and `telegramUserId` metadata.
- Confirmed delete deletes expense and writes `expense.deleted` audit log with before snapshot plus Telegram metadata.
- Missing/not-found expense cases reply clearly and do not create pending destructive actions.
- Updated `PRD.md` and `TECHNICAL_SPEC.md` to document confirmed Telegram write commands, allowlist/confirmation rules, and audit log behavior.
- Added Phase 13 tests in `src/tests/telegram.test.ts` for callback parsing, edit parser allowed fields, invalid field rejection, and delete parser behavior; test count now 44.
- Validation passed: `npm run lint`, `npm test` (44/44), `npm run build`.
- Completed Phase 13 — Telegram Admin Write Commands.
- Started Phase 14 — Telegram Scheduled Jobs & Alerts.
- Chose Vercel Cron as preferred cron platform for hosted Next.js deployment; same protected HTTP endpoints remain compatible with Cloudflare Cron if deployment platform changes.
- Added protected cron endpoints `GET /api/cron/telegram/daily` and `GET /api/cron/telegram/weekly` using `X-Cron-Secret` and `CRON_SECRET`.
- Added `src/lib/telegram-cron.ts` with daily summary, weekly Friday recap, low-balance alert, pending donation > 1 hour alert, and invalid Midtrans signature alert.
- Used `audit_logs` as cron/alert ledger to avoid schema churn: daily/weekly summary sends once per period, low-balance alert sends once, pending alert sends once per donation, invalid signature alert is rate-limited by configured window.
- Added env-driven controls: `TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH` and `TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES`.
- Added tests for cron secret verification, threshold parsing, low-balance single-fire decision, and invalid-signature rate-limit decision; test count now 48.
- Updated `README.md` with Telegram cron setup, required env values, manual trigger command, Vercel schedule example, and alert behavior.
- Validation passed: `npm run lint`, `npm test` (48/48), `npm run build`.
- Completed Phase 14 — Telegram Scheduled Jobs & Alerts.
- Started Phase 15 — Telegram Photo Receipt & Approval.
- Added Prisma approval state for expenses: `ExpenseApprovalStatus`, `expenses.approval_status`, `approval_required`, `approved_at`, and `expense_approvals` table with unique `(expense_id, telegram_user_id)` approval guard.
- Verified existing `expenses.receipt_url`; extended receipt support with private receipt object keys and signed URL helpers in `src/lib/receipt-storage.ts`.
- Added Telegram photo parsing and `/struk <expenseId>` command. Admin can attach receipt photo by caption or replying to bot message containing `ID: <expenseId>`.
- Added receipt attachment handler that stores a private receipt reference/upload target, updates `expenses.receipt_url`, and writes `expense.receipt_attached` audit log with Telegram metadata.
- Added large-expense approval threshold via `EXPENSE_APPROVAL_THRESHOLD_RUPIAH` and required distinct approval count via `EXPENSE_APPROVAL_REQUIRED_COUNT`.
- Telegram-created large expenses now enter `pending_approval`, receive inline `Setujui` approval button, and require distinct Telegram admin approvals before becoming `approved`.
- Approval callback writes `expense.approved` audit logs and prevents duplicate approval count by same Telegram user.
- Updated public report, admin dashboard balance, Telegram balance/recent-expense responses, cron summaries, and CSV export to count only `approved` expenses.
- Added protected signed receipt validation route `GET /api/admin/receipts` for admin-only signed receipt access handoff.
- Updated `.env.example` and `README.md` with receipt storage and approval env configuration.
- Added tests for approval threshold logic, approval progress, receipt signed URL generation/verification, and `/struk` parser; test count now 52.
- Validation passed: `npx prisma validate`, `npm run lint`, `npm test` (52/52), `npm run build`.
- Completed Phase 15 — Telegram Photo Receipt & Approval.
- Started Phase 16 — Telegram Donor Self-Service.
- Added donor Telegram fields via Prisma migration: `users.telegram_chat_id`, `telegram_reminder_opt_in`, and one-time `telegram_link_code`.
- Updated `/akun/donasi` to show donor Telegram link command `/mulai <kode>` and current reminder status when already linked.
- Added donor command parser and self-service helpers in `src/lib/telegram-donor.ts` for `/mulai`, `/donasi`, `/status`, `/riwayat`, and `/reminder on|off`.
- Extended Telegram webhook to bind donor chats, create donor-linked Midtrans transactions from `/donasi <nominal>`, return own donation status only, return own donation history only, and update reminder opt-in with audit log.
- Added Friday donor reminder cron at `GET /api/cron/telegram/donor-reminder`, protected by `X-Cron-Secret`, sending only once per Jakarta Friday to opted-in linked donors.
- Reminder copy explicitly says it is informational only and not automatic donation.
- Updated `.env.example` and `README.md` with donor self-service commands and reminder cron setup.
- Added tests for donor command parsing, amount parsing, and Friday reminder single-fire behavior; test count now 55.
- Validation passed: `npx prisma validate`, `npm run lint`, `npm test` (55/55), `npm run build`.
- Completed Phase 16 — Telegram Donor Self-Service.

### 2026-05-21

- Started Phase 10 — Export, QA, Deploy.
- Added protected admin CSV export at `GET /api/admin/reports/export`.
- Added admin dashboard CSV export quick link.
- CSV export includes successful donations and expenses, supports optional `from`/`to` query filters, and uses public-safe donor names.
- Added `npm test` using Node test runner with `tsx`.
- Added tests for donation validation, Midtrans signature verification, Midtrans status mapping, public donor privacy, and expense category totals.
- Updated `README.md` with current routes, validation commands, required environment values, and production deployment checklist.
- Validation passed: `npm run lint`, `npm test`, `npm run build`.
- Manual ngrok sandbox validation passed: public app URL returned 200, `POST /api/donations` created Midtrans sandbox Snap transaction `JB-20260521-1785B929`, valid settlement webhook through public ngrok URL returned `statusChanged: true`, duplicate settlement webhook returned `statusChanged: false`, status API returned `settlement`, and public report hid donor email/phone while updating balance.
- Manual admin dashboard validation passed through ngrok: admin login returned 200, `/admin` returned 200, `/admin/donasi` returned 200, `/admin/pengeluaran` returned 200, and `/api/admin/reports/export` returned CSV with settlement donation rows.
- Updated admin dashboard to use responsive sidebar navigation for dashboard, donations, expenses, CSV export, and logout.
- Modernized admin dashboard visual design with gradient shell, dark hero summary, improved KPI cards, modern quick-action cards, and polished logout/sidebar styling.
- Added admin donation pagination, page size selection, sort controls, and preserved filters across pages.
- Added admin expense pagination, page size selection, sort controls, and preserved filters across pages.
- Moved donation and expense filter/sort controls into table headers and page-size/pagination controls into table footers.
- Added auto-refresh page-size selector in table footers for donation and expense tables.
- Revalidated admin UI changes: `npm run lint`, `npm run build`.
- Remaining Phase 10 blocker: staging deploy needs deployment target and host credentials.
- Added planned Phase 11 — Telegram Expense Bot & Cloudflare Setup for post-MVP enhancement after Phase 10 is unblocked/done.

- Completed Phase 9 — Optional Donor Login.
- Added donor session cookie helpers in `src/lib/auth.ts` with donor profile lookup.
- Added donor login/logout APIs at `POST /api/auth/donor/login` and `POST /api/auth/donor/logout`.
- Added optional donor login page at `/masuk` using name, email, and local `DONOR_LOGIN_CODE` for MVP authentication.
- Added `DONOR_LOGIN_CODE` placeholder to `.env.example`.
- Linked logged-in donor donations to `donations.user_id` while keeping guest donation flow unchanged.
- Prefilled donation form name/email for logged-in donors and showed linked-account notice.
- Added personal donation history page at `/akun/donasi` with profile summary, totals, privacy labels, and status links.
- Added `GET /api/me/donations` for donor-only donation history without exposing other users' data.
- Anonymous and hidden-name donation flags remain preserved for public report privacy.
- Validation passed: `npm run lint`, `npm run build`.

- Completed Phase 8 — Expense Management.
- Added admin expense query helpers and date formatting utilities in `src/lib/admin.ts`.
- Added server-side admin user lookup from signed session in `src/lib/auth.ts`.
- Added protected expense APIs at `POST /api/admin/expenses`, `PATCH /api/admin/expenses/[id]`, and `DELETE /api/admin/expenses/[id]`.
- Expense APIs validate date, category, description, amount, vendor, and receipt URL server-side.
- Expense create/update/delete writes audit log entries with before/after snapshots.
- Added `/admin/pengeluaran` page with filters by search, category, and date range.
- Added expense form, expense table, edit action, and delete confirmation UI.
- Updated admin dashboard quick link for expense management.
- Public report already reads expenses from database, so new expenses immediately affect public balance.
- Validation passed: `npm run lint`, `npm run build`.

### 2026-05-20

- Completed Phase 7 — Admin Dashboard.
- Added admin dashboard data utility at `src/lib/admin.ts`.
- Added admin summary cards for income, expenses, balance, and pending donations.
- Added `/admin/donasi` page with donation table and filters by status, date, and search query.
- Donation table shows order ID, donor, nominal, status, payment method, created time, and message/detail panel.
- Admin dashboard and donations page use Rupiah formatting and protected admin routes.
- Manual validation passed: admin login 200, `/admin` returned 200 with summary cards, `/admin/donasi?status=settlement&q=JB` returned 200 with filter UI and settlement rows.
- Validation passed: `npm run lint`, `npm run build`.
- Started Phase 7 — Admin Dashboard.
- Completed Phase 6 — Admin Auth.
- Added signed httpOnly admin session utility in `src/lib/auth.ts`.
- Added admin login API at `POST /api/auth/admin/login`.
- Added admin logout API at `POST /api/auth/admin/logout`.
- Added `/login` admin login page.
- Added protected admin layout for `/admin` server-side access control.
- Added `proxy.ts` protection for `/admin/*` and `/api/admin/*`.
- Added fallback unauthorized route for `/api/admin/[...path]`.
- Updated admin page with logout action and protected dashboard placeholder.
- Manual validation passed: guest `/admin` redirects to `/login?next=/admin`, guest `/api/admin/donations` returns 401, public `/laporan` remains 200, admin login returns 200, authenticated `/admin` returns 200, logout returns 200.
- Validation passed: `npm run lint`, `npm run build`.
- Started Phase 6 — Admin Auth.
- Decision: use signed httpOnly admin session cookie for MVP auth to avoid blocking on external email/OAuth provider setup.
- Completed Phase 5 — Public Report.
- Added centralized report calculation utility at `src/lib/reports.ts`.
- Added public report API at `GET /api/reports/public`.
- Rebuilt `/laporan` page with period filters, summary cards, donation list, expense list, and expense category summary.
- Report summary includes period income, period expenses, period balance, and current all-time balance.
- Only `settlement` donations count as income.
- Public donor display respects anonymous and `show_name_publicly` rules.
- Public report does not expose donor email or phone.
- Added empty states for donations, expenses, and categories.
- Manual/API validation passed: report API returned income `10000`, expenses `3000`, current balance `7000`, and no private email/phone values.
- Page validation passed: `/laporan` returned HTTP 200.
- Validation passed: `npm run lint`, `npm run build`.
- Started Phase 5 — Public Report.
- Completed Phase 4 — Midtrans Webhook.
- Added Midtrans notification parsing, SHA512 signature verification, and safe status mapping in `src/lib/midtrans.ts`.
- Added `POST /api/webhooks/midtrans`.
- Webhook stores raw payload in `midtrans_webhook_logs` before trusted state changes.
- Invalid signature webhook is logged with `signature_valid = false` and rejected with 401.
- Valid webhook matches donation by `order_id` and updates status idempotently.
- Settlement webhook sets `paid_at` and creates one audit log for status change.
- Duplicate settlement webhook does not create a second audit log or double count income state.
- Manual/API validation passed for valid settlement, duplicate settlement, and invalid signature.
- Validation passed: `npm run lint`, `npm run build`.
- Started Phase 4 — Midtrans Webhook.
- Completed Phase 3 — Midtrans Payment.
- Reran validation after sandbox keys were configured in `.env.local`.
- Verified Midtrans sandbox transaction creation through `POST /api/donations`.
- Verified API returns payment handoff with sandbox Midtrans redirect URL.
- Verified Snap page is reachable with HTTP 200 on `app.sandbox.midtrans.com`.
- Verified created donation remains `pending` in database until webhook confirmation.
- Validation passed: `npx prisma migrate status`, `npm run lint`, `npm run build`.
- Implemented most of Phase 3 — Midtrans Payment.
- Added server-only Midtrans Snap helper at `src/lib/midtrans.ts`.
- `POST /api/donations` now creates a pending donation, then attempts Midtrans Snap transaction with QRIS enabled.
- Added client payment handoff to redirect donor to Midtrans `redirectUrl` when returned.
- Added public-safe donation status API at `GET /api/donations/[orderId]`.
- Added donation status page at `/donasi/status/[orderId]` with pending, success, failed, and expired messaging.
- Validation passed: `npm run lint`, `npm run build`.
- Blocked: sandbox transaction cannot be confirmed until `MIDTRANS_SERVER_KEY` and related sandbox env values are configured locally.
- Started Phase 3 — Midtrans Payment.
- Completed Phase 2 — Public Landing & Donation Form.
- Built public landing page content from `PRD.md` with donation and report CTAs.
- Built `/donasi` form UI with amount, donor name, anonymous option, optional email, optional WhatsApp, optional message, and public name preference.
- Added server-side validation in `src/lib/donations.ts` with Rp1.000 minimum amount and email format check.
- Added `POST /api/donations` to create pending donation records without login.
- Added unique `order_id` generation using Jakarta date and UUID segment.
- Verified valid donation submit, invalid nominal rejection, and anonymous donation handling via local API test.
- Verified anonymous donation stores `is_anonymous = true` and `show_name_publicly = false`.
- Validation passed: `npm run lint`, `npm run build`.
- Started Phase 2 — Public Landing & Donation Form.
- Completed Phase 1 — Database Foundation.
- Installed Prisma, PostgreSQL adapter, and `tsx` for seed execution.
- Added Prisma schema for `users`, `donations`, `expenses`, `midtrans_webhook_logs`, and `audit_logs`.
- Added donation status and user role enums.
- Added indexes and foreign keys from `TECHNICAL_SPEC.md`.
- Created and applied migrations: `20260521000830_init`, `20260521001319_add_uuid_defaults`.
- Added Prisma client helper at `src/lib/db.ts`.
- Added admin bootstrap seed at `prisma/seed-admin.ts` using `ADMIN_EMAIL` and `ADMIN_NAME`.
- Verified database connection and seed using local PostgreSQL Docker container `jumat-berkah-postgres` on port `54329`.
- Validation passed: `npx prisma validate`, `npx prisma migrate status`, `npm run seed:admin`, `npm run lint`, `npm run build`.
- Note: npm audit now reports 5 moderate vulnerabilities after Prisma dependencies. No automatic force fix applied because it can introduce breaking changes.
- Started Phase 1 — Database Foundation.
- Decision: use Prisma ORM for explicit schema, migrations, and type-safe database access.
- Completed Phase 0 — Project Setup.
- Initialized Next.js App Router project with TypeScript, Tailwind CSS, and ESLint.
- Added `.env.example` with safe placeholders for database, Midtrans, app URL, and auth.
- Added base layout, landing page, and placeholder routes for `/donasi`, `/laporan`, and `/admin`.
- Added project README setup and validation instructions.
- Installed dependencies and generated `package-lock.json`.
- Validation passed: `npm run lint`, `npm run build`.
- Note: `npm install` reported 2 moderate severity vulnerabilities in dependency audit. No automatic force fix applied because it can introduce breaking changes.
- Started Phase 0 — Project Setup.
- Created `PRD.md` as product source of truth.
- Created `TECHNICAL_SPEC.md` as technical source of truth.
- Created `IMPLEMENTATION_PLAN.md` as phase checklist and progress tracker.
- Created `AGENTS.md` as AI builder working rules.

## 4. Blockers

| Date | Blocker | Impact | Resolution |
|---|---|---|---|
| 2026-05-28 | Stable MVP launch blocked by live provider and production environment checks | Cannot mark MVP stable until real production/payment/provider conditions are verified | Track through Phase 42 and Phase 44: set high-entropy production `BETTER_AUTH_SECRET`, run Midtrans live QRIS smoke, run Telegram public channel broadcast smoke, run WhatsApp live template smoke, and record backup/restore production evidence |
| 2026-05-20 | Midtrans sandbox credentials not configured | Cannot verify that transaction appears in Midtrans sandbox or that QRIS/Snap display opens | Resolved after sandbox keys were configured in `.env.local` and Phase 3 validation passed |
| 2026-05-21 | Staging deployment target not configured in this environment | Cannot deploy staging from this environment | Prepared deploy checklist, completed ngrok-based public sandbox validation, added `DEPLOYMENT_READINESS.md`, added `vercel.json`, and revalidated local production package; needs user-provided staging host/project credentials |

## 5. Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-20 | Use 4 canonical docs: `PRD.md`, `TECHNICAL_SPEC.md`, `IMPLEMENTATION_PLAN.md`, `AGENTS.md` | Enough context for AI without over-documentation |
| 2026-05-20 | Use Next.js + PostgreSQL + Tailwind | Fast MVP, web-first, good AI support |
| 2026-05-20 | Use Prisma ORM | Explicit schema, migration workflow, and strong Next.js ecosystem support |
| 2026-05-20 | Use Midtrans QRIS | Supports Indonesian QRIS donation flow |
| 2026-05-20 | Keep donor login optional | Reduce donation friction |
| 2026-05-20 | Keep progress tracker inside `IMPLEMENTATION_PLAN.md` | Avoid extra status file during MVP |
| 2026-05-20 | Use signed httpOnly admin session cookie for MVP admin auth | Keeps admin protection server-side without requiring external auth provider setup in this phase |
| 2026-05-22 | Split Telegram bot work into Phases 11–18 (foundation, read commands, write commands, scheduled jobs, photo + approval, donor self-service, public broadcast, ops alerts) | Comply with `AGENTS.md` §4 "one phase, one goal, one validation cycle" and §5 scope control while still covering all Telegram features |
| 2026-05-22 | Treat Telegram "Friday morning donor reminder" (Phase 16) as opt-in informational message, NOT recurring auto donation | Avoid conflict with MVP non-goal "Recurring auto donation" — bot only sends a reminder, donor still pays manually via QRIS |
| 2026-05-22 | Prefer Vercel Cron for Phase 14 scheduled Telegram jobs while keeping endpoints Cloudflare Cron-compatible | Fits Next.js App Router deployment, needs only protected HTTP endpoints, and can still be called by another scheduler if staging/production platform changes |
| 2026-05-22 | Telegram bot uses single shared bot token for outbound notifications and inbound commands | One Telegram app, simpler ops; allowlist + secret token enforce admin-only writes |
| 2026-05-24 | Run Admin UX Redesign as a separate Phase 19 after live deploy, not as part of Phase 10 | AGENTS.md §4 "one phase, one goal, one validation cycle" and §5 scope control — UI redesign is not required to complete Phase 10 deploy and must not block production go-live |
| 2026-05-24 | Phase 19 may borrow visual structure from external dashboard reference (sidebar, top tabs, status badges, summary footer) but must keep Admin UI rule "clarity over decoration" from TECHNICAL_SPEC §11.2 and AGENTS §12 | Adopt patterns that genuinely help admin scan donations/expenses, avoid decorative elements that hurt readability |
| 2026-05-27 | Treat Cloudflare Tunnel reliability hardening as separate Phase 20 instead of expanding Phase 10 | Phase 10 should finish payment/Telegram deploy validation first; ops hardening needs its own validation cycle and must not risk unrelated apps on shared server |
| 2026-05-27 | Prefer Docker Compose-managed `jumat-berkah-cloudflared` plus health check/runbook as long-term fix, with cron auto-heal allowed as temporary mitigation | Compose ownership documents exact flags (`--network host`, `--protocol http2`) and reduces manual restart risk; cron is safe short-term because it restarts only the tunnel container |
| 2026-05-27 | Prioritize Backup & Restore Automation as Phase 21 before Better Auth and reporting enhancements | App is live and stores financial/payment data; reliable restore path should exist before major auth/database changes |
| 2026-05-27 | Use Resend HTTP API for Phase 24 email notifications | Avoid adding SMTP dependencies, keep server-only transactional email simple, and allow safe opt-in via env |
| 2026-05-28 | Phase 26 admin form only manages target for the current Jumat cycle; multi-cycle/historical target editing is treated as future enhancement | Keeps scope aligned with PRD §21.6 and AGENTS §5 (one phase, one goal); avoids progress-vs-period mismatch with public reports |
| 2026-05-28 | Keep Phase 30 Excel support as documented CSV-only until export dependency is approved | CSV opens in Excel/LibreOffice and avoids adding unreviewed runtime dependency; PDF export is generated without new packages |
| 2026-05-28 | Follow `IMPLEMENTATION_PLAN.md` phase order after Phase 40 audit; Phase 41 must run before Phase 42 unless the plan is explicitly reordered | `AGENTS.md` requires working only on the current phase and not starting the next phase until current acceptance criteria pass; audit findings are inputs for later phases, not permission to skip Phase 41 |
| 2026-05-28 | Use Phase 40 audit findings to constrain Phase 41 and feed Phase 42–44 | Audit found no critical code-level blocker, but stable launch depends on production/provider checks; Phase 41 must stay dashboard UI-only, Phase 42 handles security/blockers, and Phase 44 handles live smoke |
| 2026-05-30 | Phase 42 handoff uses Midtrans Snap popup with mandatory redirect fallback; popup callbacks navigate only and never mutate donation status | Improves checkout UX without touching webhook source-of-truth, donor privacy, or financial rules. Fallback to `redirectUrl` keeps flow safe when client key or Snap script is unavailable. Centralized helpers in `src/app/donasi/snap-checkout.ts` are unit-tested so popup vs redirect decisions cannot drift |
| 2026-05-30 | Introduce browser-readable `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` while keeping `MIDTRANS_IS_PRODUCTION` server-only | Snap popup script needs a public client key on the browser, but production-mode flag should not be browser-exposed; resolved by reading `MIDTRANS_IS_PRODUCTION` in the `/donasi` server component and passing it as a prop to the client `MidtransSnapScript` loader |
| 2026-05-30 | Run donor login/signup donation journey as Phase 43 — Donor Auth & Session Hygiene | Phase 42 smoke found admin/donor session ambiguity on `/donasi`; adding optional donor signup there also requires email verification, donor-owned donation linking, and admin-safe auth precedence. Keeping this in Phase 43 preserves launch-readiness focus while avoiding mandatory login or payment scope changes |

## 6. Execution Rules

- Work on one phase at a time.
- Do not start next phase until current phase acceptance criteria pass.
- Update checklist only after actual implementation and validation.
- Update Progress Tracker when phase starts and completes.
- Add Work Log entry after each meaningful session.
- Add Blocker entry when blocked.
- Add Decision Log entry when making important product/technical decisions.
- If docs conflict, follow priority in `AGENTS.md`.

---

# Phase 0 — Project Setup

## Goal

Create working Next.js project foundation with TypeScript, Tailwind, environment sample, and base routes.

## Tasks

- [x] Initialize Next.js App Router project.
- [x] Enable TypeScript strict mode.
- [x] Install and configure Tailwind CSS.
- [x] Configure ESLint.
- [x] Create `.env.example`.
- [x] Create base app layout.
- [x] Create landing route `/` placeholder.
- [x] Create donation route `/donasi` placeholder.
- [x] Create report route `/laporan` placeholder.
- [x] Create admin route `/admin` placeholder.
- [x] Add basic README setup instructions if no README exists.

## Acceptance Criteria

- App runs locally.
- Tailwind styles render correctly.
- TypeScript enabled.
- `.env.example` includes required future variables.
- Main placeholder routes exist.
- No lint errors.

## Validation

Run:

```bash
npm run lint
npm run build
```

If build is too early before full setup, document reason in Work Log and ensure dev server starts.

---

# Phase 1 — Database Foundation

## Goal

Set up PostgreSQL access, ORM, schema, and first migration.

## Tasks

- [x] Choose ORM: Prisma or Drizzle.
- [x] Install ORM dependencies.
- [x] Add `DATABASE_URL` to `.env.example`.
- [x] Configure database connection.
- [x] Define `users` model/table.
- [x] Define `donations` model/table.
- [x] Define `expenses` model/table.
- [x] Define `midtrans_webhook_logs` model/table.
- [x] Define `audit_logs` model/table.
- [x] Add enum/status handling for donation status.
- [x] Add indexes from `TECHNICAL_SPEC.md`.
- [x] Create initial migration.
- [x] Add database client helper.
- [x] Add seed/bootstrap strategy for first admin.

## Acceptance Criteria

- Schema matches `TECHNICAL_SPEC.md`.
- Migration runs successfully.
- App can connect to database.
- First admin creation path exists or is documented.
- No unsafe type shortcuts.

## Validation

Run ORM migration command and:

```bash
npm run lint
npm run build
```

---

# Phase 2 — Public Landing & Donation Form

## Goal

Build public landing page and donation creation flow up to pending donation record.

## Tasks

- [x] Build landing page content from `PRD.md`.
- [x] Add `Donasi Sekarang` CTA.
- [x] Add `Lihat Laporan` CTA.
- [x] Build `/donasi` form UI.
- [x] Add amount input.
- [x] Add donor name input.
- [x] Add anonymous toggle.
- [x] Add optional email field.
- [x] Add optional WhatsApp field.
- [x] Add optional message/doa field.
- [x] Add server-side validation.
- [x] Create `POST /api/donations` route.
- [x] Store pending donation record.
- [x] Generate unique `order_id`.

## Acceptance Criteria

- User can submit valid donation form without login.
- Invalid amount is rejected server-side.
- Donation record is saved with `pending` status.
- Anonymous donor is handled correctly.
- Private donor data is not exposed in response.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual check:

- Submit valid donation.
- Submit invalid nominal.
- Submit anonymous donation.

---

# Phase 3 — Midtrans Payment

## Goal

Connect donation creation to Midtrans QRIS payment.

## Tasks

- [x] Add Midtrans environment variables to `.env.example`.
- [x] Create Midtrans server helper/client.
- [x] Create Midtrans transaction after pending donation is stored.
- [x] Restrict or prioritize QRIS payment where supported.
- [x] Return Snap token/payment URL from `POST /api/donations`.
- [x] Build client payment handoff.
- [x] Create `/donasi/status/[orderId]` page.
- [x] Show pending payment status.
- [x] Show failed/expired status messaging.

## Acceptance Criteria

- Transaction appears in Midtrans sandbox.
- User can reach payment page/Snap/QRIS flow.
- `order_id` is unique and traceable.
- Midtrans server key is never exposed to client.
- Donation remains `pending` until webhook confirms success.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual check:

- Create sandbox transaction.
- Confirm QRIS/Snap display.

---

# Phase 4 — Midtrans Webhook

## Goal

Receive and verify Midtrans notifications, then update donation status safely.

## Tasks

- [x] Create `POST /api/webhooks/midtrans`.
- [x] Parse Midtrans notification payload.
- [x] Verify signature key.
- [x] Store raw webhook payload.
- [x] Mark invalid signature logs as invalid.
- [x] Reject invalid signature for state changes.
- [x] Match donation by `order_id`.
- [x] Map Midtrans status to internal status.
- [x] Update donation status idempotently.
- [x] Set `paid_at` on successful settlement.
- [x] Create audit log for status changes.

## Acceptance Criteria

- Valid webhook updates donation status.
- Invalid signature does not update donation.
- Duplicate webhook does not duplicate income.
- `settlement` counts as income.
- Webhook payload is logged.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual/API check:

- Send valid sandbox webhook.
- Send invalid signature webhook.
- Send duplicate webhook.

---

# Phase 5 — Public Report

## Goal

Build transparent public report for income, expenses, and balance.

## Tasks

- [x] Create `/laporan` UI.
- [x] Create `GET /api/reports/public`.
- [x] Add total successful income.
- [x] Add total expenses.
- [x] Add current balance.
- [x] Add period filter.
- [x] Add donation list.
- [x] Add expense list.
- [x] Add expense summary by category.
- [x] Hide email and phone from public response.
- [x] Show anonymous/private donor as `Anonim`.
- [x] Add empty/loading/error states.

## Acceptance Criteria

- Report is accessible without login.
- Only successful donations count as income.
- Expenses reduce balance.
- Private donor data never appears publicly.
- Anonymous display works.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual check:

- Verify balance calculation.
- Verify private data not visible in UI/API.

---

# Phase 6 — Admin Auth

## Goal

Protect admin pages and APIs with authenticated admin role.

## Tasks

- [x] Install/configure auth solution.
- [x] Create login page.
- [x] Add admin role check.
- [x] Protect `/admin` routes.
- [x] Protect `/api/admin/*` routes.
- [x] Add logout.
- [x] Keep public pages accessible without login.

## Acceptance Criteria

- Non-admin cannot access admin pages.
- Non-admin cannot call admin APIs.
- Admin can log in and out.
- Public donation and report pages remain public.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual check:

- Access admin as guest.
- Access admin as admin.

---

# Phase 7 — Admin Dashboard

## Goal

Build admin dashboard for viewing donations and financial summary.

## Tasks

- [x] Create admin dashboard layout.
- [x] Add summary cards: income, expenses, balance, pending donations.
- [x] Create `/admin/donasi` page.
- [x] Add donation table.
- [x] Add filters by status/date/name.
- [x] Add donation detail view or panel.
- [x] Format currency as Rupiah.
- [x] Add loading/empty/error states.

## Acceptance Criteria

- Admin can see all donations.
- Admin can filter donations.
- Financial summary matches report logic.
- Guest cannot access dashboard.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual check:

- View dashboard as admin.
- Verify filters.

---

# Phase 8 — Expense Management

## Goal

Allow admin to create, edit, delete, and audit expenses.

## Tasks

- [x] Create `/admin/pengeluaran` page.
- [x] Add expense table.
- [x] Add expense form.
- [x] Add expense categories.
- [x] Create `POST /api/admin/expenses`.
- [x] Create `PATCH /api/admin/expenses/[id]`.
- [x] Create `DELETE /api/admin/expenses/[id]`.
- [x] Add server-side validation.
- [x] Add audit log on create/update/delete.
- [x] Reflect expenses in public report.
- [x] Add delete confirmation.

## Acceptance Criteria

- Admin can create expenses.
- Admin can edit expenses.
- Admin can delete expenses.
- Expense changes create audit logs.
- Expenses affect public balance.
- Non-admin cannot modify expenses.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual check:

- Create expense.
- Edit expense.
- Delete expense.
- Verify public report balance.

---

# Phase 9 — Optional Donor Login

## Goal

Add optional donor login and personal donation history without blocking guest donation.

## Tasks

- [x] Enable donor login flow.
- [x] Create donor profile basics.
- [x] Link logged-in donation to `user_id`.
- [x] Create `/akun/donasi` page.
- [x] Create `GET /api/me/donations`.
- [x] Keep guest donation fully functional.
- [x] Ensure anonymous donations stay private.

## Acceptance Criteria

- Donor can donate without login.
- Logged-in donor can see own donation history.
- Donor cannot see others' private data.
- Anonymous display rules still apply.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual check:

- Guest donation.
- Logged-in donation.
- Personal history view.

---

# Phase 10 — Export, QA, Deploy

## Goal

Finalize MVP with export, QA, and deployment readiness.

## Tasks

- [x] Add CSV export for admin reports.
- [x] Add missing loading/error/empty states.
- [x] Add responsive UI checks.
- [x] Add basic tests for business rules.
- [x] Add tests for webhook signature/status handling.
- [x] Add tests for public report privacy.
- [x] Prepare production env checklist.
- [ ] Deploy staging.
- [x] Test Midtrans sandbox end-to-end.
- [x] Prepare production deployment notes.

## Acceptance Criteria

- Lint passes.
- Build passes.
- Tests pass.
- Sandbox donation flow works end-to-end.
- Public report balance is correct.
- Private donor data is not exposed.
- Admin can export report.

## Validation

Run:

```bash
npm run lint
npm run build
npm test
```

If `npm test` does not exist yet, add test script or document why during MVP.

---

# Phase 11 — Telegram Bot Foundation, Donation Notif & Cloudflare

## Goal

Establish the shared Telegram bot foundation, deliver donation settlement notifications to admin chat, ship the `/pengeluaran` expense command, and document Cloudflare DNS/TLS/webhook setup. This phase is the foundation for all later Telegram phases (12–18).

## Tasks

- [x] Add Telegram bot environment variables to `.env.example` (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_CHAT_IDS`, `TELEGRAM_NOTIFY_CHAT_ID`, `TELEGRAM_NOTIFY_ENABLED`).
- [x] Add server-only Telegram client utility in `src/lib/telegram.ts` (sendMessage, parseUpdate, signature/secret verification helpers).
- [x] Define Telegram admin allowlist strategy using comma-separated chat IDs.
- [x] Create `POST /api/webhooks/telegram` endpoint.
- [x] Verify Telegram webhook secret token via `X-Telegram-Bot-Api-Secret-Token` header.
- [x] Validate Telegram sender `chat_id` against admin allowlist before any write action.
- [x] Parse `/pengeluaran` command format (date, category, amount, description, vendor optional).
- [x] Reuse `validateExpenseInput` for server-side validation.
- [x] Create expense record from valid Telegram command and write audit log with `actorUserId = null` and action `expense.created` (channel = telegram).
- [x] Return clear Telegram reply messages for success and validation errors (Indonesian copy).
- [x] Hook Midtrans webhook settlement state change to send Telegram notification to `TELEGRAM_NOTIFY_CHAT_ID`.
- [x] Use public-safe donor display rules in notifications (Anonim when anonymous or hidden).
- [x] Notification must NOT include donor email or phone.
- [x] Notification must only fire when `statusChanged === true` for `settlement` (avoid duplicates from repeated webhooks).
- [x] Notification failure must NOT fail the Midtrans webhook response.
- [x] Add tests for Telegram command parsing.
- [x] Add tests for unauthorized Telegram chat rejection.
- [x] Add tests for Telegram webhook secret token verification.
- [x] Add tests for donation notification formatter (privacy + idempotency hint).
- [x] Document Telegram bot setup steps in `README.md`.
- [x] Add Cloudflare DNS setup notes.
- [x] Add Cloudflare TLS/SSL mode notes.
- [x] Add Cloudflare webhook URL setup notes for Midtrans and Telegram.
- [x] Add Cloudflare security notes for bot/webhook endpoints.

## Acceptance Criteria

- Only allowed Telegram admin chat IDs can create expenses via bot.
- Invalid Telegram webhook secret is rejected with 401 and no expense is created.
- Invalid command format does not create expense and replies with usage hint.
- Valid Telegram expense creates expense and audit log; expense appears in `/admin/pengeluaran` and public report.
- Settlement donation triggers exactly one Telegram notification per status change.
- Notification respects privacy rules (no email/phone, Anonim for anonymous/hidden donor).
- Telegram failure does not break Midtrans webhook processing.
- Cloudflare setup docs are complete enough for staging deployment.
- Lint, build, and tests pass.

## Validation

Run:

```bash
npm run lint
npm run build
npm test
```

Manual/API check (when bot token + chat ID configured):

- Send valid `/pengeluaran` command from allowed admin chat → expense created.
- Send same command from unauthorized chat → rejected.
- Send invalid command format → usage reply, no DB write.
- Trigger Midtrans settlement webhook → one Telegram notification arrives.
- Trigger duplicate Midtrans settlement webhook → no second notification.
- Send notification with anonymous donor → name shows `Anonim`.

---

# Phase 12 — Telegram Admin Read Commands

## Goal

Provide admin read-only commands for fast inspection without opening the dashboard.

## Tasks

- [x] Implement `/saldo` — reply with current all-time balance and today/this week income.
- [x] Implement `/donasi_terbaru [n]` — reply with last n (default 5, max 20) successful donations using public-safe names.
- [x] Implement `/pengeluaran_terbaru [n]` — reply with last n (default 5, max 20) expenses.
- [x] Implement `/cari <orderId>` — reply with donation status by order ID, public-safe display.
- [x] Implement `/laporan <hari|minggu|bulan>` — reply with summary for chosen period.
- [x] Implement `/csv [from] [to]` — send CSV export as document to chat (reuse existing CSV exporter).
- [x] Reuse `src/lib/reports.ts` for all calculations to avoid duplicate business logic.
- [x] Reject unknown commands with help text.
- [x] Add tests for command parsing and pagination clamping.
- [x] Add tests for `/cari` privacy on hidden/anonymous donors.

## Acceptance Criteria

- All read commands work only for allowlisted admin chat IDs.
- Replies use Rupiah formatting and Indonesian copy.
- No private donor email/phone leaked in any reply.
- CSV upload via Telegram works for admin chat.
- Lint, build, and tests pass.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: run each command from allowed admin chat and verify content matches dashboard.

---

# Phase 13 — Telegram Admin Write Commands

## Goal

Allow admins to edit and delete expenses safely via Telegram with explicit confirmation.

## Tasks

- [x] Implement `/edit_pengeluaran <id> <field>=<value> ...` with field allowlist.
- [x] Implement `/hapus_pengeluaran <id>` with inline keyboard confirmation (Yes/No callback).
- [x] Persist short-lived pending action state for confirmation (in-memory cache or DB-backed).
- [x] Reuse expense validators and audit log helpers from `src/lib/expenses.ts`.
- [x] Block delete if expense not found, with clear reply.
- [x] Write audit log with `actorUserId = null` and action `expense.updated` / `expense.deleted` plus `channel: telegram` metadata.
- [x] Add tests for confirmation flow and unauthorized-cancel rejection.
- [x] Add tests for invalid field rejection.

## Acceptance Criteria

- Edit and delete only succeed after confirmation from same admin chat.
- Audit logs are written with before/after JSON.
- Public report and `/admin/pengeluaran` reflect changes immediately.
- Lint, build, and tests pass.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: edit then delete a test expense via bot; verify dashboard, public report, and audit log.

---

# Phase 14 — Telegram Scheduled Jobs & Alerts

## Goal

Deliver scheduled summaries and proactive alerts to admin chat.

## Tasks

- [x] Choose and document cron platform (Vercel Cron or Cloudflare Cron) in Decision Log.
- [x] Add `/api/cron/telegram/daily` route protected by cron secret header.
- [x] Add weekly summary cron route (e.g. Friday morning recap).
- [x] Implement low-balance threshold alert with configurable env value.
- [x] Implement "pending donation > 1 hour" alert (single-fire per donation).
- [x] Implement "webhook signature invalid" alert (rate-limited per X minutes).
- [x] Add tests for threshold logic and rate-limit window.
- [x] Document cron setup in `README.md`.

## Acceptance Criteria

- Cron endpoints reject calls without valid cron secret.
- Daily summary fires once per day at scheduled time.
- Low-balance alert fires only when balance dips below threshold.
- Pending-donation alert does not duplicate per donation.
- Lint, build, and tests pass.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: trigger cron URL with valid secret; verify Telegram message and DB state.

---

# Phase 15 — Telegram Photo Receipt & Approval

## Goal

Allow admins to attach receipt photos to expenses and require multi-admin approval for large expenses.

## Tasks

- [x] Add object storage configuration (R2 or S3) and update `.env.example`.
- [x] Add migration for `expenses.receipt_url` already exists; verify and extend if needed.
- [x] Add migration for `expense_approvals` table or pending state on expense.
- [x] Implement Telegram photo upload handler that stores file to object storage.
- [x] Link uploaded receipt to specific expense via reply-to or `/struk <expenseId>` command.
- [x] Define approval threshold via env (e.g. `EXPENSE_APPROVAL_THRESHOLD`).
- [x] Implement approval flow: large expense enters `pending_approval`, requires N distinct admin approvals via inline keyboard.
- [x] Block public report from including unapproved large expenses.
- [x] Add tests for approval threshold logic, approval count, and signed URL generation.

## Acceptance Criteria

- Receipt files stored privately with admin-only signed URL access.
- Large expense not counted in balance until approved.
- Audit log captures each approval action.
- Lint, build, and tests pass.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: upload receipt photo via Telegram, attach to expense, verify storage and dashboard preview.

---

# Phase 16 — Telegram Donor Self-Service

## Goal

Let donors interact with the platform via Telegram for donation, status, and history (opt-in only).

## Tasks

- [x] Add `users.telegram_chat_id` (nullable, unique) via Prisma migration.
- [x] Add donor link flow at `/akun/donasi` that issues a one-time link code.
- [x] Implement `/mulai <linkCode>` command to bind donor account to chat.
- [x] Implement `/donasi <amount>` command → server creates Midtrans transaction and returns QRIS Snap URL.
- [x] Implement `/status <orderId>` for donor (only their own donations).
- [x] Implement `/riwayat` for donor donation history.
- [x] Implement opt-in `/reminder on|off` for Friday morning donation reminder (informational only, no auto-payment).
- [x] Add cron to send Friday reminder to opted-in donors.
- [x] Add tests for donor binding, donor data isolation, and reminder opt-in.

## Acceptance Criteria

- Donors only see their own donations.
- Friday reminder is purely informational; donor still pays manually via Midtrans.
- Privacy rules from `PRD.md` §12.2 still hold.
- Lint, build, and tests pass.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: bind a donor account, run `/donasi`, complete payment, verify reminder opt-in/out behavior.

---

# Phase 17 — Telegram Public Bot & Broadcast

## Goal

Provide public transparency commands and a broadcast channel for weekly reports.

## Tasks

- [x] Implement public commands: `/saldo_publik`, `/pengeluaran_publik`, `/laporan_publik` (read-only, public-safe data).
- [x] Add per-chat rate limiting for public commands.
- [x] Implement `/broadcast_laporan` admin command that posts weekly summary to configured channel.
- [x] Add `TELEGRAM_PUBLIC_CHANNEL_ID` env var.
- [x] Sanitize all public outputs (no email, phone, raw IDs that could leak donor identity).
- [x] Add tests for rate limit and public privacy.

## Acceptance Criteria

- Public commands work for any chat without auth.
- Rate limit enforced.
- No private data leaked.
- Channel broadcast only triggered by allowlisted admin.
- Lint, build, and tests pass.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: run public commands from non-admin chat, run `/broadcast_laporan` from admin chat, verify channel post.

---

# Phase 18 — Operational & Security Alerts

## Goal

Proactively notify admins of operational and security events.

## Tasks

- [x] Add Telegram alert for repeated failed admin logins (configurable threshold/window).
- [x] Forward critical audit log events (expense delete, large expense create) to admin chat.
- [x] Add health-check ping job that alerts on database unreachability or missing required env.
- [x] Ensure alerts respect rate limit / cooldown to avoid spam.
- [x] Add tests for alert triggers and cooldown.
- [x] Document alert configuration in `README.md`.

## Acceptance Criteria

- Failed login alert fires only after configured threshold.
- Critical audit events appear in admin chat with actor and timestamp.
- Health alerts not spammy.
- Lint, build, and tests pass.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: simulate failed admin logins, large expense create, and DB outage; verify alerts.

---

# Phase 19 — Admin UX Redesign

## Goal

Redesain layout dan navigasi panel admin (`/admin`, `/admin/donasi`, `/admin/pengeluaran`) agar lebih cepat dipindai dan konsisten antar halaman, mengikuti pola sidebar tetap, top tabs per halaman, status badge berwarna, dan footer ringkasan.

Fase ini hanya menyentuh UI/UX admin. Tidak mengubah data model, API, business logic donasi/laporan, halaman publik, atau halaman donor. Tetap tunduk pada Admin UI rule “clarity over decoration” (TECHNICAL_SPEC §11.2, AGENTS §12).

## Preconditions

- Phase 10 (Export, QA, Deploy) sudah `Done` dan staging/produksi berjalan stabil.
- Tidak boleh dimulai jika masih ada blocker produksi terbuka.

## Scope

In-scope:

- Layout admin baru dengan sidebar tetap di `src/app/admin/layout.tsx`.
- Halaman `/admin` (dashboard ringkasan).
- Halaman `/admin/donasi` (daftar + filter donasi).
- Halaman `/admin/pengeluaran` (daftar + form pengeluaran).
- Komponen admin reusable (sidebar, top tabs, summary footer, status badge, card list).
- Penyesuaian copy Indonesia agar tetap konsisten.
- Aksesibilitas dasar: kontras warna, focus state, label form, navigasi keyboard.

Out-of-scope (jangan dikerjakan di fase ini):

- Skema database / Prisma migration.
- Endpoint API baru atau perubahan kontrak API.
- Logika perhitungan saldo / laporan publik.
- Halaman publik (`/`, `/donasi`, `/laporan`, `/login`).
- Manajemen user admin (tambah/hapus admin via UI) — tetap MVP non-goal.
- Bot Telegram dan webhook.
- Native mobile app, payroll deduction, recurring auto donation, multi-branch, inventory, accounting (MVP non-goals dari AGENTS §5 dan PRD §5.2).

## Tasks

- [x] Inventarisasi halaman admin saat ini (`/admin`, `/admin/donasi`, `/admin/pengeluaran`) dan catat semua data, filter, action yang sudah ada agar tidak hilang setelah redesign.
- [x] Tambah `src/app/admin/layout.tsx` dengan sidebar tetap (Dashboard, Donasi, Pengeluaran, Laporan Publik, Logout) dan area konten utama.
- [x] Buat komponen reusable di `src/components/admin/` (mis. `AdminSidebar`, `AdminTopTabs`, `AdminSummaryFooter`, `AdminStatusBadge`).
- [x] Redesain `/admin` jadi dashboard ringkasan: kartu pemasukan, pengeluaran, saldo, donasi pending, dengan footer ringkasan periode (hari ini / bulan ini).
- [x] Redesain `/admin/donasi` dengan top tabs status (Semua, Pending, Settlement, Failed/Expired) + filter tanggal/nama/nominal yang sudah ada di Phase 7, dan status badge berwarna konsisten dengan mapping di TECHNICAL_SPEC §9.4.
- [x] Redesain `/admin/pengeluaran` dengan tab kategori atau filter periode + form tambah/edit/hapus existing dari Phase 8, plus konfirmasi destruktif tetap wajib.
- [x] Format Rupiah konsisten via util yang sudah ada (`formatRupiah`); jangan duplikasi logika.
- [x] Pastikan setiap halaman menangani state loading / empty / error / success (TECHNICAL_SPEC §11.3).
- [x] Pastikan layout responsif mobile-first (AGENTS §12); sidebar boleh collapse/drawer di breakpoint kecil.
- [x] Pastikan privacy rules tidak regresi: email/telepon donor tetap hanya di view admin, anonim tetap tampil sebagai `Anonim` di admin sesuai konvensi yang ada (PRD §8.7, AGENTS §9).
- [x] Pastikan auth guard server-side admin tetap berlaku untuk semua route admin (AGENTS §8, TECHNICAL_SPEC §10.3).
- [x] Update / tambah unit/UI test ringan untuk komponen admin baru jika ada logika non-trivial (mis. mapping status → badge).
- [x] Update README jika ada perubahan pada cara menjalankan/preview halaman admin.

## Acceptance Criteria

- Semua fungsi admin yang ada di Phase 7 dan Phase 8 tetap bekerja: ringkasan, daftar donasi, filter, detail, tambah/edit/hapus pengeluaran, audit log tercatat.
- Tidak ada perubahan pada API, skema database, atau logika perhitungan laporan.
- Halaman publik tidak berubah secara visual maupun fungsional.
- Status donasi ditampilkan dengan badge yang konsisten dengan status internal (`pending`, `settlement`, `failed`, `expired`) sesuai TECHNICAL_SPEC §9.4.
- Format Rupiah konsisten di seluruh halaman admin.
- Layout responsif di mobile dan desktop, navigasi keyboard dasar berjalan.
- Aksi destruktif (hapus pengeluaran) tetap meminta konfirmasi.
- Tidak ada regresi privasi: data kontak donor tetap hanya untuk admin.
- Lint, build, dan test pass.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual:

- Login sebagai admin, buka `/admin`, `/admin/donasi`, `/admin/pengeluaran` di desktop dan mobile width.
- Verifikasi filter donasi (status/tanggal/nama/nominal) tetap berfungsi.
- Tambah, edit, dan hapus 1 pengeluaran uji — pastikan audit log tercatat dan saldo laporan publik berubah benar.
- Buka `/laporan` sebagai publik, pastikan tidak ada perubahan pada laporan publik.
- Coba akses `/admin*` sebagai guest — harus redirect ke login.

---

# Phase 20 — Deployment Ops Hardening

## Goal

Merapikan operasional deployment setelah Phase 10 selesai agar app, database, dan Cloudflare Tunnel punya ownership yang jelas, recovery otomatis yang aman, dan runbook maintenance untuk server bersama.

Fase ini fokus reliability/operasional. Tidak mengubah fitur produk, skema database, payment logic, Telegram command behavior, atau UI.

## Preconditions

- Phase 10 sudah `Done`: domain publik, Midtrans webhook, Telegram webhook, dan smoke test produksi/sandbox sudah tervalidasi.
- Tidak ada insiden aktif pada server bersama.
- Perubahan harus hanya menyentuh resource milik Jumat Berkah (`jumat-berkah-*`) dan tidak boleh restart Docker daemon / app lain.

## Scope

In-scope:

- Masukkan `jumat-berkah-cloudflared` ke deployment ownership yang terdokumentasi (Docker Compose override/file ops khusus) dengan flags yang sudah terbukti:
  - `--network host`
  - `--protocol http2`
  - `--restart unless-stopped`
- Tambah health check publik untuk `https://berkahkaryo.my.id` dan origin lokal `http://127.0.0.1:3010`.
- Dokumentasikan temporary cron auto-heal atau ganti dengan mekanisme Compose/systemd timer yang hanya restart `jumat-berkah-cloudflared`.
- Tambah runbook: restart aman, cek logs, cek status DB/app/tunnel, update deploy, rollback.
- Tambah monitoring ringan berbasis log file untuk tunnel restart events.
- Pastikan semua command ops aman untuk server bersama dan tidak menyentuh container/volume app lain.

Out-of-scope:

- Install Nginx/Caddy host-level.
- Buka port publik 80/443/3010 langsung ke internet.
- Restart Docker daemon, reboot server, atau prune global Docker resources.
- Migrasi platform deployment.
- Perubahan API/payment/Telegram/UI.

## Tasks

- [x] Inventarisasi resource runtime Jumat Berkah: app container, Postgres container, Cloudflare Tunnel container, network, volume, domain route.
- [x] Tambah dokumentasi ops di `docs/` untuk health check dan recovery tunnel.
- [x] Tambah Compose-managed atau ops-managed definition untuk `jumat-berkah-cloudflared` dengan `--network host` dan `--protocol http2`.
- [x] Tambah safe health-check script untuk public URL dan local origin, dengan restart terbatas ke `jumat-berkah-cloudflared` saja.
- [x] Tambah log rotation/cleanup ringan untuk `/var/log/jumat-berkah-tunnel-watch.log` jika cron digunakan.
- [x] Tambah runbook command aman: `docker compose ps`, `docker logs`, `curl -I`, restart app only, restart tunnel only.
- [x] Dokumentasikan forbidden commands untuk server bersama: `docker system prune`, `docker volume prune`, Docker daemon restart, reboot, stop unrelated containers.
- [x] Validasi simulated tunnel recovery: stop/restart only tunnel container, verify public URL recovers.
- [x] Update `IMPLEMENTATION_PLAN.md` Work Log and checklist after validation.

## Acceptance Criteria

- `jumat-berkah-cloudflared` startup is documented and reproducible without relying on shell history.
- Tunnel recovery mechanism restarts only `jumat-berkah-cloudflared`, not app/db/Docker daemon/other apps.
- Public URL health check distinguishes app failure from tunnel failure by checking both public URL and local origin.
- Runbook includes exact safe commands for daily ops.
- No unrelated Docker containers, images, networks, or volumes are changed.
- Lint/build/tests still pass if repo files changed.

## Validation

```bash
npm run lint
npm run build
npm test
```

Operational manual validation:

- `curl -I http://127.0.0.1:3010` returns `200`.
- `curl -I https://berkahkaryo.my.id` returns `200` or expected auth redirect for protected routes.
- Restart only `jumat-berkah-cloudflared`; verify `docker logs jumat-berkah-cloudflared --tail 30` shows `Registered tunnel connection`.
- Confirm no unrelated container restart timestamps changed.

---

# Phase 21 — Backup & Restore Automation

## Goal

Protect live financial/payment data with automated PostgreSQL backups, retention, and documented restore drill before major feature/database changes.

## Scope

In-scope:

- Backup `jumat-berkah-postgres` database to compressed `.sql.gz` files.
- Safe backup location outside Docker volume.
- Retention policy (default 14–30 days).
- Manual restore runbook to a temporary database/container.
- Optional checksum/log file for backup success.
- Admin/ops notification on backup failure if email/Telegram notification env exists.

Out-of-scope:

- Managed cloud backup provider integration unless explicitly selected.
- Full server image backup.
- Backup of unrelated Docker volumes/apps.

## Tasks

- [x] Add backup script for `pg_dump` from `jumat-berkah-postgres`.
- [x] Add restore drill script/runbook using temporary DB target.
- [x] Add retention cleanup script.
- [x] Add cron instructions for daily backup.
- [x] Add safe backup directory and permission guidance.
- [x] Document verification command (`pg_restore`/`psql` sanity query).
- [x] Validate backup and restore drill on non-production target.

## Acceptance Criteria

- Daily backup can be run manually and by cron.
- Backup file is compressed and timestamped.
- Restore drill proves at least users/donations/expenses tables can be queried.
- Retention cleanup deletes only backup files in configured backup directory.
- No unrelated container/volume is touched.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: run backup, restore to temporary DB, query restored rows, remove temporary DB.

---

# Phase 22 — Better Auth Migration

## Goal

Migrate auth foundation to Better Auth with Google OAuth and email/password while preserving admin/donor authorization rules and privacy.

## Scope

In-scope:

- Better Auth setup for Next.js App Router.
- Google OAuth for admin and donor users.
- Email/password auth foundation.
- Auth database tables/migrations.
- Server-side admin guard based on admin role, not just Google account.
- Donor guard for donor-owned history only.
- Migration/fallback plan from current login-code auth.

Out-of-scope:

- UI redesign beyond auth pages.
- Email notification templates beyond what auth needs.
- Public donor ranking.

## Tasks

- [x] Design Better Auth schema integration with existing `users`/domain models.
- [x] Add Better Auth dependency and server config.
- [x] Add `/api/auth/[...all]` route.
- [x] Add Google provider env and callback documentation.
- [x] Add email/password support with secure password policy.
- [x] Replace admin session checks with Better Auth-backed role checks.
- [x] Replace/bridge donor login flow.
- [x] Add tests for admin/donor authorization boundaries.

## Acceptance Criteria

- Admin Google login works only for authorized admin users.
- Admin email/password login works only for authorized admin users.
- Donor Google login can view only own donation history.
- Existing financial/report/payment privacy rules do not regress.
- Old login-code flow is removed or explicitly retained as documented fallback.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: admin Google login, admin password login, donor Google login, guest access checks.

---

# Phase 23 — Profile, Password & Account Management

## Goal

Provide account management for admin/donor users after Better Auth migration.

## Scope

In-scope:

- Profile page for name/email/image.
- Profile image from Google, local override only if safe.
- Change password for email/password accounts.
- Password reset flow.
- Session revoke on password reset/change.

Out-of-scope:

- User self-delete.
- Public profile pages.

## Tasks

- [x] Add `/akun/profil` page.
- [x] Add admin profile area.
- [x] Add password change form.
- [x] Add password reset request/callback flow.
- [x] Add session revoke behavior.
- [x] Add audit logs for admin account security events.

## Acceptance Criteria

- User can update allowed profile fields.
- Password changes require current password or reset token.
- Reset token is time-limited and single-use.
- Sensitive fields are never exposed publicly.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: update profile, change password, reset password, verify old sessions behavior.

---

# Phase 24 — Email Notifications

## Goal

Add transactional email foundation for auth, admin alerts, donation/payment events, and operational failures.

## Scope

In-scope:

- Email provider config (SMTP/Resend/SendGrid; final provider TBD).
- Password reset/verification emails.
- Admin email notifications for settlement, large expense, repeated failed login, invalid webhook signature, backup failure.
- Safe templates with Indonesian copy.

Out-of-scope:

- Marketing email/newsletter.
- Bulk donor campaigns.

## Tasks

- [x] Choose email provider and env variables.
- [x] Add server-only email utility.
- [x] Add templates for auth and admin alerts.
- [x] Add retry/logging behavior for failures.
- [x] Add tests for template privacy and recipient routing.

## Acceptance Criteria

- Password/auth emails send through configured provider.
- Admin alerts can be sent to configured admin recipients.
- Donor email/phone never appears in public-facing templates.
- Email failures do not break payment/webhook processing.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: send test email, password reset email, settlement admin email.

---

# Phase 25 — Friday Reporting Cycle

## Goal

Align reports and automation to the Jumat Berkah operating cycle: Friday distribution and Friday-to-Thursday reporting.

## Scope

In-scope:

- Friday reporting period helper.
- Auto Telegram report every Friday.
- Manual broadcast remains available.
- Broadcast result log/audit.
- Public report period option for current Jumat cycle.

Out-of-scope:

- Recurring auto donation.
- Complex accounting closing entries.

## Tasks

- [x] Add Friday-cycle date utility.
- [x] Add report summary for current Friday cycle.
- [x] Update Telegram scheduled report to use Friday cycle.
- [x] Add audit log for automatic broadcast.
- [x] Add tests around timezone/Jakarta and Friday boundaries.

## Acceptance Criteria

- Friday report covers intended Jumat cycle.
- Auto Telegram post runs only through protected scheduler.
- Manual `/broadcast_laporan` still works.
- Totals match central report calculation.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: simulate Friday cron, verify Telegram channel post.

---

# Phase 26 — Weekly Donation Target

## Goal

Show and manage donation target for the current Jumat cycle.

## Scope

In-scope:

- Admin target amount per cycle.
- Public progress display.
- Low target progress reminder to admin.
- Rupiah formatting and privacy-safe public copy.

Out-of-scope:

- Multi-branch target management.
- Recurring donations.

## Tasks

- [x] Add target model/migration.
- [x] Add admin target form.
- [x] Add public progress card.
- [x] Add Telegram/admin low-progress notification.
- [x] Add tests for progress calculation.

## Acceptance Criteria

- Admin can set/update target for current cycle.
- Public sees target progress without private donor data.
- Progress uses only settlement donations.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: set target, make sandbox donation, verify progress.

---

# Phase 27 — Distribution Story & Photo Report

## Goal

Let admin publish weekly distribution story with photos and package summary for public transparency.

## Scope

In-scope:

- Admin story entry for Friday distribution.
- Photo URL/upload reference using existing receipt/storage pattern where possible.
- Public story display.
- Privacy guidance: avoid exposing vulnerable recipient identity without consent.

Out-of-scope:

- Inventory management.
- Face blurring automation.

## Tasks

- [x] Add distribution story model/migration.
- [x] Add admin create/edit story page.
- [x] Add public story section.
- [x] Add Telegram broadcast summary link.
- [x] Add privacy copy/guidance for photos.

## Acceptance Criteria

- Admin can publish Friday distribution summary.
- Public can view story and photos.
- No donor contact/private data is exposed.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: create story, view public page, verify Telegram link.

---

# Phase 28 — Public Transparency Enhancements

## Goal

Improve public trust with timeline, expense category chart, and program information page.

## Scope

In-scope:

- Public timeline of settlement donations, expenses, distributions.
- Expense category chart.
- “Tentang Program” page.
- Privacy-safe copy and data mapping.

Out-of-scope:

- Donor ranking.
- Complex analytics.

## Tasks

- [x] Add public timeline aggregation.
- [x] Add category chart UI.
- [x] Add `/tentang` page.
- [x] Add empty/error/loading states.
- [x] Add privacy tests for public timeline.

## Acceptance Criteria

- Public timeline shows no email/phone/private IDs.
- Expense chart totals match report logic.
- Program info page explains purpose, schedule, transparency, and contact.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: browse public pages mobile/desktop.

---

# Phase 29 — Admin Audit & Approval UI

## Goal

Expose audit logs and expense approvals clearly to admins.

## Scope

In-scope:

- Audit dashboard.
- Expense approval list/timeline.
- Filters by event type, actor, date.
- Read-only audit integrity.

Out-of-scope:

- Editing audit logs.
- Complex accounting approval workflow.

## Tasks

- [x] Add `/admin/audit` page.
- [x] Add `/admin/persetujuan` page if needed.
- [x] Add filters and detail panel.
- [x] Add tests for admin-only access.

## Acceptance Criteria

- Admin can inspect important operational events.
- Audit logs are read-only.
- Non-admin/guest cannot access.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: create/edit/delete expense, verify audit UI.

---

# Phase 30 — Reporting Export Upgrade

## Goal

Upgrade reports export for operational sharing and archive.

## Scope

In-scope:

- PDF report for Jumat cycle.
- Excel export if dependency is approved.
- Receipt/share page for donor after payment.
- Thank-you badge/share text.

Out-of-scope:

- Complex accounting statements.
- Public donor ranking.

## Tasks

- [x] Add PDF export for current report.
- [x] Add Excel export or document CSV-only decision.
- [x] Add receipt/share page improvements.
- [x] Add thank-you badge/share copy.
- [x] Add tests for privacy in exported report.

## Acceptance Criteria

- Exported reports match public report totals.
- Export does not expose donor email/phone publicly.
- Donor receipt is tied to order/status safely.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: export PDF/CSV/Excel, inspect content.

---

# Phase 31 — Admin Productivity Tools

## Goal

Speed up repetitive admin operations without expanding into inventory/accounting.

## Scope

In-scope:

- Quick expense templates.
- Bulk expense CSV import.
- Validation preview before import.
- Import audit logs.

Out-of-scope:

- Inventory management.
- Complex accounting ledger.

## Tasks

- [x] Add quick expense templates.
- [x] Add CSV import with preview.
- [x] Add validation errors per row.
- [x] Add audit log for imports.
- [x] Add tests for CSV validation.

## Acceptance Criteria

- Admin can create common expenses faster.
- Bulk import rejects invalid rows safely.
- Imported expenses affect balance and audit logs correctly.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: create template expense, import CSV sample, verify report balance.

---

# Phase 32 — Admin UX & Navigation Cleanup

## Goal

Reduce admin sidebar clutter and make operational pages easier to find.

## Scope

In-scope:

- Group sidebar items by workflow.
- Shorten menu labels.
- Keep all existing admin routes accessible.
- Improve mobile admin navigation if affected.

Out-of-scope:

- New business features.
- Database changes.
- Visual redesign unrelated to navigation clarity.

## Tasks

- [x] Audit current admin menu items and route ownership.
- [x] Define grouped navigation structure.
- [x] Update admin sidebar/menu components.
- [x] Verify every existing admin page remains reachable.
- [x] Add/update navigation tests if available.

## Acceptance Criteria

- Sidebar is shorter and easier to scan.
- Admin can reach donation, donor, expense, report, communication, and audit areas in 1–2 clicks.
- No broken admin navigation links.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: browse every admin menu group on desktop and mobile width.

---

# Phase 33 — Admin Donor Database

## Goal

Give admin a privacy-safe operational donor database.

## Scope

In-scope:

- `/admin/donatur` page.
- Donor list from registered donor users and guest donation contact fields.
- Search/filter by name, email, phone, and donation activity.
- Donor detail/summary with settlement-only totals.
- Links to matching donation history.

Out-of-scope:

- Public donor directory.
- Donor ranking/gamification.
- CRM automation beyond operational viewing.

## Tasks

- [x] Define donor aggregation rules.
- [x] Add donor list query with settlement totals.
- [x] Add `/admin/donatur` page and navigation entry.
- [x] Add donor detail/summary view.
- [x] Add privacy tests for donor contact fields.

## Acceptance Criteria

- Admin can find donors by name/email/phone.
- Totals count only `settlement` donations.
- Donor email/phone remain admin-only.
- Anonymous public display rules remain unchanged.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: search donor, inspect detail, verify no public report contact leak.

---

# Phase 34 — Communication Consent Foundation

## Goal

Prepare safe consent tracking before any WhatsApp reminder broadcast.

## Scope

In-scope:

- WhatsApp reminder opt-in fields.
- Donation form opt-in checkbox.
- Admin donor consent status display.
- Opt-out instruction copy.
- Consent audit where meaningful.

Out-of-scope:

- Sending WhatsApp messages.
- Importing old donors as opted-in.
- Marketing automation.

## Tasks

- [x] Add consent fields to data model/migration.
- [x] Add opt-in checkbox to donation form.
- [x] Store consent only when donor provides phone number.
- [x] Show consent state in admin donor database.
- [x] Add tests for default non-opt-in behavior.

## Acceptance Criteria

- Donor can opt in during donation.
- Existing donors default to not opted-in.
- Admin can see consent status.
- No WhatsApp send code runs in this phase.

## Validation

```bash
npx prisma generate
npm run lint
npm run build
npm test
```

Manual: create donation with/without opt-in and verify admin donor consent state.

---

# Phase 35 — WhatsApp Donation Reminder

## Goal

Send donation reminders through WhatsApp only to opted-in donors.

## Scope

In-scope:

- WhatsApp Cloud API server-only integration.
- Reminder template configuration.
- Admin-only dry-run/preview.
- Scheduled/manual reminder trigger.
- Send audit logs and failure handling.
- Rate-limited batch send to opted-in donors only.

Out-of-scope:

- Sending to non-opt-in donors.
- Unofficial WhatsApp automation/web session scraping.
- Two-way WhatsApp bot commands unless explicitly added later.

## Tasks

- [x] Add WhatsApp env placeholders and config parser.
- [x] Add server-only WhatsApp send utility.
- [x] Add opted-in donor recipient query.
- [x] Add dry-run/manual trigger endpoint guarded by admin auth.
- [x] Add scheduled reminder hook.
- [x] Add audit logs for sent/skipped/failed reminders.
- [x] Add tests for opt-in gating and failure safety.

## Acceptance Criteria

- Reminder never sends to donors without opt-in.
- WhatsApp token never reaches client.
- Failed send does not crash cron/batch.
- Admin can dry-run before live send.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: dry-run reminder, then live test to one opted-in test number if provider env is configured.

---

# Phase 36 — Report Print & Public Report Redesign

## Goal

Make public reports and printed/PDF reports look polished and easy to share.

## Scope

In-scope:

- Redesign `/laporan` visual hierarchy.
- Print-friendly A4 stylesheet.
- Print button for public users.
- Improved PDF/report layout.
- Hide buttons/filter/navigation in print.
- Keep report totals centralized.

Out-of-scope:

- Complex accounting statements.
- Donor ranking.
- Private donor contact fields in report.

## Tasks

- [x] Redesign public report page sections.
- [x] Add `@media print` styles for A4 layout.
- [x] Add print button and clear print copy.
- [x] Improve PDF report presentation.
- [x] Add privacy/totals tests for print/export data.

## Acceptance Criteria

- Public users can print a clean A4 report.
- Printed/PDF report totals match public report totals.
- Email/phone donor never appear in print/PDF.
- Mobile report remains usable.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: print preview `/laporan`, inspect PDF/export, verify A4 layout.

---

# Phase 37 — Documentation & Env Setup Guide

## Goal

Document all features and every environment variable with setup steps.

## Scope

In-scope:

- Feature documentation.
- Env variable reference.
- Provider setup guides for Midtrans, Telegram, Resend/email, Better Auth/Google OAuth, WhatsApp, database, cron, backup, and deployment.
- Production readiness checklist.
- Safe examples only.

Out-of-scope:

- Storing real secrets.
- Provider-specific support beyond setup links/instructions.

## Tasks

- [x] Add `docs/FEATURES.md`.
- [x] Add/update `docs/ENV_SETUP.md`.
- [x] Add/update production checklist.
- [x] Update `README.md` pointers.
- [x] Verify `.env.example` matches docs.

## Acceptance Criteria

- New maintainer can set up local and production from docs.
- Every env var is explained with source/provider dashboard guidance.
- Docs include smoke tests per integration.
- No real secret appears in docs.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: read docs from fresh-maintainer perspective and verify env checklist completeness.

---

# Phase 38 — Final QA & Production Readiness Review

## Goal

Run end-to-end readiness review after all post-review improvements.

## Scope

In-scope:

- Full app smoke test.
- Security/privacy review.
- Broken-link/navigation review.
- Production env checklist review.
- Document remaining blockers.

Out-of-scope:

- New feature development.
- Broad redesign after sign-off unless blocker-level issue found.

## Tasks

- [x] Run automated validation.
- [x] Smoke donation/Midtrans flow.
- [x] Smoke admin donor/expense/import/report flows.
- [x] Smoke Telegram and WhatsApp configured flows.
- [x] Review public privacy outputs.
- [x] Update final blockers/work log.

## Acceptance Criteria

- No known critical bug remains.
- Public views/export/print do not expose private donor contact fields.
- Production checklist is complete or blockers are explicit.
- Final status reflects true readiness.

## Validation

```bash
npm run lint
npm run build
npm test
```

Manual: full end-to-end smoke checklist across public, donor, admin, Telegram, WhatsApp, and deployment docs.

# Phase 39 — InApp-Inspired UI Refresh

## Goal

Adapt the downloaded InApp dashboard visual language into Jumat Berkah Karyo while preserving current product behavior and production readiness constraints.

## Scope

In-scope:

- Frontend UI/UX only.
- Global Tailwind/CSS visual tokens and reusable UI classes.
- Public warm nonprofit styling for landing, donation, report, auth/account/status pages.
- Admin neutral office-dashboard styling inspired by InApp sidebar, topbar/page header, cards, tables, badges, and form density.
- Accessibility and responsive polish.
- Progress tracker and work log updates.

Out-of-scope:

- Backend logic.
- API routes/contracts.
- Auth/session behavior.
- Midtrans/payment/webhook behavior.
- Database schema or migrations.
- Report calculations and privacy/business rules.
- New dependencies.

## Tasks

- [x] Create design spec from InApp reference.
- [x] Create implementation plan.
- [x] Run baseline validation.
- [x] Refine global visual utilities.
- [x] Rework admin shell and shared components.
- [x] Apply InApp-inspired admin page styling.
- [x] Apply warm nonprofit public page styling.
- [x] Normalize auth, account, and status pages.
- [x] Run responsive and accessibility review.
- [x] Run final validation and update Work Log.

## Acceptance Criteria

- Public pages feel warm, trustworthy, and not flashy.
- Admin pages feel neutral, compact, and data-first.
- UI follows InApp-inspired structure without importing Bootstrap/Vite/template code.
- Donation flow remains short and low friction.
- Public report still never exposes donor email or phone.
- Backend/auth/payment/database/API/business logic remain unchanged.
- Important controls keep visible focus states and 44px target size.
- Data-dependent pages keep loading, empty, and error states where relevant.

## Validation

```bash
npm run lint
npm test
npm run build
```

Manual: review `/`, `/donasi`, `/laporan`, `/login`, `/masuk`, `/admin`, `/admin/donasi`, `/admin/pengeluaran`, `/admin/donatur`, `/admin/penyaluran`, `/admin/audit`, `/admin/persetujuan`, `/akun/donasi`, `/akun/profil`, `/lupa-password`, and `/reset-password` at mobile/tablet/desktop widths.

# Phase 40 — MVP Launch Readiness Audit

## Goal

Audit Jumat Berkah before stable MVP launch so remaining risks are explicit before dashboard layout polish, security fixes, targeted refactor, or live launch validation.

## Scope

In-scope:

- Security review for secrets, auth guards, admin APIs, webhook signatures, cron protection, and provider callbacks.
- Privacy review for donor email/phone exposure, anonymous donor display, public report payloads, exports, Telegram/WhatsApp/email notifications, and admin-only operational contact data.
- Financial safety review for integer Rupiah storage, settlement-only income, expense audit logs, webhook idempotency, and report total consistency.
- Production configuration review for `.env.example`, docs, deployment checklist, backup/restore readiness, cron setup, and provider credentials.
- Provider readiness review for Midtrans live QRIS, Telegram public channel broadcast, WhatsApp live template send, and email production configuration.
- Documentation of launch blockers, impact, attempted checks, and recommended next phase.

Out-of-scope:

- Dashboard UI changes.
- Code refactoring.
- Database schema changes.
- Payment/auth/webhook behavior changes.
- New product features.

## Tasks

- [x] Review security-sensitive env and documentation placeholders.
- [x] Review admin/auth guard coverage for admin pages and APIs.
- [x] Review Midtrans webhook signature and idempotency path.
- [x] Review cron and Telegram webhook protection.
- [x] Review public privacy boundaries for reports, exports, donor names, and notifications.
- [x] Review financial calculation and audit-log rules against `TECHNICAL_SPEC.md`.
- [x] Review production runbooks, backup/restore docs, and provider smoke prerequisites.
- [x] Create launch readiness audit document under `docs/`.
- [x] Update Blockers, Decision Log, and Work Log with audit findings.

## Acceptance Criteria

- Audit document lists security, privacy, operations, provider, and launch-readiness findings.
- Every critical/high launch blocker has impact and recommended resolution.
- Known live provider smoke requirements remain tracked until verified.
- No application behavior changes are made in this phase unless a separate fix phase is approved.
- Next phase recommendation is explicit: dashboard polish, security fixes, refactor, or launch validation.

## Validation

```bash
npm run lint
npm test
npm run build
```

Manual review: inspect `docs/FINAL_QA_REVIEW.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/ENV_SETUP.md`, `docs/DEPLOYMENT_OPS_RUNBOOK.md`, `docs/BACKUP_RESTORE_RUNBOOK.md`, `.env.example`, `TECHNICAL_SPEC.md`, and relevant auth/payment/report source paths for audit evidence.

# Phase 41 — Dashboard Layout Final Polish

## Goal

Apply final small admin dashboard layout improvements after Phase 40 audit clarifies launch risks.

## Scope

In-scope:

- Admin dashboard layout and visual hierarchy refinements.
- Reusable admin UI component polish when directly needed for dashboard clarity.
- Mobile/tablet/desktop dashboard review.

Out-of-scope:

- Backend logic changes.
- API route or database changes.
- Auth/payment/webhook/provider changes.
- Public donation flow changes unless required by an approved audit finding.

## Tasks

- [x] Identify dashboard layout changes from Phase 40 findings and user review.
- [x] Update dashboard UI with minimal component changes.
- [x] Preserve existing route, API, and data behavior.
- [x] Run automated validation.
- [x] Manually review admin dashboard responsiveness.
- [x] Update Work Log.

## Acceptance Criteria

- Dashboard is clearer for admin monitoring before launch.
- No API, auth, payment, webhook, database, report calculation, or provider behavior changes occur.
- UI remains mobile-first and accessible.

## Validation

```bash
npm run lint
npm test
npm run build
```

Manual: review `/admin` at mobile, tablet, laptop, and desktop widths.

# Phase 42 — Donation Checkout UX Enhancement

## Goal

Improve public donation checkout handoff with a more seamless Midtrans experience while keeping payment safety and validation rules unchanged.

## Scope

In-scope:

- Analysis and implementation of Midtrans Snap popup handoff for `/donasi` if confirmed feasible in current codebase.
- Client-side checkout UX polish directly related to payment handoff.
- Fallback-safe handling that keeps `redirectUrl` available when popup load/open fails.
- Tests and documentation for changed checkout presentation behavior.

Out-of-scope:

- Changing webhook source of truth.
- Trusting client callback as final payment status.
- Database schema changes unless separately approved.
- Unrelated public/admin redesign work.

## Tasks

- [x] Confirm current `/api/donations` and Midtrans helper contract is sufficient for Snap popup flow.
- [x] Implement client-side Snap popup handoff with safe fallback to `redirectUrl`.
- [x] Keep `/donasi/status/[orderId]` as post-payment status destination.
- [x] Add or update tests/documentation for checkout UX behavior.
- [x] Run automated validation.
- [x] Update Decision Log and Work Log.

## Acceptance Criteria

- Donor can open Midtrans Snap from `/donasi` without breaking existing payment creation flow.
- Fallback redirect still works if popup cannot be used.
- Final donation status remains determined by webhook/server state, not client callback.
- No privacy, payment, or financial rule regresses.

## Validation

```bash
npm run lint
npm test
npm run build
```

Manual: verify popup open, popup close, fallback redirect, pending flow, and status-page handoff.

# Phase 43 — Donor Auth & Session Hygiene

## Goal

Add optional donor login/signup entry points to the donation journey while fixing `/donasi` session hygiene so admin sessions are never treated as donor sessions.

## Scope

In-scope:

- Non-blocking donor login/signup banner on `/donasi`.
- Post-donation signup CTA on `/donasi/status/[orderId]` when a guest donation has an email.
- Donor signup with Google and email/password.
- Required email verification for email/password donor signup.
- Verified-email linking of guest donations to donor accounts.
- Admin-safe auth resolution on `/donasi`: admin session wins and suppresses donor prefill/banner.
- Tests and documentation for auth/session/privacy behavior.
- Critical/high Phase 40 security or launch blockers only if directly related to auth/session hygiene.

Out-of-scope:

- Making login mandatory before donation.
- Payment, Midtrans, webhook, or financial status changes.
- Recurring auto donation.
- Claiming donations by order ID when signup email differs.
- Cosmetic redesign unrelated to donor auth/session hygiene.
- Deep refactor not required for this phase.

## Tasks

- [ ] Implement banner resolver and tests for anonymous, donor, and admin states.
- [ ] Add `/donasi` donor auth banner and remove duplicate in-form "Masuk sebagai" copy.
- [ ] Resolve donor-prefill leak on `/donasi` for users authenticated as admin via Better Auth or legacy admin cookie.
- [ ] Add donor email verification template and Better Auth verification hooks.
- [ ] Add verified-email donation linking helper with tests and audit log.
- [ ] Add donor signup page `/daftar` with Google and email/password signup.
- [ ] Add `/cek-email` handoff and login query-param support.
- [ ] Add post-donation signup CTA on `/donasi/status/[orderId]` without exposing donor phone.
- [ ] Update PRD, Technical Spec, and Implementation Plan.
- [ ] Run automated validation.
- [ ] Update Blockers, Decision Log, and Work Log.

## Acceptance Criteria

- Donor can still donate without login.
- Anonymous visitor on `/donasi` sees non-blocking login/signup choices.
- Logged-in donor on `/donasi` sees account/history/logout actions.
- Admin session on `/donasi` never gets donor prefill or donor banner.
- Email/password signup requires verification before login.
- Google signup remains available.
- Guest donations link to donor account only after verified ownership of the same email.
- Public donor privacy rules remain unchanged; anonymous donations still display as `Anonim` publicly.
- No payment, webhook, or financial status behavior changes.

## Validation

```bash
npm run lint
npm test
npm run build
```

Manual: verify anonymous banner, donor banner, admin-hidden banner, `/daftar`, `/cek-email`, verification email, status-page CTA, account donation history linking, and unchanged Snap popup/redirect donation flow.

# Phase 44 — Targeted Refactor

## Goal

Refactor high-value code paths after launch blockers are known and addressed, keeping behavior unchanged.

## Scope

In-scope:

- Split large files that are actively risky for launch maintenance.
- Centralize duplicate admin UI components or server utilities.
- Improve type clarity and test coverage around refactored behavior.

Out-of-scope:

- Deep architecture rewrite.
- Database schema changes unless separately approved.
- Payment/auth/report behavior changes.
- New features.

## Tasks

- [ ] Identify refactor candidates from Phase 40 and Phase 43 notes.
- [ ] Prioritize small refactors with clear validation.
- [ ] Add or preserve tests for behavior before moving code.
- [ ] Refactor one bounded area at a time.
- [ ] Run targeted and full validation.
- [ ] Update Work Log.

## Acceptance Criteria

- Refactored code keeps behavior equivalent.
- Tests cover moved or centralized logic.
- Files become easier to understand without broad churn.
- No launch blocker is reintroduced.

## Validation

```bash
npm run lint
npm test
npm run build
```

Manual: review changed flows based on refactored area.

# Phase 45 — Stable MVP Launch Validation

## Goal

Run final validation and live-provider smoke tests before marking the MVP stable.

## Scope

In-scope:

- Final automated validation.
- Production env readiness check.
- Midtrans live QRIS smoke.
- Telegram public channel broadcast smoke.
- WhatsApp live template smoke.
- Backup/restore readiness confirmation.
- Stable release notes and launch tag decision.

Out-of-scope:

- New product features.
- Non-blocking UI experiments.
- Deep refactor.

## Tasks

- [ ] Confirm production env values are real and safe without exposing secrets.
- [ ] Run final `npm run lint`, `npm test`, and `npm run build`.
- [ ] Run Midtrans live QRIS smoke and verify webhook settlement.
- [ ] Run Telegram public channel smoke.
- [ ] Run WhatsApp live template smoke.
- [ ] Confirm backup/restore readiness.
- [ ] Create stable MVP release notes.
- [ ] Decide and create stable launch tag.
- [ ] Update Work Log and Blockers.

## Acceptance Criteria

- Automated validation passes.
- Live provider smoke tests pass or blockers are explicitly documented with owner and impact.
- No critical/high unresolved security, privacy, payment, or financial blocker remains for MVP launch.
- Stable release notes and tag decision are recorded.

## Validation

```bash
npm run lint
npm test
npm run build
```

Manual/live: Midtrans QRIS payment, Midtrans webhook settlement, Telegram public channel broadcast, WhatsApp template send, production env checklist, and backup/restore readiness check.
