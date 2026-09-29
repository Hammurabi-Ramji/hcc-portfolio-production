# 🚀 ZAP HOSTING DEPLOYMENT GUIDE - WORKFLOW BUILDER

**Workflow Builder v1.0.0 on Your ZAP Hosting Infrastructure**

---

## 📋 YOUR CURRENT ZAP HOSTING SETUP

Based on your existing infrastructure:

| Service | Specs | Purpose |
|---------|-------|---------|
| **VPS** | Ubuntu 22.04 LTS, Lifetime | Primary application server |
| **Webspace** | Plesk, 100+ MySQL DBs | Static files, email, backups |
| **Storage** | Zap Storage Lite, 10GB | Automated backups |
| **Domains** | 6x Cheapname domains | All pointing to ZAP nameservers |

---

## 🎯 DEPLOYMENT ARCHITECTURE

```
Your ZAP Hosting Infrastructure
├── VPS (Ubuntu 22.04 LTS)
│   ├── Workflow Builder (Node.js + Tauri)
│   │   ├── Frontend (React 18, Port 5173)
│   │   ├── Backend (Tauri, Port 8080)
│   │   └── Database (SQLite, /data/)
│   │
│   ├── Nginx Reverse Proxy (Port 443/SSL)
│   │   └── workflow.yourdomain.com → localhost:8080
│   │
│   ├── Systemd Services
│   │   ├── workflow-builder.service
│   │   └── nginx.service
│   │
│   └── System Services
│       ├── SSH (Port 22)
│       ├── Firewall (UFW)
│       └── Auto-updates
│
├── Webspace
│   ├── Static assets (dist/ folder)
│   ├── Email accounts (notifications@)
│   └── Backup storage (SQL dumps)
│
└── Zap Storage
    └── Daily backup archives (.tar.gz)
```

---

## 🔑 IMPORTANT: LIFETIME ACCOUNT KEEP-ALIVE

⚠️ **Your ZAP Hosting lifetime VPS requires login every 3-4 months**

**Action Required:**
- Set calendar reminder for every 60 days
- Simply log into dashboard at: https://zap-hosting.com/admin
- This prevents automatic deletion due to inactivity
- Takes 30 seconds, no cost overhead

```bash
# Quick reminder setup (Linux)
echo "0 0 1 * * curl -s https://zap-hosting.com/admin" | crontab -
```

---

## 📝 STEP 1: PREPARE YOUR VPS

### SSH Into Your VPS

```bash
# From Windows (PowerShell) or Mac/Linux
ssh root@YOUR_VPS_IP

# Or with WinSCP for GUI file transfers
# Protocol: SFTP
# Host: YOUR_VPS_IP
# Port: 22
# Username: root (or hcc if non-root user)
```

### Update System

```bash
sudo apt update
sudo apt upgrade -y

# Install build essentials
sudo apt install -y build-essential curl wget git htop
```

---

## 🛠️ STEP 2: INSTALL RUNTIME DEPENDENCIES

### Install Node.js 20.x (for Tauri dev server)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs npm

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x
```

### Install Rust (for native compilation)

```bash
# Download and install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Activate Rust in current shell
source $HOME/.cargo/env

# Verify
rustc --version
cargo --version
```

### Install pnpm (faster than npm)

```bash
npm install -g pnpm
pnpm --version
```

### Install Additional Tools

```bash
# For compression/backups
sudo apt install -y tar gzip rsync

# For database management
sudo apt install -y sqlite3
```

---

## 📂 STEP 3: CREATE APPLICATION DIRECTORY

```bash
# Create directory structure
sudo mkdir -p /var/www/workflow-builder
sudo mkdir -p /var/backups/workflow-builder
sudo mkdir -p /data/workflow-builder

# Set permissions
sudo chown -R $USER:$USER /var/www/workflow-builder
sudo chown -R $USER:$USER /data/workflow-builder

