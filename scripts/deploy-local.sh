#!/bin/bash
set -euo pipefail

# PARA Bare-Metal Deploy Script
# For the 5950X + 128GB machine. Zero cloud. Full privacy.

REMOTE_DIR="/opt/para"
COMPOSE_FILE="WhatZatppa/docker-compose.local.yaml"
ENV_FILE="WhatZatppa/.env"
NGINX_CONF="WhatZatppa/services/nginx/nginx.local.conf"

echo "═══════════════════════════════════════════════════════════════"
echo "  PARA Bare-Metal Deploy"
echo "  Target: localhost (5950X + 128GB)"
echo "═══════════════════════════════════════════════════════════════"

# Validate
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found. Run ./scripts/generate-local-env.sh first."
    exit 1
fi

if grep -q "changeme\|YOUR_API_KEY\|example.com\|<set-your-own>" "$ENV_FILE"; then
    echo "⚠️  WARNING: $ENV_FILE still contains placeholder values."
    read -p "   Press Enter to continue anyway, or Ctrl-C to abort..."
fi

# System tune check
if [ ! -f "/etc/security/limits.d/para.conf" ]; then
    echo "⚠️  System not tuned yet. Run ./scripts/bare-metal/system-tune.sh first."
    echo "   Or continue at your own risk..."
    read -p "   Press Enter to continue..."
fi

# Build
echo ""
echo "🔨 Building Docker images..."
cd WhatZatppa
docker compose -f docker-compose.local.yaml build
cd ..

# Deploy
echo ""
echo "🚀 Starting stack..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Scale replicas
echo ""
echo "📈 Scaling replicas..."
docker compose -f "$COMPOSE_FILE" up -d --scale pds=4 --scale bsky=4

# Health checks
echo ""
echo "🏥 Health checks (waiting 10s for services to warm up)..."
sleep 10

HEALTH_PDS=$(curl -sf http://localhost:2583/xrpc/_health && echo OK || echo FAIL)
HEALTH_BSKY=$(curl -sf http://localhost:2584/xrpc/_health && echo OK || echo FAIL)
HEALTH_READY=$(curl -sf http://localhost:2583/xrpc/_ready && echo OK || echo FAIL)

echo "   PDS health:     $HEALTH_PDS"
echo "   AppView health: $HEALTH_BSKY"
echo "   PDS ready:      $HEALTH_READY"

if [ "$HEALTH_PDS" = "OK" ] && [ "$HEALTH_BSKY" = "OK" ]; then
    echo ""
    echo "✅ Deploy successful!"
    echo ""
    echo "   PDS:       http://localhost:2583"
    echo "   AppView:   http://localhost:2584"
    echo "   Analytics: http://localhost:3001 (Umami)"
    echo "   Ozone:     http://localhost:3000"
    echo ""
    echo "   Logs: docker compose -f $COMPOSE_FILE logs -f"
    echo "   Scale: docker compose -f $COMPOSE_FILE up -d --scale pds=8 --scale bsky=8"
    exit 0
else
    echo ""
    echo "❌ Health checks failed."
    echo "   Logs: docker compose -f $COMPOSE_FILE logs"
    exit 1
fi
