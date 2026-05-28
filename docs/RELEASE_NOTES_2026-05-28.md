# Release Notes — 2026-05-28

Tag: `v2026.05.28`
Status: pre-stable internal release candidate

## Summary

This release candidate prepares Jumat Berkah for GitHub publishing after the Phase 39 UI refresh and pre-push cleanup pass.

## Highlights

- Applied InApp-inspired UI refresh across public, auth/account, and admin surfaces.
- Kept backend logic, auth behavior, payment flow, webhook handling, database schema, financial calculations, and provider integrations unchanged.
- Cleaned local development artifacts before push.
- Hardened `.gitignore` for repeatable local/generated artifacts.
- Added design and implementation planning docs under `docs/superpowers/`.
- Updated `IMPLEMENTATION_PLAN.md` Work Log with validation results.

## Validation

Passed on 2026-05-28:

```sh
npm run lint
npm test
npm run build
```

Test result: `98/98` passing.

## Known Follow-ups

- Set high-entropy production `BETTER_AUTH_SECRET`.
- Run live Midtrans QRIS smoke with production credentials.
- Run Telegram public channel broadcast smoke after `TELEGRAM_PUBLIC_CHANNEL_ID=-100...` and bot admin/post permission are configured.
- Run WhatsApp live template send after provider credentials/templates are configured.

## Notes

This is not marked as stable product release. Use it as an internal date-based checkpoint before deeper future refactors.
