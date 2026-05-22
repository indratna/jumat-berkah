# Implementation Plan — Jumat Berkah

## 1. Purpose

Dokumen ini adalah checklist eksekusi dan progress tracker untuk membangun aplikasi Jumat Berkah dengan bantuan AI builder/vibe coder.

AI harus bekerja per fase. Jangan loncat fase. Jangan menandai selesai sebelum acceptance criteria dan validation pass.

## 2. Progress Tracker

### Current Status

Current Phase: Phase 10 — Export, QA, Deploy  
Overall Progress: 99%  
Last Updated: 2026-05-21  
Current Focus: Phase 10 complete except staging deployment  
Blockers: Staging deployment target not configured in this environment

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
| Phase 10 | Export, QA, Deploy | Blocked | 90% |
| Phase 11 | Telegram Expense Bot & Cloudflare Setup | Not Started | 0% |

Status values:

```txt
Not Started
In Progress
Blocked
Done
```

## 3. Work Log

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
| 2026-05-21 | Staging deployment target not configured in this environment | Cannot deploy staging from this environment | Prepared deploy checklist and completed ngrok-based public sandbox validation; needs user-provided staging host/project credentials |

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

# Phase 11 — Telegram Expense Bot & Cloudflare Setup

## Goal

Allow admins to record expenses from Telegram securely, and prepare Cloudflare configuration for domain, DNS, TLS, and webhook reliability.

## Tasks

- [ ] Add Telegram bot environment variables to `.env.example`.
- [ ] Define Telegram admin allowlist strategy using chat IDs.
- [ ] Create `POST /api/webhooks/telegram` endpoint.
- [ ] Verify Telegram webhook secret token.
- [ ] Validate Telegram sender `chat_id` against admin allowlist.
- [ ] Parse expense command format.
- [ ] Validate expense date, category, amount, description, vendor, and optional receipt URL.
- [ ] Create expense record from valid Telegram command.
- [ ] Create audit log for Telegram-created expense.
- [ ] Return clear Telegram reply messages for success and validation errors.
- [ ] Add tests for Telegram command parsing.
- [ ] Add tests for unauthorized Telegram chat rejection.
- [ ] Add tests for Telegram expense audit log behavior where practical.
- [ ] Document Telegram bot setup steps.
- [ ] Add Cloudflare DNS setup notes.
- [ ] Add Cloudflare TLS/SSL mode notes.
- [ ] Add Cloudflare webhook URL setup notes for Midtrans and Telegram.
- [ ] Add Cloudflare security notes for bot/webhook endpoints.
- [ ] Validate webhook endpoint through public Cloudflare domain.

## Acceptance Criteria

- Only allowed Telegram admin chat IDs can create expenses.
- Invalid Telegram webhook secret is rejected.
- Invalid command format does not create expense.
- Valid Telegram expense creates expense and audit log.
- Expense appears in admin expense page and public report.
- Cloudflare setup docs are complete enough for deployment.
- Midtrans and Telegram webhook URLs are documented for Cloudflare domain.

## Validation

Run:

```bash
npm run lint
npm run build
npm test
```

Manual/API check:

- Send valid Telegram expense command from allowed admin chat.
- Send command from unauthorized chat.
- Send invalid command format.
- Verify expense appears in `/admin/pengeluaran`.
- Verify public report balance updates.
- Verify webhook URLs work through Cloudflare domain.
