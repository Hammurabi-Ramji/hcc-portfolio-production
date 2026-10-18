# ──────────────────────────────────────────────────────────────
# SUE - ZAP HOSTING DEPLOYMENT GUIDE
# Complete setup and configuration for Zap Hosting VPS & Webspace
# ──────────────────────────────────────────────────────────────

## Overview

This guide shows you how to deploy the SUE extension to **Zap Hosting**:
- **VPS**: 8GB RAM, 4 Cores, 100GB NVMe (Ashburn, USA)
- **Webspace**: 20GB, 100 emails, 100 MySQL DBs

---

## 📊 Hosting Specifications

### VPS Details
| Feature | Specification |
|---------|--------------|
| **Location** | Ashburn, USA (East Coast) |
| **RAM** | 8 GB (perfect for API + DB) |
| **CPU** | 4 Cores (multi-service capable) |
| **Storage** | 100 GB NVMe SSD (fast I/O) |
| **OS** | Ubuntu 22.04 LTS |
| **Bandwidth** | 500 Mbit/s |
| **IPs** | 1 Public IP |

### Webspace Details
| Feature | Specification |
|---------|--------------|
| **Disk** | 20 GB (backups + static) |
| **Email** | 100 Accounts (SMTP/IMAP) |
| **Databases** | 100 MySQL (separate services) |
| **Protection** | DDoS mitigation included |

---

## 🏗️ Recommended Architecture

```
┌─────────────────────────────────────────────────────┐
│          ZAP HOSTING VPS (Ubuntu 22.04)             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  HCC API Server (Node.js, Port 8080)               │
│  ├── Authentication (JWT)                           │
│  ├── Agent Task Queue                               │
│  ├── Cloud Sync (Koofr, IceDrive, Degoo)           │
│  └── WebSocket Server                               │
│                                                     │
│  MySQL Database (Port 3306)                         │
│  ├── hcc_main (Primary DB)                          │
│  └── Sessions & Cache                               │
│                                                     │
│  Redis (Port 6379) - Caching                       │
│                                                     │
│  Nginx Reverse Proxy (Port 443/SSL)                 │
│  ├── hcc.hammurabicoding.com → API                 │
│  └── Static files → Extension                       │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          ZAP HOSTING WEBSPACE                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Email Accounts (100 available)                     │
│  ├── admin@yourdomain.com                          │
│  ├── support@yourdomain.com                        │
│  └── notifications@yourdomain.com                  │
│                                                     │
│  Backup Storage (20GB)                              │
│  ├── Database backups                              │
│  └── Config backups                                │
│                                                     │
│  Additional Databases (if needed)                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (30 Minutes)

### Step 1: Get Your VPS Credentials

From Zap Hosting control panel, note:
- VPS IP Address
- SSH username (usually `root`)
- SSH password (or upload SSH key)

### Step 2: SSH Into VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 3: Run the Setup Script

```bash
# Copy the setup script to your VPS
wget https://raw.githubusercontent.com/hammurabicoding/sue/main/setup-zap-vps.sh

# Make it executable
chmod +x setup-zap-vps.sh

# Edit configuration (required!)
nano setup-zap-vps.sh
# Update: HCC_DOMAIN, HCC_PASSWORD, JWT_SECRET, SESSION_SECRET

# Run the setup
bash setup-zap-vps.sh
```

This will automatically:
- ✅ Update system packages
- ✅ Harden security (UFW, SSH)
- ✅ Install Node.js 20.x
- ✅ Install MySQL and create database
- ✅ Install Nginx
- ✅ Install Redis
- ✅ Create application directories
- ✅ Configure systemd service
- ✅ Set up log rotation

### Step 4: Deploy Application

```bash
# On your local machine
cd /path/to/sue

# Build the project
npm run package

# Deploy to VPS
./scripts/deploy-to-zap.sh
```

Or manually:
```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Copy files
scp -r dist/ root@YOUR_VPS_IP:/var/www/sue/

# SSH back and install
ssh root@YOUR_VPS_IP
cd /var/www/sue
npm install --production
sudo systemctl restart hcc-api
```

### Step 5: Configure SSL

```bash
# On VPS
sudo certbot --nginx -d hcc.hammurabicoding.com
```

### Step 6: Verify Deployment

```bash
# Check services
sudo systemctl status hcc-api nginx

# Test API
curl https://hcc.hammurabicoding.com/api/status

# Check logs
sudo journalctl -u hcc-api -f
```

---

## 📁 File Structure

```
/var/www/sue/
├── dist/                    # Built extension files
│   ├── sue.html
│   ├── sue-view.js
│   ├── sue-view.wasm
│   ├── manifest.json
│   ├── styles.css
│   └── icons/
├── node_modules/           # Node.js dependencies
├── logs/                   # Application logs
├── .env                    # Environment variables
├── .env.example            # Environment template
└── package.json            # Dependencies

/var/backups/hcc/           # Database backups
└── hcc_backup_YYYYMMDD_HHMMSS.sql.gz

/etc/nginx/sites-available/hcc.hammurabicoding.com  # Nginx config
/etc/systemd/system/hcc-api.service                  # Service definition
```

---

## 🔐 Configuration

### Environment Variables (.env)

Create `/var/www/sue/.env`:

```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=mysql://hcc_user:hcc_password@localhost:3306/hcc_main
SESSION_SECRET=your_super_secret_random_string
JWT_SECRET=your_jwt_secret_random_string
CORS_ORIGIN=https://hcc.hammurabicoding.com

