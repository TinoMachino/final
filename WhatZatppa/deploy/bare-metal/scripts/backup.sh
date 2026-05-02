#!/usr/bin/env bash
# deploy/bare-metal/scripts/backup.sh
#
# Nightly backup: Postgres dump + PDS data/blobs.
# Safe to run as the 'para' user (no root required).
#
# Install as a cron job (run as para):
#   sudo -u para crontab -e
#   # Add:
#   0 3 * * * /opt/para/final/WhatZatppa/deploy/bare-metal/scripts/backup.sh >> /srv/para/backups/backup.log 2>&1
#
# Or as a systemd timer (see deploy/bare-metal/systemd/ for a template).
#
# Environment overrides:
#   BACKUP_DIR       (default: /srv/para/backups)
#   DB_NAME          (default: para)
#   RETAIN_DAYS      (default: 14)
#   PDS_DIR          (default: /srv/para/pds)
#   BLOBSTORE_DIR    (default: /srv/para/blobstore)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/srv/para/backups}"
DB_NAME="${DB_NAME:-para}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"
PDS_DIR="${PDS_DIR:-/srv/para/pds}"
BLOBSTORE_DIR="${BLOBSTORE_DIR:-/srv/para/blobstore}"

DATE="$(date +%Y%m%d-%H%M%S)"
LOG_PREFIX="[backup ${DATE}]"

mkdir -p "${BACKUP_DIR}"

echo "${LOG_PREFIX} Starting backup..."

# ---------------------------------------------------------------------------
# 1. Postgres dump
# ---------------------------------------------------------------------------
PGDUMP_FILE="${BACKUP_DIR}/postgres-${DATE}.sql.gz"
echo "${LOG_PREFIX} Dumping Postgres database '${DB_NAME}' -> ${PGDUMP_FILE}"
pg_dump "${DB_NAME}" | gzip > "${PGDUMP_FILE}"
echo "${LOG_PREFIX} Postgres dump complete ($(du -sh "${PGDUMP_FILE}" | cut -f1))"

# ---------------------------------------------------------------------------
# 2. PDS data directory (repos, keys)
# ---------------------------------------------------------------------------
PDS_BACKUP="${BACKUP_DIR}/pds-${DATE}"
echo "${LOG_PREFIX} Syncing PDS data ${PDS_DIR} -> ${PDS_BACKUP}"
mkdir -p "${PDS_BACKUP}"
rsync -a --delete "${PDS_DIR}/" "${PDS_BACKUP}/"
echo "${LOG_PREFIX} PDS data sync complete ($(du -sh "${PDS_BACKUP}" | cut -f1))"

# ---------------------------------------------------------------------------
# 3. Blobstore
# ---------------------------------------------------------------------------
BLOB_BACKUP="${BACKUP_DIR}/blobstore-${DATE}"
echo "${LOG_PREFIX} Syncing blobstore ${BLOBSTORE_DIR} -> ${BLOB_BACKUP}"
mkdir -p "${BLOB_BACKUP}"
rsync -a --delete "${BLOBSTORE_DIR}/" "${BLOB_BACKUP}/"
echo "${LOG_PREFIX} Blobstore sync complete ($(du -sh "${BLOB_BACKUP}" | cut -f1))"

# ---------------------------------------------------------------------------
# 4. Prune old backups
# ---------------------------------------------------------------------------
echo "${LOG_PREFIX} Pruning backups older than ${RETAIN_DAYS} days..."
find "${BACKUP_DIR}" -maxdepth 1 -name "postgres-*.sql.gz" \
  -mtime +"${RETAIN_DAYS}" -delete -print | while read -r f; do
  echo "${LOG_PREFIX}   deleted ${f}"
done
find "${BACKUP_DIR}" -maxdepth 1 -name "pds-*" -type d \
  -mtime +"${RETAIN_DAYS}" -exec rm -rf {} + 2>/dev/null || true
find "${BACKUP_DIR}" -maxdepth 1 -name "blobstore-*" -type d \
  -mtime +"${RETAIN_DAYS}" -exec rm -rf {} + 2>/dev/null || true

echo "${LOG_PREFIX} Backup finished successfully."
echo "${LOG_PREFIX} Backup dir usage: $(du -sh "${BACKUP_DIR}" | cut -f1)"
