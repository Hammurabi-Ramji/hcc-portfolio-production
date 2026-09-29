# OpenClaw HCC Integration - Quick Reference Guide

**Last Updated**: May 24, 2026  
**Status**: ✅ Production Ready

---

## 🚀 Quick Start (2 minutes)

### 1. Configure Environment
```bash
cd C:\hcc-straw\openclaw-integration

# Edit .env with your API credentials
# You need to set these 6 variables:
# HCC_FDA_API_URL=http://localhost:3002/api
# HCC_FDA_TOKEN=your_token
# HCC_MANTLE_API_URL=http://localhost:3001/api
# HCC_MANTLE_TOKEN=your_token
# HCC_PHARMA_API_URL=http://localhost:3003/api
# HCC_PHARMA_TOKEN=your_token
```

### 2. Run Tests
```bash
node test-all-integrations.js
```

### 3. Start Integrations
```bash
node integrations/example-workflow.js
```

---

## 📖 Common Tasks

### Run FDA Monitoring Once
```javascript
const Controller = require('./integrations/integration-controller');
const controller = new Controller();

// Get compliance updates
const result = await controller.runIntegration('fda', 'monitor');
console.log(result);
```

### Schedule Daily Jobs
```javascript
const controller = new Controller();

controller.scheduleCompleteWorkflow({
  fdaSchedule: '0 */4 * * *',      // Every 4 hours
  mantleSchedule: '0 */6 * * *',   // Every 6 hours
  pharmaSchedule: '0 0 * * *',     // Daily at midnight
  suppliers: [
    {
      id: 'sup-001',
      name: 'Your Supplier',
      url: 'https://supplier.com/products',
      selectors: {
        container: '.product',
        sku: '.sku',
        product: '.name',
        price: '.price',
        availability: '.stock'
      }
    }
  ]
});
```

### Monitor Supplier Prices
```javascript
const result = await controller.runIntegration('mantle', 'monitor-prices', {
  suppliers: [
    {
      id: 'sup-001',
      name: 'Supplier Name',
      url: 'https://supplier.com/products',
      selectors: { /* ... */ }
    }
  ]
});

console.log('Price changes:', result);
```

### Generate Compliance Report
```javascript
const report = await controller.runIntegration('pharma', 'generate-report');
console.log('Report saved');
```

### Check System Health
```javascript
const health = await controller.healthCheck();
console.log(health);
// Output:
// {
//   timestamp: "2026-05-24T...",
//   integrations: {
//     fda: { status: 'healthy', itemsFound: 42 },
//     pharma: { status: 'healthy', itemsFound: 15 },
//     mantle: { status: 'configured', itemsFound: 0 }
//   }
// }
```

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to API"
```bash
# 1. Verify .env has correct URLs
grep HCC_FDA_API_URL .env

# 2. Check if local APIs are running
curl http://localhost:3002/api/health

# 3. Check logs for details
tail logs/controller-error.log
```

### Issue: "API token invalid"
```bash
# 1. Verify tokens are set in .env
grep HCC_FDA_TOKEN .env

# 2. Check token is correct in source system
# 3. Regenerate token if expired
# 4. Update .env and restart
```

### Issue: "No data being scraped"
```bash
# 1. Verify website URL is correct
# 2. Check CSS selectors match current site structure
# 3. Try scraping manually in browser console
# 4. Update selectors if site changed

# Test selectors:
const { scrapeSupplierPricing } = require('./integrations/hcc-mantle-integration');
const data = await scrapeSupplierPricing([{
  id: 'test',
  name: 'Test',
  url: 'https://your-site.com',
  selectors: {
    container: '.your-container-selector',
    sku: '.your-sku-selector',
    product: '.your-product-selector',
    price: '.your-price-selector',
    availability: '.your-availability-selector'
  }
}]);
console.log(data); // Should show scraped items
```

### Issue: "Job not running"
```bash
# 1. Check job status
const status = controller.getJobStatus();
console.log(status);

# 2. Verify cron expression is valid
# Examples:
# 0 * * * * = Every hour
# 0 0 * * * = Daily at midnight
# 0 */6 * * * = Every 6 hours
# 30 2 * * * = 2:30 AM daily

# 3. Check logs for errors
tail logs/controller-combined.log
```

