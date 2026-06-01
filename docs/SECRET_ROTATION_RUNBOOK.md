# Secret Rotation Runbook â€” Jumat Berkah

Panduan ini dipakai saat secret pernah bocor, admin/operator berganti, atau sebelum stable/live launch. Jangan tulis secret asli di repo, chat, tiket publik, screenshot, atau dokumentasi.

## Prinsip Utama

- Rotate satu secret dalam satu waktu agar mudah rollback.
- Generate secret baru sebelum mematikan secret lama.
- Update secret di `.env.production` server atau secret manager, bukan di repo.
- Restart service yang memakai secret setelah env berubah.
- Jalankan smoke test setelah setiap rotasi.
- Anggap secret bocor jika pernah masuk GitHub history, meski file sudah dihapus dari branch terbaru.

## File yang Tidak Boleh Dipush

Jangan commit file ini:

```txt
.env
.env.local
.env.production
all about berkah karyo.txt
secret-notes.txt
*.local-notes.txt
```

Cek sebelum push:

```bash
git --no-pager status --short --untracked-files=all
git --no-pager grep -n -E "(GOCSPX|re_[A-Za-z0-9]{10,}|[0-9]{9,10}:[A-Za-z0-9_-]{30,}|cloudflaretoken|AUTH_SECRET=|TELEGRAM_BOT_TOKEN=|DONOR_LOGIN_CODE=|RECEIPT_SIGNED_URL_SECRET=|CRON_SECRET=|DATABASE_URL=.*://|MIDTRANS_SERVER_KEY=|WHATSAPP_CLOUD_ACCESS_TOKEN=)" -- .
```

`git grep` may match safe placeholders in `.env.example`; verify results before committing.

## Generate Secret Baru

Gunakan salah satu:

```bash
openssl rand -base64 32
openssl rand -hex 32
```

Untuk password admin, gunakan password manager dan minimal 12 karakter.

## Restart Commands

Restart app setelah env app berubah:

```bash
cd /var/www/jumat-berkah
docker compose -f docker-compose.staging.yml --env-file .env.production up -d
```

Rebuild app jika env `NEXT_PUBLIC_*` berubah:

```bash
cd /var/www/jumat-berkah
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build
```

Restart tunnel setelah token Cloudflare berubah:

```bash
cd /var/www/jumat-berkah
docker compose -f docker-compose.tunnel.yml --env-file .env.production up -d
docker logs your-ingress-container --tail 30
```

Expected tunnel log:

```txt
Registered tunnel connection
```

## 1. Rotate Internal App Secrets

Rotate these in `.env.production`:

```env
AUTH_SECRET=...
DONOR_LOGIN_CODE=...
TELEGRAM_WEBHOOK_SECRET=...
RECEIPT_SIGNED_URL_SECRET=...
CRON_SECRET=...
BETTER_AUTH_SECRET=...
```

Steps:

1. Generate new values.
2. Edit server env:

```bash
cd /var/www/jumat-berkah
nano .env.production
```

3. Save and restart app:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production up -d
```

4. Smoke test:

```bash
curl -I http://127.0.0.1:3000
curl -I https://your-domain.example.com/login
curl -I https://your-domain.example.com/admin
```

Expected:

- `/` or `/login` returns `200`.
- `/admin` returns `307` for guest.

If `TELEGRAM_WEBHOOK_SECRET` changes, run Telegram webhook setup again (see section 3).

## 2. Rotate Cloudflare Tunnel Token

Use this when tunnel token may be exposed.

1. Open Cloudflare Zero Trust.
2. Go to Networks â†’ Tunnels.
3. Select the Jumat Berkah tunnel.
4. Rotate/regenerate connector token.
5. Copy new token.
6. Edit server env:

```bash
cd /var/www/jumat-berkah
nano .env.production
```

7. Replace:

```env
CLOUDFLARED_TOKEN=...
```

8. Restart tunnel:

```bash
docker compose -f docker-compose.tunnel.yml --env-file .env.production up -d
docker logs your-ingress-container --tail 30
```

9. Smoke test public URL:

```bash
curl --max-time 15 -I https://your-domain.example.com
curl --max-time 15 -I https://your-domain.example.com/login
```

## 3. Rotate Telegram Bot Token and Webhook Secret

### Bot token

1. Open Telegram `@BotFather`.
2. Run `/mybots`.
3. Choose the bot.
4. Open API Token.
5. Revoke current token and copy the new token.
6. Update `.env.production`:

```env
TELEGRAM_BOT_TOKEN=...
```

### Webhook secret

Generate new value and update:

```env
TELEGRAM_WEBHOOK_SECRET=...
```

Restart app:

```bash
cd /var/www/jumat-berkah
docker compose -f docker-compose.staging.yml --env-file .env.production up -d
```

Set webhook:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production exec -T jumat-berkah-app node <<'NODE'
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telegram`;

