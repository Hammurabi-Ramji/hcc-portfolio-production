# ──────────────────────────────────────────────────────────────
# SUE - ZAP HOSTING INTEGRATION GUIDE
# ──────────────────────────────────────────────────────────────

## ✅ Hosting Configuration

### VPS Specifications
```
Position: Ashburn, USA (East Coast)
RAM: 8 GB (perfect for HCC API + services)
CPU: 4 Cores (multi-service capable)
OS: Ubuntu 22.04 LTS (latest support)
Storage: 100 GB NVMe SSD (fast I/O)
Network: 500 Mbit/s bandwidth
IPs: 1 Public IP
```

### Webspace Specifications
```
Disk: 20 GB (static assets, backups)
Email: 100 Accounts (team communication)
Databases: 100 MySQL (separate services)
Protection: DDoS mitigation included
```

---

## 🏗️ Recommended Architecture

### Phase 1: Current Setup (Simple & Efficient)

```
Zap Hosting VPS (8GB RAM, 4 cores)
│
├── HCC API Server (Node.js, Port 8080)
│   ├── Authentication (JWT)
│   ├── Agent Task Queue
│   ├── Cloud Sync (Koofr, IceDrive, Degoo)
│   └── WebSocket Server
│
├── MySQL Database (Port 3306)
│   ├── Users & Sessions
│   ├── Agent Tasks
│   ├── Projects
│   └── Cloud Connections
│
├── Nginx Reverse Proxy (Port 443/SSL)
│   ├── hcc.hammurabicoding.com (API)
│   │   └── → localhost:8080
│   └── dashboard.hcc.hammurabicoding.com (Admin)
│       └── → localhost:3000
│
└── Redis (Port 6379)
    └── Caching & Sessions
```

### Phase 2: Enhanced (When scaling)

```
VPS: API + Services only
Webspace: Static assets + Email
├── Cloudflare (DNS + CDN)
├── Separate Backup DB (in webspace)
└── Email servers (SMTP/IMAP)
```

---

## 📋 Deployment Checklist

### VPS Setup (Ubuntu 22.04)

```bash
# 1. Initial hardening
sudo apt update && sudo apt upgrade -y
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS

# 2. Install essential tools
sudo apt install -y curl wget git htop neofetch

# 3. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# 5. Install Nginx
sudo apt install -y nginx

# 6. Install Redis
sudo apt install -y redis-server

# 7. Install Docker (optional, for containerization)
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker
```

### Application Deployment

```bash
# 1. Clone your repository
cd /var/www
git clone https://github.com/hammurabicoding/sue.git
cd sue

# 2. Install dependencies
npm install

# 3. Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=8080
DATABASE_URL=mysql://hcc_user:hcc_password@localhost:3306/hcc_main
SESSION_SECRET=your_super_secret_key_here
JWT_SECRET=your_jwt_secret_key_here
CLOUD_KOOFR_KEY=your_koofr_api_key
CLOUD_ICEKEY=your_icedrive_api_key
CLOUD_DEGOW_KEY=your_degoo_api_key
EOF

# 4. Build WASM
cd sue-view
wasm-pack build --release --target web
cd ..

# 5. Bundle extension
npm run bundle

# 6. Create systemd service
sudo tee /etc/systemd/system/hcc-api.service > /dev/null << 'EOF'
[Unit]
Description=SUE API Server
After=network.target mysql.service

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

# 7. Start the service
sudo systemctl daemon-reload
sudo systemctl enable hcc-api
sudo systemctl start hcc-api

# 8. Configure Nginx
sudo tee /etc/nginx/sites-available/hcc-api > /dev/null << 'EOF'
server {
    listen 80;
    server_name hcc.hammurabicoding.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hcc.hammurabicoding.com;

    # SSL certificates (get from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/hcc.hammurabicoding.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hcc.hammurabicoding.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root for extension files
    root /var/www/sue/dist;
    index sue.html;

    # WASM support
    location /sue-view.wasm {
        add_types application/wasm .wasm;
        add_header Cache-Control "public, max-age=31536000";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location / {
        try_files $uri $uri/ /sue.html;
    }
}
EOF

# 9. Enable site
sudo ln -s /etc/nginx/sites-available/hcc-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 10. Install SSL (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d hcc.hammurabicoding.com
```

---

## 📧 Webspace Email Setup

### Email Account Structure
```
admin@yourdomain.com      - Administration
support@yourdomain.com    - Customer support
notifications@yourdomain.com - Automated alerts
alerts@yourdomain.com     - System monitoring
team@yourdomain.com       - Team communication
```

