#!/bin/sh

set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /path/to/jumat-berkah-postgres-YYYYMMDDTHHMMSSZ.sql.gz" >&2
  exit 1
fi

BACKUP_FILE="$1"
RESTORE_CONTAINER="${JUMAT_BERKAH_RESTORE_CONTAINER:-jumat-berkah-postgres-restore-drill}"
RESTORE_DB="${JUMAT_BERKAH_RESTORE_DB:-jumat_berkah_restore}"
RESTORE_USER="${JUMAT_BERKAH_RESTORE_USER:-restore_user}"
RESTORE_PASSWORD="${JUMAT_BERKAH_RESTORE_PASSWORD:-restore_password_change_me}"
POSTGRES_IMAGE="${JUMAT_BERKAH_POSTGRES_IMAGE:-postgres:16-alpine}"

case "$BACKUP_FILE" in
  *jumat-berkah-postgres-*.sql.gz) ;;
  *)
    echo "Refusing unexpected backup filename: $BACKUP_FILE" >&2
    exit 1
    ;;
esac

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

cleanup() {
  docker rm -f "$RESTORE_CONTAINER" >/dev/null 2>&1 || true
}

cleanup

docker run -d \
  --name "$RESTORE_CONTAINER" \
  -e POSTGRES_DB="$RESTORE_DB" \
  -e POSTGRES_USER="$RESTORE_USER" \
  -e POSTGRES_PASSWORD="$RESTORE_PASSWORD" \
  "$POSTGRES_IMAGE" >/dev/null

for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if docker exec "$RESTORE_CONTAINER" pg_isready -U "$RESTORE_USER" -d "$RESTORE_DB" >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" = "10" ]; then
    echo "Temporary restore database did not become ready" >&2
    cleanup
    exit 1
  fi
  sleep 2
done

gzip -dc "$BACKUP_FILE" | docker exec -i "$RESTORE_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$RESTORE_USER" -d "$RESTORE_DB" >/dev/null

docker exec "$RESTORE_CONTAINER" psql -U "$RESTORE_USER" -d "$RESTORE_DB" -Atc "select 'users=' || count(*) from users;"
docker exec "$RESTORE_CONTAINER" psql -U "$RESTORE_USER" -d "$RESTORE_DB" -Atc "select 'donations=' || count(*) from donations;"
docker exec "$RESTORE_CONTAINER" psql -U "$RESTORE_USER" -d "$RESTORE_DB" -Atc "select 'expenses=' || count(*) from expenses;"

cleanup

echo "Restore drill completed successfully. Temporary container removed: $RESTORE_CONTAINER"
