#!/usr/bin/env bash
# deploy/macos/scripts/start.sh — start all PARA services

set -euo pipefail
LAUNCH_AGENTS="${HOME}/Library/LaunchAgents"

brew services start postgresql@16
brew services start redis

# Source env and start Node backend
set -a; source "${HOME}/para/para-backend.env"; set +a
launchctl load "${LAUNCH_AGENTS}/com.para.dev-env.plist" 2>/dev/null || true
launchctl start com.para.dev-env

# Start bskyweb
launchctl load "${LAUNCH_AGENTS}/com.para.bskyweb.plist" 2>/dev/null || true
launchctl start com.para.bskyweb

# Start Caddy
caddy start --config "${HOME}/.config/caddy/Caddyfile" 2>/dev/null || caddy reload --config "${HOME}/.config/caddy/Caddyfile"

echo "All services started."
echo "Tunnel (no account needed): cloudflared tunnel --url http://localhost:8080"
