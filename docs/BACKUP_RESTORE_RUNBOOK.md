# Backup & Restore Runbook â€” Jumat Berkah

Runbook ini hanya untuk database PostgreSQL Jumat Berkah. Jangan menyentuh container, volume, atau backup aplikasi lain.

## Runtime Target

- Source container: `jumat-berkah-postgres`
- Database: `jumat_berkah`
- User: `jumat_berkah_user`
- Backup directory: `/var/backups/jumat-berkah`
- Backup format: `jumat-berkah-postgres-YYYYMMDDTHHMMSSZ.sql.gz`
- Default retention: 14 hari
- Temporary restore container: `jumat-berkah-postgres-restore-drill`

## Install Scripts On Server

```bash
cd /var/www/jumat-berkah
sudo cp scripts/backup-postgres.sh /usr/local/bin/jumat-berkah-backup-postgres.sh
sudo cp scripts/restore-drill-postgres.sh /usr/local/bin/jumat-berkah-restore-drill-postgres.sh
sudo chmod +x /usr/local/bin/jumat-berkah-backup-postgres.sh
sudo chmod +x /usr/local/bin/jumat-berkah-restore-drill-postgres.sh
sudo mkdir -p /var/backups/jumat-berkah
sudo chmod 700 /var/backups/jumat-berkah
```

## Manual Backup

```bash
sudo /usr/local/bin/jumat-berkah-backup-postgres.sh
```

Expected output:

```txt
/var/backups/jumat-berkah/jumat-berkah-postgres-YYYYMMDDTHHMMSSZ.sql.gz
```

Verify files:

```bash
sudo ls -lh /var/backups/jumat-berkah
sudo sha256sum -c /var/backups/jumat-berkah/jumat-berkah-postgres-YYYYMMDDTHHMMSSZ.sql.gz.sha256
sudo tail -n 50 /var/log/jumat-berkah-backup.log
```

## Daily Cron

Open root crontab:

```bash
sudo crontab -e
```

Add daily backup at 02:15 server time:

```cron
15 2 * * * /usr/local/bin/jumat-berkah-backup-postgres.sh >/dev/null 2>&1
```

Verify:

```bash
sudo crontab -l
```

## Retention

Default cleanup removes only files matching these patterns inside `/var/backups/jumat-berkah`:

```txt
jumat-berkah-postgres-*.sql.gz
jumat-berkah-postgres-*.sql.gz.sha256
```

Default retention is 14 days. Override example:

```bash
sudo JUMAT_BERKAH_BACKUP_RETENTION_DAYS=30 /usr/local/bin/jumat-berkah-backup-postgres.sh
```

Do not run global cleanup against `/var/backups`.

## Restore Drill To Temporary Container

Never restore into production database without explicit manual maintenance approval.

Run drill with one backup file:

```bash
sudo /usr/local/bin/jumat-berkah-restore-drill-postgres.sh /var/backups/jumat-berkah/jumat-berkah-postgres-YYYYMMDDTHHMMSSZ.sql.gz
```

Expected output includes table row counts:

```txt
users=...
donations=...
expenses=...
Restore drill completed successfully. Temporary container removed: jumat-berkah-postgres-restore-drill
```

The drill creates and removes only temporary container:

```txt
jumat-berkah-postgres-restore-drill
```

It does not overwrite production database.

## Safe Health Checks After Backup

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep jumat-berkah
curl -I http://127.0.0.1:3000
curl -I https://your-domain.example.com
```

Expected:

- `jumat-berkah-postgres` still healthy.
- App local URL returns `200`.
- Public URL returns `200`.

## Forbidden Commands

Do not run:

```bash
docker volume prune
docker system prune
docker stop $(docker ps -q)
docker rm $(docker ps -aq)
sudo rm -rf /var/backups
```

## Recovery Note

Production restore is intentionally not automated. If live data restore is needed, stop, take fresh copy of current DB, schedule maintenance, then restore only after explicit approval.
