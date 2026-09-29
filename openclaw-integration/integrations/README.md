# OpenClaw HCC System Integration
## Complete Integration Documentation

**Version**: 1.0.0  
**Date**: May 24, 2026  
**Status**: ✅ Ready for Deployment

---

## 📋 Overview

This integration module connects **OpenClaw** (web scraping and automation) with **HCC systems**:

- **HCC-FDA** - Compliance document management
- **HCC-Mantle** - Flooring ERP system
- **HCC-Pharma** - Pharmaceutical regulatory system

---

## 🏗️ Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Controller                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   HCC-FDA    │  │  HCC-Mantle  │  │ HCC-Pharma   │     │
│  │ Integration  │  │ Integration  │  │ Integration  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ▲                ▲                    ▲              │
│         │                │                    │              │
│         └────────────────┴────────────────────┘              │
│                    OpenClaw                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 HCC-FDA Integration

### Features

✅ Scrape FDA guidance documents  
✅ Monitor FDA warning letters  
✅ Track regulatory updates  
✅ Auto-sync to HCC-FDA system  

### Usage

```javascript
const HCCFDAIntegration = require('./integrations/hcc-fda-integration');
const fda = new HCCFDAIntegration();

// Scrape guidance documents
const guidance = await fda.scrapeFDAGuidance();

// Scrape warning letters
const warnings = await fda.scrapeFDAWarningLetters();

// Monitor for updates
const updates = await fda.monitorComplianceUpdates();

// Sync to HCC-FDA
const syncResult = await fda.syncToHCCFDA(guidance, 'guidance');
```

### Configuration

```bash
# .env
HCC_FDA_API_URL=http://localhost:3002/api
HCC_FDA_TOKEN=your_token_here
```

---

## 🏗️ HCC-Mantle Integration

### Features

✅ Scrape supplier pricing  
✅ Monitor price changes  
✅ Update inventory automatically  
✅ Track flooring material specs  
✅ Sync materials to HCC-Mantle  

### Usage

```javascript
const HCCMantleIntegration = require('./integrations/hcc-mantle-integration');
const mantle = new HCCMantleIntegration();

// Define suppliers
const suppliers = [
  {
    id: 'sup-001',
    name: 'Flooring Direct',
    url: 'https://supplier.com/products',
    selectors: {
      container: '.product-item',
      sku: '.sku',
      product: '.product-name',
      price: '.price',
      availability: '.stock-status'
    }
  }
];

// Scrape pricing
const pricing = await mantle.scrapeSupplierPricing(suppliers);

// Update inventory
const updateResult = await mantle.updateInventory(pricing);

// Monitor price changes
const changes = await mantle.monitorPriceChanges(suppliers);

// Complete sync
const syncResult = await mantle.completeInventorySync(suppliers);
```

### Configuration

```bash
# .env
HCC_MANTLE_API_URL=http://localhost:3001/api
HCC_MANTLE_TOKEN=your_token_here
```

---

## 💊 HCC-Pharma Integration

### Features

✅ Scrape FDA drug approvals  
✅ Monitor clinical trials  
✅ Track regulatory announcements  
✅ Generate compliance reports  
✅ Create compliance notifications  

### Usage

```javascript
const HCCPharmaIntegration = require('./integrations/hcc-pharma-integration');
const pharma = new HCCPharmaIntegration();

// Scrape drug approvals
const approvals = await pharma.scrapeDrugApprovals();

// Scrape clinical trials
const trials = await pharma.scrapeClinicalTrials('cancer');

// Monitor compliance
const monitorResult = await pharma.monitorCompliance();

// Generate report
const report = await pharma.generateComplianceReport();
```

### Configuration

```bash
# .env
HCC_PHARMA_API_URL=http://localhost:3003/api
HCC_PHARMA_TOKEN=your_token_here
```

---

## 🎯 Integration Controller

### Start All Integrations

```javascript
const IntegrationController = require('./integrations/integration-controller');
const controller = new IntegrationController();

// Run all integrations once
const result = await controller.startAllIntegrations();
```

### Schedule Automatic Workflows

```javascript
// FDA: Every 4 hours
controller.scheduleFDAMonitoring('0 */4 * * *');

// Mantle: Every 6 hours
controller.scheduleMantleSync('0 */6 * * *', suppliers);

// Pharma: Daily at midnight
controller.schedulePharmaMonitoring('0 0 * * *');

// Or use complete workflow
controller.scheduleCompleteWorkflow({
  fdaSchedule: '0 */4 * * *',
  mantleSchedule: '0 */6 * * *',
  pharmaSchedule: '0 0 * * *',
  suppliers: [...] // supplier config
});
```

### Run Specific Integrations

```javascript
// FDA
await controller.runIntegration('fda', 'monitor');
await controller.runIntegration('fda', 'scrape-guidance');
await controller.runIntegration('fda', 'scrape-warnings');

// Mantle
await controller.runIntegration('mantle', 'sync-inventory', {
  suppliers: [...]
});
await controller.runIntegration('mantle', 'monitor-prices', {
  suppliers: [...]
});

// Pharma
await controller.runIntegration('pharma', 'monitor');
await controller.runIntegration('pharma', 'generate-report');
await controller.runIntegration('pharma', 'scrape-approvals');
```

