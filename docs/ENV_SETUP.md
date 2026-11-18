# Environment Setup — Jumat Berkah

Panduan env untuk local dan production. Gunakan nilai placeholder di contoh. Jangan simpan secret asli di repo, chat, tiket publik, screenshot, atau dokumentasi.

Untuk rotasi secret setelah kebocoran, pergantian operator, atau pre-launch, gunakan `docs/SECRET_ROTATION_RUNBOOK.md`.

## File env

Local development:

```bash
cp .env.example .env.local
npm install
npm run db:generate
npm run dev
```

Production:

- Simpan env di dashboard hosting atau secret manager.
- Jangan deploy file `.env.production` ke repo.
- Gunakan secret kuat untuk semua key/token.
- Jalankan migration dan smoke test setelah deploy.

## Minimal local env

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54329/jumat_berkah?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="replace-with-strong-local-secret"
BETTER_AUTH_SECRET="replace-with-strong-local-secret-at-least-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
ADMIN_NAME="Admin Jumat Berkah"
ADMIN_LOGIN_CODE="replace-with-local-admin-code"
DONOR_LOGIN_CODE="replace-with-local-donor-code"
MIDTRANS_SERVER_KEY="replace-with-sandbox-server-key"
MIDTRANS_CLIENT_KEY="replace-with-sandbox-client-key"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="replace-with-sandbox-client-key"
MIDTRANS_MERCHANT_ID="replace-with-sandbox-merchant-id"
MIDTRANS_IS_PRODUCTION="false"
MIDTRANS_ENABLED_PAYMENTS="qris"
```

## Core app

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL provider/local Docker | PostgreSQL connection string. Server-only. | `npm run db:generate`, app boot, `/api/reports/public` responds. |
| `NEXT_PUBLIC_APP_URL` | Yes | App public URL | Public base URL, no trailing slash preferred. Client-visible. | Links in Telegram/email point to right domain. |
| `AUTH_SECRET` | Yes | Generate random secret | Legacy session signing. Server-only. | Legacy admin/donor code login works. |
| `AUTH_URL` | Optional legacy compatibility | App URL | Kept for Auth.js/legacy compatibility if present in `.env.example`; Better Auth uses `BETTER_AUTH_URL`. | App auth callbacks still use expected origin. |
| `ADMIN_EMAIL` | Yes | App owner decision | Initial admin domain user email. | `npm run seed:admin` creates/upserts admin. |
| `ADMIN_NAME` | No | App owner decision | Initial admin display name. | Admin page shows name. |
| `ADMIN_LOGIN_CODE` | Yes for legacy admin login | Generate random code | Legacy admin fallback. Server-only. | `/login` legacy code login works. |
| `DONOR_LOGIN_CODE` | Yes for legacy donor login | Generate random code | Legacy donor fallback. Server-only. | `/masuk` legacy code login works. |

Secret generation examples:

```bash
openssl rand -base64 32
```

## Better Auth and Google OAuth

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `BETTER_AUTH_SECRET` | Yes for Better Auth | Generate random secret | Must be at least 32 chars/high entropy. Server-only. | `npm run build` has no Better Auth entropy warning. |
| `BETTER_AUTH_URL` | Yes for Better Auth | App URL | Must match deployed origin. | Google/email login callbacks work. |
| `GOOGLE_CLIENT_ID` | Optional | Google Cloud Console OAuth client | Required for Google login. | Google login redirects back to app. |
| `GOOGLE_CLIENT_SECRET` | Optional | Google Cloud Console OAuth client | Server-only. | Google login succeeds. |
| `BETTER_AUTH_ADMIN_EMAIL` | Optional | App owner decision | Used by `npm run seed:better-auth-admin`. | Provision script creates admin login. |
| `BETTER_AUTH_ADMIN_PASSWORD` | Optional | Temporary secure password | Used by `npm run seed:better-auth-admin`; rotate/remove after use. | Admin email/password login works. |
| `BETTER_AUTH_ADMIN_NAME` | Optional | App owner decision | Display name for provisioned admin. | Admin profile shows expected name. |

Google setup:

1. Open Google Cloud Console.
2. Create OAuth web client.
3. Add authorized JavaScript origin: `https://your-domain.example.com`.
4. Add redirect URI: `https://your-domain.example.com/api/auth/callback/google`.
5. Put client ID/secret into hosting env.
6. Smoke: login from `/login` and `/masuk`; verify role guard still uses domain `users.role`.