### SMTP Configuration (for your app)
```
SMTP Server: smtp.yourdomain.com
SMTP Port: 587 (TLS)
Username: notifications@yourdomain.com
Password: [from webspace control panel]
```

### Database Strategy (100 DBs available)
```
hcc_main          - Primary application database
hcc_sessions      - User sessions (optional, use Redis)
hcc_analytics     - Usage analytics (optional)
hcc_backups       - Backup database (optional)
hcc_logging       - Audit logs (optional)
```

---

## 🔒 Security Configuration

### VPS Security
```bash
# 1. SSH hardening
sudo tee /etc/ssh/sshd_config.d/hcc-ssh.conf > /dev/null << 'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
EOF

# 2. Firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 3. Fail2ban for brute force protection
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 4. Auto-upgrades
sudo tee /etc/apt/apt.conf.d/20auto-upgrades > /dev/null << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
```

### Application Security
```javascript
// .env
NODE_ENV=production
JWT_SECRET=very_long_random_string
SESSION_SECRET=another_random_string
CORS_ORIGIN=https://hammurabicoding.com
```

---

## 📊 Monitoring & Maintenance

### System Monitoring
```bash
# Install htop for process monitoring
sudo apt install -y htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
htop

# Check Nginx status
sudo systemctl status nginx

# Check API service
sudo systemctl status hcc-api
```

### Backup Strategy
```bash
# Daily database backup
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u hcc_user -pHCC_PASSWORD hcc_main > /backups/hcc_$DATE.sql
gzip /backups/hcc_$DATE.sql
find /backups -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-db.sh") | crontab -

# Upload to webspace storage (if configured)
# rsync /backups/* user@webspace:/backup/
```

### Log Rotation
```bash
# Configure logrotate
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
```

---

## 🎯 Usage Recommendations

### When to Use VPS
1. **Primary API Server** - HCC API runs here
2. **Database Storage** - MySQL for persistent data
3. **Caching Layer** - Redis for sessions/cache
4. **WebSocket Server** - Real-time updates
5. **WASM Compilation** - Build assets locally

### When to Use Webspace
1. **Email Service** - 100 accounts for notifications
2. **Backup Storage** - Store database backups (20GB)
3. **Static Assets** - CDN before VPS
4. **Additional Databases** - Separate services
5. **DDoS Protection** - Web-facing services

### Cost Optimization
- **Current**: Use VPS for everything → ~$20-30/month
- **Later**: Offload static files to webspace → ~$15/month VPS + webspace
- **Best**: Cloudflare free tier for CDN + SSL + DDoS

---

## 📈 Scaling Path

### Current (0-1000 users)
```
VPS: All-in-one (API + DB + Static)
Webspace: Email + Backups
Cost: ~$25-35/month
```

### Scale (1000-10000 users)
```
VPS: API + Services (2x 8GB instances)
Webspace: Static + DB backups + Email
Cloudflare: CDN + DDoS
Cost: ~$60-80/month
```

### Enterprise (10000+ users)
```
VPS Cluster: Load-balanced API instances
Managed Database: AWS RDS or similar
Object Storage: S3 for files
Email Service: SendGrid or similar
Cost: ~$200-500/month
```

---

## ✅ Quick Start Commands

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# One-line setup (after SSH login)
curl -fsSL https://raw.githubusercontent.com/hammurabicoding/sue/main/setup/zap-hosting-setup.sh | sudo bash

# Status check
sudo systemctl status hcc-api nginx redis
df -h
free -h

# View logs
sudo journalctl -u hcc-api -f
sudo tail -f /var/log/nginx/hcc-api.error.log
```

---

## 🆘 Troubleshooting

### API Not Starting
```bash
sudo systemctl status hcc-api
sudo journalctl -u hcc-api -n 100
cat /var/www/sue/.env  # Check configuration
```

### Database Connection Error
```bash
mysql -u hcc_user -p
SHOW DATABASES;
mysql -e "SELECT user, host FROM mysql.user;"
```

### Nginx Configuration Error
```bash
sudo nginx -t
sudo systemctl reload nginx
cat /etc/nginx/sites-available/hcc-api  # Check config
```

### SSL Certificate Expiry
```bash
# Check expiry
openssl x509 -in /etc/letsencrypt/live/hcc.hammurabicoding.com/fullchain.pem -noout -dates

# Renew automatically (tested monthly)
sudo certbot renew --dry-run
```

---

**Next Steps**:
1. ✅ Get VPS credentials from Zap Hosting
2. ✅ Run setup commands above
3. ✅ Deploy SUE
4. ✅ Configure email accounts
5. ✅ Set up backups
6. ✅ Monitor & maintain

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-17  
**Author**: HCC Team <rk@hammurabicoding.com>

