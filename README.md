# Jumat Berkah

Aplikasi web donasi Jumat Berkah untuk donasi QRIS Midtrans dan laporan pemasukan/pengeluaran transparan.

## Documentation

- `AGENTS.md` — aturan kerja AI builder.
- `PRD.md` — scope produk dan acceptance criteria.
- `TECHNICAL_SPEC.md` — arsitektur, database, API, payment, security.
- `IMPLEMENTATION_PLAN.md` — phase checklist dan progress tracker.

## Getting Started

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Main Routes

- `/` — landing program.
- `/donasi` — form donasi publik.
- `/donasi/status/[orderId]` — status pembayaran donasi.
- `/laporan` — laporan publik pemasukan, pengeluaran, dan saldo.
- `/masuk` — login opsional donatur.
- `/akun/donasi` — riwayat donasi pribadi.
- `/login` — login admin.
- `/admin` — dashboard admin.
- `/admin/donasi` — daftar dan filter donasi admin.
- `/admin/pengeluaran` — manajemen pengeluaran.
- `/api/admin/reports/export` — export CSV admin.

## Validation

```bash
npm run lint
npm run build
npm test
```

## Environment

Copy `.env.example` to `.env.local` for local development and replace placeholders with real local/sandbox values.

Never commit real `.env` files.

Required deployment values:

- `DATABASE_URL`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`
- `MIDTRANS_MERCHANT_ID`
- `MIDTRANS_ENABLED_PAYMENTS`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_NAME`
- `DONOR_LOGIN_CODE`
- `TELEGRAM_BOT_TOKEN` (optional, required for Telegram features)
- `TELEGRAM_WEBHOOK_SECRET` (optional, required for Telegram features)
- `TELEGRAM_ADMIN_CHAT_IDS` (optional, comma-separated allowlist)
- `TELEGRAM_NOTIFY_CHAT_ID` (optional, single chat for settlement notifications)
- `TELEGRAM_NOTIFY_ENABLED` (optional, set to `true` to enable settlement notifications and cron alerts)
- `CRON_SECRET` (optional, required for Telegram cron endpoints)
- `TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH` (optional, integer Rupiah threshold for low-balance alert)
- `TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES` (optional, default `30`)
- `RECEIPT_STORAGE_BUCKET` (optional, private receipt bucket name)
- `RECEIPT_STORAGE_BASE_URL` (optional, app base URL for signed receipt links)
- `RECEIPT_SIGNED_URL_SECRET` (optional, required for signed receipt links)
- `RECEIPT_STORAGE_PUT_URL` (optional, storage PUT URL template containing `{key}`)
- `EXPENSE_APPROVAL_THRESHOLD_RUPIAH` (optional, large expense approval threshold)
- `EXPENSE_APPROVAL_REQUIRED_COUNT` (optional, default `2`)

## Telegram Bot Setup

The Telegram bot delivers donation settlement notifications, accepts admin
commands from allowlisted chats, and can send cron-based summaries/alerts. All
Telegram features are opt-in: leaving the related env vars empty disables them
safely.