See also `docs/BETTER_AUTH_SETUP.md`.

## Midtrans QRIS

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `MIDTRANS_SERVER_KEY` | Yes | Midtrans dashboard | Server key for transaction create and webhook signature. Server-only. | Create sandbox donation and verify webhook signature. |
| `MIDTRANS_CLIENT_KEY` | Yes | Midtrans dashboard | Client key. Server-only side; mirror to `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` for browser. | Snap/redirect opens. |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Yes | Midtrans dashboard | Same value as `MIDTRANS_CLIENT_KEY`, intentionally exposed to browser so the Snap popup script on `/donasi` can attach `data-client-key`. Required for Snap popup checkout; missing value safely degrades to redirect-only flow. | Snap popup opens on `/donasi` after submit. |
| `MIDTRANS_MERCHANT_ID` | Yes | Midtrans dashboard | Merchant ID used by payload/simulation. | Midtrans dashboard shows matching merchant. |
| `MIDTRANS_IS_PRODUCTION` | Yes | App owner decision | `false` for sandbox, `true` for live. Read server-side; client `MidtransSnapScript` receives the boolean as a prop to pick sandbox vs production Snap script. | Sandbox/live endpoint matches expected mode. |
| `MIDTRANS_ENABLED_PAYMENTS` | No | App owner decision | Comma-separated methods; use `qris` for MVP. | Payment page offers QRIS. |

Webhook setup:

1. In Midtrans dashboard, set notification URL to `https://your-domain.example.com/api/webhooks/midtrans`.
2. Use sandbox first.
3. Create donation from `/donasi`.
4. Complete QRIS sandbox payment.
5. Verify donation status becomes `settlement` and webhook log has `signature_valid=true`.
6. Verify invalid signature does not update donation.

## Telegram

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Optional | @BotFather | Required for all Telegram sends/webhook. Server-only. | `getMe` Bot API works. |
| `TELEGRAM_WEBHOOK_SECRET` | Optional | Generate random secret | Sent by Telegram as `X-Telegram-Bot-Api-Secret-Token`. | Wrong secret rejected. |
| `TELEGRAM_ADMIN_CHAT_IDS` | Optional | Telegram chat IDs | Comma-separated allowlist for admin commands. | `/saldo` from allowlisted chat works; other chat rejected. |
| `TELEGRAM_NOTIFY_CHAT_ID` | Optional | Telegram chat/channel ID | Destination for settlement/cron alerts. | Settlement notification appears. |
| `TELEGRAM_NOTIFY_ENABLED` | Optional | App owner decision | Must be exactly `true` to send notify/cron alerts. | Disabled env sends nothing. |
| `TELEGRAM_PUBLIC_CHANNEL_ID` | Optional | Telegram channel ID | Must use numeric `-100...`; bot must be channel admin with post permission. | `/broadcast_laporan` posts to channel. |
| `TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH` | Optional | App owner decision | Integer Rupiah threshold. | Daily cron sends low-balance alert once. |
| `TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES` | Optional | App owner decision | Default `30`. | Invalid signature alert respects window. |
| `TELEGRAM_FAILED_LOGIN_ALERT_THRESHOLD` | Optional | App owner decision | Default from code. | Repeated failed login triggers alert. |
| `TELEGRAM_FAILED_LOGIN_ALERT_WINDOW_MINUTES` | Optional | App owner decision | Default from code. | Alert threshold window works. |
| `TELEGRAM_ALERT_COOLDOWN_MINUTES` | Optional | App owner decision | Default from code. | Duplicate alerts suppressed. |
| `TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH` | Optional | App owner decision | Integer Rupiah. | Large expense alert triggers. |
| `TELEGRAM_LOW_TARGET_PROGRESS_PERCENT` | Optional | App owner decision | Default `60`, valid 1–100. | Low target progress alert triggers near Friday. |
| `TELEGRAM_LOW_TARGET_PROGRESS_DAY_OFFSET` | Optional | App owner decision | Default `1`, valid 0–6 days before Friday. | Alert day matches config. |

