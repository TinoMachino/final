#!/usr/bin/env bash
# deploy/macos/scripts/stop.sh — stop all PARA services

set -euo pipefail
LAUNCH_AGENTS="${HOME}/Library/LaunchAgents"

caddy stop 2>/dev/null || true
launchctl stop com.para.bskyweb  2>/dev/null || true
launchctl stop com.para.dev-env  2>/dev/null || true
brew services stop redis
brew services stop postgresql@16
echo "All services stopped."
