#!/usr/bin/env bash
# WNI Series — encrypted PostgreSQL backup to R2.
#
# Prerequisites on the VPS:
#   - docker compose project at /srv/wni (compose.yaml)
#   - rclone remote named "r2" pointing at the private bucket
#   - age public key in AGE_PUBLIC_KEY (private key stored offline)
#   - HEALTHCHECK_URL optional (healthchecks.io ping)
#
# Never commit the age private key or rclone config.

set -euo pipefail

ROOT="${WNI_ROOT:-/srv/wni}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TMP_DIR="${ROOT}/shared/backups"
DUMP="${TMP_DIR}/wni-${STAMP}.dump"
ENC="${DUMP}.age"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

mkdir -p "$TMP_DIR"
umask 077

cleanup() {
  rm -f "$DUMP" "$ENC"
}
trap cleanup EXIT

echo "[backup] dumping database ${STAMP}"
docker compose --env-file "${ROOT}/.env" -f "${ROOT}/compose.yaml" \
  exec -T postgres pg_dump -Fc -U wni -d wni > "$DUMP"

echo "[backup] verifying archive listing"
pg_restore --list "$DUMP" >/dev/null

if [[ -n "${AGE_PUBLIC_KEY:-}" ]]; then
  echo "[backup] encrypting"
  age -r "$AGE_PUBLIC_KEY" -o "$ENC" "$DUMP"
  UPLOAD="$ENC"
else
  echo "[backup] WARNING: AGE_PUBLIC_KEY is not set; uploading unencrypted dump" >&2
  UPLOAD="$DUMP"
fi

echo "[backup] uploading"
rclone copy "$UPLOAD" "r2:${R2_BUCKET:-wni-private}/db/" --immutable

echo "[backup] pruning local files older than ${RETENTION_DAYS} days"
find "$TMP_DIR" -type f -name 'wni-*.dump*' -mtime +"${RETENTION_DAYS}" -delete

if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
  curl -fsS --max-time 10 "$HEALTHCHECK_URL" >/dev/null || true
fi

echo "[backup] done ${STAMP}"
