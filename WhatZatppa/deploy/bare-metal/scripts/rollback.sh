#!/usr/bin/env bash
# deploy/bare-metal/scripts/rollback.sh
#
# Emergency rollback: pull a pinned git ref, rebuild both the Node backend
# and the Go bskyweb binary, restart services, and verify health.
#
# Usage:
#   sudo -u para deploy/bare-metal/scripts/rollback.sh <git-tag-or-sha>
#
# Example:
#   sudo -u para deploy/bare-metal/scripts/rollback.sh v1.2.3
#   sudo -u para deploy/bare-metal/scripts/rollback.sh main

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/opt/para/final}"
BACKEND_ROOT="${REPO_ROOT}/WhatZatppa"
FRONTEND_ROOT="${REPO_ROOT}/PARA"
BSKYWEB_BIN="/opt/para/bin/bskyweb"

REF="${1:-}"
if [[ -z "${REF}" ]]; then
  echo "Usage: $0 <git-tag-or-sha>" >&2
  exit 1
fi

echo "==> Rollback to '${REF}'"
echo ""

# ---------------------------------------------------------------------------
# 1. Pull target ref
# ---------------------------------------------------------------------------
echo "--- git fetch + checkout ---"
git -C "${REPO_ROOT}" fetch --tags origin
git -C "${REPO_ROOT}" checkout "${REF}"
echo ""

# ---------------------------------------------------------------------------
# 2. Rebuild Node backend
# ---------------------------------------------------------------------------
echo "--- Rebuilding Node backend ---"
cd "${BACKEND_ROOT}"
pnpm install --frozen-lockfile
pnpm build
echo ""

# ---------------------------------------------------------------------------
# 3. Rebuild bskyweb Go binary
# ---------------------------------------------------------------------------
echo "--- Rebuilding bskyweb binary ---"
cd "${FRONTEND_ROOT}/bskyweb"
go build -o "${BSKYWEB_BIN}" ./cmd/bskyweb
echo "    Built: ${BSKYWEB_BIN}"
echo ""

# ---------------------------------------------------------------------------
# 4. Restart services
# ---------------------------------------------------------------------------
echo "--- Restarting services ---"
sudo systemctl restart para-dev-env para-bskyweb
echo "    Waiting 10s for services to come up..."
sleep 10
echo ""

# ---------------------------------------------------------------------------
# 5. Health check
# ---------------------------------------------------------------------------
echo "--- Running health checks ---"
"${BACKEND_ROOT}/deploy/bare-metal/scripts/healthcheck.sh"