if (!token || !secret || !process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error("Telegram token, secret, and NEXT_PUBLIC_APP_URL are required.");
}

fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
    max_connections: 1,
  }),
})
  .then((res) => res.json())
  .then((json) => console.log(JSON.stringify(json, null, 2)))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
NODE
```

If the command times out from the container, use the app's Telegram smoke commands after the server network is stable or repeat with the IPv4-forced diagnostic from the deployment work log.

Smoke test from allowlisted admin chat:

```txt
/saldo
/broadcast_laporan
```

Expected:

- `/saldo` returns balance summary.
- `/broadcast_laporan` posts to the configured public channel.

If broadcast returns `Bad Request: chat not found`, verify `TELEGRAM_PUBLIC_CHANNEL_ID` and make the bot an admin of the channel with post permission.

## 4. Rotate Google OAuth Client Secret

1. Open Google Cloud Console â†’ APIs & Services â†’ Credentials.
2. Select the OAuth 2.0 client used by Jumat Berkah.
3. Reset/rotate client secret.
4. Confirm authorized origin:

```txt
https://your-domain.example.com
```

5. Confirm redirect URI:

```txt
https://your-domain.example.com/api/auth/callback/google
```

6. Update `.env.production`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

7. Restart app:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production up -d
```

8. Smoke test Google login at:

```txt
https://your-domain.example.com/login
```

## 5. Rotate Resend API Key

1. Open Resend dashboard.
2. Create a new API key with needed send permission.
3. Delete/revoke the old key.
4. Update `.env.production`:

```env
RESEND_API_KEY=...
```

5. Restart app:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production up -d
```

6. Smoke test password reset or configured email flow.

## 6. Rotate Midtrans Keys

Use sandbox first.

1. Open Midtrans dashboard.
2. Switch to Sandbox or Production intentionally.
3. Go to Settings â†’ Access Keys.
4. Copy matching Server Key, Client Key, and Merchant ID.
5. Update `.env.production`:

```env
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=...
MIDTRANS_MERCHANT_ID=...
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_ENABLED_PAYMENTS=qris
```

Use `MIDTRANS_IS_PRODUCTION=true` only after sandbox smoke passes and live QRIS is active.

Because `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` is bundled into the client, rebuild:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build
```

Auth diagnostic without exposing key:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production exec -T jumat-berkah-app node <<'NODE'
const key = process.env.MIDTRANS_SERVER_KEY;
const auth = Buffer.from(`${key}:`).toString("base64");

fetch("https://api.sandbox.midtrans.com/v2/JB-DUMMY-AUTH-CHECK/status", {
  headers: {
    Accept: "application/json",
    Authorization: `Basic ${auth}`,
  },
  signal: AbortSignal.timeout(15000),
})
  .then(async (res) => {
    console.log("STATUS", res.status);
    console.log(await res.text());
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
NODE
```

Expected with valid sandbox server key:

- `404` or order-not-found style response.
- Not `401 Unknown Merchant server_key/id`.

Smoke test:

1. Create donation from `/donasi`.
2. Open Snap payment page.
3. Pay via Midtrans sandbox simulator.
4. Verify `donations.status='settlement'`.
5. Verify `midtrans_webhook_logs.signature_valid=true`.

## 7. Rotate Admin Password

For an existing Better Auth admin:

1. Login to admin.
2. Open:

```txt
https://your-domain.example.com/admin/profil
```

3. Use password change form.
4. Store new password in password manager.

If initial seed password was put in `.env.production`, remove it after account creation:

```env
BETTER_AUTH_ADMIN_PASSWORD=...
```

Then restart app:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production up -d
```

## Post-Rotation Checklist

Run route smoke checks against your deployment URL:

```bash
curl -I https://your-domain.example.com
curl -I https://your-domain.example.com/login
curl -I https://your-domain.example.com/admin
```

Expected:

- public `/` and `/login` return `200`.
- guest `/admin` redirects to login.

Check application and ingress logs through your hosting provider without printing secrets.

Record private rotation evidence outside the public repository:

- which secret class was rotated,
- validation command results,
- any remaining blockers.

Do not record actual secret values.
