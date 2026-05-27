# Server Deployment — Ubuntu + Docker + Cloudflare

> Current production-style deployment uses Cloudflare Tunnel (`jumat-berkah-cloudflared`) instead of host Nginx because the shared server already runs multiple apps and host Nginx may not be installed. See `docs/DEPLOYMENT_OPS_RUNBOOK.md` for day-2 operations, tunnel auto-heal, and safe recovery commands.

Target server context:

- OS: Ubuntu
- Server LAN IP: `192.168.200.112`
- Existing application: `192.168.200.112:3001` — do not touch
- Jumat Berkah app bind: `127.0.0.1:3010`
- PostgreSQL: dedicated Docker container
- Public access: Cloudflare Tunnel to `http://127.0.0.1:3010` (preferred on shared server); Nginx reverse proxy only as fallback
- Telegram: enabled
- Midtrans: sandbox first

## Safety Rules

- Prefer Cloudflare Tunnel on this shared server; do not install or reload host Nginx unless explicitly approved.
- Do not bind Jumat Berkah to `3001`.
- Do not expose app container to public network; use `127.0.0.1:3010:3000` only.
- Do not restart Docker daemon during business hours if other apps run there.
- Do not edit existing Nginx site config for other apps.
- Create new Nginx site file for Jumat Berkah only.
- Backup before changing Nginx:

```bash
sudo cp -r /etc/nginx /etc/nginx.backup.$(date +%Y%m%d%H%M%S)
```

## 1. Pre-check Server

```bash
docker ps
docker compose version
sudo ss -tulpn | grep ':3001'
sudo ss -tulpn | grep ':3010'
sudo nginx -t
ls /etc/nginx/sites-available
ls /etc/nginx/sites-enabled
```

Expected:

- `:3001` used by existing app.
- `:3010` empty before deploy.
- `nginx -t` passes.

If `:3010` is used, change `docker-compose.staging.yml` and Nginx proxy to another free localhost port.

## 2. Cloudflare Setup

1. Add domain to Cloudflare.
2. Point registrar nameservers to Cloudflare.
3. Create DNS record:

```txt
Type: A
Name: jumatberkah
Content: <PUBLIC_IP_KANTOR>
Proxy status: Proxied
```

4. Set SSL/TLS mode:

```txt
Full (strict)
```

5. Add WAF/Firewall skip challenge rule for webhooks and cron:

```txt
URI Path starts with /api/webhooks/
OR URI Path starts with /api/cron/telegram/
```

Action: skip challenge/security features that can block machine-to-machine requests.

## 3. Clone Repo

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <REPO_URL> jumat-berkah
cd /var/www/jumat-berkah
```

## 4. Create `.env.production`

Create file:

```bash
nano .env.production
```

Template:

```env
POSTGRES_PASSWORD=GANTI_PASSWORD_DB_KUAT
DATABASE_URL=postgresql://jumat_berkah_user:GANTI_PASSWORD_DB_KUAT@jumat-berkah-postgres:5432/jumat_berkah
NEXT_PUBLIC_APP_URL=https://jumatberkah.domain.com
SESSION_SECRET=GANTI_RANDOM_KUAT
ADMIN_LOGIN_CODE=GANTI_KODE_ADMIN_KUAT
DONOR_LOGIN_CODE=GANTI_KODE_DONOR_OPSIONAL
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=...
MIDTRANS_ENABLED_PAYMENTS=qris
RECEIPT_SIGNING_SECRET=GANTI_RANDOM_KUAT
CRON_SECRET=GANTI_RANDOM_KUAT

TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=GANTI_RANDOM_KUAT
TELEGRAM_ADMIN_CHAT_IDS=...
TELEGRAM_NOTIFY_CHAT_ID=...
TELEGRAM_NOTIFY_ENABLED=true
TELEGRAM_PUBLIC_CHANNEL_ID=...
TELEGRAM_LOW_BALANCE_THRESHOLD_RUPIAH=500000
TELEGRAM_INVALID_SIGNATURE_ALERT_WINDOW_MINUTES=30
TELEGRAM_FAILED_LOGIN_ALERT_THRESHOLD=5
TELEGRAM_FAILED_LOGIN_ALERT_WINDOW_MINUTES=15
TELEGRAM_ALERT_COOLDOWN_MINUTES=30
TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH=500000
EXPENSE_APPROVAL_THRESHOLD_RUPIAH=500000
EXPENSE_APPROVAL_REQUIRED_COUNT=2
```

Never commit `.env.production`.

## 5. Build and Start Containers

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build
```