# Navigate to app directory
cd /var/www/workflow-builder
```

---

## 📥 STEP 4: DEPLOY APPLICATION

### Option A: Clone from Repository

```bash
cd /var/www/workflow-builder

# Clone your repo (adjust URL)
git clone https://github.com/yourusername/workflow-builder.git .

# Install dependencies
pnpm install

# Build for production
pnpm build
```

### Option B: Upload Pre-built Files

Using **WinSCP** (GUI approach - recommended):

1. Open WinSCP
2. New Session:
   - Protocol: SFTP
   - Host: YOUR_VPS_IP
   - Username: root
   - Click "Login"
3. Drag these folders from your PC to `/var/www/workflow-builder/`:
   - `dist/` (built frontend)
   - `node_modules/` (or run `pnpm install` on VPS)
   - `.env` (configuration)
   - `src-tauri/` (backend source)

---

## ⚙️ STEP 5: CONFIGURE ENVIRONMENT

Create `.env` file:

```bash
cat > /var/www/workflow-builder/.env << 'EOF'
# Application
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Database (SQLite)
DATABASE_PATH=/data/workflow-builder/workflows.db

# Security
SESSION_SECRET=your_random_secret_here_min_32_chars
JWT_SECRET=your_jwt_secret_here_min_32_chars

# CORS - your domain
CORS_ORIGIN=https://workflow.yourdomain.com

# Backup settings
BACKUP_PATH=/var/backups/workflow-builder
BACKUP_RETENTION_DAYS=7

# Logging
LOG_LEVEL=info
LOG_PATH=/var/www/workflow-builder/logs

# Optional: Cloud storage for backups
# KOOFR_API_KEY=your_key_here
# KOOFR_BUCKET=workflow-backups
EOF

# Restrict permissions
chmod 600 /var/www/workflow-builder/.env

# Verify configuration
cat /var/www/workflow-builder/.env
```

---

## 🚀 STEP 6: BUILD NATIVE COMPONENTS (First Time Only)

```bash
cd /var/www/workflow-builder

# Build Tauri backend
cd src-tauri
cargo build --release
cd ..

# The binary is now at: src-tauri/target/release/workflow-builder

# Copy to accessible location
cp src-tauri/target/release/workflow-builder /var/www/workflow-builder/

chmod +x /var/www/workflow-builder/workflow-builder
```

---

## 📋 STEP 7: CREATE SYSTEMD SERVICE

Create service file:

```bash
sudo tee /etc/systemd/system/workflow-builder.service > /dev/null << 'EOF'
[Unit]
Description=Workflow Builder Application
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/workflow-builder
EnvironmentFile=/var/www/workflow-builder/.env

# For Node.js backend
ExecStart=/usr/bin/node dist/background.js

# Restart policy
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=workflow-builder

# Resource limits (adjust as needed)
LimitNOFILE=65535
MemoryLimit=2G

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable service (auto-start on boot)
sudo systemctl enable workflow-builder

# Start service
sudo systemctl start workflow-builder

