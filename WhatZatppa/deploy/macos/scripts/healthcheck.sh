#!/usr/bin/env bash
# deploy/macos/scripts/healthcheck.sh

set -euo pipefail

PASS=0; FAIL=0

check() {
  local name="$1" url="$2"
  printf '%-30s ' "${name}"
  if curl -fsS --max-time 8 "${url}" >/dev/null 2>&1; then
    echo "OK"; PASS=$((PASS+1))
  else
    echo "FAILED"; FAIL=$((FAIL+1))
  fi
}

check "pds (local)"     "http://127.0.0.1:2583/xrpc/_health"
check "appview (local)" "http://127.0.0.1:2584/xrpc/_health"
check "bskyweb (local)" "http://127.0.0.1:8100/"
check "caddy (local)"   "http://127.0.0.1:8080/"

echo ""
echo "Services:"
for svc in com.para.dev-env com.para.bskyweb; do
  pid=$(launchctl list "${svc}" 2>/dev/null | grep -i '"PID"' | awk '{print $3}' | tr -d '";')
  [[ -z "$pid" ]] && pid="OFF"
  printf '%-30s PID=%s\n' "${svc}" "${pid}"
done
brew services list | grep -E "postgresql|redis"

echo ""
[[ "${FAIL}" -eq 0 ]] && echo "All checks passed (${PASS} OK)." || { echo "FAILED: ${FAIL} check(s)."; exit 1; }
