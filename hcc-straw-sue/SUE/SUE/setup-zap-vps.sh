#!/bin/bash
# ──────────────────────────────────────────────────────────────
# SUE - ZAP HOSTING VPS SETUP SCRIPT
# Automates the entire server configuration
# Run this on the Ubuntu 22.04 VPS
# ──────────────────────────────────────────────────────────────

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     SUE - Zap Hosting VPS Setup                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration (edit these)
HCC_DOMAIN="hcc.hammurabicoding.com"
HCC_USER="hcc_user"
HCC_PASSWORD="CHANGE_THIS_PASSWORD"
NODE_ENV="production"
JWT_SECRET="CHANGE_THIS_SECRET_KEY"
SESSION_SECRET="CHANGE_THIS_SESSION_KEY"
PORT="8080"

# Track progress
echo_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. System Updates
echo_step "Updating system packages..."
sudo apt update && sudo apt upgrade -y
echo_success "System updated"

# 2. Security Hardening
echo_step "Hardening system security..."
sudo ufw enable 2>/dev/null || true
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable 2>/dev/null || true

# SSH hardening
sudo mkdir -p /etc/ssh/sshd_config.d
sudo tee /etc/ssh/sshd_config.d/hcc-ssh.conf > /dev/null << 'EOF'
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
EOF

echo_success "Security hardened"

# 3. Install Node.js 20.x
echo_step "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
NODE_VERSION=$(node -v)
echo_success "Node.js $NODE_VERSION installed"

# 4. Install MySQL
echo_step "Installing MySQL database..."
DEBIAN_FRONTEND=noninteractive sudo apt install -y mysql-server
sudo mysql_secure_installation << 'EOF'
Y
$HCC_PASSWORD
Y
Y
Y
Y
EOF

# Create HCC database and user
mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS hcc_main CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$HCC_USER'@'localhost' IDENTIFIED BY '$HCC_PASSWORD';
GRANT ALL PRIVILEGES ON hcc_main.* TO '$HCC_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo_success "MySQL installed and configured"

# 5. Install Nginx
echo_step "Installing Nginx web server..."
sudo apt install -y nginx
echo_success "Nginx installed"

# 6. Install Redis
echo_step "Installing Redis cache..."
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
echo_success "Redis installed"

# 7. Install Git and build tools
echo_step "Installing Git and build tools..."
sudo apt install -y git curl wget htop
echo_success "Build tools installed"

# 8. Install Docker (optional but recommended)
echo_step "Installing Docker (optional)..."
curl -fsSL https://get.docker.com | sh -s stable
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker www-data
echo_success "Docker installed"

# 9. Install Certbot for SSL
echo_step "Installing SSL certificates (Certbot)..."
sudo apt install -y certbot python3-certbot-nginx
echo_success "SSL ready"

# 10. Create application directory
echo_step "Setting up application directory..."
sudo mkdir -p /var/www/sue
sudo mkdir -p /var/www/sue/logs
sudo chown -R www-data:www-data /var/www/sue
chmod -R 755 /var/www/sue
echo_success "Directory created"

# 11. Clone repository (you'll need to add your repo URL)
echo_step "Cloning SUE repository..."
cd /var/www/sue
# Uncomment the line below when ready:
# git clone https://github.com/hammurabicoding/sue.git .

# 12. Create environment file
echo_step "Creating environment configuration..."
cat > /var/www/sue/.env << EOF
NODE_ENV=$NODE_ENV
PORT=$PORT
DATABASE_URL=mysql://$HCC_USER:$HCC_PASSWORD@localhost:3306/hcc_main
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://$HCC_DOMAIN
EOF

sudo chown www-data:www-data /var/www/sue/.env
chmod 600 /var/www/sue/.env
echo_success "Environment configured"

# 13. Create systemd service
echo_step "Creating systemd service..."
sudo tee /etc/systemd/system/hcc-api.service > /dev/null << 'EOF'
[Unit]
Description=SUE API Server
After=network.target mysql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/sue
ExecStart=/usr/bin/node dist/background.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
echo_success "Service created"

# 14. Configure Nginx
echo_step "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$HCC_DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $HCC_DOMAIN;
    
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $HCC_DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$HCC_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$HCC_DOMAIN/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    root /var/www/sue/dist;
    index sue.html;

    location /sue-view.wasm {
        add_types application/wasm .wasm;
        add_header Cache-Control "public, max-age=31536000";
    }

    location /api/ {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        try_files \$uri \$uri/ /sue.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$HCC_DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t
echo_success "Nginx configured"

# 15. Install Fail2ban
echo_step "Installing Fail2ban for security..."
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
echo_success "Fail2ban installed"

# 16. Set up log rotation
echo_step "Configuring log rotation..."
sudo tee /etc/logrotate.d/hcc-api > /dev/null << 'EOF'
/var/www/sue/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
EOF

echo_success "Log rotation configured"

# 17. Create backup directory
echo_step "Setting up backup directory..."
sudo mkdir -p /var/backups/hcc
sudo chown www-data:www-data /var/backups/hcc
echo_success "Backup directory created"

# 18. Final status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ VPS Setup Complete!${NC}"
echo ""
echo "📊 System Status:"
echo "  Node.js: $NODE_VERSION"
echo "  Nginx: $(sudo systemctl is-active nginx || echo 'inactive')"
echo "  MySQL: $(sudo systemctl is-active mysql || echo 'inactive')"
echo "  Redis: $(sudo systemctl is-active redis-server || echo 'inactive')"
echo ""
echo "🔐 Security:"
echo "  Firewall: $(sudo ufw status | head -1)"
echo "  Fail2ban: $(sudo systemctl is-active fail2ban || echo 'inactive')"
echo ""
echo "📁 Next Steps:"
echo "  1. Uncomment git clone in this script and run again"
echo "  2. npm install && npm run package"
echo "  3. sudo certbot --nginx -d $HCC_DOMAIN"
echo "  4. sudo systemctl enable hcc-api && sudo systemctl start hcc-api"
echo ""
echo "📝 To customize, edit /var/www/sue/.env"
echo ""

