#!/bin/sh

set -eu

# Calls one authenticated cron endpoint from the host scheduler.
#
# The secret is read from the app env file instead of being written into the
# crontab, so rotating CRON_SECRET only means editing .env.production and
# recreating the app container.
#
# Usage: run-cron-endpoint.sh [daily|health]

APP_BASE="${JUMAT_BERKAH_APP_URL:-http://127.0.0.1:3010}"
ENV_FILE="${JUMAT_BERKAH_ENV_FILE:-/var/www/jumat-berkah/.env.production}"
LOG_FILE="${JUMAT_BERKAH_CRON_LOG:-$HOME/jumat-berkah-cron.log}"

case "${1:-health}" in
  daily) TARGET="/api/cron/telegram/daily" ;;
  health) TARGET="/api/cron/telegram/health" ;;
  *)
    printf 'usage: %s [daily|health]\n' "$0" >&2
    exit 2
    ;;
esac

SECRET=$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -n 1 | cut -d= -f2- | tr -d '"'"'"'')

if [ -z "$SECRET" ]; then
  printf '%s %s CRON_SECRET missing in %s\n' "$(date -Is)" "$1" "$ENV_FILE" >> "$LOG_FILE"
  exit 1
fi

BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT

CODE=$(curl -s --max-time 30 -o "$BODY" -w '%{http_code}' \
  -H "X-Cron-Secret: $SECRET" \
  "$APP_BASE$TARGET" || echo "000")

printf '%s %s http=%s body=%s\n' \
  "$(date -Is)" "$1" "$CODE" "$(tr -d '\n' < "$BODY" | cut -c1-400)" >> "$LOG_FILE"

if [ "$CODE" != "200" ]; then
  exit 1
fi