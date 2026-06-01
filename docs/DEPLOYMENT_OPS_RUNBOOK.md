# Deployment Ops Runbook — Jumat Berkah

Runbook ini khusus resource Jumat Berkah di server bersama. Jangan menjalankan command global yang dapat mengganggu aplikasi lain.

Untuk rotasi secret/token sebelum stable launch atau setelah kebocoran, gunakan `docs/SECRET_ROTATION_RUNBOOK.md`.

## Runtime Resources

- Public URL: `https://berkahkaryo.my.id`
- Local origin: `http://127.0.0.1:3010`
- App container: `jumat-berkah-app`
- Database container: `jumat-berkah-postgres`
- Cloudflare Tunnel container: `jumat-berkah-cloudflared`
- App compose file: `docker-compose.staging.yml`
- Tunnel compose file: `docker-compose.tunnel.yml`
- App network: `jumat-berkah-network`
- Database volume: `jumat_berkah_postgres_data`
- Tunnel protocol: `http2`
- Tunnel network mode: `host`

## Safe Health Checks

```bash
cd /var/www/jumat-berkah

docker compose -f docker-compose.staging.yml --env-file .env.production ps
docker ps | grep jumat-berkah-cloudflared
curl -I http://127.0.0.1:3010
curl -I https://berkahkaryo.my.id
curl -I https://berkahkaryo.my.id/login
curl -I https://berkahkaryo.my.id/admin
```

Expected:

- Local origin returns `200`.
- Public URL returns `200`.
- `/admin` returns `307` to login when not authenticated.
- PostgreSQL container is `healthy`.

## Safe Logs

```bash
docker logs jumat-berkah-app --tail 100
docker logs jumat-berkah-postgres --tail 100
docker logs jumat-berkah-cloudflared --tail 100
sudo tail -n 100 /var/log/jumat-berkah-tunnel-watch.log
```

## Cloudflare Tunnel Ownership

Preferred tunnel runtime is compose-managed with `docker-compose.tunnel.yml`.

Required environment variable on server:

```env
CLOUDFLARED_TOKEN=<cloudflare tunnel token>
```

Never commit the token.

Start / update only the tunnel container:

```bash
cd /var/www/jumat-berkah
set -a
. ./.env.production
set +a
docker compose -f docker-compose.tunnel.yml --env-file .env.production up -d
```

Verify exact network mode:

```bash
docker inspect jumat-berkah-cloudflared --format '{{.HostConfig.NetworkMode}}'
```

Expected:

```txt
host
```

Verify tunnel connection:

```bash
docker logs jumat-berkah-cloudflared --tail 30
```

Expected:

```txt
Registered tunnel connection
protocol=http2
```

## Temporary Auto-Heal Cron

The temporary auto-heal script checks public URL and local origin. It restarts only `jumat-berkah-cloudflared` when public URL is unhealthy but local origin is healthy.

Install script from repo:

```bash
sudo cp scripts/check-jumat-berkah-tunnel.sh /usr/local/bin/check-jumat-berkah-tunnel.sh
sudo chmod +x /usr/local/bin/check-jumat-berkah-tunnel.sh
```

Test script:

```bash
sudo /usr/local/bin/check-jumat-berkah-tunnel.sh
sudo tail -n 20 /var/log/jumat-berkah-tunnel-watch.log
```

Cron entry:

```bash
crontab -e
```

Add:

```cron
*/5 * * * * /usr/local/bin/check-jumat-berkah-tunnel.sh
```

Verify:

```bash
crontab -l
```

### Tunnel Watch Log Cleanup

`check-jumat-berkah-tunnel.sh` keeps `/var/log/jumat-berkah-tunnel-watch.log` small without touching other logs. Default behavior compacts the file after it exceeds `1048576` bytes and keeps the last 200 lines.

Optional override:

```bash
sudo JUMAT_BERKAH_TUNNEL_LOG_MAX_BYTES=2097152 /usr/local/bin/check-jumat-berkah-tunnel.sh
```

Manual safe cleanup, if needed:

```bash
sudo tail -n 200 /var/log/jumat-berkah-tunnel-watch.log | sudo tee /var/log/jumat-berkah-tunnel-watch.log >/dev/null
```

Do not truncate unrelated `/var/log/*` files.

## Safe Restart Commands

Restart app only:

```bash
cd /var/www/jumat-berkah
docker compose -f docker-compose.staging.yml --env-file .env.production up -d
```

Restart tunnel only:

```bash
docker restart jumat-berkah-cloudflared
```

Restart database only should usually be avoided. If needed, schedule maintenance first.

## Deploy Update

```bash
cd /var/www/jumat-berkah
git pull
docker compose -f docker-compose.staging.yml --env-file .env.production up -d --build
docker compose -f docker-compose.staging.yml --env-file .env.production exec jumat-berkah-app npx prisma migrate deploy
curl -I http://127.0.0.1:3010
curl -I https://berkahkaryo.my.id
```

## Forbidden Commands on Shared Server

Do not run without explicit maintenance approval:

```bash
docker system prune
docker volume prune
docker image prune -a
docker stop $(docker ps -q)
docker rm $(docker ps -aq)
docker volume rm ...
sudo systemctl restart docker
sudo reboot
```

Safe cleanup, only when needed and understood:

```bash
docker builder prune -f
docker image prune -f
```

These can slow future builds but should not stop running apps.

## Troubleshooting Matrix

| Public URL | Local URL | Likely Cause | Action |
|---|---|---|---|
| 200 | 200 | Healthy | No action |
| 502/530 | 200 | Cloudflare Tunnel/edge issue | Restart `jumat-berkah-cloudflared`, check tunnel logs |
| 000/timeout | 200 | Network/Cloudflare route issue | Check tunnel status and Cloudflare dashboard |
| 502/530 | not 200 | App/origin issue | Check app logs and app compose status; do not restart tunnel first |
| 200 | not 200 | Cached public response / local check mismatch | Recheck with `curl -I`, inspect app logs |

## Smoke Checks After Recovery

```bash
curl -I https://berkahkaryo.my.id/
curl -I https://berkahkaryo.my.id/donasi
curl -I https://berkahkaryo.my.id/laporan
curl -I https://berkahkaryo.my.id/login
curl -I https://berkahkaryo.my.id/admin
```

Expected public pages return `200`; admin routes redirect to login for guest access.