Webhook registration:

```bash
curl -X POST "https://api.telegram.org/botTOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.example.com/api/webhooks/telegram",
    "secret_token": "YOUR_TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates": ["message", "callback_query"],
    "drop_pending_updates": true,
    "max_connections": 1
  }'
```

Smoke commands:

```txt
/saldo
/laporan minggu
/pengeluaran 2026-05-22 | Beras | 300000 | 30 kg beras | Pasar Senen
/broadcast_laporan
```

## Cron

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `CRON_SECRET` | Required for cron endpoints | Generate random secret | Accepted as `X-Cron-Secret` or `Authorization: Bearer ...`. Server-only. | Manual curl returns success, wrong secret returns unauthorized. |
| `TELEGRAM_DONOR_REMINDER_ENABLED` | Optional legacy/config placeholder | App owner decision | Safe to leave unset unless donor Telegram reminder gating is reintroduced; current cron remains protected by `CRON_SECRET` and Telegram notify config. | Donor reminder cron returns safe skipped/sent result. |

Endpoints:

- `GET /api/cron/telegram/daily`
- `GET /api/cron/telegram/weekly`
- `GET /api/cron/telegram/donor-reminder`
- `GET /api/cron/telegram/health`
- `GET /api/cron/whatsapp/reminders`

Manual smoke:

```bash
curl -H "X-Cron-Secret: YOUR_CRON_SECRET" \
  https://your-domain.example.com/api/cron/telegram/health
```

## Email / Resend

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `EMAIL_PROVIDER` | Optional | App owner decision | Set to `resend` to enable sends. Empty disables safely. | Missing provider logs/falls back without breaking flow. |
| `EMAIL_FROM` | Required if email enabled | Resend verified sender/domain | Example: `Jumat Berkah <noreply@example.com>`. | Resend accepts sender. |
| `RESEND_API_KEY` | Required if email enabled | Resend dashboard | Server-only. | Password reset email arrives. |
| `ADMIN_EMAIL_NOTIFICATIONS` | Optional | App owner decision | Comma-separated admin recipients. | Settlement/admin alert email arrives. |

Smoke:

1. Request password reset from `/lupa-password`.
2. Trigger settlement webhook in sandbox.
3. Trigger invalid signature/large expense alert if configured.
4. Confirm failures do not break core request.

## WhatsApp Cloud API

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `WHATSAPP_REMINDER_ENABLED` | Optional | App owner decision | Must be `true` for live sends. Defaults safe/off. | Disabled env only logs/skips. |
| `WHATSAPP_CLOUD_ACCESS_TOKEN` | Required if enabled | Meta Developer dashboard | Server-only token. | Meta API returns success. |
| `WHATSAPP_CLOUD_PHONE_NUMBER_ID` | Required if enabled | Meta WhatsApp Cloud API | Phone number ID, not display phone. | Send endpoint uses correct number ID. |
| `WHATSAPP_REMINDER_TEMPLATE_NAME` | Required if enabled | Meta template manager | Approved template name. | Template send succeeds. |
| `WHATSAPP_REMINDER_TEMPLATE_LANGUAGE` | Optional | Meta template language | Default `id`. | Send uses approved locale. |
| `WHATSAPP_REMINDER_BATCH_LIMIT` | Optional | App owner decision | Default `20`, max `100`. | Dry run returns expected count. |

Smoke:

```bash
curl -X POST https://your-domain.example.com/api/admin/whatsapp-reminders \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"limit":10}'
```

Live send only after consent data and approved template are ready.

