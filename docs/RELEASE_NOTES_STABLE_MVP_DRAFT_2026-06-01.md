# Release Notes — Stable MVP Draft

Date: 2026-06-01
Tag: TBD
Status: draft for Phase 45 (`Stable MVP Launch Validation`)

## Summary

Jumat Berkah has reached stable-MVP draft status from code and local validation perspective. Core public donation flow, admin operations, transparency reporting, donor account flow, Telegram operational features, weekly target tracking, distribution story publishing, export/reporting, and launch hardening work are present in repository and pass automated validation.

Stable launch decision is still gated by final live-provider smoke and production evidence capture.

## Highlights

### Public donation and transparency
- Public landing, donation, report, and about pages use consistent craft UI.
- Donation checkout supports Midtrans Snap popup with safe fallback redirect.
- Donation status remains server-trusted through Midtrans webhook, not browser callback.
- Public report exposes only safe donor display data and keeps privacy rules (`Anonim`, no email/phone).
- Weekly target progress and Friday-cycle reporting are live in public surfaces.
- Distribution story now has dedicated public story pages at `/cerita/[id]` with SEO metadata, share metadata, previous/next navigation, and default photo fallback.

### Admin operations
- Admin dashboard, donation list, donor database, expense management, approvals, audit log, exports, and system-status pages are available.
- Admin table UX has been standardized across major operational pages.
- Manual admin donation status sync with Midtrans exists for delayed/missed webhook recovery.
- Expense receipt upload, audit logging, export, and import workflows are included.

### Donor accounts
- Optional donor auth supports Google and email/password with email verification.
- Donor dashboard, profile management, password change/reset, and donation history are available.
- Guest donation linking to verified donor account is supported.

### Messaging and automation
- Telegram foundation, admin commands, donor self-service, public commands, alerts, and weekly/broadcast automations are implemented.
- WhatsApp reminder foundation and admin-controlled send path are implemented behind provider config.
- Email notification flows for password reset and settlement/admin alerts are implemented.

### Ops and launch hardening
- Backup/restore scripts and runbooks are in repo.
- Deployment, env setup, production checklist, and live provider smoke runbook are documented.
- Better Auth migration completed with domain-role enforcement for admin access.

## Validation

Latest local validation completed in Phase 45:

```sh
npm run lint
npm test
npm run build
```

Result:
- `npm run lint` ✅
- `npm test` ✅ (`155/155` passing)
- `npm run build` ✅

## Launch blockers before stable tag

Stable tag must not be created until these are resolved or explicitly accepted with owner/impact:

1. **Real deployment target + production admin login + env confirmation**
   - Domain may be prepared, but app is not deployed live yet. Launch validation cannot begin until deployed target exists, admin login can be tested there, and secret-bearing env review can be completed.
2. **Midtrans live QRIS smoke**
   - Need real production payment and settlement webhook verification.
3. **Telegram public channel broadcast smoke**
   - Need `TELEGRAM_PUBLIC_CHANNEL_ID=-100...` plus bot admin/post permission.
4. **WhatsApp live template smoke**
   - Need production credentials, approved template, and internal test recipient.
5. **Backup/restore production evidence**
   - Need fresh backup file, checksum verification, and restore drill evidence.

## Recommended tag decision

Current recommendation: **Hold stable tag** until Phase 45 live smoke checklist in `docs/LIVE_PROVIDER_SMOKE_RUNBOOK.md` is completed.

As of 2026-06-01, app is still pre-deploy. Live-provider smoke, admin login, and production env confirmation all require real deployment plus operator-run evidence.

If all live checks pass, convert this draft into final stable release notes and create stable launch tag.

## Notes

- This draft reflects repository state and latest local validation evidence.
- It is not yet proof of full live-provider production readiness.
- Final release notes should append live smoke evidence summary and actual tag name.
