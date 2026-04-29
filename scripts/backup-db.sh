#!/bin/bash
# ============================================================
#  Smarketing — Daily PostgreSQL backup
#  Add to crontab: 0 3 * * * /opt/smarketing/scripts/backup-db.sh
# ============================================================

APP_DIR="/opt/smarketing"
BACKUP_DIR="/opt/backups/smarketing"
KEEP_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

source "$APP_DIR/.env.production"

mkdir -p "$BACKUP_DIR"

echo "[$DATE] Starting backup..."

# Dump from Docker PostgreSQL container
docker compose -f "$APP_DIR/docker-compose.prod.yml" exec -T db \
    pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
    | gzip > "$BACKUP_DIR/smarketing_$DATE.sql.gz"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "[$DATE] Backup saved: smarketing_$DATE.sql.gz"
echo "[$DATE] Current backups:"
ls -lh "$BACKUP_DIR" | tail -10

# Optional: sync to S3 / Cloudflare R2
# aws s3 cp "$BACKUP_DIR/smarketing_$DATE.sql.gz" s3://your-bucket/backups/
