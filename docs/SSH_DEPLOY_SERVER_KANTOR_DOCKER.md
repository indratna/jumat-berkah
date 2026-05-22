# SSH Deploy — Jumat Berkah ke Server Kantor Docker

Dokumen ini untuk deploy Jumat Berkah ke server kantor tanpa mengganggu aplikasi existing.

## Target

- Server Ubuntu: `192.168.200.112`
- Existing app: `192.168.200.112:3001` — jangan disentuh
- Jumat Berkah local bind: `127.0.0.1:3010`
- Docker Compose: app + PostgreSQL dedicated
- Public access: Cloudflare + Nginx
- Telegram: aktif
- Midtrans: sandbox dulu

## 0. Data yang Harus Disiapkan

Sebelum deploy, siapkan:

- Username SSH server.
- Password SSH atau private key.
- Repo URL Git, atau folder project siap upload.
- Domain/subdomain, contoh `jumatberkah.domain.com`.
- IP public kantor.
- Midtrans sandbox keys.
- Telegram bot token.
- Telegram admin chat ID.
- Telegram notify chat ID.
- Telegram public channel ID jika mau broadcast.

## 1. Login SSH

### 1.1 Cek koneksi server

```bash
ping 192.168.200.112
```

### 1.2 Login pakai password

```bash
ssh username@192.168.200.112
```

Contoh:

```bash
ssh admin@192.168.200.112
```

Masukkan password saat diminta.

### 1.3 Login pakai private key

Linux/macOS:

```bash
ssh -i ~/.ssh/id_rsa username@192.168.200.112
```

Windows PowerShell:

```powershell
ssh -i C:\Users\NamaUser\.ssh\id_rsa username@192.168.200.112
```

### 1.4 Cek sudah masuk server

```bash
whoami
hostname
pwd
```

### 1.5 Cek sudo

```bash
sudo whoami
```

Expected:

```txt
root
```

Kalau gagal, user belum punya sudo. Minta admin server menambahkan sudo.

## 2. Pre-check Server

Jalankan di server:

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

- `:3001` dipakai aplikasi existing.
- `:3010` kosong.
- `nginx -t` sukses.

Jika `:3010` sudah dipakai, stop dan pilih port lain.

## 3. Backup Nginx

```bash
sudo cp -r /etc/nginx /etc/nginx.backup.$(date +%Y%m%d%H%M%S)
```

## 4. Upload / Clone Source Code

### Opsi A — Git clone

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <REPO_URL> jumat-berkah
cd /var/www/jumat-berkah
```

Contoh:

```bash
git clone https://github.com/ORG/JumatBerkah.git jumat-berkah
cd /var/www/jumat-berkah
```

Jika repo private, gunakan GitHub token saat diminta password.

### Opsi B — Upload dari komputer lokal

Dari komputer lokal, bukan dari SSH server:

PowerShell Windows:

```powershell
scp -r D:\Project\JumatBerkah username@192.168.200.112:/var/www/jumat-berkah
```

Lalu di server:

```bash
cd /var/www/jumat-berkah
```

Rekomendasi: pakai Git clone agar update lebih mudah.

## 5. Buat `.env.production`

Di server:

```bash
nano .env.production
```

Isi template berikut. Ganti semua nilai `GANTI_...` dan placeholder.

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

Simpan nano:

1. `Ctrl+O`
2. Enter
3. `Ctrl+X`

Kunci permission:

```bash
chmod 600 .env.production
```

## 6. Build dan Start Docker

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build
```

Cek status:

```bash
docker compose -f docker-compose.staging.yml ps
docker logs jumat-berkah-app --tail 100
docker logs jumat-berkah-postgres --tail 100
```

Cek app lokal:

```bash
curl -I http://127.0.0.1:3010
```

Expected:

```txt
HTTP/1.1 200 OK
```

## 7. Jalankan Database Migration

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production exec jumat-berkah-app npx prisma migrate deploy
```

Cek status migration:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production exec jumat-berkah-app npx prisma migrate status
```

## 8. Buat Admin Awal

Ganti email admin:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production exec jumat-berkah-app sh -c 'ADMIN_EMAIL=admin@domain.com ADMIN_NAME=Admin npm run seed:admin'
```

Login admin nanti memakai:

- email: `admin@domain.com`
- kode: `ADMIN_LOGIN_CODE` dari `.env.production`

## 9. Setup Nginx

Buat site baru:

```bash
sudo nano /etc/nginx/sites-available/jumat-berkah
```

Isi. Ganti domain.

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

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/jumat-berkah /etc/nginx/sites-enabled/jumat-berkah
sudo nginx -t
sudo systemctl reload nginx
```

Jika symlink sudah ada:

```bash
ls -l /etc/nginx/sites-enabled/jumat-berkah
```

## 10. Cloudflare DNS

Di dashboard Cloudflare:

1. Add domain.
2. Ubah nameserver domain di registrar ke nameserver Cloudflare.
3. Tambah DNS record:

```txt
Type: A
Name: jumatberkah
Content: IP_PUBLIC_KANTOR
Proxy status: Proxied
```

