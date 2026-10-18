# HOLO-9 Deployment Guide: Zap Hosting Lifetime VPS

**Deploy SQLite-first HOLO-9 to Zap Hosting with zero external dependencies.**

---

## 📋 Prerequisites

- Zap Hosting lifetime VPS (any Linux distro: Ubuntu 22.04+ recommended)
- SSH access to your VPS
- Domain name (optional, IP works fine)
- ~500MB free disk space

---

## 🚀 Step 1: Prepare Your VPS

### SSH into Your VPS

```bash
ssh root@your-vps-ip
```

### Update System

```bash
apt update && apt upgrade -y
```

### Install Node.js (v20+)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify
node --version  # Should be v20.x+
npm --version
```

### Install pnpm

```bash
npm install -g pnpm
```

### Install PM2 (Process Manager)

```bash
npm install -g pm2
```

---

## 📦 Step 2: Clone and Setup HOLO-9

### Clone Repository

```bash
cd /opt
git clone https://github.com/hammurabi-coding/hcc-straw.git
cd hcc-straw/hcc-straw-baas
```

### Install Dependencies

```bash
pnpm install --frozen-lockfile
```

This takes ~2-3 minutes. It installs all packages including:
- Hono.js
- Better-SQLite3 (compiled from source)
- TypeScript
- All 11 service packages

### Build TypeScript

```bash
pnpm build
```

---

## 🗂️ Step 3: Configure Environment

### Create `.env` File

```bash
cat > .env << 'EOF'
NODE_ENV=production
LOG_LEVEL=info

# Service ports (internal, behind Caddy reverse proxy)
AUTH_PORT=3001
DATA_PORT=3002
BILLING_PORT=3003
STORAGE_PORT=3004
ANALYTICS_PORT=3005

# Storage settings
STORAGE_PATH=/opt/hcc-straw/hcc-straw-baas/.storage
DATA_PATH=/opt/hcc-straw/hcc-straw-baas/.data
EOF
```

### Generate Secure JWT Secret

```bash
echo "JWT_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')" >> .env
```

Every service refuses to start without a `JWT_SECRET` of at least 32 characters. Never reuse an example value.

---

## ⚙️ Step 4: Start Services with PM2

### Create PM2 Ecosystem File

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'auth-service',
      script: 'packages/auth-service/dist/index.js',
      env: { PORT: 3001 }
    },
    {
      name: 'data-service',
      script: 'packages/data-service/dist/index.js',
      env: { PORT: 3002 }
    },
    {
      name: 'billing-service',
      script: 'packages/billing-service/dist/index.js',
      env: { PORT: 3003 }
    },
    {
      name: 'storage-service',
      script: 'packages/storage-service/dist/index.js',
      env: { PORT: 3004 }
    },
    {
      name: 'analytics-service',
      script: 'packages/analytics-service/dist/index.js',
      env: { PORT: 3005 }
    }
  ]
};
EOF
```

### Start All Services

```bash
pm2 start ecosystem.config.js
```

### Verify Services Running

```bash
pm2 ls
pm2 logs
```

You should see output like:
```
⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤
     App name │ id │ version │ mode │ status
⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤
 auth-service │ 0  │ 1.0.0   │ fork │ online
 data-service │ 1  │ 1.0.0   │ fork │ online
 billing-...  │ 2  │ 1.0.0   │ fork │ online
 storage-...  │ 3  │ 1.0.0   │ fork │ online
 analytics-.. │ 4  │ 1.0.0   │ fork │ online
```

### Enable Auto-Start on Reboot

```bash
pm2 startup
pm2 save
```

---

## 🔗 Step 5: Setup Reverse Proxy (Caddy)

### Install Caddy

```bash
apt install -y caddy
```

### Create Caddyfile

```bash
cat > /etc/caddy/Caddyfile << 'EOF'
# Replace example.com with your domain
example.com {
  # Auth Service
  route /auth/* {
    reverse_proxy localhost:3001
  }

  # Data Service
  route /data/* {
    reverse_proxy localhost:3002
  }

  # Billing Service
  route /billing/* {
    reverse_proxy localhost:3003
  }

  # Storage Service
  route /storage/* {
    reverse_proxy localhost:3004
  }

  # Analytics Service
  route /analytics/* {
    reverse_proxy localhost:3005
  }

  # Health check endpoint
  route /health {
    respond "OK" 200
  }

  # Enable gzip compression
  encode gzip

  # Security headers
  header / X-Content-Type-Options nosniff
  header / X-Frame-Options DENY
  header / X-XSS-Protection "1; mode=block"
}
EOF
```

### Update DNS

Point your domain to your VPS IP:
```
example.com A your-vps-ip
```

### Start Caddy

```bash
systemctl start caddy
systemctl enable caddy
```

### Verify HTTPS

```bash
curl https://example.com/health
# Should return: OK
```

---

## 🧪 Step 6: Test Services

### Test Auth Service

```bash
curl -X POST https://example.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123",
    "tenant_id": "tenant-001",
    "tenant_name": "My Organization"
  }'

# Response:
# {"success":true,"message":"User registered successfully","user":...}
```