# Cloud service credentials (from Zap Hosting webspace)
CLOUD_KOOFR_KEY=your_koofr_api_key
CLOUD_ICEKEY=your_icedrive_api_key
CLOUD_DEGOW_KEY=your_degoo_api_key
```

### MySQL Database

```sql
-- Already created by setup script, but verify:
SHOW DATABASES;
-- Output: hcc_main

USE hcc_main;
SHOW TABLES;

-- Create tables (from your app migrations)
-- (Run your app's migration script)
```

### Nginx Configuration

Located at `/etc/nginx/sites-available/hcc.hammurabicoding.com`:

```nginx
server {
    listen 80;
    server_name hcc.hammurabicoding.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hcc.hammurabicoding.com;

    # SSL certs (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/hcc.hammurabicoding.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hcc.hammurabicoding.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static files
    root /var/www/sue/dist;
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:8080;
    }
    
    # WASM files
    location /sue-view.wasm {
        add_types application/wasm .wasm;
    }
}
```

---

## 🔄 Maintenance

### Daily Backup

Automated via crontab (2 AM daily):

```bash
# Already configured in maintenance.sh
0 2 * * * /var/www/sue/scripts/maintenance.sh run
```

### Check Status

```bash
# Quick status check
bash /var/www/sue/scripts/maintenance.sh status

# Or manual:
sudo systemctl status hcc-api nginx
df -h /var/www
free -h
```

### View Logs

```bash
# Application logs
sudo journalctl -u hcc-api -f

# Nginx access
sudo tail -f /var/log/nginx/hcc.hammurabicoding.com.access.log

# Nginx errors
sudo tail -f /var/log/nginx/hcc.hammurabicoding.com.error.log
```

### System Updates

```bash
# Weekly updates
sudo apt update && sudo apt upgrade -y

# Reboot if kernel updated
sudo reboot
```

### SSL Certificate Renewal

Automatic (Certbot handles this), but verify monthly:

```bash
# Check expiry
openssl x509 -in /etc/letsencrypt/live/hcc.hammurabicoding.com/fullchain.pem -noout -dates

# Force test renewal
sudo certbot renew --dry-run
```

---

## 🛠️ Troubleshooting

### API Not Responding

```bash
# Check service status
sudo systemctl status hcc-api

# View recent logs
sudo journalctl -u hcc-api -n 50

# Restart service
sudo systemctl restart hcc-api

# Check port listening
sudo ss -tlnp | grep 8080
```

### Database Connection Error

```bash
# Test MySQL connection
mysql -u hcc_user -p

# Check MySQL service
sudo systemctl status mysql

# Verify database exists
mysql -u hcc_user -p -e "SHOW DATABASES;"
```

### Nginx 404/502 Errors

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/hcc.hammurabicoding.com.error.log

# Verify root directory exists
ls -la /var/www/sue/dist/
```

### High CPU/Memory Usage

```bash
# Check resource usage
htop

# Find resource-heavy processes
ps aux --sort=-%mem | head -10
ps aux --sort=-%cpu | head -10

# Restart services if needed
sudo systemctl restart hcc-api
sudo systemctl restart nginx
```

---

## 📈 Monitoring & Alerts

### Set Up Monitoring (Optional)

```bash
# Install monitoring tools
sudo apt install -y htop iotop bmon

# Or use cloud monitoring:
# - Datadog
# - New Relic
# - Sentry (error tracking)
```

### Email Alerts

Configure email notifications from webspace:

```bash
# In .env
EMAIL_HOST=smtp.zap-hosting.com
EMAIL_PORT=587
EMAIL_USER=notifications@yourdomain.com
EMAIL_PASS=your_email_password
```

### Backup to Webspace

Upload backups to Zap Hosting webspace:

```bash
# Add to crontab
0 3 * * * rsync -avz /var/backups/hcc/ webuser@webspace:/backups/hcc/
```

---

## 💰 Cost Breakdown

### Zap Hosting Plans

| Service | Monthly Cost | Purpose |
|---------|-------------|---------|
| **VPS** | ~$25-35 | API, DB, Services |
| **Webspace** | ~$10-15 | Email, Backups, Static |
| **Total** | **~$35-50/month** | Full production setup |

### Cost Optimization

- ✅ Use VPS for everything (save $10-15)
- ✅ Free SSL (Let's Encrypt)
- ✅ Free CDN (Cloudflare)
- ⚠️ Monitor resource usage

---

## 🎯 Next Steps

1. ✅ **Deploy** to VPS using scripts above
2. ✅ **Configure** SSL certificates
3. ✅ **Set up** monitoring and backups
4. ✅ **Test** extension in browser
5. ✅ **Monitor** logs and performance
6. ✅ **Document** any customizations

---

## 📞 Support

- **Zap Hosting Support**: support@zap-hosting.com
- **HCC Documentation**: [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)
- **GitHub Issues**: https://github.com/hammurabicoding/sue/issues

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-17  
**Author**: HCC Team <rk@hammurabicoding.com>

