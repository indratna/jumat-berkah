#!/bin/sh

set -eu

PUBLIC_URL="${JUMAT_BERKAH_PUBLIC_URL:-https://berkahkaryo.my.id/}"
LOCAL_URL="${JUMAT_BERKAH_LOCAL_URL:-http://127.0.0.1:3010/}"
TUNNEL_CONTAINER="${JUMAT_BERKAH_TUNNEL_CONTAINER:-jumat-berkah-cloudflared}"
LOG_FILE="${JUMAT_BERKAH_TUNNEL_LOG:-/var/log/jumat-berkah-tunnel-watch.log}"
MAX_LOG_BYTES="${JUMAT_BERKAH_TUNNEL_LOG_MAX_BYTES:-1048576}"

mkdir -p "$(dirname "$LOG_FILE")"
if [ -f "$LOG_FILE" ]; then
  LOG_BYTES="$(wc -c < "$LOG_FILE" | tr -d ' ')"
  if [ "$LOG_BYTES" -gt "$MAX_LOG_BYTES" ]; then
    tail -n 200 "$LOG_FILE" > "$LOG_FILE.tmp"
    mv "$LOG_FILE.tmp" "$LOG_FILE"
    echo "$(date -Is) compacted tunnel watch log after reaching ${LOG_BYTES} bytes" >> "$LOG_FILE"
  fi
fi

PUBLIC_STATUS="$(curl -L -s -o /dev/null -w "%{http_code}" "$PUBLIC_URL" || echo "000")"
LOCAL_STATUS="$(curl -s -o /dev/null -w "%{http_code}" "$LOCAL_URL" || echo "000")"

if [ "$PUBLIC_STATUS" != "200" ] && [ "$LOCAL_STATUS" = "200" ]; then
  echo "$(date -Is) public unhealthy: $PUBLIC_STATUS, local healthy: $LOCAL_STATUS, restarting tunnel" >> "$LOG_FILE"
  docker restart "$TUNNEL_CONTAINER" >> "$LOG_FILE" 2>&1
fi

if [ "$LOCAL_STATUS" != "200" ]; then
  echo "$(date -Is) local origin unhealthy: $LOCAL_STATUS, not restarting tunnel" >> "$LOG_FILE"
fi
