#!/bin/bash
# ============================================================
#  Smarketing — Zero-downtime redeploy
#  Called by GitHub Actions after a push to main
# ============================================================
set -e

APP_DIR="/opt/smarketing"
IMAGE_TAG=${1:-latest}
DOCKER_REGISTRY=${2:-ghcr.io/GITHUB_USERNAME}

cd "$APP_DIR"

echo "Deploying tag: $IMAGE_TAG"

# Pull latest images
docker pull "$DOCKER_REGISTRY/smarketing-backend:$IMAGE_TAG"
docker pull "$DOCKER_REGISTRY/smarketing-frontend:$IMAGE_TAG"

# Rolling restart (zero-downtime via Docker Compose)
docker compose -f docker-compose.prod.yml up -d \
    --no-deps \
    --pull always \
    backend frontend

# Prune old images
docker image prune -f --filter "until=24h"

echo "Deploy complete — $(date)"
