#!/bin/bash
set -euo pipefail

# PARA Production Deploy Script
# Usage: ./scripts/deploy-production.sh [user@host]
#
# This script:
#   1. Builds all backend Docker images
#   2. Pushes them to the server
#   3. Starts the full stack with docker-compose.prod.yaml
#   4. Runs health checks
#   5. Reports status

SERVER="${1:-}"
REMOTE_DIR="/opt/para"
COMPOSE_FILE="WhatZatppa/docker-compose.prod.yaml"
ENV_FILE="WhatZatppa/.env"

echo "═══════════════════════════════════════════════════════════════"
echo "  PARA Production Deploy"
echo "═══════════════════════════════════════════════════════════════"

# Validate
if [ -z "$SERVER" ]; then
    echo "❌ Usage: $0 [user@server-ip-or-hostname]"
    echo "   Example: $0 root@123.45.67.89"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found. Run scripts/generate-secrets.sh first."
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ $COMPOSE_FILE not found. Are you in the repo root?"
    exit 1
fi

# Warn if using placeholder values
if grep -q "<set-your-own>\|<will-be-known>\|changeme\|YOUR_API_KEY\|example.com" "$ENV_FILE"; then
    echo "⚠️  WARNING: $ENV_FILE still contains placeholder values."
    echo "   Review and fill them before continuing."
    read -p "   Press Enter to continue anyway, or Ctrl-C to abort..."
fi

# Build images locally
echo ""
echo "🔨 Building Docker images..."
cd WhatZatppa
docker compose -f docker-compose.prod.yaml build
cd ..

# Sync files to server
echo ""
echo "📤 Uploading to $SERVER:$REMOTE_DIR ..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR"
rsync -avz --progress "$COMPOSE_FILE" "$ENV_FILE" "$SERVER:$REMOTE_DIR/"

# Deploy on server
echo ""
echo "🚀 Deploying stack..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yaml down --remove-orphans && docker compose -f docker-compose.prod.yaml up -d"

# Health checks
echo ""
echo "🏥 Running health checks..."
sleep 5

HEALTH_PDS=$(ssh "$SERVER" "curl -sf http://localhost:2583/xrpc/_health && echo OK || echo FAIL")
HEALTH_BSKY=$(ssh "$SERVER" "curl -sf http://localhost:2584/xrpc/_health && echo OK || echo FAIL")

echo "   PDS health:     $HEALTH_PDS"
echo "   AppView health: $HEALTH_BSKY"

if [ "$HEALTH_PDS" = "OK" ] && [ "$HEALTH_BSKY" = "OK" ]; then
    echo ""
    echo "✅ Deploy successful!"
    echo ""
    echo "   PDS:      https://pds.para.social     (or your domain)"
    echo "   AppView:  https://appview.para.social (or your domain)"
    echo ""
    echo "   Check logs: ssh $SERVER 'cd $REMOTE_DIR && docker compose logs -f'"
    exit 0
else
    echo ""
    echo "❌ Health checks failed. Investigate:"
    echo "   ssh $SERVER 'cd $REMOTE_DIR && docker compose logs'"
    exit 1
fi
