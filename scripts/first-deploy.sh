#!/bin/bash
# ============================================================
#  Smarketing — First-time deployment
#  Run once on a fresh server after setup-server.sh
# ============================================================
set -e

DOMAIN=${1:-yourdomain.com}
EMAIL=${2:-admin@yourdomain.com}
APP_DIR="/opt/smarketing"

cd "$APP_DIR"

# 1. Verify .env.production exists
if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production not found. Copy from .env.production.example and fill in values."
    exit 1
fi

# 2. Start Nginx first (for ACME challenge)
echo "[1] Starting Nginx for SSL challenge..."
docker compose -f docker-compose.prod.yml up -d nginx

# 3. Issue SSL certificate
echo "[2] Issuing SSL certificate..."
certbot certonly --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "api.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

# 4. Start full stack
echo "[3] Starting full stack..."
docker compose -f docker-compose.prod.yml up -d

# 5. Wait for health check
echo "[4] Waiting for backend to be healthy..."
for i in {1..30}; do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo "✓ Backend is healthy"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 5
done

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  Smarketing is live!                          ║"
echo "║                                               ║"
echo "║  https://$DOMAIN                              ║"
echo "║  https://api.$DOMAIN/docs                     ║"
echo "╚═══════════════════════════════════════════════╝"
