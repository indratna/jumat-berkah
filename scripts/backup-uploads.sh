#!/bin/sh

set -eu

UPLOAD_VOLUME="${JUMAT_BERKAH_UPLOAD_VOLUME:-jumat_berkah_uploads}"
BACKUP_DIR="${JUMAT_BERKAH_BACKUP_DIR:-/var/backups/jumat-berkah}"
RETENTION_DAYS="${JUMAT_BERKAH_BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/jumat-berkah-uploads-$TIMESTAMP.tar.gz"
CHECKSUM_FILE="$BACKUP_FILE.sha256"
LOG_FILE="${JUMAT_BERKAH_BACKUP_LOG:-/var/log/jumat-berkah-backup.log}"
HELPER_IMAGE="${JUMAT_BERKAH_BACKUP_IMAGE:-alpine:3}"

notify_backup_failure() {
  status="$?"
  if [ "$status" -eq 0 ]; then
    return 0
  fi

  echo "$(date -Is) uploads backup failed with exit code $status" >> "$LOG_FILE"

  if [ "${EMAIL_PROVIDER:-}" = "resend" ] && [ -n "${RESEND_API_KEY:-}" ] && [ -n "${EMAIL_FROM:-}" ] && [ -n "${ADMIN_EMAIL_NOTIFICATIONS:-}" ]; then
    escaped_error="Backup file upload Jumat Berkah gagal di host $(hostname). Exit code: $status"
    curl -fsS https://api.resend.com/emails \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H "Content-Type: application/json" \
      --data "{\"from\":\"$EMAIL_FROM\",\"to\":[\"$ADMIN_EMAIL_NOTIFICATIONS\"],\"subject\":\"[Jumat Berkah] Backup Upload Gagal\",\"text\":\"$escaped_error\"}" >/dev/null 2>&1 || true
  fi

  exit "$status"
}

trap notify_backup_failure EXIT

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"
chmod 700 "$BACKUP_DIR"

echo "$(date -Is) starting uploads backup to $BACKUP_FILE" >> "$LOG_FILE"

# The archive is written by a helper container because the volume is only
# reachable through the Docker daemon, not from a host path.
docker run --rm \
  -v "$UPLOAD_VOLUME:/data:ro" \
  -v "$BACKUP_DIR:/backup" \
  "$HELPER_IMAGE" \
  tar -czf "/backup/$(basename "$BACKUP_FILE")" -C /data .

chmod 600 "$BACKUP_FILE"
sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
chmod 600 "$CHECKSUM_FILE"

find "$BACKUP_DIR" -type f -name 'jumat-berkah-uploads-*.tar.gz' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'jumat-berkah-uploads-*.tar.gz.sha256' -mtime +"$RETENTION_DAYS" -delete

echo "$(date -Is) uploads backup completed: $BACKUP_FILE" >> "$LOG_FILE"
printf '%s\n' "$BACKUP_FILE"