### Health Check

```javascript
const health = await controller.healthCheck();
console.log(health);
// Output:
// {
//   timestamp: "2026-05-24T...",
//   integrations: {
//     fda: "healthy",
//     mantle: "configured",
//     pharma: "healthy"
//   }
// }
```

### Job Management

```javascript
// Get job status
const status = controller.getJobStatus();

// Stop all jobs
controller.stopAllJobs();
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd C:\hcc-straw\openclaw-integration
npm install
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API URLs and tokens
```

### 3. Run Integrations

```bash
# Run example workflow
node integrations/example-workflow.js

# This will:
# 1. Check health of all systems
# 2. Run individual integrations
# 3. Schedule automatic workflows
# 4. Display job status
```

---

## 📊 Data Flow

### FDA Integration Data Flow

```
FDA Website
    ↓
Scrape Guidance/Warnings
    ↓
Parse & Extract Data
    ↓
Validate & Format
    ↓
HCC-FDA API
    ↓
Store in HCC-FDA
```

### Mantle Integration Data Flow

```
Supplier Websites
    ↓
Scrape Pricing & Specs
    ↓
Parse Product Data
    ↓
Compare with Previous Prices
    ↓
HCC-Mantle API
    ↓
Update Inventory
```

### Pharma Integration Data Flow

```
FDA.gov, ClinicalTrials.gov
    ↓
Scrape Approvals/Trials
    ↓
Extract Regulatory Data
    ↓
Generate Report
    ↓
HCC-Pharma API
    ↓
Create Notifications
```

---

## ⏰ Scheduling

### Cron Expression Format

```
* * * * *
│ │ │ │ └─ Day of week (0-6, Sunday=0)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

### Examples

- `0 */4 * * *` - Every 4 hours
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 9 * * *` - Daily at 9 AM
- `0 0 * * 0` - Weekly on Sunday
- `0 0 1 * *` - Monthly on 1st

---

## 🔐 Security

### API Authentication

All integrations use Bearer token authentication:

```javascript
headers: {
  'Authorization': `Bearer ${process.env.HCC_SYSTEM_TOKEN}`
}
```

### Environment Variables

Store all sensitive data in `.env`:

```bash
HCC_FDA_API_URL=...
HCC_FDA_TOKEN=...
HCC_MANTLE_API_URL=...
HCC_MANTLE_TOKEN=...
HCC_PHARMA_API_URL=...
HCC_PHARMA_TOKEN=...
```

---

## 📊 Monitoring & Logging

All integrations include detailed logging:

```javascript
✓ Scraped 42 FDA guidance documents
✓ Updated: SKU-001
✗ Failed to sync: SKU-002
```

### Log Files

- `logs/fda-sync.log` - FDA integration logs
- `logs/mantle-sync.log` - Mantle integration logs
- `logs/pharma-sync.log` - Pharma integration logs

---

## 🐛 Troubleshooting

### Integration Not Running

```bash
# Check job status
const status = controller.getJobStatus();

# Check health
const health = await controller.healthCheck();
```

### API Connection Failed

1. Verify .env configuration
2. Check HCC system is running
3. Verify API token is valid
4. Check network connectivity

### Scraping Errors

1. Verify target website is accessible
2. Check CSS selectors are correct
3. Review selector configuration
4. Test with basic scraper first

---

## 📁 File Structure

```
integrations/
├── hcc-fda-integration.js           # FDA integration
├── hcc-mantle-integration.js        # Mantle integration
├── hcc-pharma-integration.js        # Pharma integration
├── integration-controller.js        # Master controller
├── example-workflow.js              # Usage example
└── README.md                        # This file
```

---

## 🎯 Use Cases

### 1. Regulatory Compliance Monitoring

```javascript
const controller = new IntegrationController();
controller.scheduleFDAMonitoring('0 */4 * * *');
// Automatically monitors FDA for updates every 4 hours
```

### 2. Supplier Price Monitoring

```javascript
const controller = new IntegrationController();
controller.scheduleMantleSync('0 */6 * * *', suppliers);
// Updates inventory and monitors prices every 6 hours
```

### 3. Pharmaceutical Compliance

```javascript
const controller = new IntegrationController();
controller.schedulePharmaMonitoring('0 0 * * *');
// Daily compliance report generation
```

### 4. Complete Automated Workflow

```javascript
const controller = new IntegrationController();
controller.scheduleCompleteWorkflow({
  fdaSchedule: '0 */4 * * *',
  mantleSchedule: '0 */6 * * *',
  pharmaSchedule: '0 0 * * *',
  suppliers: [...]
});
// All systems running on schedule
```

---

## 🔄 Continuous Integration

These integrations are designed to run 24/7:

- **FDA Monitoring**: Every 4 hours (6 times/day)
- **Mantle Sync**: Every 6 hours (4 times/day)
- **Pharma Monitoring**: Once daily (midnight)

---

## 📞 Support

For issues or questions:

1. Check integration logs
2. Run health check
3. Verify API configuration
4. Review selector configuration
5. Check target website availability

---

**Status**: ✅ **Integration Ready**  
**Date**: May 24, 2026  
**Version**: 1.0.0  

All HCC systems are now integrated with OpenClaw!
