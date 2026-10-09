# VetPharma ERP Production Deployment Guide

## Production Deployment - Enhanced System Rollout

### 🚀 Deployment Overview
This guide provides step-by-step instructions for deploying the enhanced VetPharma ERP system with full FDA CVM compliance capabilities to production environment.

---

## 1. PRE-DEPLOYMENT PREPARATION

### 1.1 System Requirements Check
- [ ] **Server Hardware:** Minimum 16GB RAM, 500GB SSD, Quad-core CPU
- [ ] **Operating System:** Windows Server 2019/2022 or Linux (Ubuntu 20.04+)
- [ ] **Database:** SQLite (included) or PostgreSQL/MySQL for enterprise
- [ ] **Network:** Stable internet connection, firewall configuration
- [ ] **Security:** SSL certificates, user authentication setup

### 1.2 Backup Current System
```bash
# Create full system backup
tar -czf vetpharma_backup_$(date +%Y%m%d).tar.gz /opt/vetpharma/
mysqldump vetpharma_db > vetpharma_db_backup_$(date +%Y%m%d).sql
```

### 1.3 Environment Setup
```bash
# Create deployment directory
sudo mkdir -p /opt/vetpharma/production
cd /opt/vetpharma/production

# Set proper permissions
sudo chown -R vetpharma:vetpharma /opt/vetpharma/
sudo chmod -R 755 /opt/vetpharma/
```

---

## 2. CODE DEPLOYMENT

### 2.1 Backend Deployment (Rust/Tauri)

**Step 1: Build Production Release**
```bash
cd src-tauri
cargo build --release
```

**Step 2: Install System Dependencies**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf

# CentOS/RHEL
sudo yum install -y webkit2gtk3-devel libappindicator-gtk3 librsvg2-devel
```

**Step 3: Deploy Backend Binary**
```bash
# Copy release binary
sudo cp target/release/vetpharma-erp /opt/vetpharma/production/

# Create systemd service
sudo tee /etc/systemd/system/vetpharma-erp.service > /dev/null <<EOF
[Unit]
Description=VetPharma ERP System
After=network.target