4. SSL/TLS mode:

```txt
Full (strict)
```

## 11. HTTPS di Origin Server

Install certbot jika belum:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

Run:

```bash
sudo certbot --nginx -d jumatberkah.domain.com
```

Jika gagal karena Cloudflare proxy:

1. Set DNS record Cloudflare ke **DNS only** sementara.
2. Run certbot lagi.
3. Set balik ke **Proxied**.

## 12. Cloudflare WAF Skip Rules

Buat rule agar webhook/cron tidak kena challenge.

Expression:

```txt
URI Path starts with /api/webhooks/
OR URI Path starts with /api/cron/telegram/
```

Action:

```txt
Skip challenge/security features that can block automated requests
```

Minimal: jangan pakai JS Challenge / Managed Challenge untuk path itu.

## 13. Setup Cron Server

Edit cron:

```bash
crontab -e
```

Isi. Ganti `GANTI_CRON_SECRET` sesuai `.env.production`.

```cron
0 7 * * * curl -fsS -H "X-Cron-Secret: GANTI_CRON_SECRET" https://jumatberkah.domain.com/api/cron/telegram/daily >/dev/null 2>&1
0 7 * * 5 curl -fsS -H "X-Cron-Secret: GANTI_CRON_SECRET" https://jumatberkah.domain.com/api/cron/telegram/weekly >/dev/null 2>&1
0 7 * * 5 curl -fsS -H "X-Cron-Secret: GANTI_CRON_SECRET" https://jumatberkah.domain.com/api/cron/telegram/donor-reminder >/dev/null 2>&1
*/30 * * * * curl -fsS -H "X-Cron-Secret: GANTI_CRON_SECRET" https://jumatberkah.domain.com/api/cron/telegram/health >/dev/null 2>&1
```

## 14. Setup Telegram Webhook

Run dari server atau komputer lokal.

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://jumatberkah.domain.com/api/webhooks/telegram",
    "secret_token": "YOUR_TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Cek webhook:

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

## 15. Setup Midtrans Sandbox Webhook

Di dashboard Midtrans Sandbox, set webhook URL:

```txt
https://jumatberkah.domain.com/api/webhooks/midtrans
```

Pastikan `.env.production`:

```env
MIDTRANS_IS_PRODUCTION=false
```

## 16. Smoke Test

### 16.1 Server local

```bash
curl -I http://127.0.0.1:3010
```

### 16.2 Public URL

```bash
curl -I https://jumatberkah.domain.com
curl -I https://jumatberkah.domain.com/donasi
curl -I https://jumatberkah.domain.com/laporan
```

### 16.3 Browser

Buka:

- `https://jumatberkah.domain.com/`
- `https://jumatberkah.domain.com/donasi`
- `https://jumatberkah.domain.com/laporan`
- `https://jumatberkah.domain.com/login`
- `https://jumatberkah.domain.com/admin`

### 16.4 Admin

Login pakai:

- admin email dari seed
- `ADMIN_LOGIN_CODE`

Cek:

- dashboard muncul
- donation list muncul
- expense create sukses
- CSV export sukses

### 16.5 Donation + Midtrans

- Buat donasi kecil.
- Pastikan redirect ke Midtrans sandbox.
- Selesaikan sandbox payment.
- Pastikan status berubah ke `settlement`.
- Cek `/laporan` update.
- Pastikan public report tidak tampilkan email/phone.

### 16.6 Telegram

Admin chat:

```txt
/saldo
```

Public chat:

```txt
/saldo_publik
```

Broadcast:

```txt
/broadcast_laporan
```

Failed login alert:

- coba login admin salah sampai threshold
- cek alert masuk Telegram

## 17. Update Aplikasi Nanti

```bash
cd /var/www/jumat-berkah
git pull
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build
docker compose -f docker-compose.staging.yml --env-file .env.production exec jumat-berkah-app npx prisma migrate deploy
curl -I http://127.0.0.1:3010
```

## 18. Cek Log Jika Error

```bash
docker logs jumat-berkah-app --tail 200
docker logs jumat-berkah-postgres --tail 200
sudo journalctl -u nginx --no-pager -n 100
sudo nginx -t
```

## 19. Stop / Restart

Restart app:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production restart jumat-berkah-app
```

Stop app + DB:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.production down
```

Do not run `docker system prune` without checking other existing apps.

## 20. Rollback Dasar

```bash
cd /var/www/jumat-berkah
git log --oneline -5
git checkout <PREVIOUS_COMMIT>
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build
curl -I http://127.0.0.1:3010
```

## 21. Checklist Final

- [ ] SSH login sukses.
- [ ] `:3001` existing app tidak disentuh.
- [ ] `:3010` kosong sebelum deploy.
- [ ] Docker Compose up sukses.
- [ ] Migration deploy sukses.
- [ ] Admin seed sukses.
- [ ] Nginx config test sukses.
- [ ] Cloudflare DNS aktif.
- [ ] HTTPS aktif.
- [ ] Midtrans webhook set.
- [ ] Telegram webhook set.
- [ ] Smoke test public/admin/donation/report pass.