### Test Data Service

```bash
# Create collection
curl -X POST https://example.com/data/collections \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-001" \
  -d '{"name":"customers","schema":{"fields":["name","email"]}}'

# Expected: {"success":true,"collection":{...}}
```

### Test Billing Service

```bash
curl -X POST https://example.com/billing/subscriptions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-001" \
  -d '{"plan":"pro"}'

# Expected: {"success":true,"subscription":{...}}
```

---

## 📊 Step 7: Monitoring & Maintenance

### Monitor Service Health

```bash
# Real-time logs
pm2 logs

# Service status
pm2 monit

# Restart a service
pm2 restart auth-service

# Restart all services
pm2 restart all
```

### Check Database Sizes

```bash
du -sh .data/
du -sh .storage/

# Example output:
# 45M     .data/
# 12M     .storage/
```

### View Service Logs

```bash
# Last 50 lines of auth service
pm2 logs auth-service --lines 50

# Real-time auth service logs
pm2 logs auth-service
```

---

## 💾 Step 8: Backup & Recovery

### Automatic Daily Backup

```bash
cat > /etc/cron.daily/holo9-backup << 'EOF'
#!/bin/bash
cd /opt/hcc-straw/hcc-straw-baas
tar -czf backups/holo9-$(date +\%Y\%m\%d).tar.gz .data/ .storage/
find backups/ -name "holo9-*.tar.gz" -mtime +30 -delete  # Keep 30 days
EOF

chmod +x /etc/cron.daily/holo9-backup
```

### Manual Backup

```bash
cd /opt/hcc-straw/hcc-straw-baas
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .data/ .storage/
```

### Restore from Backup

```bash
# Stop services
pm2 stop all

# Extract backup
cd /opt/hcc-straw/hcc-straw-baas
tar -xzf backup-20260608-120000.tar.gz

# Restart services
pm2 start all
```

---

## 🔐 Security Hardening

### Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS only
ufw enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
```

### Rotate JWT Secret (Monthly)

```bash
# Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Update .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" .env

# Restart services
pm2 restart all
```

### Enable SSL/TLS Auto-Renewal

Caddy handles this automatically with Let's Encrypt.

```bash
# Verify certificates
certbot certificates

# Manual renewal (if needed)
caddy reload
```

---

## 📈 Performance Tuning

### Increase SQLite Write Speed

Edit each service's startup to add pragmas:
```typescript
db.exec('PRAGMA synchronous = NORMAL');
db.exec('PRAGMA cache_size = 10000');
db.exec('PRAGMA temp_store = MEMORY');
```

### Enable File Caching

```bash
# Increase file descriptor limit
echo "fs.file-max = 2097152" >> /etc/sysctl.conf
sysctl -p
```

### Monitor Disk Usage

```bash
# Alert if disk > 80% full
df -h | grep -E '^/dev/' | awk '$5 > 80 {print "WARNING: Disk " $5 " full"}'
```

---

## 🚨 Troubleshooting

### Services Crashing

```bash
# Check PM2 logs
pm2 logs

# Common issues:
# 1. Port already in use
lsof -i :3001

# 2. Disk full
df -h

# 3. Memory issues
free -m
```

### Database Corruption

```bash
# Backup current databases
cp -r .data .data.backup

# Reset database
rm .data/*.db

# Restart service (migrations run automatically)
pm2 restart auth-service
```

### SSL Certificate Issues

```bash
# Force renewal
caddy reload --force

# Check Caddy logs
journalctl -u caddy -n 50
```

---

## 📞 Support Resources

- **Zap Hosting Docs:** https://zap-hosting.com/en/knowledge/
- **Node.js Best Practices:** https://nodejs.org/
- **Caddy Reverse Proxy:** https://caddyserver.com/
- **PM2 Process Manager:** https://pm2.keymetrics.io/
- **SQLite Documentation:** https://www.sqlite.org/docs.html

---

## ✅ Post-Deployment Checklist

- [ ] All 5 services running via PM2
- [ ] Caddy reverse proxy working
- [ ] Domain pointing to VPS
- [ ] HTTPS/SSL active
- [ ] Services accessible at `https://example.com/service/*`
- [ ] Auth service tested
- [ ] Data service tested
- [ ] Billing service tested
- [ ] Daily backups scheduled
- [ ] Monitoring alerts set up
- [ ] Firewall rules configured
- [ ] SSL auto-renewal working

---

## 🎉 Success!

Your HOLO-9 BaaS platform is now running on Zap Hosting with:
- ✅ Zero external dependencies
- ✅ 100% data sovereignty
- ✅ Automatic HTTPS
- ✅ Daily backups
- ✅ Process monitoring
- ✅ ~$5-10/month for lifetime VPS

**Total deployment time:** ~30 minutes
**Monthly cost:** Minimal (just VPS)
**Data security:** Maximum (local, encrypted)

---

**Last Updated:** 2026-06-08
**HOLO-9 Version:** 1.0.0-sqlite
**Status:** Production Ready