1. Create a bot with [@BotFather](https://t.me/BotFather), copy the token to
   `TELEGRAM_BOT_TOKEN`.
2. Generate a strong random `TELEGRAM_WEBHOOK_SECRET`. Telegram echoes this
   value in the `X-Telegram-Bot-Api-Secret-Token` request header so the server
   can verify the source.
3. Get every admin chat ID (numeric) and put them in `TELEGRAM_ADMIN_CHAT_IDS`,
   comma-separated. Only these chats may run write commands.
4. Pick the chat that should receive donation settlement notifications and set
   `TELEGRAM_NOTIFY_CHAT_ID` to that chat ID. To turn notifications on, set
   `TELEGRAM_NOTIFY_ENABLED="true"`.
5. Register the webhook with Telegram (run once after deploy):

   ```bash
   curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://your-domain.example.com/api/webhooks/telegram",
       "secret_token": "YOUR_TELEGRAM_WEBHOOK_SECRET",
       "allowed_updates": ["message"]
     }'
   ```

6. Test from an allowlisted admin chat:

   ```
   /pengeluaran 2026-05-22 | Beras | 300000 | 30 kg beras | Pasar Senen
   ```

   The bot replies with a confirmation and creates an expense plus audit log.

### Telegram Cron Setup

Phase 14 uses HTTP cron endpoints protected by `X-Cron-Secret` or Vercel Cron `Authorization: Bearer $CRON_SECRET`. Decision:
prefer Vercel Cron for hosted Next.js deployment because it can call App Router
endpoints directly and keep scheduling config near deployment. Cloudflare Cron
can also call the same URLs if deployment platform is not Vercel.

Cron endpoints:

- `GET /api/cron/telegram/daily` — daily summary plus low-balance, pending donation, and invalid Midtrans signature alerts.
- `GET /api/cron/telegram/weekly` — weekly Friday-morning recap.
- `GET /api/cron/telegram/donor-reminder` — Friday donor reminder for opted-in donors.
- `GET /api/cron/telegram/health` — health check and operational alert.

Required env for cron alerts:

- `CRON_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_NOTIFY_CHAT_ID`
- `TELEGRAM_NOTIFY_ENABLED=true`

Optional env:

- `TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH=500000`
- `TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES=30`

Manual trigger example:

```bash
curl -H "X-Cron-Secret: YOUR_CRON_SECRET" \
  https://your-domain.example.com/api/cron/telegram/daily
```

Suggested Vercel cron schedule:

```json
{
  "crons": [
    { "path": "/api/cron/telegram/daily", "schedule": "0 0 * * *" },
    { "path": "/api/cron/telegram/weekly", "schedule": "0 0 * * 5" }
  ]
}
```

Times are UTC. `0 0` UTC is 07:00 WIB.

Alert behavior:

- Daily summary sends at most once per Jakarta date, tracked in `audit_logs`.
- Low-balance alert sends once after balance is below configured threshold.
- Pending donation alert sends once per donation when status stays `pending` for more than 1 hour.
- Invalid Midtrans signature alert is rate-limited by `TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES`.

### Telegram Donor Self-Service

Phase 16 lets logged-in donors opt in to Telegram self-service.

Donor setup:

1. Donor logs in and opens `/akun/donasi`.
2. Page shows one-time command `/mulai <kode>`.
3. Donor sends command to bot. Bot binds Telegram chat to donor account.

Supported donor commands:

- `/mulai <kode>` — bind Telegram chat to donor account.
- `/donasi <nominal>` — create Midtrans QRIS/Snap transaction linked to donor account.
- `/status <orderId>` — check own donation only.
- `/riwayat` — show latest own donations only.
- `/reminder on` — opt in Friday informational reminder.
- `/reminder off` — opt out.

Reminder cron:

- `GET /api/cron/telegram/donor-reminder`
- Protected by `X-Cron-Secret` / `CRON_SECRET`.
- Sends only on Friday in Asia/Jakarta and once per date.
- Reminder is informational only; donor still must create/pay donation manually via Midtrans.

Suggested Vercel cron addition:

```json
{ "path": "/api/cron/telegram/donor-reminder", "schedule": "0 0 * * 5" }
```

### Receipt Photo & Approval Setup

Phase 15 supports Telegram receipt photos and approval for large expenses.

Receipt flow:

1. Admin creates expense via `/pengeluaran`.
2. Admin sends photo with caption `/struk <expenseId>` or replies to bot message that contains `ID: <expenseId>`.
3. App stores private receipt reference in `expenses.receipt_url` and writes `expense.receipt_attached` audit log.

Approval flow:

- Set `EXPENSE_APPROVAL_THRESHOLD_RUPIAH` to require approval for large expenses.
- Set `EXPENSE_APPROVAL_REQUIRED_COUNT` for distinct Telegram admin approvals needed.
- Large Telegram-created expense starts as `pending_approval` and does not count in public reports, dashboard balance, CSV export, or Telegram balance until approved.
- Approval callback writes `expense.approved` audit logs.

Storage notes:

- `RECEIPT_STORAGE_PUT_URL` may contain `{key}` for a private object-storage upload endpoint/presigned PUT template.
- If `RECEIPT_STORAGE_PUT_URL` is empty, app stores a private receipt pointer only. Use real R2/S3 PUT URL in staging/production for actual file upload.
- Signed receipt URL helpers use `RECEIPT_SIGNED_URL_SECRET`; admin receipt proxy route can be added later if dashboard preview needs direct file access.

### Privacy notes

- Settlement notifications use public-safe donor names (`Anonim` for anonymous
  or hidden donors) and never include email or phone.
- Telegram outages do not affect Midtrans webhook processing or donation
  status; notifications are fire-and-forget.

## Cloudflare Setup Notes

Use Cloudflare in front of the deployed app to terminate TLS, manage DNS, and
harden webhook endpoints. Decisions specific to platform credentials (Vercel,
Fly.io, etc.) belong with the operator; the notes below are platform-agnostic.

### DNS

- Create an A or CNAME record pointing the production domain (e.g. `app.example.com`) to the hosting platform.
- Keep the record proxied (orange cloud) to gain TLS, caching, and WAF.
- For the Midtrans webhook, no separate subdomain is required; reuse the main app domain.
- For Telegram, Telegram only requires HTTPS on port 443/8443; the proxied Cloudflare endpoint satisfies this.

### TLS / SSL Mode

- Set SSL mode to `Full (strict)`. Cloudflare and the origin both use valid certificates.
- Enable `Always Use HTTPS` so HTTP webhook attempts are upgraded.
- Enable `HTTP Strict Transport Security` after verifying the site works on HTTPS.

### Webhook URLs

- Midtrans webhook URL to register in Midtrans dashboard:
  `https://app.example.com/api/webhooks/midtrans`
- Telegram webhook URL to register via `setWebhook`:
  `https://app.example.com/api/webhooks/telegram`

### Security Notes for Bot/Webhook Endpoints

- Do not place webhooks behind Cloudflare Access or Bot Fight Mode aggressive rules; both providers must be able to call the endpoint without challenge.
- Use Cloudflare Page Rules or WAF custom rules to disable the JS challenge and "Bot Fight Mode" for `/api/webhooks/*` paths.
- Allow `POST` only on webhook routes via WAF if desired.
- Both webhooks already verify their own signatures/secrets server-side, so do not rely on Cloudflare alone for trust.
- Forward only `X-Telegram-Bot-Api-Secret-Token` and standard headers; some hosts require explicit allowlisting.

## Production Deployment Checklist

1. Configure production database and apply Prisma migrations.
2. Configure production Midtrans keys on host.
3. Set `NEXT_PUBLIC_APP_URL` to public HTTPS app URL.
4. Register Midtrans webhook URL: `/api/webhooks/midtrans`.
5. Generate strong `AUTH_SECRET`.
6. Create first admin with `npm run seed:admin` after setting admin env values.
7. Run `npm run lint`, `npm run build`, and `npm test` before release.
8. Test public donation, webhook settlement, public report, admin login, expense management, and CSV export on staging.
9. Before production QRIS launch, test small payment if allowed by Midtrans account policy.

## Telegram Operational & Security Alerts

Phase 18 adds opt-in Telegram alerts using the existing notify chat. Required base env remains:

```env
TELEGRAM_NOTIFY_ENABLED=true
TELEGRAM_BOT_TOKEN=replace-with-bot-token
TELEGRAM_NOTIFY_CHAT_ID=-1000000000000
CRON_SECRET=replace-with-strong-secret
```

Optional alert tuning:

```env
TELEGRAM_FAILED_LOGIN_ALERT_THRESHOLD=5
TELEGRAM_FAILED_LOGIN_ALERT_WINDOW_MINUTES=15
TELEGRAM_ALERT_COOLDOWN_MINUTES=30
TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH=500000
```

Alert behavior:

- Repeated failed admin login writes `admin.login.failed` audit rows and sends Telegram alert after configured threshold/window.
- Expense delete always triggers critical audit alert.
- Expense create triggers critical audit alert only when amount is at or above `TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH`.
- Health check endpoint `GET /api/cron/telegram/health` requires `X-Cron-Secret: $CRON_SECRET` and alerts on database access failure or missing required env (`MIDTRANS_SERVER_KEY`, `ADMIN_LOGIN_CODE`).
- All alerts use `TELEGRAM_ALERT_COOLDOWN_MINUTES` to avoid spam.

Manual health trigger example:

```bash
curl -H "X-Cron-Secret: replace-with-strong-secret" https://your-domain.example/api/cron/telegram/health
```

