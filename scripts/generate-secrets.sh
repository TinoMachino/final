#!/bin/bash
set -euo pipefail

# PARA Production Secret Generator
# Usage: ./scripts/generate-secrets.sh > WhatZatppa/.env
#
# Generates cryptographically secure secrets for all backend services.
# Pipe output to .env, then edit domain names and admin passwords.

if ! command -v openssl &> /dev/null; then
    echo "❌ openssl is required. Install it first."
    exit 1
fi

cat <<EOF
# PARA Production Environment
# GENERATED: $(date -u +%Y-%m-%dT%H:%M:%SZ)
# DO NOT COMMIT THIS FILE — it contains real secrets.

# =============================================================================
# INFRASTRUCTURE
# =============================================================================
POSTGRES_USER=pg
POSTGRES_PASSWORD=$(openssl rand -hex 32)
POSTGRES_DB=para

# =============================================================================
# PDS (Personal Data Server)
# =============================================================================
PDS_HOSTNAME=pds.para.social
PDS_PORT=2583
PDS_BLOBSTORE_DISK_LOCATION=/data/blobs

# Signing keys — rotate these quarterly
PDS_REPO_SIGNING_KEY_K256_PRIVATE_KEY_HEX=$(openssl rand -hex 32)
PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX=$(openssl rand -hex 32)

# Secrets
PDS_DPOP_SECRET=$(openssl rand -hex 32)
PDS_JWT_SECRET=$(openssl rand -hex 32)
PDS_ADMIN_PASSWORD=$(openssl rand -hex 16)
PDS_RATE_LIMIT_BYPASS_KEY=$(openssl rand -hex 32)

# External services
PDS_DID_PLC_URL=https://plc.directory
PDS_BSKY_APP_VIEW_URL=https://appview.para.social
PDS_BSKY_APP_VIEW_DID=did:web:appview.para.social
PDS_CRAWLERS=https://bsky.network

# OAuth branding
PDS_OAUTH_PROVIDER_NAME="PARA"
PDS_OAUTH_PROVIDER_PRIMARY_COLOR="#48267F"
PDS_OAUTH_PROVIDER_HOME_LINK=https://para.social
PDS_OAUTH_PROVIDER_TOS_LINK=https://para.social/tos
PDS_OAUTH_PROVIDER_POLICY_LINK=https://para.social/privacy

# Registration
PDS_INVITE_REQUIRED=1

# =============================================================================
# AppView (bsky)
# =============================================================================
BSKY_SERVER_DID=did:web:appview.para.social
ADMIN_PASSWORDS=<set-your-own-strong-password>
ADMIN_DIDS=<will-be-known-after-first-account-creation>

DATAPLANE_URLS=http://dataplane:2585
BSYNC_URL=http://bsync:2586

# =============================================================================
# Ozone (Moderation)
# =============================================================================
OZONE_SERVER_DID=did:web:ozone.para.social
OZONE_ADMIN_DIDS=<will-be-known-after-first-account-creation>

# =============================================================================
# bsync
# =============================================================================
BSYNC_SERVER_DID=did:web:bsync.para.social
EOF

echo >&2 ""
echo >&2 "✅ Secrets generated."
echo >&2 "   Next steps:"
echo >&2 "   1. Review the output above"
echo >&2 "   2. Replace <set-your-own-strong-password> with a real admin password"
echo >&2 "   3. Save to WhatZatppa/.env"
echo >&2 "   4. Run: ./scripts/deploy-production.sh user@your-server-ip"
