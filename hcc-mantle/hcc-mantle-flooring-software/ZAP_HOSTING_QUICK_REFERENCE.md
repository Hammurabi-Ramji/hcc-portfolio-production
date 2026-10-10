# 📌 Zap Hosting Quick Reference Card

## Print-Friendly One-Page Cheat Sheet

---

## 🚀 Essential Commands

### Deployment
```bash
# Install ERP system
sudo bash install-zap.sh --domain erp.yourdomain.com --email your@email.com

# Check installation status
tail -f installation.log

# Verify services
sudo systemctl status nginx
sudo systemctl status postgresql
sudo pm2 list
```

### Daily Operations
```bash
# Restart all services
sudo pm2 restart flooring-backend
sudo pm2 restart flooring-frontend
sudo systemctl restart nginx

# View logs
tail -f /var/log/flooring-erp/backend.log
tail -f /var/log/nginx/access.log

# Check system health
./health-check.sh
```

### Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql flooring_erp

# Backup database
./backup-restore.sh backup

# Restore database
./backup-restore.sh restore BACKUP_FILE.sql
```

### SSL/TLS
```bash
# Renew SSL certificates
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Check certificate
sudo certbot certificates
```

---

## 🌐 URLs & Ports

| Service | URL/Port | Purpose |
|---------|----------|---------|
| Frontend | https://yourdomain.com | Customer/Employee/Vendor portals |
| Backend API | https://yourdomain.com/api | REST API endpoints |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |
| SSH | YOUR_IP:22 | Server access |
| HTTP | 80 | Redirects to HTTPS |
| HTTPS | 443 | Secure web traffic |

---

## 👥 Default User Roles

| Role | Access Level | Portal |
|------|-------------|--------|
| Super Admin | Full system access | Admin Dashboard |
| Admin | Company management | Admin Dashboard |
| Manager | Department oversight | Employee Portal |
| Employee | Job tasks, time tracking | Employee Portal |
| Customer | Projects, invoices, quotes | Customer Portal |
| Vendor | Inventory, POs, invoices | Vendor Portal |

---

## 📁 Important File Locations

```bash
# Application
/opt/flooring-erp/backend/     # Backend code
/opt/flooring-erp/frontend/    # Frontend code
/opt/flooring-erp/scripts/     # Automation scripts

# Logs
/var/log/flooring-erp/         # Application logs
/var/log/nginx/                # Web server logs
/var/log/postgresql/           # Database logs

# Backups
/backups/flooring-erp/         # Automated backups
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Website Not Loading | Check Nginx: `sudo nginx -t && sudo systemctl restart nginx` |
| Database Connection Failed | Check PostgreSQL: `sudo systemctl restart postgresql` |
| High Memory Usage | Restart services: `sudo pm2 restart all` |
| SSL Certificate Expired | Renew: `sudo certbot renew --force-renewal` |

---

## 💾 Backup & Restore

```bash
# Manual backup
./backup-restore.sh backup

# Restore from backup
./backup-restore.sh restore BACKUP_FILE.sql

# Automated backup schedule: Daily at 2:00 AM
```

---

## 📊 Health Check Indicators

- ✅ Nginx: `sudo systemctl status nginx`
- ✅ PostgreSQL: `sudo systemctl status postgresql`
- ✅ Redis: `sudo systemctl status redis`
- ✅ Backend: `sudo pm2 show flooring-backend`
- ✅ Frontend: `sudo pm2 show flooring-frontend`

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Configure firewall (UFW)
- [ ] Enable 2FA for admin
- [ ] Set up automated backups
- [ ] Monitor access logs weekly

---

**Version:** 1.0.0 | **Platform:** Zap Hosting vServer | **Cost:** $0/month