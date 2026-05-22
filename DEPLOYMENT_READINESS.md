# Deployment Readiness — Jumat Berkah

Last reviewed: 2026-05-22

## Status Summary

Codebase is build-ready for deployment packaging, but production release is still blocked until real hosting, database, domain, Midtrans production credentials, and optional Telegram credentials are configured and smoke-tested.

| Area | Status | Notes |
|---|---|---|
| Next.js build | Ready | `npm run build` passes locally. |
| TypeScript/lint/tests | Ready | `npm run lint` and `npm test` pass locally. |
| Prisma schema | Ready | `npx prisma validate` passes locally. |
| Prisma migration status | Blocked locally | `npx prisma migrate status` needs `DATABASE_URL` in shell/host env. |
| Production database | Pending user credential | Needs provisioned PostgreSQL and `npx prisma migrate deploy`. |
| Midtrans production | Pending user credential | Needs production keys and production webhook registration. |
| Telegram production | Optional / pending user credential | Needs bot token, webhook secret, admin chat IDs, notify chat/channel IDs. |
| Staging deploy | Blocked | Server-office Docker package prepared for `127.0.0.1:3010`; still needs domain/Cloudflare/server execution. |
| Manual smoke test | Pending deploy | Must run after staging/production URL exists. |

## Required Production Environment

Set these in host dashboard, never commit real values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/jumat_berkah
NEXT_PUBLIC_APP_URL=https://your-production-domain.example
SESSION_SECRET=replace-with-strong-random-secret
ADMIN_LOGIN_CODE=replace-with-strong-admin-code
DONOR_LOGIN_CODE=replace-with-donor-code-if-donor-login-used
MIDTRANS_SERVER_KEY=Mid-server-production-key
MIDTRANS_CLIENT_KEY=Mid-client-production-key
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_MERCHANT_ID=your-production-merchant-id
MIDTRANS_ENABLED_PAYMENTS=qris
RECEIPT_SIGNING_SECRET=replace-with-strong-random-secret
```

Optional Telegram production env:

```env
TELEGRAM_BOT_TOKEN=replace-with-bot-token
TELEGRAM_WEBHOOK_SECRET=replace-with-strong-random-secret
TELEGRAM_ADMIN_CHAT_IDS=123456789,-1001234567890
TELEGRAM_NOTIFY_CHAT_ID=-1001234567890
TELEGRAM_NOTIFY_ENABLED=true
TELEGRAM_PUBLIC_CHANNEL_ID=-1009876543210
CRON_SECRET=replace-with-strong-random-secret
TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH=500000
TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES=30
TELEGRAM_FAILED_LOGIN_ALERT_THRESHOLD=5
TELEGRAM_FAILED_LOGIN_ALERT_WINDOW_MINUTES=15
TELEGRAM_ALERT_COOLDOWN_MINUTES=30
TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH=500000
EXPENSE_APPROVAL_THRESHOLD_RUPIAH=500000
EXPENSE_APPROVAL_REQUIRED_COUNT=2
```

## Deployment Steps

For server kantor Docker deployment, use `docs/SERVER_DEPLOYMENT_UBUNTU_CLOUDFLARE_DOCKER.md`. It assumes existing app stays on `192.168.200.112:3001` and Jumat Berkah binds only to `127.0.0.1:3010`.

Generic steps:

1. Provision PostgreSQL database.
2. Configure host env values above.
3. Install dependencies: `npm ci`.
4. Generate Prisma client: `npx prisma generate`.
5. Apply migrations: `npx prisma migrate deploy`.
6. Seed/create first admin using `npm run seed:admin` or direct secure DB insert with admin role.
7. Build: `npm run build`.
8. Deploy app to host.
9. Set Midtrans production webhook URL:
   - `https://your-production-domain.example/api/webhooks/midtrans`
10. If Telegram enabled, set webhook:

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-production-domain.example/api/webhooks/telegram",
    "secret_token": "YOUR_TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates": ["message", "callback_query"]
  }'
```

11. Configure cron scheduler for:
   - `GET /api/cron/telegram/daily`
   - `GET /api/cron/telegram/weekly`
   - `GET /api/cron/telegram/donor-reminder`
   - `GET /api/cron/telegram/health`

Each cron request must send header:

```txt
X-Cron-Secret: your-cron-secret
```

## Smoke Test Checklist

Run after deploy using production/staging URL:

### Public

- [ ] `GET /` returns 200.
- [ ] `GET /donasi` returns 200.
- [ ] `GET /laporan` returns 200.
- [ ] Public report shows no donor email/phone.
- [ ] Anonymous/hidden donor displays as `Anonim`.

### Donation + Midtrans

- [ ] Create test donation with small amount.
- [ ] Midtrans Snap/QRIS page opens.
- [ ] Initial donation status is `pending`.
- [ ] Valid Midtrans webhook updates donation to `settlement`.
- [ ] Duplicate settlement webhook does not create duplicate income effect.
- [ ] Invalid signature webhook returns 401 and does not update donation.

### Admin

- [ ] Guest `/admin` redirects to login or returns protected response.
- [ ] Admin login succeeds with configured admin account/code.
- [ ] Admin donation list loads.
- [ ] Admin expense create works.
- [ ] Admin expense delete writes audit log and triggers alert if Telegram enabled.
- [ ] CSV export downloads.

### Telegram Optional

- [ ] Telegram webhook rejects missing/wrong secret.
- [ ] Admin chat can run `/saldo`.
- [ ] Non-admin chat cannot run admin commands.
- [ ] Public chat can run `/saldo_publik`.
- [ ] `/broadcast_laporan` posts to configured public channel.
- [ ] Failed admin login alert fires after configured threshold.
- [ ] Health cron sends alert when required env is intentionally missing in staging.

## Current Blockers

- Domain/subdomain and Cloudflare zone are not configured yet.
- Server execution is not available from this environment.
- Production/staging PostgreSQL `DATABASE_URL` exists only after server `.env.production` is created.
- Midtrans dashboard access is needed to register staging webhook.
- Telegram bot/channel IDs must be configured on server for active Telegram staging.

## Local Audit Results

- `npx prisma validate` passed.
- `npx prisma migrate status` could not run because `DATABASE_URL` is not configured in shell/host env.
- `npm run lint` passed.
- `npm test` passed (63/63).
- `npm run build` passed after rerun with longer timeout. First run timed out during TypeScript phase after successful compile due local command timeout, not build error.
- Docker Compose config passed with dummy env using `docker compose --env-file .env.production -f docker-compose.staging.yml config`.
- Docker image build passed with `docker build -t jumat-berkah:test .`.
