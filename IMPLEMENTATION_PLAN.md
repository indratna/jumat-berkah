# Implementation Plan — Jumat Berkah

## 1. Purpose

Dokumen ini adalah checklist eksekusi dan progress tracker untuk membangun aplikasi Jumat Berkah dengan bantuan AI builder/vibe coder.

AI harus bekerja per fase. Jangan loncat fase. Jangan menandai selesai sebelum acceptance criteria dan validation pass.

## 2. Progress Tracker

### Current Status

Current Phase: Phase 20 — Deployment Ops Hardening  
Overall Progress: 100%  
Last Updated: 2026-05-27  
Current Focus: Phase 20 in progress; repo now includes tunnel compose ownership, auto-heal script, log cleanup, and deployment ops runbook. Remaining work: apply compose-managed tunnel on server and perform manual recovery validation.  
Blockers: Server manual recovery validation requires server access/session.

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
| Phase 19 | Admin UX Redesign | Not Started | 0% |
| Phase 20 | Deployment Ops Hardening | In Progress | 85% |
| Phase 21 | Backup & Restore Automation | Not Started | 0% |
| Phase 22 | Better Auth Migration | Not Started | 0% |
| Phase 23 | Profile, Password & Account Management | Not Started | 0% |
| Phase 24 | Email Notifications | Not Started | 0% |
| Phase 25 | Friday Reporting Cycle | Not Started | 0% |
| Phase 26 | Weekly Donation Target | Not Started | 0% |
| Phase 27 | Distribution Story & Photo Report | Not Started | 0% |
| Phase 28 | Public Transparency Enhancements | Not Started | 0% |
| Phase 29 | Admin Audit & Approval UI | Not Started | 0% |
| Phase 30 | Reporting Export Upgrade | Not Started | 0% |
| Phase 31 | Admin Productivity Tools | Not Started | 0% |

Status values:

```txt
Not Started
In Progress
Blocked
Done
```

## 3. Work Log

### 2026-05-27

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
- Remaining Phase 20 validation is server-only: apply compose-managed tunnel on `/var/www/jumat-berkah`, restart only `jumat-berkah-cloudflared`, confirm public URL recovers, and confirm unrelated container restart timestamps are unchanged.
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
| - | - | - | - |
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

- [ ] Inventarisasi halaman admin saat ini (`/admin`, `/admin/donasi`, `/admin/pengeluaran`) dan catat semua data, filter, action yang sudah ada agar tidak hilang setelah redesign.
- [ ] Tambah `src/app/admin/layout.tsx` dengan sidebar tetap (Dashboard, Donasi, Pengeluaran, Laporan Publik, Logout) dan area konten utama.
- [ ] Buat komponen reusable di `src/components/admin/` (mis. `AdminSidebar`, `AdminTopTabs`, `AdminSummaryFooter`, `AdminStatusBadge`).
- [ ] Redesain `/admin` jadi dashboard ringkasan: kartu pemasukan, pengeluaran, saldo, donasi pending, dengan footer ringkasan periode (hari ini / bulan ini).
- [ ] Redesain `/admin/donasi` dengan top tabs status (Semua, Pending, Settlement, Failed/Expired) + filter tanggal/nama/nominal yang sudah ada di Phase 7, dan status badge berwarna konsisten dengan mapping di TECHNICAL_SPEC §9.4.
- [ ] Redesain `/admin/pengeluaran` dengan tab kategori atau filter periode + form tambah/edit/hapus existing dari Phase 8, plus konfirmasi destruktif tetap wajib.
- [ ] Format Rupiah konsisten via util yang sudah ada (`formatRupiah`); jangan duplikasi logika.
- [ ] Pastikan setiap halaman menangani state loading / empty / error / success (TECHNICAL_SPEC §11.3).
- [ ] Pastikan layout responsif mobile-first (AGENTS §12); sidebar boleh collapse/drawer di breakpoint kecil.
- [ ] Pastikan privacy rules tidak regresi: email/telepon donor tetap hanya di view admin, anonim tetap tampil sebagai `Anonim` di admin sesuai konvensi yang ada (PRD §8.7, AGENTS §9).
- [ ] Pastikan auth guard server-side admin tetap berlaku untuk semua route admin (AGENTS §8, TECHNICAL_SPEC §10.3).
- [ ] Update / tambah unit/UI test ringan untuk komponen admin baru jika ada logika non-trivial (mis. mapping status → badge).
- [ ] Update README jika ada perubahan pada cara menjalankan/preview halaman admin.

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
- [ ] Validasi simulated tunnel recovery: stop/restart only tunnel container, verify public URL recovers.
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

- [ ] Add backup script for `pg_dump` from `jumat-berkah-postgres`.
- [ ] Add restore drill script/runbook using temporary DB target.
- [ ] Add retention cleanup script.
- [ ] Add cron instructions for daily backup.
- [ ] Add safe backup directory and permission guidance.
- [ ] Document verification command (`pg_restore`/`psql` sanity query).
- [ ] Validate backup and restore drill on non-production target.

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

- [ ] Design Better Auth schema integration with existing `users`/domain models.
- [ ] Add Better Auth dependency and server config.
- [ ] Add `/api/auth/[...all]` route.
- [ ] Add Google provider env and callback documentation.
- [ ] Add email/password support with secure password policy.
- [ ] Replace admin session checks with Better Auth-backed role checks.
- [ ] Replace/bridge donor login flow.
- [ ] Add tests for admin/donor authorization boundaries.

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

- [ ] Add `/akun/profil` page.
- [ ] Add admin profile area.
- [ ] Add password change form.
- [ ] Add password reset request/callback flow.
- [ ] Add session revoke behavior.
- [ ] Add audit logs for admin account security events.

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

- [ ] Choose email provider and env variables.
- [ ] Add server-only email utility.
- [ ] Add templates for auth and admin alerts.
- [ ] Add retry/logging behavior for failures.
- [ ] Add tests for template privacy and recipient routing.

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

- [ ] Add Friday-cycle date utility.
- [ ] Add report summary for current Friday cycle.
- [ ] Update Telegram scheduled report to use Friday cycle.
- [ ] Add audit log for automatic broadcast.
- [ ] Add tests around timezone/Jakarta and Friday boundaries.

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

- [ ] Add target model/migration.
- [ ] Add admin target form.
- [ ] Add public progress card.
- [ ] Add Telegram/admin low-progress notification.
- [ ] Add tests for progress calculation.

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

- [ ] Add distribution story model/migration.
- [ ] Add admin create/edit story page.
- [ ] Add public story section.
- [ ] Add Telegram broadcast summary link.
- [ ] Add privacy copy/guidance for photos.

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

- [ ] Add public timeline aggregation.
- [ ] Add category chart UI.
- [ ] Add `/tentang` page.
- [ ] Add empty/error/loading states.
- [ ] Add privacy tests for public timeline.

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

- [ ] Add `/admin/audit` page.
- [ ] Add `/admin/persetujuan` page if needed.
- [ ] Add filters and detail panel.
- [ ] Add tests for admin-only access.

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

- [ ] Add PDF export for current report.
- [ ] Add Excel export or document CSV-only decision.
- [ ] Add receipt/share page improvements.
- [ ] Add thank-you badge/share copy.
- [ ] Add tests for privacy in exported report.

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

- [ ] Add quick expense templates.
- [ ] Add CSV import with preview.
- [ ] Add validation errors per row.
- [ ] Add audit log for imports.
- [ ] Add tests for CSV validation.

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