## Receipt storage

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `RECEIPT_STORAGE_BUCKET` | Optional | S3/R2/storage provider | Private bucket name. | Receipt object key generated. |
| `RECEIPT_STORAGE_BASE_URL` | Optional | App URL/storage proxy | Base URL for signed receipt links. | Admin signed receipt URL opens. |
| `RECEIPT_SIGNED_URL_SECRET` | Optional | Generate random secret | Required for signed receipt links. Server-only. | Expired/tampered URL rejected. |
| `RECEIPT_STORAGE_PUT_URL` | Optional | Storage provider/proxy | PUT URL template containing `{key}`. Server-only. | Telegram receipt photo uploads. |

## Expense approval

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `EXPENSE_APPROVAL_THRESHOLD_RUPIAH` | Optional | App owner decision | Integer Rupiah. Expense at/above threshold needs approval. | Large expense enters approval flow. |
| `EXPENSE_APPROVAL_REQUIRED_COUNT` | Optional | App owner decision | Default `2`. | Required approval count shown correctly. |

## Backup and restore scripts

Scripts read normal shell env, not Next.js runtime env.

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `JUMAT_BERKAH_DB_CONTAINER` | Optional | Docker runtime | Default `jumat-berkah-postgres`. | Backup can exec into DB container. |
| `JUMAT_BERKAH_DB_NAME` | Optional | PostgreSQL config | Default `jumat_berkah`. | Backup contains expected database. |
| `JUMAT_BERKAH_DB_USER` | Optional | PostgreSQL config | Default `jumat_berkah_user`. | Backup can run `pg_dump`. |
| `JUMAT_BERKAH_BACKUP_DIR` | Optional | Server path | Default `/var/backups/jumat-berkah`. Directory should be root/admin-owned. | Backup file written. |
| `JUMAT_BERKAH_BACKUP_RETENTION_DAYS` | Optional | App owner decision | Default `14`. | Old backup cleanup works. |
| `JUMAT_BERKAH_BACKUP_LOG` | Optional | Server path | Default `/var/log/jumat-berkah-backup.log`. | Failure/success log written. |
| `JUMAT_BERKAH_RESTORE_CONTAINER` | Optional | Docker runtime | Default `jumat-berkah-postgres-restore-drill`. | Restore drill temp container starts/removes. |
| `JUMAT_BERKAH_RESTORE_DB` | Optional | Restore drill config | Default `jumat_berkah_restore`. | Restore drill can query tables. |
| `JUMAT_BERKAH_RESTORE_USER` | Optional | Restore drill config | Default `restore_user`. | Restore drill can login. |
| `JUMAT_BERKAH_RESTORE_PASSWORD` | Optional | Restore drill config | Use strong local-only value on shared hosts. | Temp DB starts. |
| `JUMAT_BERKAH_POSTGRES_IMAGE` | Optional | Docker image | Default `postgres:16-alpine`. | Restore drill uses expected Postgres version. |
| `DATABASE_URL` | Yes | PostgreSQL provider | Used by app; backup scripts use Docker-specific vars above. | App and scripts target correct DB. |
| `EMAIL_PROVIDER`/`EMAIL_FROM`/`RESEND_API_KEY`/`ADMIN_EMAIL_NOTIFICATIONS` | Optional | Resend/app owner | Backup failure email if configured. | Force script failure in staging and verify alert. |

Smoke:

```bash
sh -n scripts/backup-postgres.sh
sh -n scripts/restore-drill-postgres.sh
```

Then follow `docs/BACKUP_RESTORE_RUNBOOK.md` for live backup and restore drill.

## Docker Compose (server)

`docker-compose.staging.yml` membaca beberapa variabel di luar runtime app.

| Env var | Required | Source | Notes | Smoke test |
|---|---:|---|---|---|
| `POSTGRES_PASSWORD` | Yes for Docker Compose | Generate random secret | Password init container `jumat-berkah-postgres`. Harus sama persis dengan password di dalam `DATABASE_URL`. Hanya dibaca saat volume data masih kosong; mengganti nilainya tidak mengubah volume yang sudah ada. Server-only. | `docker compose -f docker-compose.staging.yml --env-file .env.production config` tidak error. |

Compose gagal dengan `POSTGRES_PASSWORD is required` bila variabel ini kosong, jadi isi dulu di `.env.production` server sebelum `docker compose up`.