### Issue: "Memory usage high"
```bash
# 1. Clear data directory of old files
rm data/compliance-report-*.json

# 2. Check for memory leaks in logs
grep -i "memory" logs/*.log

# 3. Restart the process
pm2 restart openclaw
```

---

## 📊 Monitoring

### View Logs
```bash
# Real-time FDA logs
tail -f logs/fda-combined.log

# Real-time errors
tail -f logs/*-error.log

# Search logs
grep "Failed" logs/mantle-combined.log

# Count errors by type
grep -c "Error" logs/controller-error.log
```

### Check Job Status
```javascript
const status = controller.getJobStatus();
console.log(JSON.stringify(status, null, 2));
```

### View Statistics
```javascript
const stats = controller.getSystemStats();
console.log(stats);
// {
//   jobs: { fda: { status: 'running', ... }, ... },
//   integrationStats: {
//     fda: { runs: 12, successes: 11, failures: 1, lastRun: '...' },
//     ...
//   },
//   uptime: 3600 (seconds)
// }
```

---

## ⚙️ Configuration

### Cron Expression Format
```
* * * * *
│ │ │ │ └─ Day of week (0-6, Sunday=0)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

### Common Schedules
| Schedule | Cron | Frequency |
|----------|------|-----------|
| Every hour | `0 * * * *` | 24x per day |
| Every 4 hours | `0 */4 * * *` | 6x per day |
| Every 6 hours | `0 */6 * * *` | 4x per day |
| Daily | `0 0 * * *` | 1x per day |
| Weekly | `0 0 * * 0` | 1x per week (Sunday) |
| Monthly | `0 0 1 * *` | 1x per month |

### Environment Variables
```bash
# Required
HCC_FDA_API_URL=http://localhost:3002/api
HCC_FDA_TOKEN=your_token

HCC_MANTLE_API_URL=http://localhost:3001/api
HCC_MANTLE_TOKEN=your_token

HCC_PHARMA_API_URL=http://localhost:3003/api
HCC_PHARMA_TOKEN=your_token

# Optional
LOG_LEVEL=info          # debug, info, warn, error
NODE_ENV=production     # development, production
```

---

## 🛠️ API Integration

### FDA Integration Methods
```javascript
// Scrape guidance documents
await controller.fda.scrapeFDAGuidance()

// Scrape warning letters
await controller.fda.scrapeFDAWarningLetters()

// Scrape updates
await controller.fda.scrapeRegulatoryUpdates()

// Monitor all + sync
await controller.fda.monitorComplianceUpdates()

// Sync to HCC-FDA
await controller.fda.syncToHCCFDA(documents, 'guidance')
```

### Mantle Integration Methods
```javascript
// Scrape supplier pricing
await controller.mantle.scrapeSupplierPricing(suppliers)

// Scrape material specs
await controller.mantle.scrapeFlooringSpecs(materialUrls)

// Update inventory
await controller.mantle.updateInventory(products)

// Monitor price changes
await controller.mantle.monitorPriceChanges(suppliers)

// Complete sync
await controller.mantle.completeInventorySync(suppliers)

// Sync materials
await controller.mantle.syncProjectMaterials(materials)
```

### Pharma Integration Methods
```javascript
// Scrape drug approvals
await controller.pharma.scrapeDrugApprovals()

// Scrape clinical trials
await controller.pharma.scrapeClinicalTrials('cancer')

// Scrape announcements
await controller.pharma.scrapeRegulatoryAnnouncements()

// Monitor compliance
await controller.pharma.monitorCompliance()

// Generate report
await controller.pharma.generateComplianceReport()