Check:

```bash
docker compose -f docker-compose.staging.yml ps
docker logs jumat-berkah-app --tail 100
docker logs jumat-berkah-postgres --tail 100
curl -I http://127.0.0.1:3010
```

## 6. Run Migration

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production exec jumat-berkah-app npx prisma migrate deploy
```

Check migration status:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production exec jumat-berkah-app npx prisma migrate status
```

## 7. Seed Admin

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production exec jumat-berkah-app sh -c 'ADMIN_EMAIL=admin@domain.com ADMIN_NAME=Admin npm run seed:admin'
```

Use real admin email.

## 8. Nginx Reverse Proxy

Create new site file only:

```bash
sudo nano /etc/nginx/sites-available/jumat-berkah
```

Config:

```nginx
server {
    listen 80;
    server_name jumatberkah.domain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/jumat-berkah /etc/nginx/sites-enabled/jumat-berkah
sudo nginx -t
sudo systemctl reload nginx
```

## 9. HTTPS Origin Certificate

Preferred: Let’s Encrypt on origin.

```bash
sudo certbot --nginx -d jumatberkah.domain.com
```

If Cloudflare proxy blocks validation, temporarily set DNS record to DNS only, run certbot, then set back to Proxied.

## 10. Server Cron

Edit cron:

```bash
crontab -e
```

Add with same `CRON_SECRET` as env:

```cron
0 7 * * * curl -fsS -H "X-Cron-Secret: GANTI_CRON_SECRET" https://jumatberkah.domain.com/api/cron/telegram/daily >/dev/null 2>&1
0 7 * * 5 curl -fsS -H "X-Cron-Secret: GANTI_CRON_SECRET" https://jumatberkah.domain.com/api/cron/telegram/weekly >/dev/null 2>&1
0 7 * * 5 curl -fsS -H "X-Cron-Secret: GANTI_CRON_SECRET" https://jumatberkah.domain.com/api/cron/telegram/donor-reminder >/dev/null 2>&1
*/30 * * * * curl -fsS -H "X-Cron-Secret: GANTI_CRON_SECRET" https://jumatberkah.domain.com/api/cron/telegram/health >/dev/null 2>&1
```

## 11. Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://jumatberkah.domain.com/api/webhooks/telegram",
    "secret_token": "YOUR_TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Check:

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

## 12. Midtrans Sandbox Webhook

Set in Midtrans sandbox dashboard:

```txt
https://jumatberkah.domain.com/api/webhooks/midtrans
```

Keep staging env:

```env
MIDTRANS_IS_PRODUCTION=false
```

## 13. Smoke Test

Public:

```bash
curl -I https://jumatberkah.domain.com
curl -I https://jumatberkah.domain.com/donasi
curl -I https://jumatberkah.domain.com/laporan
```

Admin:

- Open `/login`.
- Login using admin email + `ADMIN_LOGIN_CODE`.
- Confirm `/admin` loads.

Donation:

- Create small sandbox donation.
- Open Midtrans payment page.
- Trigger/complete sandbox settlement.
- Confirm `/laporan` updates.
- Confirm duplicate webhook does not double count.

Telegram:

- Admin chat: `/saldo`.
- Public chat: `/saldo_publik`.
- Admin chat: `/broadcast_laporan`.
- Failed admin login repeated until threshold; confirm alert.

## 14. Update App Later

```bash
cd /var/www/jumat-berkah
git pull
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build
docker compose -f docker-compose.staging.yml --env-file .env.production exec jumat-berkah-app npx prisma migrate deploy
curl -I http://127.0.0.1:3010
```

## 15. Rollback Basic

Show recent images/containers:

```bash
docker ps -a
docker images | grep jumat
```

If new deploy fails, stop current compose and redeploy previous git commit:

```bash
git log --oneline -5
git checkout <previous_commit>
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build
```
