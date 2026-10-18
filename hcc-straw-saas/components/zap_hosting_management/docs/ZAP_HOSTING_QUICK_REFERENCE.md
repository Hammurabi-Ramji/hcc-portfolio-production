# ⚡ ZAP HOSTING WORKFLOW BUILDER - QUICK START

**Fast deployment guide for your existing VPS**

---

## 🎯 3-STEP QUICK DEPLOY (30 Minutes)

### Step 1: Connect to VPS
```bash
ssh root@YOUR_VPS_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git curl

# Install pnpm
npm install -g pnpm
```

### Step 2: Deploy Application
```bash
# Create directory
sudo mkdir -p /var/www/workflow-builder
cd /var/www/workflow-builder

# Option A: Clone from GitHub
git clone https://github.com/yourusername/workflow-builder.git .
pnpm install
pnpm build

# Option B: Upload files via WinSCP then:
pnpm install
```

### Step 3: Run as Service
```bash
# Create systemd service
sudo tee /etc/systemd/system/workflow-builder.service > /dev/null << 'EOF'
[Unit]
Description=Workflow Builder
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/workflow-builder
ExecStart=/usr/bin/node dist/background.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable workflow-builder
sudo systemctl start workflow-builder

# Verify
sudo systemctl status workflow-builder
```

**Done!** Your app is running at `http://YOUR_VPS_IP:8080`

---

## 🌐 ENABLE HTTPS (10 Minutes)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d workflow.yourdomain.com

# Create Nginx config
sudo tee /etc/nginx/sites-available/workflow-builder > /dev/null << 'EOF'
server {
    listen 80;
    server_name workflow.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name workflow.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/workflow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workflow.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/workflow-builder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Done!** Access at `https://workflow.yourdomain.com`

---

## 📊 COMMAND QUICK REFERENCE

```bash
# Service management
sudo systemctl start workflow-builder      # Start
sudo systemctl stop workflow-builder       # Stop
sudo systemctl restart workflow-builder    # Restart
sudo systemctl status workflow-builder     # Check status

# View logs
sudo journalctl -u workflow-builder -f     # Live logs
sudo journalctl -u workflow-builder -n 50  # Last 50 lines

# Nginx
sudo systemctl reload nginx                # Reload config
sudo nginx -t                              # Test config

# Database (SQLite)
sqlite3 /data/workflow-builder/workflows.db ".tables"

# Disk usage
df -h                                      # System
du -sh /var/www/workflow-builder/         # App

# Health check
curl http://localhost:8080/health
curl https://workflow.yourdomain.com/health
```

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] VPS IP address: `_________________`
- [ ] Domain: `_________________`
- [ ] Files ready to upload or repository URL

### Deployment
- [ ] SSH into VPS
- [ ] Install Node.js & pnpm
- [ ] Create `/var/www/workflow-builder` directory
- [ ] Deploy application files
- [ ] Create systemd service file
- [ ] Start service: `sudo systemctl start workflow-builder`
- [ ] Verify service running: `sudo systemctl status workflow-builder`

### HTTPS Setup
- [ ] Install Certbot
- [ ] Get SSL certificate
- [ ] Create Nginx config
- [ ] Enable site
- [ ] Test HTTPS access

### Maintenance Setup
- [ ] Enable automatic backups (cron job)
- [ ] Enable auto-renewal (Certbot)
- [ ] Set up log rotation
- [ ] Test health check endpoint

### Final Verification
- [ ] Access `https://workflow.yourdomain.com`
- [ ] Create test workflow
- [ ] Execute test workflow
- [ ] Check logs: `sudo journalctl -u workflow-builder -f`
- [ ] Verify database: `sqlite3 /data/workflow-builder/workflows.db ".tables"`

---

## 🔑 IMPORTANT REMINDERS

### ⚠️ Account Keep-Alive (CRITICAL)
```
Your ZAP Hosting LIFETIME VPS requires:
- Login every 3-4 months
- Set calendar reminder for every 60 days
- Takes 30 seconds at: https://zap-hosting.com/admin
- This is the ONLY overhead for zero-subscription hosting
```

