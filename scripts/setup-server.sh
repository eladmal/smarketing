#!/bin/bash
# ============================================================
#  Smarketing — Server Setup Script
#  Tested on: Ubuntu 22.04 LTS
#  Run as root: bash setup-server.sh yourdomain.com admin@email.com
# ============================================================
set -e

DOMAIN=${1:-yourdomain.com}
EMAIL=${2:-admin@yourdomain.com}
APP_USER="smarketing"
APP_DIR="/opt/smarketing"

echo "╔══════════════════════════════════════════════╗"
echo "║   Smarketing Server Setup — $DOMAIN"
echo "╚══════════════════════════════════════════════╝"

# ── 1. System update ─────────────────────────────────────────────────────────
echo "[1/8] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git ufw fail2ban htop unzip

# ── 2. Docker ─────────────────────────────────────────────────────────────────
echo "[2/8] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Docker Compose plugin
if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# ── 3. App user ───────────────────────────────────────────────────────────────
echo "[3/8] Creating app user..."
if ! id "$APP_USER" &> /dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    usermod -aG docker "$APP_USER"
fi

# ── 4. App directory ──────────────────────────────────────────────────────────
echo "[4/8] Setting up app directory..."
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ── 5. Firewall ───────────────────────────────────────────────────────────────
echo "[5/8] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# ── 6. Fail2ban (brute-force protection) ─────────────────────────────────────
echo "[6/8] Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port    = ssh
EOF
systemctl enable fail2ban
systemctl restart fail2ban

# ── 7. SSL certificate ────────────────────────────────────────────────────────
echo "[7/8] Installing Certbot..."
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

echo "IMPORTANT: Certbot will run after you start the stack."
echo "Run: certbot certonly --webroot -w /var/www/certbot -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN --email $EMAIL --agree-tos"

# ── 8. Swap (prevents OOM on small servers) ───────────────────────────────────
echo "[8/8] Creating 2GB swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Server setup complete!                              ║"
echo "║                                                      ║"
echo "║  Next steps:                                         ║"
echo "║  1. Copy your code to $APP_DIR                       ║"
echo "║  2. Create .env.production (see example file)        ║"
echo "║  3. Update nginx/conf.d/smarketing.conf with domain  ║"
echo "║  4. Run: bash scripts/first-deploy.sh                ║"
echo "╚══════════════════════════════════════════════════════╝"