### Nilai `NEXT_PUBLIC_*` ditanam saat build

`NEXT_PUBLIC_APP_URL` dan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` di-inline Next.js saat `next build`, jadi nilainya harus tersedia sebagai build arg — bukan hanya env runtime. `docker-compose.staging.yml` meneruskannya dari `.env.production`, sehingga build **wajib** memakai `--env-file`:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build --wait
```

Tanpa `--env-file` (atau bila variabelnya kosong), build tetap sukses tetapi nilai tersebut tertanam sebagai string kosong: popup Snap jatuh ke mode redirect dan link notifikasi/receipt kehilangan domain. Setelah mengganti salah satu nilai, rebuild image.

### Jaringan saat build

Build memakai jaringan default Docker. Isi build hanya `npm ci` yang butuh internet, dan jaringan bridge default sudah cukup untuk itu.

Jangan menambahkan `network: host` di bagian `build:`. BuildKit menolak opsi itu kecuali builder-nya diberi entitlement `network.host`, dan builder bawaan Docker Engine (driver `docker`) tidak memberikannya, sehingga build gagal dengan:

```txt
additional privileges requested: pass "--allow=network.host" to grant requested privileges
```

Kalau sebuah builder lokal memang butuh host networking, taruh di file override lokal yang tidak di-commit:

```bash
# docker-compose.local.yml (gitignored)
services:
  jumat-berkah-app:
    build:
      network: host
```

```bash
docker compose -f docker-compose.staging.yml -f docker-compose.local.yml \
  --env-file .env.production build
```

### Healthcheck sebagai gate deploy

Image produksi membawa `HEALTHCHECK` yang memanggil `/login` di dalam container. Itu liveness murni: halaman prerender, jadi tidak menyentuh database dan tidak ikut goyah saat database sedang tidak sehat.

Tidak ada service lain di `docker-compose.staging.yml` yang bisa memakai `depends_on: condition: service_healthy` terhadap app, jadi gate-nya dipakai lewat `--wait`. Perintah `up` menunggu sampai healthcheck `healthy` sebelum dianggap selesai, dan keluar non-zero bila container tidak pernah sehat:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build --wait
docker inspect --format '{{.State.Health.Status}}' jumat-berkah-app
```

Tunnel Cloudflare tetap file compose terpisah dengan host networking. Ia tidak ikut menunggu healthcheck, jadi nyalakan tunnel hanya setelah app `healthy` (mis. pakai `--wait` di atas).

Smoke:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production config > /dev/null \
  && echo "compose config ok"
```

## Deployment

Common production env:

- All required core app vars.
- Provider vars for enabled integrations.
- Strong `BETTER_AUTH_SECRET`, `AUTH_SECRET`, `CRON_SECRET`, webhook secrets.
- `NEXT_PUBLIC_APP_URL` set to public HTTPS origin.
- `POSTGRES_PASSWORD` sama persis dengan password di `DATABASE_URL` (dipakai container postgres Compose).

Deployment smoke:

1. Public HTTPS homepage returns `200`.
2. `/donasi`, `/laporan`, `/tentang`, `/login`, and `/masuk` return `200`.
3. `/admin` redirects guest to login.
4. Midtrans webhook URL is reachable from the internet.
5. Enabled provider integrations pass their smoke tests from this guide.

Keep provider credentials, server IPs, tunnel tokens, private runbooks, and operator-only smoke evidence outside the public repository.

## Env completeness checklist

- [ ] `.env.example` contains every env name in this guide with placeholder/safe values only.
- [ ] Production secret store contains all required vars for enabled features.
- [ ] No real secret appears in git diff.
- [ ] Local `.env.local` is ignored by git.
- [ ] `NEXT_PUBLIC_APP_URL` uses correct public HTTPS domain in production.
- [ ] Midtrans mode and keys both sandbox or both production, never mixed.
- [ ] Telegram public channel ID uses `-100...` and bot has post permission.
- [ ] Resend sender/domain verified before enabling email.
- [ ] WhatsApp template approved before enabling live sends.
- [ ] Backup directory and retention verified on server.
