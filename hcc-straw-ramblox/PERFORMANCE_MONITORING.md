# Ramblox Performance Monitoring Guide

**Date:** May 24, 2026  
**Status:** 🟢 Monitoring Setup

---

## 📊 Performance Metrics to Monitor

### Core Metrics
- **API Response Times** - All endpoints
- **Database Query Performance** - SQLite operations
- **User Authentication Speed** - Login/register times
- **Game Creation Time** - CRUD operations
- **Analytics Tracking Latency** - Event recording

### Infrastructure Metrics
- **Server Uptime** - Availability percentage
- **Memory Usage** - RAM consumption
- **CPU Usage** - Processing load
- **Disk Space** - Database storage
- **Network Traffic** - Bandwidth usage

### User Experience Metrics
- **Page Load Times** - Frontend performance
- **Time to Interactive** - App responsiveness
- **Error Rates** - Failed requests
- **User Session Duration** - Engagement metrics

---

## 🔧 Monitoring Tools Setup

### 1. Vercel Analytics (Recommended)

**Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add analytics
vercel analytics enable
```

**What it tracks:**
- Page views
- Load times
- User geography
- Device types
- Error tracking

**Access:** https://vercel.com/dashboard

---

### 2. Uptime Monitoring

**Option A: UptimeRobot (Free)**
```
Monitor Type: HTTP
URL: https://your-staging-url.vercel.app/api
Port: 443
Method: GET
Check Every: 5 minutes
```

**Option B: Better Uptime**
- Free tier: 10 monitors
- 1-minute checks
- Custom alerts

**Option C: Self-hosted**
```yaml
# .github/workflows/health-check.yml
name: Health Check

on:
  schedule:
    - cron: '*/5 * * * *'

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Health Check
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-staging-url.vercel.app/api)
          if [ "$response" != "200" ]; then
            echo "Health check failed: $response"
            exit 1
          fi
```

---

### 3. Performance Profiling

**Browser DevTools:**
```
1. Open http://localhost:3000
2. Press F12
3. Go to Performance tab
4. Click "Record"
5. Interact with app
6. Stop recording
7. Analyze results
```

**Lighthouse (Built into Chrome):**
```
1. Open DevTools
2. Go to Lighthouse tab
3. Select all categories
4. Click "Generate Report"
```

---

### 4. Database Performance

**SQLite Monitoring:**
```sql
-- Check database size
SELECT page_count * page_size as database_size 
FROM pragma_page_count(), pragma_page_size();

-- Check query performance
EXPLAIN QUERY PLAN SELECT * FROM games WHERE creator_id = ?;

-- Check indexes
PRAGMA index_list(games);

-- Check table statistics
PRAGMA table_info(games);
```

**Performance Tips:**
- ✅ Use prepared statements (already implemented)
- ✅ Keep indexes updated
- ✅ Monitor database file size
- ✅ Enable WAL mode (already enabled)

---

### 5. API Performance

**Test Script:**
```bash
#!/bin/bash
# scripts/benchmark-api.sh