### 🔐 Backup Your Database
```bash
# Manual backup
sqlite3 /data/workflow-builder/workflows.db ".backup /backups/workflows.backup"

# Automated daily backup (add to crontab)
0 2 * * * sqlite3 /data/workflow-builder/workflows.db ".backup /backups/workflows_$(date +\%Y\%m\%d).db"
```

### 🔄 Update Your Application
```bash
cd /var/www/workflow-builder
git pull origin main
pnpm install
pnpm build
sudo systemctl restart workflow-builder
```

---

## 📁 FILE STRUCTURE ON VPS

```
/var/www/workflow-builder/
├── dist/                    # Built frontend
├── src-tauri/              # Tauri backend source
├── node_modules/           # Dependencies
├── .env                    # Configuration (PRIVATE!)
├── package.json
├── tsconfig.json
└── logs/                   # Application logs

/data/workflow-builder/
└── workflows.db            # SQLite database

/var/backups/workflow-builder/
└── workflows_YYYYMMDD.db   # Daily backups
```

---

## 🆘 QUICK TROUBLESHOOTING

### App not responding?
```bash
# Check if running
sudo systemctl status workflow-builder

# View errors
sudo journalctl -u workflow-builder -n 50

# Restart
sudo systemctl restart workflow-builder
```

### Can't access via HTTPS?
```bash
# Check certificate
sudo certbot certificates

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Database issues?
```bash
# Check if exists
ls -la /data/workflow-builder/workflows.db

# Test database
sqlite3 /data/workflow-builder/workflows.db "SELECT COUNT(*) FROM workflows;"
```

### Out of disk space?
```bash
# Check usage
df -h
du -sh /var/www/workflow-builder/*

# Clean backups
find /var/backups -name "*.db" -mtime +30 -delete
```

---

## 🚀 PERFORMANCE TIPS

1. **Enable Gzip Compression** (in Nginx)
   ```nginx
   gzip on;
   gzip_types text/plain application/json text/css;
   ```

2. **Database Optimization**
   ```bash
   sqlite3 /data/workflow-builder/workflows.db "VACUUM;"
   sqlite3 /data/workflow-builder/workflows.db "ANALYZE;"
   ```

3. **Monitor Resource Usage**
   ```bash
   # Real-time monitoring
   htop
   
   # Memory usage
   free -h
   
   # CPU usage
   top
   ```

4. **Enable Caching**
   - Add cache headers in Nginx
   - Use Cloudflare CDN (free tier)
   - Cache static assets

---

## 📊 MONITORING

### Create Health Check
```bash
# Add to your .env
HEALTH_CHECK_ENABLED=true

# Then check
curl https://workflow.yourdomain.com/api/health
```

### Monitor Service
```bash
# Create monitoring script
cat > /usr/local/bin/monitor-workflow.sh << 'EOF'
#!/bin/bash
if ! curl -f https://workflow.yourdomain.com/api/health > /dev/null; then
    sudo systemctl restart workflow-builder
    echo "Service restarted at $(date)" >> /var/log/workflow-monitor.log
fi
EOF

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-workflow.sh") | crontab -
```

---

## 🔗 USEFUL LINKS

| Resource | URL |
|----------|-----|
| **ZAP Hosting** | https://zap-hosting.com |
| **Tauri Docs** | https://tauri.app |
| **Nginx Docs** | https://nginx.org |
| **SQLite Docs** | https://sqlite.org |
| **Let's Encrypt** | https://letsencrypt.org |
| **Certbot Docs** | https://certbot.eff.org |

---

## 📞 SUPPORT

**Need help?**
- Zap Hosting: support@zap-hosting.com
- Check `/var/log/nginx/error.log` for web errors
- Check `sudo journalctl -u workflow-builder` for app errors
- Review detailed guide: `ZAP_HOSTING_DEPLOYMENT_WORKFLOW_BUILDER.md`

---

## ✨ NEXT STEPS

1. ✅ Deploy application
2. ✅ Enable HTTPS
3. ✅ Set up backups
4. ✅ Configure monitoring
5. ✅ Set account keep-alive reminder
6. ✅ Document any customizations

**Your Workflow Builder is production-ready!** 🚀

---

**Version**: 1.0.0  
**Last Updated**: May 24, 2026  
**Workflow Builder on ZAP Hosting VPS**

