# HOLO-9 SQLite-First: Testing & Deployment Execution Guide

**Status:** Ready for Testing & Deployment  
**Last Updated:** 2026-06-08

---

## 🧪 Phase 1: Local Testing (Windows Development)

### Prerequisites Check

```powershell
# Check Node.js
node --version    # Should be v20+

# Check pnpm
pnpm --version    # Should be installed

# Check SQLite availability
npm list better-sqlite3
```

### Installation

```powershell
cd C:\hcc-straw\hcc-straw-baas
pnpm install
```

**Expected Output:**
```
✓ Installed dependencies
✓ Linked packages
✓ Ready for development
```

### Start Services (Individual Testing)

**Terminal 1: Auth Service**
```powershell
cd C:\hcc-straw\hcc-straw-baas\packages\auth-service
node index.ts
# Expected: Server listening on port 3001
```

**Terminal 2: Data Service**
```powershell
cd C:\hcc-straw\hcc-straw-baas\packages\data-service
node index.ts
# Expected: Server listening on port 3002
```

**Terminal 3: Billing Service**
```powershell
cd C:\hcc-straw\hcc-straw-baas\packages\billing-service
node index.ts
# Expected: Server listening on port 3003
```

**Terminal 4: Storage Service**
```powershell
cd C:\hcc-straw\hcc-straw-baas\packages\storage-service
node index.ts
# Expected: Server listening on port 3004
```

**Terminal 5: Analytics Service**
```powershell
cd C:\hcc-straw\hcc-straw-baas\packages\analytics-service
node index.ts
# Expected: Server listening on port 3005
```

---

## 🧪 Test Each Service

### 1. Auth Service (Port 3001)

**Register User:**
```powershell
$body = @{
    email = "admin@example.com"
    password = "SecurePass123!"
    tenant_id = "tenant-001"
    tenant_name = "Test Company"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Expected Response:
# {
#   "success": true,
#   "message": "User registered successfully",
#   "user": {
#     "id": "...",
#     "email": "admin@example.com",
#     "tenant_id": "tenant-001"
#   }
# }
```

**Login:**
```powershell
$body = @{
    email = "admin@example.com"
    password = "SecurePass123!"
    tenant_id = "tenant-001"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Token received: $($token.Substring(0, 20))..."
```

**Verify Token:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/me" `
  -Method GET `
  -Headers @{"Authorization" = "Bearer $token"}

# Expected: User payload
```

### 2. Data Service (Port 3002)

**Create Collection:**
```powershell
$body = @{
    name = "customers"
    schema = @{
        fields = @("name", "email", "phone")
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3002/collections" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-Tenant-ID" = "tenant-001"} `
  -Body $body

