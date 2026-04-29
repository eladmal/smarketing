# Smarketing — Production Deployment Guide

## Architecture

```
Internet (HTTPS)
       ↓
  Nginx (SSL + Reverse Proxy)
       ↓              ↓
  Frontend        API (NestJS :8000)
  (React/Nginx)        ↓
                 PostgreSQL :5432
```

---

## Recommended Server Specs

| Usage              | Server              | Cost/mo  | Provider         |
|--------------------|---------------------|----------|------------------|
| Up to ~500 users   | 4 vCPU / 8GB RAM    | ~$48     | DigitalOcean Droplet |
| Up to ~2000 users  | 8 vCPU / 16GB RAM   | ~$96     | DigitalOcean Droplet |
| Enterprise         | Dedicated server    | ~$50     | Hetzner AX41     |

**Recommended: DigitalOcean Droplet — "Premium Intel" 4vCPU / 8GB ($48/mo)**
- 160GB NVMe SSD
- 5TB transfer
- Automated weekly backups (+$9.60/mo)
- Region: Frankfurt (closest to Israel)

---

## Quick Start (30 minutes)

### Step 1 — Create Server

1. Create a DigitalOcean account: https://digitalocean.com
2. Create Droplet: **Ubuntu 22.04 LTS** → **Premium Intel 8GB** → **Frankfurt**
3. Add your SSH key
4. Note the server IP

### Step 2 — Point DNS

In your domain registrar (Namecheap / Cloudflare / GoDaddy):

| Type | Name           | Value        |
|------|----------------|--------------|
| A    | @              | SERVER_IP    |
| A    | www            | SERVER_IP    |
| A    | api            | SERVER_IP    |

Wait 5 minutes for DNS propagation.

### Step 3 — Setup Server

```bash
# SSH into server
ssh root@SERVER_IP

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/GITHUB_USER/smarketing/main/scripts/setup-server.sh | bash -s yourdomain.com admin@email.com
```

### Step 4 — Deploy App

```bash
# Clone your repo to server
cd /opt
git clone https://github.com/YOUR_USERNAME/smarketing.git
cd smarketing

# Configure production environment
cp .env.production.example .env.production
nano .env.production   # Fill in all values!

# Update nginx config with your domain
sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN/g' nginx/conf.d/smarketing.conf

# First deploy (gets SSL certificate automatically)
bash scripts/first-deploy.sh yourdomain.com admin@email.com
```

### Step 5 — Verify

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs --tail=50 backend

# Test health endpoint
curl https://api.yourdomain.com/health
```

---

## CI/CD (GitHub Actions)

Every push to `main` → builds Docker images → deploys to server automatically.

### Setup GitHub Secrets

In your GitHub repo → Settings → Secrets → Actions:

| Secret              | Value                              |
|---------------------|------------------------------------|
| `SERVER_HOST`       | Your server IP                     |
| `SERVER_USER`       | `root` or `smarketing`             |
| `SERVER_SSH_KEY`    | Private SSH key (id_rsa content)   |
| `PRODUCTION_DOMAIN` | `yourdomain.com`                   |

### Workflow
```
git push origin main
         ↓
  GitHub Actions builds images
  (backend + frontend Docker)
         ↓
  Pushes to GitHub Container Registry
         ↓
  SSH into server → pulls new images
  → zero-downtime restart
```

---

## Database Backups

```bash
# Setup daily backup (runs at 3am)
echo "0 3 * * * /opt/smarketing/scripts/backup-db.sh" | crontab -

# Manual backup
bash /opt/smarketing/scripts/backup-db.sh

# Restore from backup
gunzip -c /opt/backups/smarketing/smarketing_DATE.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db \
  psql -U smarketing smarketing
```

---

## Monitoring

### Quick status check
```bash
# All containers health
docker compose -f docker-compose.prod.yml ps

# Backend logs (live)
docker compose -f docker-compose.prod.yml logs -f backend

# Resource usage
docker stats
```

### Recommended monitoring (free)
- **Better Stack** (betterstack.com) — uptime monitoring, alerts to email/Slack
- **Grafana Cloud** — metrics dashboards (free tier)

Setup Better Stack:
1. Create account → Monitors → New Monitor
2. URL: `https://api.yourdomain.com/health`
3. Alert when response ≠ 200

---

## Scaling

When you outgrow a single server:

1. **Database** → Move to managed PostgreSQL (DigitalOcean Managed DB ~$15/mo)
   - Zero maintenance, automatic backups, failover
   - Update `DATABASE_URL` in `.env.production`

2. **File uploads** → Move to Cloudflare R2 (S3-compatible, free 10GB)
   - Add S3 module to NestJS (`@aws-sdk/client-s3`)

3. **Backend** → Add second Droplet + Load Balancer ($12/mo)
   - DigitalOcean Load Balancer handles traffic splitting

4. **CDN** → Put Cloudflare in front (free)
   - Caches static assets globally
   - DDoS protection included

---

## SSL Renewal

Certbot auto-renews every 12 hours (only renews when < 30 days left).
Manual renewal: `certbot renew`

---

## Cost Summary

| Component                   | Cost/mo |
|-----------------------------|---------|
| Droplet (8GB Premium)       | $48     |
| Automated Backups (20%)     | $10     |
| Cloudflare (free tier)      | $0      |
| Better Stack monitoring     | $0      |
| **Total**                   | **~$58/mo** |

Break-even: Just **1 Pro subscriber (₪299)** covers server costs.
