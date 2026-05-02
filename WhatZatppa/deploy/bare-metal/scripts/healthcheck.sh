#!/usr/bin/env bash
# deploy/bare-metal/scripts/healthcheck.sh
#
# Verifies that all three public services are reachable and healthy.
# Checks both localhost (process-level) and public HTTPS (Caddy + TLS).
#
# Usage:
#   deploy/bare-metal/scripts/healthcheck.sh
#
# Environment overrides:
#   PDS_LOCAL_URL        (default: http://127.0.0.1:2583)
#   APPVIEW_LOCAL_URL    (default: http://127.0.0.1:2584)
#   BSKYWEB_LOCAL_URL    (default: http://127.0.0.1:8100)
#   PDS_PUBLIC_URL       (default: https://pds.paramx.social)
#   APPVIEW_PUBLIC_URL   (default: https://appview.paramx.social)
#   BSKYWEB_PUBLIC_URL   (default: https://web.paramx.social)

set -euo pipefail

PDS_LOCAL_URL="${PDS_LOCAL_URL:-http://127.0.0.1:2583}"
APPVIEW_LOCAL_URL="${APPVIEW_LOCAL_URL:-http://127.0.0.1:2584}"
BSKYWEB_LOCAL_URL="${BSKYWEB_LOCAL_URL:-http://127.0.0.1:8100}"

PDS_PUBLIC_URL="${PDS_PUBLIC_URL:-https://pds.paramx.social}"
APPVIEW_PUBLIC_URL="${APPVIEW_PUBLIC_URL:-https://appview.paramx.social}"
BSKYWEB_PUBLIC_URL="${BSKYWEB_PUBLIC_URL:-https://web.paramx.social}"

PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local path="${3:-}"
  local full="${url}${path}"
  printf '%-26s %s ' "${name}" "${full}"
  if curl -fsS --max-time 10 "${full}" >/dev/null 2>&1; then
    echo "OK"
    PASS=$(( PASS + 1 ))
  else
    echo "FAILED"
    FAIL=$(( FAIL + 1 ))
  fi
}

echo ""
echo "=== Local process checks ==="
check "pds (local)"       "${PDS_LOCAL_URL}"     "/xrpc/_health"
check "appview (local)"   "${APPVIEW_LOCAL_URL}"  "/xrpc/_health"
check "bskyweb (local)"   "${BSKYWEB_LOCAL_URL}"  "/"

echo ""
echo "=== Public HTTPS checks (Caddy + TLS) ==="
check "pds (public)"      "${PDS_PUBLIC_URL}"     "/xrpc/_health"
check "appview (public)"  "${APPVIEW_PUBLIC_URL}"  "/xrpc/_health"
check "bskyweb (public)"  "${BSKYWEB_PUBLIC_URL}"  "/"

echo ""
echo "=== systemd service status ==="
for svc in para-dev-env para-bskyweb caddy postgresql redis-server; do
  status=$(systemctl is-active "${svc}" 2>/dev/null || echo "not-found")
  printf '%-26s %s\n' "${svc}" "${status}"
  if [[ "${status}" != "active" ]]; then
    FAIL=$(( FAIL + 1 ))
  fi
done

echo ""
if [[ "${FAIL}" -eq 0 ]]; then
  echo "All checks passed (${PASS} OK)."
  exit 0
else
  echo "FAILED: ${FAIL} check(s) failed, ${PASS} passed."
  exit 1
fi