# Expected: Collection created with ID
```

**Insert Record:**
```powershell
$body = @{
    collection_id = "col-abc123"  # From previous response
    data = @{
        name = "John Doe"
        email = "john@example.com"
        phone = "555-1234"
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3002/records" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-Tenant-ID" = "tenant-001"} `
  -Body $body

# Expected: Record created with ID
```

**Query Records:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/records?collection_id=col-abc123&limit=10" `
  -Method GET `
  -Headers @{"X-Tenant-ID" = "tenant-001"}

# Expected: Array of records with pagination
```

### 3. Billing Service (Port 3003)

**Create Subscription:**
```powershell
$body = @{
    plan = "pro"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3003/subscriptions" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-Tenant-ID" = "tenant-001"} `
  -Body $body

# Expected: Subscription created
```

**Record Usage:**
```powershell
$body = @{
    metric_name = "api_calls"
    value = 150
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3003/usage/record" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-Tenant-ID" = "tenant-001"} `
  -Body $body

# Expected: Usage recorded
```

**Get Current Usage:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3003/usage/tenant-001" `
  -Method GET

# Expected: 
# {
#   "success": true,
#   "plan": "pro",
#   "usage": 150,
#   "base_cost": 29.99,
#   "usage_cost": "7.50",
#   "estimated_total": "37.49"
# }
```

**Generate Invoice:**
```powershell
$body = @{
    tenant_id = "tenant-001"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3003/invoices/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Expected: Invoice generated with ID and amount
```

### 4. Storage Service (Port 3004)

**Upload File:**
```powershell
# Create test file
"Hello, World!" | Out-File -FilePath "$env:TEMP\test.txt"

# Upload
$form = @{
    file = Get-Item "$env:TEMP\test.txt"
}

Invoke-WebRequest -Uri "http://localhost:3004/upload" `
  -Method POST `
  -Form $form `
  -Headers @{"X-Tenant-ID" = "tenant-001"}

# Expected: File stored with ID
```

**List Files:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3004/files" `
  -Method GET `
  -Headers @{"X-Tenant-ID" = "tenant-001"}

# Expected: Array of files
```

**Check Quota:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3004/quota" `
  -Method GET `
  -Headers @{"X-Tenant-ID" = "tenant-001"}

# Expected:
# {
#   "success": true,
#   "quota": {
#     "max_bytes": 10737418240,
#     "used_bytes": 13,
#     "available_bytes": 10737418227,
#     "file_count": 1,
#     "used_percent": "0.00"
#   }
# }
```

### 5. Analytics Service (Port 3005)

**Track Event:**
```powershell
$body = @{
    event_name = "user_signup"
    event_data = @{
        value = 1
        dimensions = @{
            source = "web"
            country = "US"
        }
    }
    user_id = "user-123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3005/events" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-Tenant-ID" = "tenant-001"} `
  -Body $body

# Expected: Event tracked
```

**Get Metrics:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3005/metrics" `
  -Method GET `
  -Headers @{"X-Tenant-ID" = "tenant-001"}

# Expected: Aggregated metrics
```

**Check Health:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3005/health" `
  -Method GET `
  -Headers @{"X-Tenant-ID" = "tenant-001"}

# Expected:
# {
#   "success": true,
#   "status": "healthy",
#   "events_tracked": 1,
#   "metrics_recorded": 1
# }
```

---

## 🗂️ Verify Databases Created

### Check `.data/` Directory

```powershell
Get-ChildItem -Path "C:\hcc-straw\hcc-straw-baas\.data\" -Recurse

# Expected output:
# auth.db          (5MB)
# data.db          (50MB+)
# billing.db       (2MB)
# storage.db       (1MB)
# analytics.db     (20MB)
```

### Check `.storage/` Directory

```powershell
Get-ChildItem -Path "C:\hcc-straw\hcc-straw-baas\.storage\" -Recurse

# Expected output:
# tenant-001/
#   └── abc123-test.txt
```

### Query Database Directly (Optional)

```powershell
# Install sqlite3 command line
choco install sqlite

# Query auth database
sqlite3 C:\hcc-straw\hcc-straw-baas\.data\auth.db ".tables"

# Expected: Should show: tenants users sessions audit_logs
```

---

## ✅ Local Testing Checklist

- [ ] Auth Service: User registration works
- [ ] Auth Service: Login returns JWT token
- [ ] Auth Service: Token verification works
- [ ] Data Service: Collection creation works
- [ ] Data Service: Record insertion works
- [ ] Data Service: Record querying works
- [ ] Billing Service: Subscription creation works
- [ ] Billing Service: Usage tracking works
- [ ] Billing Service: Invoice generation works
- [ ] Storage Service: File upload works
- [ ] Storage Service: File listing works
- [ ] Storage Service: Quota tracking works
- [ ] Analytics Service: Event tracking works
- [ ] Analytics Service: Metrics retrieval works
- [ ] Databases created in `.data/`
- [ ] Files stored in `.storage/`

---

## 📖 Next Steps: Production Deployment

**See:** `ZAP_HOSTING_DEPLOYMENT.md`

1. Provision Zap Hosting VPS
2. Install Node.js + pnpm
3. Clone repository
4. Configure environment
5. Start services with PM2
6. Setup Caddy reverse proxy
7. Enable HTTPS
8. Monitor with PM2

---

## 🆘 Troubleshooting

### Port Already in Use

```powershell
# Find process using port 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Kill process
Stop-Process -Id <PID> -Force
```

### Database Lock Error

```powershell
# SQLite WAL (Write-Ahead Logging) files
Remove-Item "C:\hcc-straw\hcc-straw-baas\.data\*.db-wal"
Remove-Item "C:\hcc-straw\hcc-straw-baas\.data\*.db-shm"
```

### Missing Dependencies

```powershell
cd C:\hcc-straw\hcc-straw-baas
pnpm install --force
```

### Check Service Logs

```powershell
# Windows Event Viewer
Get-EventLog -LogName Application -Source "Node.js" -Newest 10
```

---

## 📊 Performance Expectations

**Local Development (Windows):**
- Startup time: <1 second per service
- Response time: <50ms per request
- Database size: 80MB+ (depends on data)
- Memory per service: 50-100MB

**Production (Zap Hosting):**
- Startup time: <1 second per service
- Response time: <100ms per request
- Concurrent requests: 100+
- Monthly cost: ~$10

---

## 📝 Notes

1. **Multi-Tenant Isolation:** Always include `X-Tenant-ID` header in requests
2. **JWT Expiry:** Tokens expire after 24 hours
3. **Database Persistence:** All data survives restarts (no data loss)
4. **File Storage:** Stored locally in `.storage/tenant-id/` structure
5. **Automatic Migrations:** Schemas created automatically on first run

---

**Status:** ✅ Ready for Testing | ✅ Ready for Production Deployment

Next: Follow `ZAP_HOSTING_DEPLOYMENT.md` for Zap Hosting setup
