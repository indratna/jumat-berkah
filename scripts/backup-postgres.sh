#!/bin/sh

set -eu

DB_CONTAINER="${JUMAT_BERKAH_DB_CONTAINER:-jumat-berkah-postgres}"
DB_NAME="${JUMAT_BERKAH_DB_NAME:-jumat_berkah}"
DB_USER="${JUMAT_BERKAH_DB_USER:-jumat_berkah_user}"
BACKUP_DIR="${JUMAT_BERKAH_BACKUP_DIR:-/var/backups/jumat-berkah}"
RETENTION_DAYS="${JUMAT_BERKAH_BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/jumat-berkah-postgres-$TIMESTAMP.sql.gz"
CHECKSUM_FILE="$BACKUP_FILE.sha256"
LOG_FILE="${JUMAT_BERKAH_BACKUP_LOG:-/var/log/jumat-berkah-backup.log}"

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"
chmod 700 "$BACKUP_DIR"

echo "$(date -Is) starting backup to $BACKUP_FILE" >> "$LOG_FILE"

docker exec "$DB_CONTAINER" pg_dump --no-owner --no-privileges --username "$DB_USER" "$DB_NAME" | gzip -9 > "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE"

sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
chmod 600 "$CHECKSUM_FILE"

find "$BACKUP_DIR" -type f -name 'jumat-berkah-postgres-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'jumat-berkah-postgres-*.sql.gz.sha256' -mtime +"$RETENTION_DAYS" -delete

echo "$(date -Is) backup completed: $BACKUP_FILE" >> "$LOG_FILE"
printf '%s\n' "$BACKUP_FILE"
