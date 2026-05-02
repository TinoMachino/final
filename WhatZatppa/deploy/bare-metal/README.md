# Bare-Metal Deploy Runbook — PARA / paramx.social

This folder contains all artifacts needed to deploy the PARA backend stack
on a single Linux host using **Caddy**, **systemd**, system **Postgres**, and **Redis**.

## Target Architecture

```
Internet
  -> Caddy :80/:443 (TLS terminated, ACME auto-renewal)
       -> pds.paramx.social      -> 127.0.0.1:2583  (Node — PDS)
       -> appview.paramx.social  -> 127.0.0.1:2584  (Node — AppView/bsky)
       -> web.paramx.social      -> 127.0.0.1:8100  (Go   — bskyweb frontend)

systemd
  -> para-dev-env.service   (Node dev-env launcher: PDS + AppView + PLC)
  -> para-bskyweb.service   (Go bskyweb web frontend)

system packages
  -> postgresql
  -> redis-server

persistent disk
  -> /srv/para/pds          (PDS repo data + keys)
  -> /srv/para/blobstore    (media blobs)
  -> /srv/para/backups      (nightly dumps)
```

## Prerequisites

- Ubuntu 22.04 / 24.04 (Debian-family).
- DNS `A` records already pointing to this server:
  - `pds.paramx.social`
  - `appview.paramx.social`
  - `web.paramx.social`
- Root (or sudo) access for initial setup.
- The repo checked out at `/opt/para/final` (or set `REPO_ROOT`).

## File Map

```
deploy/bare-metal/
  Caddyfile                       Caddy reverse-proxy config
  env.production.example          Node backend env template
  bskyweb.env.example             bskyweb (Go) env template
  systemd/
    para-dev-env.service          Node backend systemd unit
    para-bskyweb.service          bskyweb (Go) systemd unit
  scripts/
    bootstrap-server.sh           One-time server provisioning
    healthcheck.sh                Service health verification
    backup.sh                     Nightly backup (Postgres + PDS data)
    rollback.sh                   Emergency rollback to a git ref
  backup/
    restore-notes.md              Restore procedures and key rotation guide
```

---

## Step 1 — One-Time Server Provisioning

Run as root on the fresh server:

```bash
sudo bash /opt/para/final/WhatZatppa/deploy/bare-metal/scripts/bootstrap-server.sh
```

This installs: Caddy, Postgres, Redis, Node 22 (NodeSource), Go (go.dev/dl),
creates the `para` system user, storage directories, and Postgres role+database.

---

## Step 2 — Fill In Secrets

```bash
sudo cp /opt/para/final/WhatZatppa/deploy/bare-metal/env.production.example \
        /etc/para/para-backend.env
sudo cp /opt/para/final/WhatZatppa/deploy/bare-metal/bskyweb.env.example \
        /etc/para/bskyweb.env

sudo editor /etc/para/para-backend.env   # fill ALL CHANGE_ME values
sudo editor /etc/para/bskyweb.env
```

Generate secrets with:

```bash
# 32-byte hex (JWT, DPoP, rate-limit bypass, DB password)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# k256 private keys (PDS repo signing + PLC rotation)
openssl rand -hex 32
```

Update the Postgres role password to match:

```bash
sudo -u postgres psql -c "ALTER ROLE para PASSWORD '<your-db-password>';"
```

---

## Step 3 — Install Caddy Config

```bash
sudo cp /opt/para/final/WhatZatppa/deploy/bare-metal/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl start caddy
```

---

## Step 4 — Build And Install Services

### 4a. Build Node backend

```bash
sudo -u para bash -c '
  cd /opt/para/final/WhatZatppa
  corepack enable
  pnpm install --frozen-lockfile
  pnpm build
'
```

### 4b. Build bskyweb (Go)

```bash
sudo -u para bash -c '
  cd /opt/para/final/PARA/bskyweb
  go build -o /opt/para/bin/bskyweb ./cmd/bskyweb
'
```

### 4c. Install systemd units

```bash
sudo cp /opt/para/final/WhatZatppa/deploy/bare-metal/systemd/*.service \
        /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now para-dev-env para-bskyweb
```

---

## Step 5 — Verify Health

```bash
# Wait ~30s for PDS/AppView to bootstrap on first start, then:
/opt/para/final/WhatZatppa/deploy/bare-metal/scripts/healthcheck.sh
```

Or manually:

```bash
curl -fsS http://127.0.0.1:2583/xrpc/_health   # PDS local
curl -fsS http://127.0.0.1:2584/xrpc/_health   # AppView local
curl -fsS http://127.0.0.1:8100/               # bskyweb local
curl -fsS https://pds.paramx.social/xrpc/_health
curl -fsS https://appview.paramx.social/xrpc/_health
curl -fsS https://web.paramx.social/
```

---

## Day-2 Operations

### Build + deploy an update

```bash
# As para user:
cd /opt/para/final
git pull origin main
cd WhatZatppa && pnpm install --frozen-lockfile && pnpm build
cd /opt/para/final/PARA/bskyweb && go build -o /opt/para/bin/bskyweb ./cmd/bskyweb
sudo systemctl restart para-dev-env para-bskyweb
```

### Roll back to a specific tag

```bash
sudo -u para /opt/para/final/WhatZatppa/deploy/bare-metal/scripts/rollback.sh v1.2.3
```

### Check logs

```bash
journalctl -u para-dev-env -f
journalctl -u para-bskyweb  -f
journalctl -u caddy          -f
```

### Restart a single service

```bash
sudo systemctl restart para-dev-env
sudo systemctl restart para-bskyweb
sudo systemctl reload caddy    # reload Caddyfile without downtime
```

---

## Backups

Set up the nightly cron job as the `para` user:

```bash
sudo -u para crontab -e
# Add:
0 3 * * * /opt/para/final/WhatZatppa/deploy/bare-metal/scripts/backup.sh >> /srv/para/backups/backup.log 2>&1
```

See `backup/restore-notes.md` for restore procedures and key rotation guidance.

---

## Persistence

The following survive normal service restarts:

- Postgres database (AppView, Ozone, PLC state)
- Redis (system service, AOF/snapshot as configured)
- PDS repos + keys: `/srv/para/pds`
- Media blobs: `/srv/para/blobstore`

> [!WARNING]
> Do not delete `/srv/para/pds` or `/srv/para/blobstore` unless intentionally
> resetting. Loss of PDS data means user identities and repos are gone.

---

## Known Follow-Ups

- Split `para-dev-env` into dedicated per-service systemd units (PDS, AppView,
  Ozone, PLC) once service boundaries stabilize.
- Add a systemd timer for `backup.sh` as an alternative to cron.
- Add Prometheus/Grafana scrape config for relay lag and AppView metrics.
- Wire backup rotation to off-host storage (S3 / rsync remote).
- Add CI check for `caddy validate` on Caddyfile changes.
