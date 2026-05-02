#!/usr/bin/env bash
# deploy/macos/scripts/bootstrap-mac.sh
#
# One-time Mac setup for the PARA local stack.
# Run as your normal user (not root). Homebrew will sudo when needed.
#
# Usage:
#   bash /path/to/final/WhatZatppa/deploy/macos/scripts/bootstrap-mac.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../" && pwd)"
DATA_ROOT="${HOME}/para"

echo "==> Repo root : ${REPO_ROOT}"
echo "==> Data root : ${DATA_ROOT}"

# ---------------------------------------------------------------------------
# 1. Homebrew
# ---------------------------------------------------------------------------
if ! command -v brew &>/dev/null; then
  echo "==> Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "==> Installing packages..."
brew install node@22 go postgresql@16 redis cloudflared caddy

# Make node@22 the default
brew link --overwrite node@22 2>/dev/null || true
echo "    node $(node --version), go $(go version | awk '{print $3}')"

# Enable corepack → pnpm
corepack enable

# ---------------------------------------------------------------------------
# 2. Postgres + Redis via brew services
# ---------------------------------------------------------------------------
brew services start postgresql@16
brew services start redis
echo "==> Postgres and Redis started."

# Create Postgres role + DB (idempotent)
sleep 2
psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='para'" | grep -q 1 || \
  psql postgres -c "CREATE ROLE para WITH LOGIN PASSWORD 'CHANGE_ME';"
psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='para'" | grep -q 1 || \
  psql postgres -c "CREATE DATABASE para OWNER para;"
echo "    Postgres role 'para' and database 'para' ready."

# ---------------------------------------------------------------------------
# 3. Storage directories
# ---------------------------------------------------------------------------
mkdir -p \
  "${DATA_ROOT}/pds" \
  "${DATA_ROOT}/blobstore" \
  "${DATA_ROOT}/backups" \
  "${DATA_ROOT}/bin"
echo "==> Storage dirs created under ${DATA_ROOT}/"

# ---------------------------------------------------------------------------
# 4. Build bskyweb binary
# ---------------------------------------------------------------------------
echo "==> Building bskyweb..."
cd "${REPO_ROOT}/PARA/bskyweb"
go build -o "${DATA_ROOT}/bin/bskyweb" ./cmd/bskyweb
echo "    Built: ${DATA_ROOT}/bin/bskyweb"

# ---------------------------------------------------------------------------
# 5. Build Node backend
# ---------------------------------------------------------------------------
echo "==> Building Node backend..."
cd "${REPO_ROOT}/WhatZatppa"
pnpm install --frozen-lockfile
pnpm build
echo "    Node backend built."

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
cat <<MSG

============================================================
  Bootstrap complete. Next steps:
============================================================

1. Copy and edit env files:
     cp WhatZatppa/deploy/macos/env.backend.example ~/para/para-backend.env
     cp WhatZatppa/deploy/macos/env.bskyweb.example ~/para/bskyweb.env
     \$EDITOR ~/para/para-backend.env
     \$EDITOR ~/para/bskyweb.env

2. Update Postgres password:
     psql postgres -c "ALTER ROLE para PASSWORD '<your-password>';"

3. Install launchd agents:
     bash WhatZatppa/deploy/macos/scripts/install-services.sh

4. Start a Cloudflare tunnel for testing (no account needed):
     cloudflared tunnel --url http://localhost:8080
     # Caddy multiplexes all three services on 8080

5. Run health checks:
     bash WhatZatppa/deploy/macos/scripts/healthcheck.sh

MSG
