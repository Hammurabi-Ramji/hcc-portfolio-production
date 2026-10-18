# 🐳 DOCKER DEPLOYMENT - WORKFLOW BUILDER ON ZAP HOSTING

**Containerized deployment for maximum portability and ease of management**

---

## 🎯 WHEN TO USE DOCKER

| Scenario | Use Docker? |
|----------|------------|
| **Easy scaling** | ✅ Yes |
| **Multiple apps on same VPS** | ✅ Yes |
| **Quick deployment/updates** | ✅ Yes |
| **Environment consistency** | ✅ Yes |
| **Database isolation** | ✅ Yes |
| **Simple single app** | ⚠️ Optional |

---

## 📋 PREREQUISITES

Your VPS needs:
- Docker installed
- Docker Compose installed
- 2GB+ RAM available
- 20GB+ disk space

---

## 🚀 STEP 1: INSTALL DOCKER

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (optional)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
docker run hello-world
```

---

## 📝 STEP 2: CREATE DOCKER COMPOSE FILE

Create `docker-compose.yml`:

```bash
cd /var/www/workflow-builder

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Workflow Builder Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: workflow-builder
    restart: always
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
      - DATABASE_PATH=/data/workflows.db
      - SESSION_SECRET=${SESSION_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      - LOG_LEVEL=info
    volumes:
      - ./data:/data              # Database persistence
      - ./logs:/var/www/logs      # Log persistence
      - ./backups:/var/backups    # Backup storage
    networks:
      - workflow-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Nginx Reverse Proxy
  nginx:
    image: nginx:latest
    container_name: workflow-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites-available:/etc/nginx/sites-available:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro  # SSL certificates
      - ./data/static:/usr/share/nginx/html:ro
    depends_on:
      - app
    networks:
      - workflow-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  workflow-network:
    driver: bridge

volumes:
  database_data:
    driver: local
EOF

cat docker-compose.yml
```

---

## 🐋 STEP 3: CREATE DOCKERFILE

Create `Dockerfile`:

```bash
cat > Dockerfile << 'EOF'
# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json pnpm-lock.yaml* ./
RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist

# Create data directories
RUN mkdir -p /data /var/backups /var/logs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD curl -f http://localhost:8080/health || exit 1

# Start application
CMD ["node", "dist/background.js"]
EOF

cat Dockerfile
```

---

## ⚙️ STEP 4: CREATE NGINX CONFIG

Create `nginx/nginx.conf`:

```bash
mkdir -p nginx/sites-available

cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    include /etc/nginx/sites-available/*;
}
EOF

cat > nginx/sites-available/workflow-builder.conf << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name workflow.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name workflow.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/workflow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workflow.yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy to application
    location / {
        proxy_pass http://app:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://app:8080;
    }
}
EOF

cat nginx/sites-available/workflow-builder.conf
```

---

## 🔐 STEP 5: CREATE ENVIRONMENT FILE

```bash
cat > .env << 'EOF'
# Application Settings
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Security Secrets (Change these!)
SESSION_SECRET=your_super_secret_session_key_here_minimum_32_chars
JWT_SECRET=your_jwt_secret_key_here_minimum_32_chars

# Database
DATABASE_PATH=/data/workflows.db

# CORS and Domain
CORS_ORIGIN=https://workflow.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_PATH=/var/logs

# Backup
BACKUP_PATH=/var/backups
BACKUP_RETENTION_DAYS=7
EOF

# Secure the file
chmod 600 .env
```

---

## 🚀 STEP 6: BUILD AND START CONTAINERS

```bash
cd /var/www/workflow-builder

# Build Docker image
docker-compose build

# Start containers in background
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Expected output:
# CONTAINER ID   IMAGE                              STATUS
# xxxx           workflow-builder                   Up 2 minutes (healthy)
# xxxx           nginx:latest                       Up 2 minutes (healthy)
```

---

## 🌐 STEP 7: CONFIGURE SSL CERTIFICATE

```bash
# On your VPS (not in container)
sudo apt install -y certbot

# Get certificate
sudo certbot certonly --standalone -d workflow.yourdomain.com

# Certificate is now at: /etc/letsencrypt/live/workflow.yourdomain.com/

# Restart Nginx container to use new certificate
docker-compose restart nginx

# Verify
curl -I https://workflow.yourdomain.com
```

---

## 📊 MANAGEMENT COMMANDS

### Check Status
```bash
cd /var/www/workflow-builder

# View all containers
docker-compose ps

# View running processes
docker ps

# View logs
docker-compose logs -f app      # Application logs
docker-compose logs -f nginx    # Nginx logs

# View specific number of lines
docker-compose logs --tail=50 app
```

### Start/Stop/Restart
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart app
docker-compose restart nginx

# View detailed status
docker-compose exec app curl http://localhost:8080/health
```

### Database Access
```bash
# Access SQLite database inside container
docker-compose exec app sqlite3 /data/workflows.db

# Run SQL command
docker-compose exec app sqlite3 /data/workflows.db ".tables"

# Backup database
docker-compose exec app sqlite3 /data/workflows.db ".backup /var/backups/workflows_backup.db"
```

### View Resource Usage
```bash
# CPU and memory usage
docker stats

# Detailed container info
docker inspect workflow-builder

# Disk usage
docker system df
```

---

## 🔄 DEPLOYMENT UPDATES

### Update Application Code

```bash
cd /var/www/workflow-builder

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View logs to ensure successful start
docker-compose logs -f app
```

### Update Base Images

```bash
# Update Node.js base image (automatically happens on rebuild)
docker-compose pull
docker-compose build --no-cache
docker-compose up -d

# Clean up old images
docker image prune -a
```

---

## 💾 BACKUP & RESTORE

### Create Backup

```bash
cd /var/www/workflow-builder

# Backup database
docker-compose exec app sqlite3 /data/workflows.db ".backup /var/backups/workflows_$(date +%Y%m%d_%H%M%S).db"

# Backup entire data directory
tar -czf /var/backups/workflow-builder-full-$(date +%Y%m%d_%H%M%S).tar.gz data/

# List backups
ls -lh /var/www/workflow-builder/backups/
```

### Automated Daily Backups

```bash
cat > /usr/local/bin/backup-workflow-docker.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/workflow-builder/backups"
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f /var/www/workflow-builder/docker-compose.yml \
  exec app sqlite3 /data/workflows.db ".backup /var/backups/workflows_$DATE.db"

# Backup entire data
tar -czf $BACKUP_DIR/workflow-builder-$DATE.tar.gz \
  -C /var/www/workflow-builder data/

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find /var/www/workflow-builder/data -name "*.db" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/workflow-builder-$DATE.tar.gz" >> /var/log/workflow-backup.log
EOF

chmod +x /usr/local/bin/backup-workflow-docker.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-workflow-docker.sh") | crontab -
```

### Restore from Backup

```bash
cd /var/www/workflow-builder

# Stop containers
docker-compose down

# Restore database
sqlite3 data/workflows.db < backups/workflows_YYYYMMDD_HHMMSS.db

# Or restore entire directory
tar -xzf backups/workflow-builder-YYYYMMDD_HHMMSS.tar.gz

# Restart containers
docker-compose up -d

# Verify
docker-compose logs -f app
```

---

## 🆘 TROUBLESHOOTING

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check if port is in use
sudo ss -tlnp | grep 8080

# Try building again
docker-compose build --no-cache

# Check resources
docker system df
df -h
```

### Database Connection Error

```bash
# Check database exists
docker-compose exec app ls -la /data/

# Test database
docker-compose exec app sqlite3 /data/workflows.db ".tables"

# Check permissions
docker-compose exec app stat /data/workflows.db
```

### Nginx 502 Bad Gateway

```bash
# Check if app is healthy
docker-compose exec app curl http://localhost:8080/health

# Check app logs
docker-compose logs app

# Restart services
docker-compose restart app nginx
```

### Out of Disk Space

```bash
# Check usage
docker system df
df -h

# Clean up Docker
docker container prune -f
docker image prune -a -f
docker volume prune -f

# Clean logs
docker exec workflow-builder truncate -s 0 /var/logs/*
```

---

## 🎯 MONITORING WITH DOCKER

### Health Checks

Already configured in docker-compose.yml:
```bash
# Check health status
docker ps --format "{{.Names}}\t{{.Status}}"

# Example output:
# workflow-builder    Up 2 hours (healthy)
# workflow-nginx      Up 2 hours (healthy)
```

### Container Monitoring

```bash
# Real-time monitoring
docker stats --no-stream

# Memory limit per container
docker-compose down
# Edit docker-compose.yml: add `mem_limit: 1024m` under app service
docker-compose up -d
```

---

## 📋 MAINTENANCE SCHEDULE

| Task | Frequency | Command |
|------|-----------|---------|
| **Backup database** | Daily | `backup-workflow-docker.sh` |
| **Check logs** | Daily | `docker-compose logs app` |
| **Update containers** | Weekly | `docker-compose pull && docker-compose up -d` |
| **Clean unused images** | Monthly | `docker image prune -a` |
| **Renew SSL cert** | Every 3 months | `sudo certbot renew` |

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Docker and Docker Compose installed
- [ ] docker-compose.yml created and tested
- [ ] Dockerfile created and builds successfully
- [ ] Nginx configuration created
- [ ] .env file created with secrets
- [ ] SSL certificate installed
- [ ] Services started: `docker-compose up -d`
- [ ] Health checks passing: `docker ps`
- [ ] Application accessible via HTTPS
- [ ] Database created and tables visible
- [ ] Backup script created and tested
- [ ] Cron job scheduled for automated backups
- [ ] Monitoring set up

---

## 🎉 SUCCESS!

Your Workflow Builder is running in Docker containers!

```bash
# Access application
https://workflow.yourdomain.com

# View logs
docker-compose logs -f

# Check health
curl https://workflow.yourdomain.com/health
```

---

## 🔗 USEFUL RESOURCES

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx in Docker](https://hub.docker.com/_/nginx)
- [Node.js Docker](https://hub.docker.com/_/node)

---

**Version**: 1.0.0  
**Last Updated**: May 24, 2026  
**Workflow Builder Docker Deployment**