// Sync data
await controller.pharma.syncRegulatoryData(data, 'approvals')
```

---

## 📝 Data Formats

### FDA Document Format
```javascript
{
  title: string,
  url: string,
  source: 'FDA Official',
  scrapedAt: ISO8601 timestamp,
  type: 'Drug' | 'Device'
}
```

### Mantle Product Format
```javascript
{
  supplierId: string,
  supplierName: string,
  sku: string,
  productName: string,
  price: number,
  unit: string,
  availability: string,
  lastUpdated: ISO8601 timestamp
}
```

### Pharma Approval Format
```javascript
{
  drugName: string,
  activeIngredient: string,
  indication: string,
  applicant: string,
  approvalDate: string,
  approvalType: string,
  priority: string,
  status: 'Approved'
}
```

---

## 🚨 Error Handling

### All integrations handle:
- ✅ Network timeouts (retry with backoff)
- ✅ API errors (log and continue)
- ✅ Invalid data (validate and skip)
- ✅ Missing fields (filter and warn)
- ✅ Rate limiting (respect delays)
- ✅ Connection refused (backoff and retry)

### Error Recovery Examples
```javascript
// Single item failure doesn't stop job
const results = await sync([item1, item2, item3]);
// {
//   success: [{ item1 }, { item2 }],
//   failed: [{ item3, error: 'Invalid SKU' }]
// }

// Retry logic automatically handles transient failures
// First attempt fails → waits 1000ms → retries
// Second attempt fails → waits 2000ms → retries
// Third attempt fails → gives up, logs error

// Rate limiting prevents throttling
// API requests spaced 1-2 seconds apart automatically
```

---

## 📚 File Structure

```
openclaw-integration/
├── .env                                # Configuration (⚠️ edit this)
├── package.json                        # Dependencies
├── README.md                           # User guide
├── SETUP_COMPLETE.md                   # Setup info
├── AUDIT_AND_FIXES_REPORT.md           # Detailed audit
├── FIXES_SUMMARY.md                    # Quick summary
├── QUICK_REFERENCE.md                  # This file
│
├── integrations/
│   ├── hcc-fda-integration.js          # FDA scraper
│   ├── hcc-mantle-integration.js       # Mantle scraper
│   ├── hcc-pharma-integration.js       # Pharma scraper
│   ├── integration-controller.js       # Main controller
│   ├── example-workflow.js             # Usage example
│   └── README.md                       # Integration docs
│
├── data/                               # Scraped data storage
│   ├── previous-prices.json
│   └── compliance-report-*.json
│
├── logs/                               # Application logs
│   ├── fda-combined.log
│   ├── fda-error.log
│   ├── mantle-combined.log
│   ├── mantle-error.log
│   ├── pharma-combined.log
│   ├── pharma-error.log
│   ├── controller-combined.log
│   └── controller-error.log
│
└── test-all-integrations.js            # Test suite
```

---

## 🔐 Security Notes

### Token Management
- ✅ Tokens stored in .env (not in code)
- ✅ Never commit .env to version control
- ✅ Rotate tokens regularly
- ✅ Use strong random tokens

### Data Protection
- ❌ Currently stores data in plain JSON
- ⚠️ Don't store sensitive PII
- 📝 Consider encryption for production
- 🔒 Restrict file permissions on logs/

### API Communication
- ✅ Use HTTPS in production
- ✅ Validate all API responses
- ✅ Check token expiration
- ✅ Log all API interactions

---

## 🎯 Best Practices

1. **Use scheduling** - Don't run integrations manually in production
2. **Monitor logs** - Check logs daily for errors
3. **Test changes** - Run tests after any modifications
4. **Backup data** - Backup data/ directory daily
5. **Rotate tokens** - Update tokens every 90 days
6. **Update selectors** - If websites change, update CSS selectors
7. **Version control** - Keep configuration in git (except .env)
8. **Document custom** - Document any custom scrapers

---

## 📞 Support Resources

- **Detailed Audit**: See `AUDIT_AND_FIXES_REPORT.md`
- **Setup Guide**: See `README.md`
- **Examples**: See `integrations/example-workflow.js`
- **Tests**: Run `node test-all-integrations.js`
- **Logs**: Check `logs/` directory

---

**Status**: ✅ Production Ready  
**Last Updated**: May 24, 2026
