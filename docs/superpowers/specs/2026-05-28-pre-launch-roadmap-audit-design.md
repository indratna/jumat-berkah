# Pre-Launch Roadmap and MVP Audit Design

Date: 2026-05-28
Status: Approved for planning

## Goal

Add a safe pre-launch roadmap to Jumat Berkah before stable MVP launch, starting with an audit-first phase before dashboard polish, security fixes, targeted refactor, and final launch validation.

## Context

The current implementation plan is complete through Phase 39. The repository has a date-based internal checkpoint tag, `v2026.05.28`, and known production follow-ups remain for provider smoke tests and production secret hardening.

The next work should not jump directly into UI changes or deep refactoring. A launch-readiness audit should identify real blockers first, then guide fixes and refactors.

## Scope

This planning pass will update `IMPLEMENTATION_PLAN.md` only. It will not change application code, database schema, API routes, auth behavior, Midtrans payment/webhook behavior, financial calculations, provider integrations, or UI layout.

## Roadmap

### Phase 40 — MVP Launch Readiness Audit

Audit the app before making more changes. Review security, privacy, production config, provider readiness, operational safety, and launch blockers.

Expected output:

- Security/privacy/ops/provider audit notes.
- Launch blockers with impact and recommended resolution.
- Go/no-go notes for stable MVP launch.
- Clear handoff into dashboard polish, blocker fixes, or refactor work.

### Phase 41 — Dashboard Layout Final Polish

Make small final admin dashboard layout improvements after audit scope is known.

Expected output:

- UI-only layout polish.
- No API, route, database, auth, payment, webhook, or business-rule changes.
- Manual responsive review for admin dashboard pages.

### Phase 42 — Security and Launch Blocker Fixes

Fix critical and high-priority issues found during Phase 40.

Expected output:

- Production secret and env hardening.
- Auth/admin guard verification.
- Webhook and cron protection verification.
- Privacy leak checks.
- Payment and financial safety checks.
- Tests or documentation for fixed blockers.

### Phase 43 — Targeted Refactor

Refactor only after audit findings are known and launch blockers are addressed.

Expected output:

- Split large files where it improves safety.
- Centralize reusable admin UI components or server utilities only where duplication is clear.
- Strengthen tests around refactored behavior.
- Keep behavior unchanged unless explicitly required by earlier phases.

### Phase 44 — Stable MVP Launch Validation

Run final validation and live-provider smoke tests before stable MVP launch.

Expected output:

- Final lint, test, and build results.
- Midtrans live QRIS smoke result.
- Telegram public channel smoke result.
- WhatsApp live template smoke result.
- Backup/restore readiness check.
- Stable release notes and launch tag decision.

## Risk Controls

- Do not mix audit, UI polish, security fixes, refactor, and launch validation in one phase.
- Start with documentation and audit before code changes.
- Do not change money, privacy, auth, or payment behavior without explicit phase scope and validation.
- Keep live provider requirements visible as blockers until verified.
- Maintain `IMPLEMENTATION_PLAN.md` as source of truth.

## Validation for This Planning Pass

Because this pass only changes planning documentation:

```sh
npm run lint
npm test
npm run build
git --no-pager diff -- IMPLEMENTATION_PLAN.md
```

## Success Criteria

- `IMPLEMENTATION_PLAN.md` contains Phase 40 through Phase 44.
- Current phase is set to Phase 40 with audit-first focus.
- Existing completed Phase 0–39 history remains intact.
- Work Log records the roadmap planning update.
- No application behavior changes are made during this planning pass.
