# PARA Bare-Metal Deploy Checklist

## Pre-Deploy
- [ ] DNS A records resolve to server IP: `pds.paramx.social`, `appview.paramx.social`, `web.paramx.social`
- [ ] SSH access confirmed
- [ ] Repo cloned at `/opt/para/final`

## Provision (bootstrap-server.sh)
- [ ] `sudo bootstrap-server.sh` ran without errors
- [ ] `node --version` → v22.x
- [ ] `go version` → go1.26.x
- [ ] `para` system user exists: `id para`
- [ ] Postgres role + DB exist: `sudo -u postgres psql -c '\l'`
- [ ] UFW enabled: `ufw status` shows 22/80/443 open

## Secrets
- [ ] `/etc/para/para-backend.env` — all `CHANGE_ME` replaced
- [ ] `/etc/para/bskyweb.env` — reviewed
- [ ] Postgres role password updated: `ALTER ROLE para PASSWORD '...'`
- [ ] PDS signing keys generated (two separate `openssl rand -hex 32`)
- [ ] JWT + DPoP secrets generated
- [ ] Secrets backed up to secure store (1Password / Vault / etc.)

## Caddy
- [ ] `sudo cp Caddyfile /etc/caddy/Caddyfile`
- [ ] `caddy validate --config /etc/caddy/Caddyfile` → OK
- [ ] `systemctl start caddy` → active
- [ ] TLS certs issued: `caddy certificates` or check `https://pds.paramx.social`

## Build
- [ ] `pnpm install --frozen-lockfile && pnpm build` — Node backend built
- [ ] `go build -o /opt/para/bin/bskyweb ./cmd/bskyweb` — binary exists

## Services
- [ ] `systemctl enable --now para-dev-env` → active
- [ ] `systemctl enable --now para-bskyweb` → active
- [ ] `systemctl enable --now para-backup.timer` → active

## Health Verification
- [ ] `scripts/healthcheck.sh` → all checks pass
- [ ] `curl https://pds.paramx.social/xrpc/_health` → `{"version":...}`
- [ ] `curl https://appview.paramx.social/xrpc/_health` → `{"version":...}`
- [ ] `curl https://web.paramx.social/` → HTML response

## Safety Nets
- [ ] Backup timer enabled: `systemctl list-timers para-backup`
- [ ] Test backup: `sudo -u para scripts/backup.sh`
- [ ] Backup files exist in `/srv/para/backups/`
- [ ] `logrotate` config installed: `sudo cp logrotate/para /etc/logrotate.d/para`
- [ ] Rollback tested: `scripts/rollback.sh <current-tag>` completes cleanly

## Post-Deploy
- [ ] Seed demo data (if applicable): `node ./scripts/civic-seed/index.mjs apply ...`
- [ ] Confirm restart persistence: `sudo systemctl restart para-dev-env && healthcheck.sh`
- [ ] Journal log clean: `journalctl -u para-dev-env --since "5 min ago" | grep -i error`
