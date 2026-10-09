# 📖 VetPharma ERP - Deployment Guide

**Version:** 1.0.0  
**Date:** October 3, 2025  
**Status:** Production-Ready

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Deployment Options](#deployment-options)
5. [Configuration](#configuration)
6. [Database Setup](#database-setup)
7. [Docker Deployment](#docker-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Security Best Practices](#security-best-practices)

---

## Introduction

VetPharma ERP is a comprehensive Enterprise Resource Planning system designed specifically for veterinary pharmaceutical manufacturing. This guide provides complete deployment instructions for all supported platforms.

### System Overview

- **Frontend:** Svelte + Vite
- **Backend:** Rust + Tauri
- **Database:** SQLite (default) / PostgreSQL (optional)
- **Caching:** Redis
- **Monitoring:** Prometheus + Grafana

### Deployment Models

1. **Desktop Application** - Standalone native application
2. **Docker Container** - Containerized microservices
3. **Manual Build** - Source code deployment

---

## Prerequisites

### Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| Node.js | 18.0+ | Frontend build |
| npm | 9.0+ | Package management |
| Rust | 1.70+ | Backend compilation |
| Cargo | 1.70+ | Rust package manager |
| SQLite | 3.35+ | Database (default) |
| Git | 2.30+ | Version control |

### Optional Software

| Software | Version | Purpose |
|----------|---------|---------|
| Docker | 20.10+ | Container deployment |
| Docker Compose | 2.0+ | Multi-container orchestration |
| PostgreSQL | 13+ | Alternative database |
| Redis | 6.0+ | Caching layer |
| NSIS | 3.0+ | Windows installer |

### System Requirements

#### Minimum Requirements
- **CPU:** 2 cores @ 2.0 GHz
- **RAM:** 4 GB
- **Storage:** 10 GB available
- **OS:** Windows 10+, Ubuntu 20.04+, macOS 10.15+

#### Recommended Requirements
- **CPU:** 4+ cores @ 3.0+ GHz
- **RAM:** 8+ GB
- **Storage:** 50+ GB SSD
- **OS:** Windows 11, Ubuntu 22.04 LTS, macOS 12+

---

## Quick Start

### 1. Install Prerequisites

**Windows (PowerShell):**
```powershell
# Install Node.js from https://nodejs.org/
# Install Rust from https://rustup.rs/
rustup-init.exe

# Verify installations
node --version
npm --version
rustc --version
cargo --version
```

**Linux (Ubuntu/Debian):**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install SQLite
sudo apt-get install -y sqlite3 libsqlite3-dev

# Verify installations
node --version
npm --version
rustc --version
```

**macOS:**
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install prerequisites
brew install node rust sqlite

# Verify installations
node --version
rustc --version
```

### 2. Clone and Configure

```bash
# Navigate to project directory
cd /path/to/Vet_Pharma_ERP

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Generate secure secrets
openssl rand -hex 32  # Copy to SESSION_SECRET
openssl rand -hex 32  # Copy to JWT_SECRET
openssl rand -hex 32  # Copy to ENCRYPTION_KEY
```

### 3. Deploy

**Option A: Using Deploy Script (Recommended)**
```bash
# Windows
./deploy.sh --windows --clean --init-db

# Linux
./deploy.sh --linux --clean --init-db

# macOS
./deploy.sh --macos --clean --init-db
```

**Option B: Manual Deployment**
```bash
# Initialize database
./scripts/init_database.sh

# Build frontend
npm run build

# Build backend
cd src-tauri
cargo build --release
cd ..

# Run application
npm run tauri:dev
```

**Option C: Docker Deployment**
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 4. Access Application

```
URL: http://localhost:8080
Username: admin
Password: Admin@123
```

⚠️ **CRITICAL:** Change the default password immediately after first login!

---

## Deployment Options

### Desktop Application Deployment

#### Windows

1. **Build Installer:**
```bash
./deploy.sh --windows --installer
```

2. **Installer Output:**
- Location: `./installers/VetPharma-ERP-Setup-1.0.0.exe`
- Size: ~100 MB
- Silent install: `VetPharma-ERP-Setup-1.0.0.exe /S`

3. **Manual Installation:**
- Run installer as Administrator
- Follow installation wizard
- Application installs to: `C:\Program Files\VetPharma ERP`
- Data directory: `C:\ProgramData\VetPharma ERP`

#### Linux

1. **Build Package:**
```bash
./deploy.sh --linux --installer
```

2. **Package Output:**
- Location: `./installers/vetpharma-erp-1.0.0-linux-x64.tar.gz`
- Extract: `tar -xzf vetpharma-erp-1.0.0-linux-x64.tar.gz`
- Run: `./vetpharma-erp-linux/vetpharma-erp.sh`

3. **System Integration:**
```bash
# Copy .desktop file
sudo cp vetpharma-erp.desktop /usr/share/applications/

# Install to /opt
sudo mv vetpharma-erp-linux /opt/vetpharma-erp

# Create symbolic link
sudo ln -s /opt/vetpharma-erp/vetpharma-erp.sh /usr/local/bin/vetpharma-erp
```

#### macOS

1. **Build DMG:**
```bash
./deploy.sh --macos --installer
```

2. **DMG Output:**
- Location: `./installers/vetpharma-erp-1.0.0-macos.dmg`
- Mount DMG and drag to Applications folder
- First run: Right-click → Open (bypass Gatekeeper)

---

## Configuration

### Environment Variables

Edit `.env` file with your specific configuration:

```bash
# Application Settings
APP_PORT=8080
APP_URL=http://localhost:8080

# Security (Generate unique values!)
SESSION_SECRET=your-unique-secret-here
JWT_SECRET=your-unique-jwt-secret-here
ENCRYPTION_KEY=your-unique-encryption-key-here

# Database
DATABASE_URL=./data/vetpharma_production.db

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password

# Company Information
COMPANY_NAME="Your Company Name"
COMPANY_EMAIL=info@yourcompany.com
FDA_ESTABLISHMENT_ID=your-fda-id
```

### Configuration Files

1. **`.env`** - Main environment configuration
2. **`config/nginx/nginx.conf`** - Nginx reverse proxy settings
3. **`config/prometheus/prometheus.yml`** - Monitoring configuration
4. **`config/grafana/`** - Dashboard configurations

---

## Database Setup

### SQLite (Default)

SQLite is used by default for desktop deployments:

```bash
# Initialize database
./scripts/init_database.sh

# Database location
./data/vetpharma_production.db

# Backup database
cp ./data/vetpharma_production.db ./backups/backup_$(date +%Y%m%d).db

# Access database
sqlite3 ./data/vetpharma_production.db
```

### PostgreSQL (Production)

For production or multi-user deployments:

1. **Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start service
sudo systemctl start postgresql
```

2. **Create Database:**
```bash
sudo -u postgres psql

CREATE DATABASE vetpharma;
CREATE USER vetpharma WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE vetpharma TO vetpharma;
\q
```

3. **Update Configuration:**
```bash
# Edit .env
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=vetpharma
POSTGRES_USER=vetpharma
POSTGRES_PASSWORD=your-password
```

4. **Run Migrations:**
```bash
# Import schema
psql -U vetpharma -d vetpharma -f scripts/init_postgres.sql
```

---

## Docker Deployment

### Basic Docker Deployment

1. **Prerequisites:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

2. **Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Services:**
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Deployment

```bash
# Create production compose file
cp docker-compose.yml docker-compose.prod.yml

# Edit docker-compose.prod.yml for production settings

# Deploy with production settings
docker-compose -f docker-compose.prod.yml up -d

# Enable automatic restart
docker-compose -f docker-compose.prod.yml up -d --restart unless-stopped
```

### Docker Services

The stack includes:

1. **app** - VetPharma ERP application (port 8080)
2. **redis** - Caching layer (port 6379)
3. **postgres** - Database (port 5432)
4. **nginx** - Reverse proxy (ports 80, 443)
5. **prometheus** - Metrics collection (port 9090)
6. **grafana** - Dashboards (port 3000)
7. **backup** - Automated backup service

### Docker Management

```bash
# View container logs
docker-compose logs -f app

# Execute commands in container
docker-compose exec app sh

# Restart specific service
docker-compose restart app

# View resource usage
docker-compose stats

# Backup data volumes
docker run --rm -v vetpharma_app-data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/data_$(date +%Y%m%d).tar.gz /data
```

---

## Troubleshooting

### Common Issues

#### Issue: Port Already in Use

**Symptom:** Application fails to start with "port 8080 already in use"

**Solution:**
```bash
# Find process using port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in .env
APP_PORT=8081
```

#### Issue: Database Connection Failed

**Symptom:** "Failed to connect to database"

**Solution:**
```bash
# Check database file exists
ls -la ./data/vetpharma_production.db

# Check file permissions
chmod 644 ./data/vetpharma_production.db

# Recreate database
rm ./data/vetpharma_production.db
./scripts/init_database.sh
```

#### Issue: Build Fails

**Symptom:** "Build failed" during deployment

**Solution:**
```bash
# Clean build cache
npm cache clean --force
cd src-tauri && cargo clean && cd ..

# Remove node_modules
rm -rf node_modules
npm install

# Try clean build
./deploy.sh --clean --windows
```

#### Issue: Docker Container Won't Start

**Symptom:** Container exits immediately

**Solution:**
```bash
# Check logs
docker-compose logs app

# Check configuration
docker-compose config

# Restart with clean state
docker-compose down -v
docker-compose up -d
```

### Log Files

Check these log files for debugging:

- **Application Logs:** `./logs/application.log`
- **Deployment Logs:** `./logs/deployment_YYYYMMDD.log`
- **Database Logs:** `./logs/database_init.log`
- **Build Logs:** `./logs/build.log`
- **Docker Logs:** `docker-compose logs`

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:8080/health

# Check database connection
sqlite3 ./data/vetpharma_production.db "SELECT 1;"

# Check Redis
redis-cli ping

# Check all Docker services
docker-compose ps
```

### Prometheus Metrics

Access metrics at: `http://localhost:9090`

Key metrics to monitor:
- Request rate and latency
- Database query performance
- Memory and CPU usage
- Error rates
- Active users

### Grafana Dashboards

Access dashboards at: `http://localhost:3000`

Default credentials:
- Username: admin
- Password: Set in .env (GRAFANA_ADMIN_PASSWORD)

Pre-configured dashboards:
1. **System Overview** - Overall system health
2. **Application Metrics** - App-specific metrics
3. **Database Performance** - Database statistics
4. **User Activity** - User session analytics

### Backup Procedures

**Automatic Backups:**
```bash
# Configured in .env
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
```

**Manual Backups:**
```bash
# Backup database
cp ./data/vetpharma_production.db \
   ./backups/manual_backup_$(date +%Y%m%d_%H%M%S).db

# Backup complete data directory
tar -czf ./backups/full_backup_$(date +%Y%m%d).tar.gz ./data

# Backup Docker volumes
docker run --rm -v vetpharma_app-data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/docker_backup_$(date +%Y%m%d).tar.gz /data
```

**Restore Procedures:**
```bash
# Restore database
cp ./backups/backup_YYYYMMDD.db ./data/vetpharma_production.db

# Restart application
docker-compose restart app  # Docker
# or
npm run tauri:dev  # Desktop
```

### Maintenance Tasks

**Daily:**
- Monitor error logs
- Check backup completion
- Verify system health

**Weekly:**
- Review performance metrics
- Check disk space usage
- Update security patches

**Monthly:**
- Database optimization
- Log rotation and cleanup
- Security audit
- Performance review

**Quarterly:**
- Full system backup test
- Disaster recovery drill
- Capacity planning review
- User access audit

---

## Security Best Practices

### Initial Setup

1. **Change Default Passwords:**
```bash
# Change admin password immediately after first login
# Use strong password: minimum 12 characters, mixed case, numbers, symbols
```

2. **Generate Unique Secrets:**
```bash
# Generate secure random secrets
openssl rand -hex 32  # SESSION_SECRET
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # ENCRYPTION_KEY

# Never reuse secrets across environments
```

3. **Configure SSL/TLS:**
```bash
# Generate SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./config/ssl/server.key \
  -out ./config/ssl/server.crt

# Update nginx configuration to use SSL
# Redirect HTTP to HTTPS
```

### Access Control

1. **User Management:**
- Implement principle of least privilege
- Regular access reviews
- Strong password policy
- Multi-factor authentication (if available)

2. **Network Security:**
```bash
# Firewall rules (example for Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Disable unnecessary ports
# Use VPN for remote access
```

3. **Database Security:**
```bash
# Use encrypted connections
POSTGRES_SSL_MODE=require

# Regular security updates
sudo apt-get update && sudo apt-get upgrade

# Limit database access to localhost
```

### Compliance

**21 CFR Part 11:**
- Electronic signatures enabled
- Audit trail active
- System validation documented
- Access controls enforced

**Data Integrity (ALCOA+):**
- Attributable - User tracking
- Legible - Clear records
- Contemporaneous - Real-time logging
- Original - Primary records preserved
- Accurate - Data validation

### Monitoring & Auditing

```bash
# Enable audit logging
AUDIT_TRAIL_ENABLED=true

# Monitor failed login attempts
# Review audit logs regularly
# Set up alerts for suspicious activity

# Access audit logs
sqlite3 ./data/vetpharma_production.db \
  "SELECT * FROM audit_logs WHERE action='LOGIN_FAILED' \
   AND timestamp > datetime('now', '-1 day');"
```

---

## Support & Resources

### Documentation
- **User Manual:** `./docs/USER_MANUAL.md`
- **API Documentation:** `./docs/API.md`
- **Training Materials:** `./docs/training/`

### Support Channels
- **Email:** support@vetpharma.com
- **Phone:** +1-555-0100
- **Hours:** Monday-Friday, 8 AM - 6 PM EST
- **Emergency:** 24/7 critical support available

### Updates
- **Check for updates:** `git pull origin main`
- **Release notes:** `./CHANGELOG.md`
- **Migration guides:** `./docs/migrations/`

---

## Appendix

### Useful Commands

```bash
# Check system status
./scripts/system_status.sh

# Run diagnostics
./scripts/diagnostics.sh

# Generate support bundle
./scripts/generate_support_bundle.sh

# Database maintenance
./scripts/db_maintenance.sh

# Performance tuning
./scripts/performance_tune.sh
```

### File Locations

| Type | Location |
|------|----------|
| Application | `./` |
| Data | `./data/` |
| Logs | `./logs/` |
| Backups | `./backups/` |
| Configuration | `./config/` |
| Scripts | `./scripts/` |

### Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Application | 8080 | Main application |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Nginx HTTP | 80 | Web server |
| Nginx HTTPS | 443 | Secure web |
| Prometheus | 9090 | Metrics |
| Grafana | 3000 | Dashboards |

---

**Document Version:** 1.0.0  
**Last Updated:** October 3, 2025  
**Next Review:** January 3, 2026

---

© 2025 VetPharma Solutions. All Rights Reserved.
