# Backup & Restore Notes — PARA Bare-Metal

## What To Back Up

| Data | Location | Backup method |
|---|---|---|
| Postgres DB | `127.0.0.1:5432/para` | `pg_dump` → gzip |
| PDS repos + keys | `/srv/para/pds` | `rsync` |
| Blobstore | `/srv/para/blobstore` | `rsync` |
| Env secrets | `/etc/para/para-backend.env`, `/etc/para/bskyweb.env` | Manual copy to secure store |
| Caddy config | `/etc/caddy/Caddyfile` | Manual copy |

> [!CAUTION]
> The PDS signing keys (`PDS_REPO_SIGNING_KEY_K256_PRIVATE_KEY_HEX`, `PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX`)
> and JWT secret live in `/etc/para/para-backend.env`. If you lose these you cannot
> re-sign repo commits or validate sessions. Back them up to a secrets manager
> (e.g. 1Password, Vault, AWS Secrets Manager) immediately after first deploy.

---

## Automated Nightly Backup

The backup script at `deploy/bare-metal/scripts/backup.sh` handles Postgres + PDS data + blobs.

### Install cron job (as the `para` user)

```bash
sudo -u para crontab -e
```

Add:

```cron
# Daily backup at 03:00, logs to /srv/para/backups/backup.log
0 3 * * * /opt/para/final/WhatZatppa/deploy/bare-metal/scripts/backup.sh \
    >> /srv/para/backups/backup.log 2>&1
```

### Verify a backup ran

```bash
ls -lh /srv/para/backups/
tail -50 /srv/para/backups/backup.log
```

---

## Restore: Postgres

### Full restore from a dump file

```bash
# 1. Stop all app services so no new writes come in
sudo systemctl stop para-dev-env para-bskyweb

# 2. Drop and recreate the database (as postgres superuser)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS para;"
sudo -u postgres psql -c "CREATE DATABASE para OWNER para;"

# 3. Restore from the dump
gunzip < /srv/para/backups/postgres-YYYYMMDD-HHMMSS.sql.gz \
  | sudo -u postgres psql -d para

# 4. Restart services
sudo systemctl start para-dev-env para-bskyweb

# 5. Verify
WhatZatppa/deploy/bare-metal/scripts/healthcheck.sh
```

---

## Restore: PDS Data & Blobs

```bash
# 1. Stop the backend
sudo systemctl stop para-dev-env

# 2. Restore PDS data (repos, keys, SQLite)
sudo -u para rsync -a --delete \
  /srv/para/backups/pds-YYYYMMDD-HHMMSS/ \
  /srv/para/pds/

# 3. Restore blobstore
sudo -u para rsync -a --delete \
  /srv/para/backups/blobstore-YYYYMMDD-HHMMSS/ \
  /srv/para/blobstore/

# 4. Restart
sudo systemctl start para-dev-env

# 5. Verify
WhatZatppa/deploy/bare-metal/scripts/healthcheck.sh
```

---

## Key Rotation

### JWT / DPoP secret rotation

1. Generate new secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `/etc/para/para-backend.env`:
   ```bash
   sudo editor /etc/para/para-backend.env
   ```
3. Restart the backend:
   ```bash
   sudo systemctl restart para-dev-env
   ```
4. All existing sessions will be invalidated — users must re-login.

### PDS signing key rotation

> [!WARNING]
> Rotating PDS signing keys is **not** a lightweight operation.
> Existing repos are signed with the old key. The new key must be announced
> to the PLC directory. Consult the atproto spec for key rotation procedures
> before proceeding on a live PDS.

---

## Off-Host Backup (Recommended)

Copy backups to a second host or object storage:

```bash
# S3-compatible example (rclone)
rclone sync /srv/para/backups s3:your-bucket/para-backups

# rsync to a remote backup host
rsync -az /srv/para/backups/ backup-host:/backups/para/
```

---

## Retention Policy

The `backup.sh` script defaults to **14 days**. Override with:

```bash
RETAIN_DAYS=30 deploy/bare-metal/scripts/backup.sh
```
