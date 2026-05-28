# Pre-Launch Roadmap and MVP Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `IMPLEMENTATION_PLAN.md` with Phase 40–44 so Jumat Berkah moves toward stable MVP launch through audit-first planning.

**Architecture:** This is a documentation-only planning change. It updates the progress tracker, phase table, work log, and appends five new phase definitions while preserving completed Phase 0–39 history and avoiding application behavior changes.

**Tech Stack:** Markdown documentation, Git, existing npm validation scripts.

---

## File Structure

Expected files to modify or inspect:

- Modify: `JumatBerkah/IMPLEMENTATION_PLAN.md` — add Phase 40–44 roadmap and set current phase to Phase 40.
- Inspect: `JumatBerkah/docs/superpowers/specs/2026-05-28-pre-launch-roadmap-audit-design.md` — approved design source.
- Inspect only: application source files — confirm they remain unchanged by this planning pass.

Do not modify application code, database schema, API routes, auth behavior, payment/webhook behavior, report calculations, provider integrations, or UI layout during this plan.

---

### Task 1: Snapshot Current Documentation State

**Files:**
- Inspect: `JumatBerkah/IMPLEMENTATION_PLAN.md`
- Inspect: `JumatBerkah/docs/superpowers/specs/2026-05-28-pre-launch-roadmap-audit-design.md`

- [ ] **Step 1: Confirm working tree is clean before planning edit**

Run:

```sh
git --no-pager status --short
```

Expected: no output. If there are changes, stop and inspect before editing.

- [ ] **Step 2: Confirm latest phase is Phase 39**

Run:

```sh
git --no-pager grep -n "Phase 39" IMPLEMENTATION_PLAN.md
```

Expected: output includes `Phase 39 — InApp-Inspired UI Refresh` in the progress tracker and phase body.

- [ ] **Step 3: Confirm approved design exists**

Run:

```sh
test -f docs/superpowers/specs/2026-05-28-pre-launch-roadmap-audit-design.md && echo ok
```

Expected:

```txt
ok
```

---

### Task 2: Update Progress Tracker to Phase 40

**Files:**
- Modify: `JumatBerkah/IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Update Current Status block**

Replace the Current Status lines with:

```markdown
Current Phase: Phase 40 — MVP Launch Readiness Audit  
Overall Progress: 100%  
Last Updated: 2026-05-28  
Current Focus: Phase 40 starts the stable MVP launch path with an audit-first pass across security, privacy, production configuration, provider readiness, operational safety, and launch blockers before any dashboard polish or refactor work.
Blockers: Live provider smoke remains required: Telegram public channel broadcast needs `TELEGRAM_PUBLIC_CHANNEL_ID=-100...` plus bot admin/post permission; production `BETTER_AUTH_SECRET` must be high entropy; Midtrans live QRIS and WhatsApp live send need provider credentials/templates.
```

Expected: Current Phase points to Phase 40, but existing blockers stay visible.

- [ ] **Step 2: Add Phase 40–44 rows after Phase 39 in Phase Progress table**

Add these rows:

```markdown
| Phase 40 | MVP Launch Readiness Audit | In Progress | 0% |
| Phase 41 | Dashboard Layout Final Polish | Not Started | 0% |
| Phase 42 | Security & Launch Blocker Fixes | Not Started | 0% |
| Phase 43 | Targeted Refactor | Not Started | 0% |
| Phase 44 | Stable MVP Launch Validation | Not Started | 0% |
```

Expected: Phase 0–39 rows remain unchanged.

---

### Task 3: Add Work Log Entry

**Files:**
- Modify: `JumatBerkah/IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Add work log entry at top of `### 2026-05-28`**

Add:

```markdown
- Added pre-launch roadmap for Phase 40–44 after the `v2026.05.28` internal checkpoint. Chose audit-first execution before dashboard layout polish, security fixes, targeted refactor, and stable MVP launch validation. No application code, routes, API behavior, auth/payment/webhook/database logic, financial calculations, provider integrations, or UI layout changed in this planning pass.
```

Expected: new entry appears above the pre-push cleanup entry.

---

### Task 4: Append Phase 40 Definition

**Files:**
- Modify: `JumatBerkah/IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Append Phase 40 section after Phase 39**

Append:

```markdown
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

- [ ] Review security-sensitive env and documentation placeholders.
- [ ] Review admin/auth guard coverage for admin pages and APIs.
- [ ] Review Midtrans webhook signature and idempotency path.
- [ ] Review cron and Telegram webhook protection.
- [ ] Review public privacy boundaries for reports, exports, donor names, and notifications.
- [ ] Review financial calculation and audit-log rules against `TECHNICAL_SPEC.md`.
- [ ] Review production runbooks, backup/restore docs, and provider smoke prerequisites.
- [ ] Create launch readiness audit document under `docs/`.
- [ ] Update Blockers, Decision Log, and Work Log with audit findings.

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
```

Expected: Phase 40 is audit-only and has clear validation.

---

### Task 5: Append Phase 41–44 Definitions

**Files:**
- Modify: `JumatBerkah/IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Append Phase 41 section**

