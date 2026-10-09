# Ramblox Staging Deployment Guide

**Date:** May 24, 2026  
**Environment:** Staging  
**Database:** SQLite3 (local)  
**Platform:** Vercel/Netlify

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

**Benefits:**
- ✅ Automatic deployments from Git
- ✅ Preview deployments for PRs
- ✅ Edge functions support
- ✅ Easy rollback
- ✅ Built-in monitoring

**Steps:**

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Link Vercel to Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Link project
   cd C:\hcc-straw\hcc-straw-ramblox
   vercel link
   ```

3. **Configure Vercel**
   - Go to Vercel dashboard
   - Import repository
   - Configure settings:
     - **Framework Preset:** Next.js
     - **Root Directory:** (leave blank)
     - **Build Command:** `pnpm build`
     - **Output Directory:** `.next`

4. **Set Environment Variables**
   ```bash
   # Copy values from .env.local
   # Add to Vercel Project Settings > Environment Variables
   
   SQLITE_PATH=/vercel/path/data/ramblox.db
   SESSION_SECRET=<generate-new-secret>
   DEBUG=true
   NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   # Deploy to staging
   vercel --prod
   ```

---

### Option 2: Netlify

**Steps:**

1. **Create Netlify Account**
   - Go to https://netlify.com
   - Sign up

2. **Deploy from Git**
   - Click "New site from Git"
   - Select repository
   - Configure:
     - **Build command:** `pnpm build`
     - **Publish directory:** `client/out`

3. **Environment Variables**
   ```
   SQLITE_PATH=./data/ramblox.db
   SESSION_SECRET=<generate-new-secret>
   DEBUG=false
   NODE_ENV=production
   ```

4. **Deploy**
   - Netlify will auto-deploy on push

---

### Option 3: Self-Hosted (Docker)

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN pnpm build

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  ramblox:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SQLITE_PATH=/app/data/ramblox.db
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
      - DEBUG=false
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
```

---

## 📊 Pre-Deployment Checklist

- [x] Database configured and seeded
- [x] All tests passing
- [x] Environment variables ready
- [x] Documentation complete
- [ ] SSL certificates configured
- [ ] Domain configured (optional)
- [ ] Monitoring set up
- [ ] Backup procedures documented

---

## 🔧 Environment Configuration

### Production .env.local
```bash
# Database
SQLITE_PATH=./data/ramblox.db

# Security (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=prod-secret-key-min-64-characters-long

# Server
PORT=3000

# Production
NODE_ENV=production
DEBUG=false
```

### Staging .env.staging
```bash
# Database
SQLITE_PATH=./data/ramblox-staging.db

# Security
SESSION_SECRET=staging-secret-key-change-this

# Server
PORT=3000

# Staging
NODE_ENV=staging
DEBUG=true
```

---

## 📝 Post-Deployment Tasks

### 1. Verify Deployment
```bash
# Check health endpoint
curl https://your-staging-url.vercel.app/api

# Check authentication
curl -X POST https://your-staging-url.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ramblox.test","password":"admin123"}'

# Test game creation
curl https://your-staging-url.vercel.app/api/games
```

### 2. Set Up Monitoring
- [ ] Vercel Analytics
- [ ] Netlify Insights
- [ ] Third-party monitoring (New Relic, Datadog)

### 3. Configure DNS (if using custom domain)
```
# Add CNAME record
www.your-domain.com → your-app.vercel.app
```

### 4. Enable HTTPS
- **Vercel/Netlify:** Automatic (Let's Encrypt)
- **Self-hosted:** Configure with nginx or caddy

---

## 🔄 Continuous Deployment

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test:manual
      
      - name: Build
        run: pnpm build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🚨 Rollback Procedure

If deployment fails or issues occur:

1. **Vercel:**
   - Go to dashboard
   - Click "Deployments"
   - Select previous deployment
   - Click "Promote"

2. **Netlify:**
   - Go to site dashboard
   - Click "Deploys"
   - Select successful deployment
   - Click "Publish deploy"

3. **Self-hosted:**
   ```bash
   docker-compose down
   docker-compose pull
   docker-compose up -d
   ```

---

## 📞 Support

**Questions?** Check:
- [Staging Deployment Guide](./STAGING_DEPLOYMENT.md)
- [E2E Testing Guide](./E2E_TESTING_GUIDE.md)
- [SQLITE_MIGRATION.md](./SQLITE_MIGRATION.md)

**Built with ❤️ by Hammurabi Coding Company**
