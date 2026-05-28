# Production Readiness Checklist — Jumat Berkah

Gunakan checklist ini sebelum atau sesudah deploy production. Jangan tulis secret asli di checklist hasil audit.

## 1. Build dan test

- [ ] `npm install` selesai tanpa error.
- [ ] `npm run db:generate` selesai.
- [ ] `npm run lint` passed.
- [ ] `npm test` passed.
- [ ] `npm run build` passed.
- [ ] Tidak ada warning secret lemah untuk production (`AUTH_SECRET`, `BETTER_AUTH_SECRET`, webhook secret, cron secret).

## 2. Database

- [ ] `DATABASE_URL` production menunjuk database benar.
- [ ] Migration production sudah diterapkan.
- [ ] Admin awal sudah dibuat dengan `npm run seed:admin` atau provisioning Better Auth admin.
- [ ] Backup otomatis aktif.
- [ ] Restore drill terakhir berhasil.
- [ ] Akses database dibatasi dari publik.

Smoke:

```bash
npm run db:generate
npm run seed:admin
```

## 3. Public routes

- [ ] `/` return `200`.
- [ ] `/donasi` return `200`.
- [ ] `/laporan` return `200`.
- [ ] `/laporan?period=jumat` return `200`.
- [ ] `/tentang` return `200`.
- [ ] `/login` return `200`.
- [ ] `/masuk` return `200`.
- [ ] `/admin` redirects guest to login.
- [ ] `/admin/donasi` rejects guest.
- [ ] `/admin/pengeluaran` rejects guest.

## 4. Privacy and financial rules

- [ ] Public report never shows donor email.
- [ ] Public report never shows donor phone.
- [ ] Anonymous/hidden donor displays as `Anonim`.
- [ ] Only `settlement` donations count as income.
- [ ] Pending/failed/refund donations do not count as active income.
- [ ] Expense create/update/delete writes audit log.
- [ ] Public balance = successful income - expenses.
- [ ] Print/PDF/CSV export totals match UI totals.

## 5. Midtrans

- [ ] `MIDTRANS_IS_PRODUCTION` matches key mode.
- [ ] `MIDTRANS_SERVER_KEY` set server-only.
- [ ] `MIDTRANS_CLIENT_KEY` set only where needed.
- [ ] `MIDTRANS_MERCHANT_ID` correct.
- [ ] `MIDTRANS_ENABLED_PAYMENTS` includes `qris`.
- [ ] Dashboard notification URL set to `https://your-domain.example.com/api/webhooks/midtrans`.
- [ ] Sandbox QRIS end-to-end passed before live.
- [ ] Live small-value QRIS test passed if approved.
- [ ] Invalid signature webhook logged but did not update donation.
- [ ] Duplicate webhook did not double count income.

## 6. Auth

- [ ] `AUTH_SECRET` strong.
- [ ] `BETTER_AUTH_SECRET` strong/high entropy.
- [ ] `BETTER_AUTH_URL` equals public origin.
- [ ] Google OAuth origins and redirect URIs match production domain.
- [ ] Admin Google/email login works.
- [ ] Donor Google/email login works.
- [ ] Legacy admin code login works if still enabled.
- [ ] Legacy donor code login works if still enabled.
- [ ] Donor role cannot access admin.
- [ ] Better Auth account without domain admin role cannot access admin.

## 7. Email / Resend

- [ ] `EMAIL_PROVIDER=resend` only when ready.
- [ ] `EMAIL_FROM` uses verified Resend domain/sender.
- [ ] `RESEND_API_KEY` stored server-only.
- [ ] `ADMIN_EMAIL_NOTIFICATIONS` recipients verified.
- [ ] Password reset email arrives.
- [ ] Settlement admin email arrives.
- [ ] Alert email failure does not break webhook/request.

## 8. Telegram