[Service]
Type=simple
User=vetpharma
WorkingDirectory=/opt/vetpharma/production
ExecStart=/opt/vetpharma/production/vetpharma-erp
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable vetpharma-erp
```

### 2.2 Frontend Deployment (Svelte)

**Step 1: Build Production Frontend**
```bash
npm run build
```

**Step 2: Deploy Static Files**
```bash
# Copy built files to web server directory
sudo cp -r dist/* /var/www/html/vetpharma/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html/vetpharma/
sudo chmod -R 755 /var/www/html/vetpharma/
```

**Step 3: Configure Web Server (Nginx)**
```nginx
server {
    listen 80;
    server_name vetpharma.yourdomain.com;

    root /var/www/html/vetpharma;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:1420;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

---

## 3. DATABASE SETUP

### 3.1 Database Initialization
```bash
# Initialize database schema
cd /opt/vetpharma/production
./vetpharma-erp --init-db

# Populate with template data
./vetpharma-erp --populate-kb
```

### 3.2 Database Migration (if upgrading)
```bash
# Backup existing database
cp vetpharma.db vetpharma.db.backup

# Run migration scripts
./vetpharma-erp --migrate-db

# Verify migration success
./vetpharma-erp --check-db
```

### 3.3 Database Backup Configuration
```bash
# Create backup script
sudo tee /opt/vetpharma/backup.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/vetpharma/backups"

mkdir -p \$BACKUP_DIR
cp vetpharma.db \$BACKUP_DIR/vetpharma_\$DATE.db

# Keep only last 30 backups
cd \$BACKUP_DIR
ls -t vetpharma_*.db | tail -n +31 | xargs -r rm
EOF

# Make executable and schedule
sudo chmod +x /opt/vetpharma/backup.sh
sudo crontab -l | { cat; echo "0 2 * * * /opt/vetpharma/backup.sh"; } | sudo crontab -
```

---

## 4. SECURITY CONFIGURATION

### 4.1 SSL/TLS Setup
```bash
# Install certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d vetpharma.yourdomain.com

# Configure automatic renewal
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -
```

### 4.2 User Authentication Setup
```bash
# Configure LDAP/Active Directory integration (if applicable)
# Edit configuration file
nano /opt/vetpharma/config/auth.json

# Example configuration:
{
  "auth_provider": "ldap",
  "ldap_server": "ldap://your-domain.com",
  "base_dn": "DC=yourdomain,DC=com",
  "user_search_filter": "(sAMAccountName={username})"
}
```

### 4.3 Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Verify firewall status
sudo ufw status
```

---

## 5. COMPLIANCE MODULES ACTIVATION

### 5.1 Validation System Setup
```bash
# Initialize validation templates
./vetpharma-erp --init-validation

# Create default validation protocols
./vetpharma-erp --create-default-protocols
```

### 5.2 Training System Setup
```bash
# Initialize training courses
./vetpharma-erp --init-training

# Import GMP training materials
./vetpharma-erp --import-gmp-courses
```

### 5.3 Compliance Monitoring Setup
```bash
# Configure compliance alerts
./vetpharma-erp --setup-compliance-monitoring

# Schedule automated compliance checks
sudo crontab -l | { cat; echo "0 6 * * 1 /opt/vetpharma/production/vetpharma-erp --run-compliance-check"; } | sudo crontab -
```

---

## 6. USER PROVISIONING

### 6.1 Create Administrator Account
```bash
# Create initial admin user
./vetpharma-erp --create-admin-user --username admin --email admin@vetpharma.com

# Set initial password (will prompt for secure password)
./vetpharma-erp --set-admin-password
```

### 6.2 Configure User Roles
```bash
# Create standard roles
./vetpharma-erp --create-role --name "Quality Manager" --permissions "validation:full,training:full,compliance:full"
./vetpharma-erp --create-role --name "Validation Specialist" --permissions "validation:full,training:read"
./vetpharma-erp --create-role --name "Training Coordinator" --permissions "training:full,compliance:read"
./vetpharma-erp --create-role --name "Production Operator" --permissions "training:read,compliance:read"
```

### 6.3 Bulk User Import (Optional)
```bash
# Prepare CSV file with user data
# Format: username,email,full_name,role
echo "username,email,full_name,role" > users.csv
echo "jdoe,john.doe@vetpharma.com,John Doe,Production Operator" >> users.csv

# Import users
./vetpharma-erp --import-users users.csv
```

---

## 7. SYSTEM TESTING

### 7.1 Post-Deployment Testing
```bash
# Run system health check
./vetpharma-erp --health-check

# Test all API endpoints
./vetpharma-erp --test-api

# Verify database connectivity
./vetpharma-erp --test-db-connection
```

### 7.2 Compliance Feature Testing
```bash
# Test validation module
curl -X POST http://localhost:1420/api/validation/create-protocol \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Protocol","validation_type":"Equipment"}'

# Test training module
curl -X POST http://localhost:1420/api/training/create-course \
  -H "Content-Type: application/json" \
  -d '{"course_title":"Test Course","course_type":"GMP"}'

# Test compliance dashboard
curl http://localhost:1420/api/compliance/metrics
```

### 7.3 Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 http://localhost/

# Memory usage check
ps aux | grep vetpharma-erp

# Database performance
./vetpharma-erp --benchmark-db
```

---

## 8. MONITORING AND LOGGING

### 8.1 System Monitoring Setup
```bash
# Install monitoring tools
sudo apt install htop iotop sysstat

# Configure log rotation
sudo tee /etc/logrotate.d/vetpharma > /dev/null <<EOF
/opt/vetpharma/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 644 vetpharma vetpharma
    postrotate
        systemctl reload vetpharma-erp
    endscript
}
EOF
```

### 8.2 Alert Configuration
```bash
# Configure email alerts for critical events
sudo tee /opt/vetpharma/alert-config.json > /dev/null <<EOF
{
  "smtp_server": "smtp.vetpharma.com",
  "alert_emails": ["admin@vetpharma.com", "it-support@vetpharma.com"],
  "alert_triggers": {
    "system_down": true,
    "high_cpu": 90,
    "low_disk_space": 10,
    "db_connection_failed": true
  }
}
EOF
```

---

## 9. GO-LIVE CHECKLIST

### 9.1 Pre-Go-Live Verification
- [ ] All system components installed and configured
- [ ] Database initialized with correct schema
- [ ] User accounts created and roles assigned
- [ ] SSL certificates installed and working
- [ ] Firewall configured correctly
- [ ] Backup system operational
- [ ] Monitoring and alerting configured

### 9.2 Go-Live Execution
- [ ] Stop current production system
- [ ] Perform final database backup
- [ ] Start new system
- [ ] Verify system accessibility
- [ ] Test critical business functions
- [ ] Monitor system performance
- [ ] Communicate go-live to users

### 9.3 Post-Go-Live Support
- [ ] Monitor system logs for errors
- [ ] Address user issues promptly
- [ ] Conduct user training sessions
- [ ] Perform daily health checks
- [ ] Plan rollback procedure if needed

---

## 10. ROLLBACK PROCEDURES

### 10.1 Emergency Rollback
```bash
# Stop new system
sudo systemctl stop vetpharma-erp

# Restore backup
cp vetpharma.db.backup vetpharma.db

# Start old system
sudo systemctl start vetpharma-erp-old

# Verify rollback success
curl http://localhost/health
```

### 10.2 Partial Rollback
```bash
# Rollback specific features if needed
./vetpharma-erp --disable-feature compliance
./vetpharma-erp --rollback-to-version 1.0.0
```

---

## 11. MAINTENANCE PROCEDURES

### 11.1 Regular Maintenance Tasks
```bash
# Weekly tasks
sudo /opt/vetpharma/maintenance.sh

# Monthly tasks
./vetpharma-erp --monthly-maintenance

# Quarterly tasks
./vetpharma-erp --quarterly-compliance-review
```

### 11.2 Update Procedures
```bash
# Check for updates
./vetpharma-erp --check-updates

# Apply updates
./vetpharma-erp --update-system

# Verify update success
./vetpharma-erp --health-check
```

---

## 12. SUPPORT AND CONTACTS

### 12.1 Support Team
- **System Administrator:** admin@vetpharma.com
- **Database Administrator:** dba@vetpharma.com
- **Quality Assurance:** qa@vetpharma.com
- **IT Support:** it-support@vetpharma.com

### 12.2 Emergency Contacts
- **24/7 System Support:** +1-800-VETPHARMA
- **Quality Emergency:** +1-800-QUALITY
- **Regulatory Issues:** +1-800-FDA-CVM

### 12.3 Documentation
- User Manual: `/opt/vetpharma/docs/user-manual.pdf`
- Admin Guide: `/opt/vetpharma/docs/admin-guide.pdf`
- Troubleshooting: `/opt/vetpharma/docs/troubleshooting.pdf`

---

## 13. DEPLOYMENT SIGN-OFF

**Deployment Lead:** ___________________________ Date: __________

**Quality Approval:** ___________________________ Date: __________

**IT Approval:** ___________________________ Date: __________

**Business Approval:** ___________________________ Date: __________