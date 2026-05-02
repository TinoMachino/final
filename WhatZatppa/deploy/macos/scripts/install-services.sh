#!/usr/bin/env bash
# deploy/macos/scripts/install-services.sh
#
# Installs launchd plists (substitutes your real username) and loads them.
# Run once after bootstrap-mac.sh.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../" && pwd)"
PLIST_SRC="${REPO_ROOT}/WhatZatppa/deploy/macos/launchd"
LAUNCH_AGENTS="${HOME}/Library/LaunchAgents"
LOG_DIR="${HOME}/para/logs"

mkdir -p "${LOG_DIR}"

# Substitute YOURUSERNAME placeholder
for src in "${PLIST_SRC}"/*.plist; do
  name="$(basename "${src}")"
  dest="${LAUNCH_AGENTS}/${name}"
  sed "s|YOURUSERNAME|${USER}|g" "${src}" > "${dest}"
  echo "==> Installed ${dest}"
done

# Install Caddyfile to homebrew caddy config location
CADDY_CONFIG_DIR="${HOME}/.config/caddy"
mkdir -p "${CADDY_CONFIG_DIR}"
cp "${REPO_ROOT}/WhatZatppa/deploy/macos/Caddyfile" "${CADDY_CONFIG_DIR}/Caddyfile"
echo "==> Installed Caddyfile to ${CADDY_CONFIG_DIR}/Caddyfile"

echo ""
echo "Load services with:"
echo "  launchctl load ${LAUNCH_AGENTS}/com.para.dev-env.plist"
echo "  launchctl load ${LAUNCH_AGENTS}/com.para.bskyweb.plist"
echo ""
echo "Or use the start script:"
echo "  bash WhatZatppa/deploy/macos/scripts/start.sh"