- [ ] `TELEGRAM_BOT_TOKEN` stored server-only.
- [ ] `TELEGRAM_WEBHOOK_SECRET` strong.
- [ ] Webhook registered to `/api/webhooks/telegram` with secret token.
- [ ] `TELEGRAM_ADMIN_CHAT_IDS` contains only authorized admin chats.
- [ ] `TELEGRAM_NOTIFY_ENABLED=true` only after destination confirmed.
- [ ] `TELEGRAM_NOTIFY_CHAT_ID` receives settlement and cron messages.
- [ ] `TELEGRAM_PUBLIC_CHANNEL_ID` uses `-100...` format.
- [ ] Bot is channel admin with post permission.
- [ ] `/saldo` works from allowlisted admin chat.
- [ ] `/pengeluaran ...` creates expense and audit log.
- [ ] `/broadcast_laporan` posts public report to channel.
- [ ] Unknown chat is rejected for admin commands.

## 9. Cron

- [ ] `CRON_SECRET` strong and server-only.
- [ ] Vercel/host cron configured for daily, weekly, donor reminder, health, and WhatsApp reminders as needed.
- [ ] Wrong cron secret returns unauthorized.
- [ ] Manual health cron succeeds.
- [ ] Daily/weekly messages are not duplicated unexpectedly.

Manual smoke:

```bash
curl -H "X-Cron-Secret: YOUR_CRON_SECRET" \
  https://your-domain.example.com/api/cron/telegram/health
```

## 10. WhatsApp reminder

- [ ] Consent copy visible on donation form.
- [ ] Existing donors default non-opt-in.
- [ ] `WHATSAPP_REMINDER_ENABLED` remains `false` until token/template ready.
- [ ] `WHATSAPP_CLOUD_ACCESS_TOKEN` stored server-only.
- [ ] `WHATSAPP_CLOUD_PHONE_NUMBER_ID` correct.
- [ ] Template approved in Meta dashboard.
- [ ] Dry-run endpoint returns masked phones only.
- [ ] Live send tested with opted-in internal number first.

## 11. Receipt storage

- [ ] Private receipt bucket configured if feature enabled.
- [ ] Signed URL secret strong.
- [ ] Receipt links expire.
- [ ] Tampered receipt links rejected.
- [ ] Public report never links private receipt directly.

## 12. Admin operations

- [ ] `/admin/donasi` filters work.
- [ ] `/admin/donatur` search/detail works and shows consent state.
- [ ] `/admin/pengeluaran` create/edit/delete works.
- [ ] CSV import preview and all-or-nothing import works.
- [ ] `/admin/penyaluran` draft/publish works.
- [ ] `/admin/audit` filters work.
- [ ] `/admin/persetujuan` shows approval timeline/pending large expenses.
- [ ] Weekly target form saves current Jumat cycle target.

## 13. Report/export/print

- [ ] `/laporan?period=jumat` total income/expense/balance correct.
- [ ] Expense category chart visible on mobile.
- [ ] Timeline transparansi visible and public-safe.
- [ ] Published distribution story appears.
- [ ] Print preview A4 clean.
- [ ] PDF export downloads and opens.
- [ ] CSV export downloads and opens.
- [ ] Email/phone absent from UI/print/PDF/CSV.

## 14. Deployment and tunnel

- [ ] Public HTTPS domain resolves.
- [ ] Cloudflare Tunnel container/process managed by documented runbook.
- [ ] Local origin health OK.
- [ ] Public health smoke OK.
- [ ] Tunnel auto-heal script installed if using shared server tunnel.
- [ ] Logs accessible without exposing secrets.
- [ ] Restart/deploy steps documented for operator.

## 15. Known blockers before final sign-off

- [ ] Telegram public channel smoke: requires `TELEGRAM_PUBLIC_CHANNEL_ID=-100...`, bot admin status, and post permission.
- [ ] Production `BETTER_AUTH_SECRET` strong enough to remove local warning.
- [ ] Any provider live-mode credentials tested in sandbox first.

## 16. Final sign-off evidence

Record evidence without secrets:

- Date/time.
- Commit/deploy identifier.
- Validation command outputs summary.
- Smoke test routes and status codes.
- Provider smoke result names only, no tokens.
- Remaining blockers or accepted risks.