Append:

```markdown
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

- [ ] Identify dashboard layout changes from Phase 40 findings and user review.
- [ ] Update dashboard UI with minimal component changes.
- [ ] Preserve existing route, API, and data behavior.
- [ ] Run automated validation.
- [ ] Manually review admin dashboard responsiveness.
- [ ] Update Work Log.

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
```

- [ ] **Step 2: Append Phase 42 section**

Append:

```markdown
# Phase 42 — Security & Launch Blocker Fixes

## Goal

Fix critical and high-priority launch blockers found during Phase 40.

## Scope

In-scope:

- Production secret/env hardening.
- Admin guard, webhook, cron, privacy, payment-safety, and financial audit-log fixes when identified by Phase 40.
- Tests and documentation for each fixed blocker.

Out-of-scope:

- Cosmetic UI polish unrelated to blockers.
- Deep refactor not required to fix a blocker.
- New product features.

## Tasks

- [ ] Prioritize Phase 40 blockers by launch impact.
- [ ] Fix only critical/high blockers approved for this phase.
- [ ] Add or update tests for fixed security/privacy/payment behavior.
- [ ] Update docs and `.env.example` if configuration behavior changes.
- [ ] Run automated validation.
- [ ] Update Blockers, Decision Log, and Work Log.

## Acceptance Criteria

- Critical/high launch blockers from Phase 40 are fixed or explicitly documented as external/live-provider dependencies.
- Security/privacy/payment fixes have tests or documented manual verification.
- No unrelated refactor or feature scope enters this phase.

## Validation

```bash
npm run lint
npm test
npm run build
```

Manual: verify each fixed blocker using the reproduction or audit check documented in Phase 40.
```

- [ ] **Step 3: Append Phase 43 section**

Append:

```markdown
# Phase 43 — Targeted Refactor

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

- [ ] Identify refactor candidates from Phase 40 and Phase 42 notes.
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
```

- [ ] **Step 4: Append Phase 44 section**

Append:

```markdown
# Phase 44 — Stable MVP Launch Validation

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
```

Expected: Phase 41–44 are sequential and scoped.

---

### Task 6: Verify Documentation Diff and Validate Repository

**Files:**
- Inspect: `JumatBerkah/IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Review plan diff**

Run:

```sh
git --no-pager diff -- IMPLEMENTATION_PLAN.md
```

Expected: only progress tracker, work log, and Phase 40–44 additions changed.

- [ ] **Step 2: Run lint**

Run:

```sh
npm run lint
```

Expected: pass.

- [ ] **Step 3: Run tests**

Run:

```sh
npm test
```

Expected: all tests pass. Latest baseline: `98/98`.

- [ ] **Step 4: Run build**

Run:

```sh
npm run build
```

Expected: build passes. Existing local `BETTER_AUTH_SECRET` entropy warning may appear and remains a production blocker.

---

### Task 7: Commit Roadmap Planning Update

**Files:**
- Modify: `JumatBerkah/IMPLEMENTATION_PLAN.md`
- Create: `JumatBerkah/docs/superpowers/plans/2026-05-28-pre-launch-roadmap-audit.md`

- [ ] **Step 1: Stage documentation files**

Run:

```sh
git add IMPLEMENTATION_PLAN.md docs/superpowers/plans/2026-05-28-pre-launch-roadmap-audit.md
```

Expected: only documentation files are staged.

- [ ] **Step 2: Review staged diff stat**

Run:

```sh
git --no-pager diff --cached --stat
```

Expected: staged changes are documentation only.

- [ ] **Step 3: Commit**

Run:

```sh
git commit -m "Add pre-launch roadmap phases"
```

Expected: commit succeeds.

- [ ] **Step 4: Confirm clean tree**

Run:

```sh
git --no-pager status --short
```

Expected: no output.

---

## Self-Review

Spec coverage:

- Phase 40 audit-first roadmap: Task 4.
- Phase 41 dashboard polish: Task 5 Step 1.
- Phase 42 security/blocker fixes: Task 5 Step 2.
- Phase 43 targeted refactor: Task 5 Step 3.
- Phase 44 stable MVP launch validation: Task 5 Step 4.
- Progress tracker and current phase update: Task 2.
- Work Log update: Task 3.
- Documentation-only constraint: File Structure, Task 6, and Task 7.

Placeholder scan:

- No `TBD`, `TODO`, or incomplete placeholders remain.
- Every command and expected output is explicit.

Type consistency:

- No application types or runtime APIs are introduced by this plan.
