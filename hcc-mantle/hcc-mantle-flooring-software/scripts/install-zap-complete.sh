#!/bin/bash

# ============================================================================
# HCC MANTLE - AUTOMATED DEPLOYMENT SCRIPT FOR ZAP HOSTING
# Complete installation and configuration for production
# ============================================================================

set -e # Exit on any error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     HCC MANTLE - FLOORING ERP SYSTEM                           ║"
echo "║     Automated Deployment Script v1.0                          ║"
echo "║     Zap Hosting vServer Edition                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# 1. PARSE COMMAND LINE ARGUMENTS
# ============================================================================

DOMAIN="${1:---domain}"
EMAIL="${2:---email}"
ENVIRONMENT="${3:-production}"

if [ "$DOMAIN" = "--domain" ] || [ -z "$DOMAIN" ]; then
  echo "❌ Domain required. Usage: sudo bash install-zap.sh --domain erp.yourdomain.com --email admin@yourdomain.com"
  exit 1
fi

if [ "$EMAIL" = "--email" ] || [ -z "$EMAIL" ]; then
  echo "❌ Email required. Usage: sudo bash install-zap.sh --domain erp.yourdomain.com --email admin@yourdomain.com"
  exit 1
fi

echo "✓ Configuration:"
echo "  Domain: $DOMAIN"
echo "  Email: $EMAIL"
echo "  Environment: $ENVIRONMENT"
echo ""

# ============================================================================
# 2. UPDATE SYSTEM
# ============================================================================

echo "📦 Step 1/10: Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git build-essential python3

# ============================================================================
# 3. INSTALL NODE.JS & NPM
# ============================================================================

echo "📦 Step 2/10: Installing Node.js & npm..."

if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
else
  echo "  ✓ Node.js already installed: $(node --version)"
fi

npm install -g -qq npm@latest
echo "✓ Node.js $(node --version) installed"

# ============================================================================
# 4. INSTALL POSTGRESQL
# ============================================================================

echo "📦 Step 3/10: Installing PostgreSQL..."

if ! command -v psql &> /dev/null; then
  apt-get install -y -qq postgresql postgresql-contrib
  systemctl start postgresql
  systemctl enable postgresql
else
  echo "  ✓ PostgreSQL already installed"
fi

echo "✓ PostgreSQL installed and started"

# ============================================================================
# 5. CREATE DATABASE & USER
# ============================================================================

echo "📦 Step 4/10: Setting up PostgreSQL database..."

DB_PASSWORD=$(openssl rand -base64 32)
sudo -u postgres psql <<EOF
CREATE USER flooring_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE flooring_erp OWNER flooring_user;
GRANT ALL PRIVILEGES ON DATABASE flooring_erp TO flooring_user;
ALTER ROLE flooring_user CREATEDB;
EOF

echo "✓ Database created: flooring_erp"
echo "  User: flooring_user"
echo "  Password: (stored securely)"

# ============================================================================
# 6. INSTALL NGINX
# ============================================================================

echo "📦 Step 5/10: Installing Nginx..."

if ! command -v nginx &> /dev/null; then
  apt-get install -y -qq nginx
  systemctl start nginx
  systemctl enable nginx
else
  echo "  ✓ Nginx already installed"
fi

echo "✓ Nginx installed"

# ============================================================================
# 7. INSTALL SSL CERTIFICATE (Let's Encrypt)
# ============================================================================

echo "📦 Step 6/10: Setting up SSL certificates..."

apt-get install -y -qq certbot python3-certbot-nginx

certbot certonly --nginx \
  --non-interactive \
  --agree-tos \
  -m $EMAIL \
  -d $DOMAIN

echo "✓ SSL certificate installed for $DOMAIN"

# ============================================================================
# 8. CLONE AND SETUP APPLICATION
# ============================================================================

echo "📦 Step 7/10: Cloning HCC Mantle application..."

cd /opt
git clone https://github.com/hammurabi-coding-company/hcc-mantle.git flooring-erp

cd /opt/flooring-erp/hcc-mantle-flooring-software

# ============================================================================
# 9. INSTALL DEPENDENCIES & BUILD
# ============================================================================

echo "📦 Step 8/10: Installing dependencies..."

# Install backend dependencies
cd backend
npm install -q
npm run build

# Install frontend dependencies
cd ../frontend
npm install -q
npm run build

echo "✓ Dependencies installed and built"

# ============================================================================
# 10. CREATE ENVIRONMENT FILES
# ============================================================================

echo "📦 Step 9/10: Configuring environment..."

