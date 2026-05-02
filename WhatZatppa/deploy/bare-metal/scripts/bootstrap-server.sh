#!/usr/bin/env bash
# deploy/bare-metal/scripts/bootstrap-server.sh
#
# One-time server provisioning script for the PARA bare-metal stack.
# Run as root on a fresh Ubuntu 22.04 / 24.04 host.
#
# Usage:
#   sudo bash /opt/para/final/WhatZatppa/deploy/bare-metal/scripts/bootstrap-server.sh
#
# What this does:
#   1. Updates apt and installs base packages (Caddy, Postgres, Redis, ufw, etc.)
#   2. Installs Node 22 (system-wide via NodeSource) + corepack/pnpm
#   3. Installs Go (latest stable via go.dev/dl) into /usr/local/go
#   4. Creates the 'para' system user and storage directories
#   5. Creates the Postgres role and database
#   6. Enables UFW with SSH/HTTP/HTTPS rules
#   7. Creates /etc/para config directory

set -euo pipefail
DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------------------
# 0. Guard
# ---------------------------------------------------------------------------
if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: Run as root, e.g.: sudo $0" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
BACKEND_ROOT="${REPO_ROOT}/WhatZatppa"
FRONTEND_ROOT="${REPO_ROOT}/PARA"

echo "==> Repo root : ${REPO_ROOT}"
echo "==> Backend   : ${BACKEND_ROOT}"
echo "==> Frontend  : ${FRONTEND_ROOT}"
echo ""

# ---------------------------------------------------------------------------
# 1. Base packages (Caddy from official Caddy apt repo)
# ---------------------------------------------------------------------------
echo "==> Installing base packages..."

apt-get update -q

# Add Caddy official apt repo (gives a much more recent Caddy than Ubuntu repos)
if ! dpkg -l caddy &>/dev/null; then
  apt-get install -y -q apt-transport-https curl gnupg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] \
https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q
fi

apt-get install -y -q \
  ca-certificates \
  caddy \
  curl \
  git \
  jq \
  postgresql \
  postgresql-client \
  redis-server \
  rsync \
  ufw \
  unzip

# ---------------------------------------------------------------------------
# 2. Node 22 via NodeSource (system-wide, not NVM)
#    NodeSource GPG key + apt repo → /usr/bin/node
# ---------------------------------------------------------------------------
if ! node --version 2>/dev/null | grep -q '^v22'; then
  echo "==> Installing Node 22 via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "    node $(node --version)"

# Enable corepack so pnpm is available as the deploy user
corepack enable
echo "    corepack enabled (pnpm available via corepack)"

# ---------------------------------------------------------------------------
# 3. Go — latest stable from go.dev/dl
#    go.mod says 'go 1.26'; install the latest available and pin in .profile
# ---------------------------------------------------------------------------
GO_INSTALL_DIR=/usr/local
GO_BIN=/usr/local/go/bin/go

if ! "${GO_BIN}" version &>/dev/null; then
  echo "==> Installing Go (latest stable)..."
  # Fetch the latest stable version number from go.dev
  GO_VERSION=$(curl -fsSL "https://go.dev/dl/?mode=json" \
    | jq -r '[.[] | select(.stable==true)] | .[0].version')
  ARCH=$(dpkg --print-architecture)
  case "${ARCH}" in
    amd64) GOARCH=amd64 ;;
    arm64) GOARCH=arm64 ;;
    *) echo "Unsupported arch: ${ARCH}" >&2; exit 1 ;;
  esac
  TARBALL="${GO_VERSION}.linux-${GOARCH}.tar.gz"
  curl -fsSL "https://dl.google.com/go/${TARBALL}" -o "/tmp/${TARBALL}"
  rm -rf /usr/local/go
  tar -C /usr/local -xzf "/tmp/${TARBALL}"
  rm "/tmp/${TARBALL}"
  ln -sf /usr/local/go/bin/go /usr/local/bin/go
  ln -sf /usr/local/go/bin/gofmt /usr/local/bin/gofmt
fi
echo "    $(go version)"

