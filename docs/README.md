# Documentation

This directory contains public, reusable documentation for running and maintaining Jumat Berkah.

## Start Here

- `FEATURES.md` — product feature map, main routes, and smoke tests.
- `ENV_SETUP.md` — local, sandbox, and production environment variables.
- `PRODUCTION_CHECKLIST.md` — production readiness checklist.
- `../README.md` — project overview and quick start.

## Product and Architecture

- `../PRD.md` — product requirements and acceptance criteria.
- `../TECHNICAL_SPEC.md` — architecture, database model, APIs, security, and business rules.

## Authentication

- `BETTER_AUTH_SETUP.md` — Better Auth and Google OAuth setup.

## Security

- `SECURITY_TESTING.md` — test layers, commands, and manual security checklist.
- `CSP_REPORT_ONLY.md` — report-only CSP, allowlist rationale, report logs, and enforcement path.
- `PREFLIGHT_SMOKE_RUNBOOK.md` — post-deploy smoke checks for guards, headers, and rate limits.
- `DEPLOY_SMOKE_CHECKLIST.md` — urutan smoke pasca-deploy termasuk alur Snap.js dan webhook.

## Operations

- `BACKUP_RESTORE_RUNBOOK.md` — PostgreSQL backup and restore drill.
- `SECRET_ROTATION_RUNBOOK.md` — secret rotation after leaks, handoff, or pre-launch review.
- `REPORT_EXPORTS.md` — public/admin report export behavior.

## Production Notes

Use `PRODUCTION_CHECKLIST.md` before production launch. Keep real deployment credentials, private server notes, and operator-only smoke results outside the public repository.

## Security Reminder

Never commit real secrets, private donor data, or deployment credentials. Public reports must never expose donor email or phone.