# Check status
sudo systemctl status workflow-builder
```

---

## 🌐 STEP 8: CONFIGURE NGINX REVERSE PROXY

### Create Nginx Configuration

```bash
sudo tee /etc/nginx/sites-available/workflow-builder.conf > /dev/null << 'EOF'
# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name workflow.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name workflow.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/workflow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workflow.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml application/atom+xml image/svg+xml;

    # API proxy to Node.js backend
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (frontend)
    location / {
        root /var/www/workflow-builder/dist;
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "ok";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/workflow-builder.conf /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 STEP 9: INSTALL SSL CERTIFICATE (Let's Encrypt)

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL Certificate

```bash
# For workflow.yourdomain.com
sudo certbot --nginx -d workflow.yourdomain.com

# Follow prompts:
# 1. Enter email
# 2. Agree to terms
# 3. Share email (optional)
# 4. Select "Redirect" (auto-redirect HTTP to HTTPS)

# Verify certificate was created
ls -la /etc/letsencrypt/live/workflow.yourdomain.com/
```

### Auto-Renewal Setup

```bash
# Test renewal (dry-run)
sudo certbot renew --dry-run

# Create renewal timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo systemctl status certbot.timer
```

---

## 📊 STEP 10: CONFIGURE BACKUPS

### Create Backup Script

```bash
cat > /usr/local/bin/backup-workflow-builder.sh << 'EOF'
#!/bin/bash

# Variables
BACKUP_DIR="/var/backups/workflow-builder"
DB_PATH="/data/workflow-builder/workflows.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/workflows_backup_$DATE.tar.gz"
RETENTION_DAYS=7

# Create backup directory if needed
mkdir -p $BACKUP_DIR

# Backup database and config
tar -czf $BACKUP_FILE \
    $DB_PATH \
    /var/www/workflow-builder/.env \
    /var/www/workflow-builder/logs/

# Compress backup
gzip -9 $BACKUP_FILE

# Remove old backups (older than 7 days)
find $BACKUP_DIR -name "*.tar.gz*" -mtime +$RETENTION_DAYS -delete

# Log backup
echo "Backup completed: $BACKUP_FILE" >> /var/log/workflow-builder-backup.log

# Optional: Upload to Zap Storage or Cloud
# aws s3 cp $BACKUP_FILE s3://your-bucket/backups/
# rclone copy $BACKUP_FILE koofr:/backups/workflow-builder/

exit 0
EOF

# Make executable
chmod +x /usr/local/bin/backup-workflow-builder.sh

# Test backup
/usr/local/bin/backup-workflow-builder.sh

# Verify
ls -lh /var/backups/workflow-builder/
```

### Schedule Daily Backups

```bash
# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-workflow-builder.sh") | crontab -

# Verify crontab
crontab -l
```

---

## 🔥 STEP 11: FIREWALL CONFIGURATION

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (keep connection!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific port if needed (Tauri dev)
# sudo ufw allow 8080/tcp  # Only if testing

# Check firewall status
sudo ufw status
```

---

## 🧪 STEP 12: VERIFY DEPLOYMENT

### Check Services

```bash
# Application status
sudo systemctl status workflow-builder
sudo systemctl status nginx

# Port listening
sudo ss -tlnp | grep -E ':(80|443|8080)'

# Logs
sudo journalctl -u workflow-builder -f  # Follow logs
sudo journalctl -u workflow-builder -n 50  # Last 50 lines
tail -f /var/log/nginx/access.log
```

### Test Application

```bash
# From your local machine:
curl -I https://workflow.yourdomain.com

# Expected response: 200 OK
# Status should be: HTTP/1.1 200 OK

# Test API
curl https://workflow.yourdomain.com/api/health

# Open in browser
# https://workflow.yourdomain.com
```

---

## 📈 STEP 13: CONFIGURE MONITORING

### Health Check Script

```bash
cat > /usr/local/bin/check-workflow-builder.sh << 'EOF'
#!/bin/bash

# Check if service is running
if ! systemctl is-active --quiet workflow-builder; then
    echo "ERROR: workflow-builder is not running!"
    systemctl restart workflow-builder
    echo "Service restarted" | mail -s "Workflow Builder Alert" admin@yourdomain.com
fi

# Check disk usage
DISK_USAGE=$(df /data | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage at ${DISK_USAGE}%" | mail -s "Workflow Builder Storage Alert" admin@yourdomain.com
fi

# Check SSL certificate expiry
CERT_EXPIRY=$(certbot certificates | grep "Expiry Date" | awk '{print $NF}')
echo "SSL Certificate expires: $CERT_EXPIRY"

exit 0
EOF

chmod +x /usr/local/bin/check-workflow-builder.sh

# Run hourly
(crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/check-workflow-builder.sh") | crontab -
```

---

## 📝 STEP 14: UPDATE & MAINTAIN

### Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
cd /var/www/workflow-builder
pnpm update

# Rebuild Tauri if needed
cd src-tauri
cargo update
cargo build --release
cd ..
```

### View Logs

```bash
# Service logs
sudo journalctl -u workflow-builder -n 100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check disk usage
df -h
du -sh /var/www/workflow-builder/
du -sh /data/workflow-builder/
du -sh /var/backups/workflow-builder/
```

---

## 🚀 QUICK COMMAND REFERENCE

| Task | Command |
|------|---------|
| **Start app** | `sudo systemctl start workflow-builder` |
| **Stop app** | `sudo systemctl stop workflow-builder` |
| **Restart app** | `sudo systemctl restart workflow-builder` |
| **Check status** | `sudo systemctl status workflow-builder` |
| **View logs** | `sudo journalctl -u workflow-builder -f` |
| **Reload Nginx** | `sudo systemctl reload nginx` |
| **Test Nginx** | `sudo nginx -t` |
| **Manual backup** | `/usr/local/bin/backup-workflow-builder.sh` |
| **Check disk** | `df -h` |
| **SSH to VPS** | `ssh root@YOUR_VPS_IP` |
| **Renew SSL** | `sudo certbot renew` |

---

## 🆘 TROUBLESHOOTING

### Application Won't Start

```bash
# Check service status with details
sudo systemctl status workflow-builder

# View recent logs
sudo journalctl -u workflow-builder -n 50

# Test if port is available
sudo ss -tlnp | grep 8080

# Manual test
cd /var/www/workflow-builder
node dist/background.js

# Check environment
cat /var/www/workflow-builder/.env
```

### Database Connection Error

```bash
# Verify database exists
ls -la /data/workflow-builder/workflows.db

# Test SQLite directly
sqlite3 /data/workflow-builder/workflows.db ".tables"

# Check permissions
ls -la /data/workflow-builder/
```

### Nginx 502 Bad Gateway

```bash
# Ensure backend is running
sudo systemctl status workflow-builder

# Check if port 8080 is listening
sudo ss -tlnp | grep 8080

# Test connection to backend
curl http://localhost:8080/health

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Check expiry date
openssl x509 -in /etc/letsencrypt/live/workflow.yourdomain.com/fullchain.pem -noout -dates

# Renew certificate
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

### Out of Disk Space

```bash
# Check usage
df -h
du -sh /var/www/workflow-builder/*
du -sh /var/backups/workflow-builder/*
du -sh /data/workflow-builder/*

# Clean old backups
find /var/backups/workflow-builder -name "*.tar.gz" -mtime +30 -delete

# Clean logs
journalctl --vacuum=100M
```

---

## 📞 SUPPORT RESOURCES

- **Zap Hosting Support**: support@zap-hosting.com
- **Let's Encrypt**: https://letsencrypt.org/
- **Nginx Documentation**: https://nginx.org/
- **Tauri Documentation**: https://tauri.app/
- **SQLite Documentation**: https://www.sqlite.org/

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] SSH into VPS
- [ ] Install Node.js, Rust, pnpm
- [ ] Create application directory
- [ ] Deploy application files
- [ ] Configure .env file
- [ ] Build Tauri backend
- [ ] Create systemd service
- [ ] Configure Nginx
- [ ] Install SSL certificate
- [ ] Configure firewall
- [ ] Test application access
- [ ] Set up automated backups
- [ ] Set up monitoring
- [ ] Document configuration
- [ ] Set calendar reminder for account keep-alive

---

## 🎉 DEPLOYMENT COMPLETE!

Your **Workflow Builder** is now running on your ZAP Hosting infrastructure.

**Access your application:**
```
https://workflow.yourdomain.com
```

**Maintenance reminder:** Log into ZAP Hosting dashboard every 60 days to keep your lifetime account active.

---

**Last Updated**: May 24, 2026  
**Workflow Builder Version**: 1.0.0  
**ZAP Hosting Lifetime VPS Edition**