API_URL="http://localhost:3000/api"
ENDPOINTS=(
  "/api"
  "/api/auth/login"
  "/api/games"
  "/api/analytics"
  "/api/monetization"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo -n "Testing $endpoint: "
  start=$(date +%s%N)
  curl -s -o /dev/null -w "" "$API_URL$endpoint"
  end=$(date +%s%N)
  duration=$(( (end - start) / 1000000 ))
  echo "${duration}ms"
done
```

**Run:**
```bash
chmod +x scripts/benchmark-api.sh
./scripts/benchmark-api.sh
```

---

### 6. Error Tracking

**Option A: Vercel Error Tracking**
- Built into Vercel dashboard
- Automatic error collection
- Stack traces included

**Option B: Sentry**
```bash
npm install @sentry/nextjs

# Initialize in lib/sentry.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## 📈 Performance Baselines

### Expected Response Times
| Endpoint | Target | Acceptable | Critical |
|----------|--------|------------|----------|
| Health Check | < 10ms | < 50ms | > 100ms |
| User Login | < 100ms | < 500ms | > 1000ms |
| List Games | < 20ms | < 100ms | > 200ms |
| Track Event | < 5ms | < 20ms | > 50ms |
| Game CRUD | < 50ms | < 200ms | > 500ms |

### Expected Server Metrics
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| CPU Usage | < 30% | < 70% | > 90% |
| Memory Usage | < 50% | < 80% | > 95% |
| Disk Space | > 20% free | < 10% free | < 5% free |
| Uptime | > 99.9% | < 99% | < 95% |

---

## 🔄 Continuous Monitoring

### GitHub Actions Integration
```yaml
# .github/workflows/performance-monitor.yml
name: Performance Monitoring

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  performance-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run performance tests
        run: |
          # Start server
          pnpm dev &
          sleep 5
          
          # Run performance tests
          pnpm test:performance
          
          # Upload results
          upload-artifact --name performance-report --path ./output/performance-report.json
```

---

## 📝 Daily Monitoring Checklist

**Automated:**
- [x] Health check every 5 minutes
- [x] Error logging
- [x] Uptime monitoring
- [x] Performance metrics collection

**Manual (Daily):**
- [ ] Check Vercel dashboard
- [ ] Review error logs
- [ ] Monitor database size
- [ ] Check user feedback
- [ ] Review performance reports

---

## 🚨 Alert Configuration

### Email Alerts (Vercel)
1. Go to Vercel Dashboard
2. Select project
3. Go to Settings > Domains
4. Configure alerts:
   - Deploy failures
   - Runtime errors
   - Performance degradation

### Custom Alert Rules
```javascript
// scripts/monitor-alerts.js

const ALERT_THRESHOLDS = {
  responseTime: 1000,  // ms
  errorRate: 0.05,     // 5%
  memoryUsage: 80,     // %
  diskUsage: 90        // %
};

async function checkHealth() {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://your-staging-url.vercel.app/api');
    const duration = Date.now() - startTime;
    
    if (duration > ALERT_THRESHOLDS.responseTime) {
      sendAlert(`Response time: ${duration}ms exceeds threshold`);
    }
    
    if (response.status !== 200) {
      sendAlert(`HTTP status: ${response.status}`);
    }
    
  } catch (error) {
    sendAlert(`Health check failed: ${error.message}`);
  }
}

function sendAlert(message) {
  // Send to Slack, Email, or other notification
  console.error(`ALERT: ${message}`);
}
```

---

## 📊 Reporting

### Weekly Performance Report
Generate automatically with:
```bash
# scripts/generate-report.sh
#!/bin/bash

# Collect metrics
echo "Collecting performance data..."
echo "Response times:"
curl -s https://your-staging-url.vercel.app/api | jq '.'

# Format as markdown
cat > output/weekly-report.md << EOF
# Weekly Performance Report

Generated: $(date)

## Summary
- Response Time: [collect from tools]
- Error Rate: [collect from tools]
- Uptime: [collect from tools]

## Issues
[List any issues found]

## Recommendations
[List improvements needed]
EOF
```

---

## 🔍 Troubleshooting

### Slow API Response
1. Check database size
2. Verify indexes exist
3. Monitor concurrent connections
4. Check network latency

### High Memory Usage
1. Check for memory leaks
2. Monitor process heap
3. Optimize database queries
4. Consider scaling up

### High Error Rate
1. Review error logs
2. Check user inputs
3. Validate API responses
4. Monitor external dependencies

---

## 📞 Support

**Questions?** Check:
- [E2E Testing Guide](./E2E_TESTING_GUIDE.md)
- [Staging Deployment](./STAGING_DEPLOYMENT.md)
- [SQLite Migration](./SQLITE_MIGRATION.md)

**Built with ❤️ by Hammurabi Coding Company**