# ---------------------------------------------------------------------------
# 4. 'para' system user + storage directories
# ---------------------------------------------------------------------------
echo "==> Creating 'para' system user..."
if ! id para &>/dev/null; then
  useradd --system --shell /usr/sbin/nologin --home-dir /opt/para --create-home para
fi

echo "==> Creating storage directories..."
install -d -o para -g para -m 0750 /srv/para
install -d -o para -g para -m 0750 /srv/para/pds
install -d -o para -g para -m 0750 /srv/para/blobstore
install -d -o para -g para -m 0750 /srv/para/backups
install -d -o para -g para -m 0750 /opt/para/bin
install -d -o root -g root -m 0755 /etc/para

# Give para user access to the repo checkout (if already cloned here)
if [[ -d "${REPO_ROOT}" ]]; then
  chown -R para:para "${REPO_ROOT}"
fi

# ---------------------------------------------------------------------------
# 5. Postgres: enable service, create role + database
# ---------------------------------------------------------------------------
echo "==> Configuring PostgreSQL..."
systemctl enable --now postgresql

# Wait for Postgres to be ready
for i in {1..10}; do
  sudo -u postgres psql -c '\q' 2>/dev/null && break
  echo "    Waiting for postgres... (${i}/10)"
  sleep 2
done

# Create role 'para' if it doesn't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='para'" \
  | grep -q 1 || \
  sudo -u postgres psql -c "CREATE ROLE para WITH LOGIN PASSWORD 'CHANGE_ME_IN_ENV';"

# Create database 'para' owned by role 'para' if it doesn't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='para'" \
  | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE para OWNER para;"

echo "    Postgres role 'para' and database 'para' ready."
echo "    IMPORTANT: Set the actual password in /etc/para/para-backend.env"
echo "               and update the role: ALTER ROLE para PASSWORD 'new-password';"

# ---------------------------------------------------------------------------
# 6. Redis
# ---------------------------------------------------------------------------
echo "==> Enabling Redis..."
systemctl enable --now redis-server

# ---------------------------------------------------------------------------
# 7. Caddy
# ---------------------------------------------------------------------------
echo "==> Enabling Caddy..."
systemctl enable caddy
# Do not start yet — Caddyfile must be installed first.

# ---------------------------------------------------------------------------
# 8. Firewall (UFW)
# ---------------------------------------------------------------------------
echo "==> Configuring UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
cat <<'MSG'

============================================================
  Bootstrap complete. Next steps:
============================================================

1. Clone or pull the repo as the para user:
     sudo -u para git clone <repo-url> /opt/para/final

2. Fill in secrets:
     sudo cp WhatZatppa/deploy/bare-metal/env.production.example \
              /etc/para/para-backend.env
     sudo cp WhatZatppa/deploy/bare-metal/bskyweb.env.example \
              /etc/para/bskyweb.env
     sudo editor /etc/para/para-backend.env
     sudo editor /etc/para/bskyweb.env

3. Update Postgres password to match env file:
     sudo -u postgres psql -c \
       "ALTER ROLE para PASSWORD '<your-db-password>';"

4. Install Caddy config:
     sudo cp WhatZatppa/deploy/bare-metal/Caddyfile /etc/caddy/Caddyfile
     sudo caddy validate --config /etc/caddy/Caddyfile
     sudo systemctl start caddy

5. Build and install bskyweb binary:
     sudo -u para bash -c '
       cd /opt/para/final/PARA/bskyweb
       go build -o /opt/para/bin/bskyweb ./cmd/bskyweb
     '

6. Build the Node backend:
     sudo -u para bash -c '
       cd /opt/para/final/WhatZatppa
       corepack enable
       pnpm install --frozen-lockfile
       pnpm build
     '

7. Install and start systemd services:
     sudo cp WhatZatppa/deploy/bare-metal/systemd/*.service /etc/systemd/system/
     sudo systemctl daemon-reload
     sudo systemctl enable --now para-dev-env para-bskyweb

8. Run health checks:
     sudo -u para WhatZatppa/deploy/bare-metal/scripts/healthcheck.sh

MSG