cat > /opt/flooring-erp/.env.production <<EOF
# Database
DATABASE_URL="postgresql://flooring_user:$DB_PASSWORD@localhost:5432/flooring_erp"

# Server
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# Client
CLIENT_URL=https://$DOMAIN

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EOF

echo "✓ Environment configured"

# ============================================================================
# 11. SETUP PM2 FOR PROCESS MANAGEMENT
# ============================================================================

echo "📦 Step 10/10: Setting up process management..."

npm install -g -qq pm2

cat > /opt/flooring-erp/ecosystem.config.js <<'EOF'
module.exports = {
  apps: [
    {
      name: 'flooring-erp-backend',
      script: './backend/src/server.ts',
      interpreter: 'npx',
      interpreter_args: 'ts-node',
      env: {
        NODE_ENV: 'production'
      },
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/error.log',
      out_file: './logs/out.log'
    },
    {
      name: 'flooring-erp-frontend',
      script: './frontend/dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 2,
      exec_mode: 'cluster'
    }
  ]
};
EOF

mkdir -p /opt/flooring-erp/logs
pm2 start ecosystem.config.js
pm2 startup
pm2 save

echo "✓ Process management configured with PM2"

# ============================================================================
# 12. SETUP NGINX REVERSE PROXY
# ============================================================================

echo "🔧 Configuring Nginx..."

cat > /etc/nginx/sites-available/$DOMAIN <<EOF
upstream flooring_erp {
  server localhost:3001;
}

upstream flooring_frontend {
  server localhost:3000;
}

server {
  listen 80;
  server_name $DOMAIN;
  return 301 https://\$server_name\$request_uri;
}

server {
  listen 443 ssl http2;
  server_name $DOMAIN;

  ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript;

  client_max_body_size 100M;

  # API
  location /api/ {
    proxy_pass http://flooring_erp;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  # Frontend
  location / {
    proxy_pass http://flooring_frontend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
  }

  # Health check
  location /health {
    proxy_pass http://flooring_erp/api/health;
    access_log off;
  }
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo "✓ Nginx configured"

# ============================================================================
# 13. SETUP FIREWALL
# ============================================================================

echo "🔒 Configuring firewall..."

ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
ufw enable -y

echo "✓ Firewall configured"

# ============================================================================
# 14. SETUP BACKUP & MONITORING
# ============================================================================

echo "📊 Setting up monitoring..."

# Daily backup script
cat > /usr/local/bin/backup-flooring-erp.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backups/flooring-erp"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U flooring_user flooring_erp | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Backup application
tar -czf $BACKUP_DIR/app_$TIMESTAMP.tar.gz /opt/flooring-erp

# Keep last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "✓ Backup completed: $TIMESTAMP"
EOF

chmod +x /usr/local/bin/backup-flooring-erp.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-flooring-erp.sh") | crontab -

echo "✓ Backup job configured (daily at 2 AM)"

# ============================================================================
# 15. VERIFICATION & SUMMARY
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          ✓ INSTALLATION COMPLETE                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 System Information:"
echo "  Application: HCC Mantle Flooring ERP"
echo "  Domain: https://$DOMAIN"
echo "  Database: PostgreSQL (flooring_erp)"
echo "  API Port: 3001"
echo "  Frontend Port: 3000"
echo "  Process Manager: PM2"
echo ""
echo "🔑 First Login Credentials:"
echo "  Email: admin@$DOMAIN"
echo "  Password: (Set during first access)"
echo ""
echo "📚 Management Commands:"
echo "  View logs: pm2 logs"
echo "  Restart app: pm2 restart all"
echo "  Database backup: /usr/local/bin/backup-flooring-erp.sh"
echo "  SSL renewal: certbot renew (auto-scheduled)"
echo ""
echo "📍 Application Paths:"
echo "  Application: /opt/flooring-erp"
echo "  Backups: /backups/flooring-erp"
echo "  Logs: /opt/flooring-erp/logs"
echo ""
echo "🔒 Security:"
echo "  SSL/TLS: Enabled (Let's Encrypt)"
echo "  Firewall: UFW (22, 80, 443 open)"
echo "  Database: PostgreSQL with authentication"
echo ""
echo "📞 Next Steps:"
echo "  1. Visit https://$DOMAIN in your browser"
echo "  2. Create your company account"
echo "  3. Configure payment gateway (Stripe)"
echo "  4. Import customer data"
echo "  5. Create your first project"
echo ""
echo "✓ Deployment completed successfully!"
echo ""
