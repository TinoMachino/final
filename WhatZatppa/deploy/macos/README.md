# Mac Local Deploy Runbook — PARA

## Architecture

```
Cloudflare Tunnel (free, no domain needed to start)
  -> http://localhost:8080
       -> Caddy (path routing)
            -> :2583  Node — PDS
            -> :2584  Node — AppView
            -> :8100  Go   — bskyweb
  
launchd (~/Library/LaunchAgents/)
  -> com.para.dev-env   (Node backend)
  -> com.para.bskyweb   (Go frontend)

brew services
  -> postgresql@16
  -> redis
```

---

## One-Time Setup

```bash
bash WhatZatppa/deploy/macos/scripts/bootstrap-mac.sh
```

Then edit env files (replace all `CHANGE_ME` and `YOURUSERNAME`):

```bash
cp WhatZatppa/deploy/macos/env.backend.example ~/para/para-backend.env
cp WhatZatppa/deploy/macos/env.bskyweb.example ~/para/bskyweb.env
$EDITOR ~/para/para-backend.env
$EDITOR ~/para/bskyweb.env
# Update Postgres password to match env:
psql postgres -c "ALTER ROLE para PASSWORD '<your-password>';"
```

Install launchd agents + Caddyfile:

```bash
bash WhatZatppa/deploy/macos/scripts/install-services.sh
```

---

## Start / Stop

```bash
bash WhatZatppa/deploy/macos/scripts/start.sh
bash WhatZatppa/deploy/macos/scripts/stop.sh
```

---

## Expose to the Internet (Cloudflare Tunnel)

### Phase 1 — No account, temp URL

```bash
cloudflared tunnel --url http://localhost:8080
# Prints: https://random-slug.trycloudflare.com
# Share this URL for testing.
```

### Phase 2 — With your domain (after buying it)

1. Add domain to Cloudflare → set nameservers.
2. Create named tunnel:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create para
   ```
3. Create `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /Users/YOURUSERNAME/.cloudflared/<tunnel-id>.json

   ingress:
     - hostname: pds.paramx.social
       service: http://localhost:2583
     - hostname: appview.paramx.social
       service: http://localhost:2584
     - hostname: web.paramx.social
       service: http://localhost:8100
     - service: http_status:404
   ```
4. Add DNS routes:
   ```bash
   cloudflared tunnel route dns para pds.paramx.social
   cloudflared tunnel route dns para appview.paramx.social
   cloudflared tunnel route dns para web.paramx.social
   ```
5. Update `~/para/para-backend.env`:
   ```bash
   DEV_ENV_PDS_HOSTNAME=pds.paramx.social
   DEV_ENV_BSKY_PUBLIC_URL=https://appview.paramx.social
   BSKY_SERVER_DID=did:web:appview.paramx.social
   ```
6. Run tunnel as a service:
   ```bash
   sudo cloudflared service install
   sudo launchctl start com.cloudflare.cloudflared
   ```

---

## Health Check

```bash
bash WhatZatppa/deploy/macos/scripts/healthcheck.sh
```

---

## Logs

```bash
tail -f ~/para/logs/dev-env.log
tail -f ~/para/logs/bskyweb.log
```

---

## Rebuild After Code Changes

```bash
cd WhatZatppa && pnpm build
cd PARA/bskyweb && go build -o ~/para/bin/bskyweb ./cmd/bskyweb
bash WhatZatppa/deploy/macos/scripts/stop.sh
bash WhatZatppa/deploy/macos/scripts/start.sh
```

---

## Backups

Same script as bare-metal, adjusted paths:

```bash
BACKUP_DIR=~/para/backups \
PDS_DIR=~/para/pds \
BLOBSTORE_DIR=~/para/blobstore \
bash WhatZatppa/deploy/bare-metal/scripts/backup.sh
```

Add to crontab (`crontab -e`):
```cron
0 3 * * * BACKUP_DIR=$HOME/para/backups PDS_DIR=$HOME/para/pds BLOBSTORE_DIR=$HOME/para/blobstore bash /path/to/WhatZatppa/deploy/bare-metal/scripts/backup.sh >> $HOME/para/backups/backup.log 2>&1
```
