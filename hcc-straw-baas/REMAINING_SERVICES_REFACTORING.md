# HOLO-9: Remaining Services Refactoring (6/11 Services)

**Status:** Roadmap for completion  
**Target:** 2 weeks  
**Services to Refactor:** Gateway, Workflow, Integration, Delivery, Core, Hosting

---

## 📋 Overview

| Service | Current | Lines | Endpoints | Priority | Effort |
|---------|---------|-------|-----------|----------|--------|
| **Gateway** | Stub (echo routing) | ~16 | Route proxying | 🔴 High | 3 days |
| **Workflow** | Stub (mock execution) | ~19 | DAG executor | 🔴 High | 4 days |
| **Integration** | Stub (hardcoded list) | ~13 | 3rd-party APIs | 🟠 Medium | 5 days |
| **Delivery** | Stub (webhook log) | ~15 | Queue + delivery | 🟠 Medium | 3 days |
| **Core** | Stub (health check) | ~19 | Orchestration | 🟠 Medium | 2 days |
| **Hosting** | Stub (mock endpoints) | ~29 | VPS deployment | 🟠 Medium | 4 days |

---

## 🔧 Gateway Service (Priority: 🔴 High)

**Current:** Echo routing only  
**Target:** Real request proxying  
**Effort:** 3 days | 150 lines

### Implementation Plan

```typescript
// packages/gateway-service/index.ts (NEW)

import { Hono } from 'hono';
import { proxy } from 'hono/proxy';

const app = new Hono();
const SERVICE_REGISTRY = {
  auth: 'http://localhost:3001',
  data: 'http://localhost:3002',
  billing: 'http://localhost:3003',
  storage: 'http://localhost:3004',
  analytics: 'http://localhost:3005',
};

// Route all /v1/{service}/* requests to appropriate backend
app.all('/v1/:service/*', async (c) => {
  const service = c.req.param('service');
  const path = c.req.path.replace(`/v1/${service}`, '');
  
  const backendUrl = SERVICE_REGISTRY[service];
  if (!backendUrl) {
    return c.json({ error: 'Service not found' }, 404);
  }

  // Proxy request with tenant header passthrough
  const tenantId = c.req.header('X-Tenant-ID');
  const headers = tenantId ? { 'X-Tenant-ID': tenantId } : {};

  return proxy(c, backendUrl + path, {
    headers,
    logging: true,
  });
});

// Health check
app.get('/health', (c) => c.json({
  status: 'healthy',
  services: Object.keys(SERVICE_REGISTRY)
}));

export default app;
```

### Database Schema
No database needed (pure proxy service)

### Endpoints
- `GET /v1/{service}/*` - Proxy to any service
- `POST /v1/{service}/*` - Proxy to any service
- `GET /health` - Service health

### Tests
```typescript
// Test proxying to auth service
await fetch('/v1/auth/me', {
  headers: { 'Authorization': 'Bearer ...' }
});

// Should return auth service response
```

---

## 🔄 Workflow Engine (Priority: 🔴 High)

**Current:** Mock execution  
**Target:** Real DAG execution  
**Effort:** 4 days | 300 lines

### Implementation Plan

```typescript
// packages/workflow-engine/index.ts (NEW)

import { Hono } from 'hono';
import { createServiceDB } from '../../shared/db/sqlite';

const app = new Hono();
const db = createServiceDB('workflow');

// Schema migration
db.migrate('./migrations/001-init.sql');

// DAG topological sort (from desktop app)
function toposort(edges) {
  // Implementation: topological sort of workflow nodes
}

// Execute workflow
app.post('/workflows/execute', async (c) => {
  const { definition, input, workflow_id } = await c.req.json();
  const tenantId = c.req.header('X-Tenant-ID');

  // Create execution record
  const executionId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO executions (id, tenant_id, workflow_id, definition_json, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(executionId, tenantId, workflow_id, JSON.stringify(definition), 'running');

  // Sort nodes by dependencies
  const sortedNodes = toposort(definition.edges);

  // Execute nodes sequentially
  let output = input;
  for (const node of sortedNodes) {
    try {
      output = await executeNode(node, output);
      
      // Log step
      db.prepare(`
        INSERT INTO execution_steps (execution_id, node_id, status, output_json)
        VALUES (?, ?, ?, ?)
      `).run(executionId, node.id, 'completed', JSON.stringify(output));
    } catch (error) {
      db.prepare(`
        UPDATE executions SET status = ? WHERE id = ?
      `).run('failed', executionId);
      
      return c.json({ error: error.message }, 500);
    }
  }

  // Mark complete
  db.prepare(`
    UPDATE executions SET status = ?, output_json = ? WHERE id = ?
  `).run('completed', JSON.stringify(output), executionId);

  return c.json({
    executionId,
    status: 'completed',
    output
  });
});

// Get execution status
app.get('/workflows/:id/status', (c) => {
  const tenantId = c.req.header('X-Tenant-ID');
  const executionId = c.req.param('id');

  const execution = db.prepare(`
    SELECT * FROM executions WHERE id = ? AND tenant_id = ?
  `).get(executionId, tenantId);

  if (!execution) return c.json({ error: 'Not found' }, 404);

  return c.json(execution);
});

export default app;
```

### Database Schema
```sql
-- workflows/migrations/001-init.sql (40 lines)
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  definition_json TEXT,
  status TEXT DEFAULT 'running',
  output_json TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY(workflow_id) REFERENCES workflows(id)
);

CREATE TABLE execution_steps (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  status TEXT,
  output_json TEXT,
  FOREIGN KEY(execution_id) REFERENCES executions(id)
);

CREATE INDEX idx_executions_tenant ON executions(tenant_id);
CREATE INDEX idx_executions_status ON executions(status);
```

### Endpoints
- `POST /workflows/execute` - Execute workflow DAG
- `GET /workflows/:id/status` - Get execution status
- `GET /workflows/:id/steps` - Get execution steps

---

## 🔌 Integration Hub (Priority: 🟠 Medium)

**Current:** Hardcoded list  
**Target:** Real API integrations  
**Effort:** 5 days | 250 lines

### Supported Integrations

1. **Stripe** - Payments
2. **Slack** - Notifications
3. **SendGrid** - Email
4. **OpenAI** - AI
5. **GitHub** - Source control

### Implementation Plan

```typescript
// Stripe Integration
const stripeAdapter = {
  async charge(amount: number, currency: string) {
    const stripe = require('stripe')(process.env.STRIPE_KEY);
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency
    });
  }
};

// Slack Integration
const slackAdapter = {
  async sendMessage(channel: string, message: string) {
    const slack = require('@slack/web-api').WebClient;
    const client = new slack(process.env.SLACK_TOKEN);
    return client.chat.postMessage({
      channel,
      text: message
    });
  }
};

// Database: Track API keys, webhooks, usage
db.prepare(`
  CREATE TABLE integrations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    config_json TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();
```

---

## 📦 Delivery Service (Priority: 🟠 Medium)

**Current:** Stub  
**Target:** Real queue + delivery  
**Effort:** 3 days | 200 lines

### Implementation Plan

```typescript
// Webhook delivery with retry logic
const deliverWebhook = async (webhook, payload) => {
  const maxRetries = 3;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': sign(payload, webhook.secret)
        },
        body: JSON.stringify(payload),
        timeout: 30000
      });

      if (response.ok) {
        db.prepare(`UPDATE deliveries SET status = ? WHERE id = ?`)
          .run('delivered', deliveryId);
        return;
      }
    } catch (error) {
      attempts++;
      if (attempts < maxRetries) {
        await sleep(2 ** attempts * 1000); // Exponential backoff
      }
    }
  }

  db.prepare(`UPDATE deliveries SET status = ? WHERE id = ?`)
    .run('failed', deliveryId);
};
```

---

## 🎯 Core Platform (Priority: 🟠 Medium)

**Current:** Health check only  
**Target:** Service orchestration  
**Effort:** 2 days | 150 lines

### Implementation Plan

```typescript
// Service registry + health monitoring
const monitorServices = async () => {
  const services = ['auth', 'data', 'billing', 'storage', 'analytics'];
  
  for (const service of services) {
    try {
      const response = await fetch(`http://localhost:300X/health`);
      const status = response.ok ? 'healthy' : 'unhealthy';
      
      db.prepare(`
        INSERT INTO service_health (service_name, status, checked_at)
        VALUES (?, ?, ?)
      `).run(service, status, new Date().toISOString());
    } catch (error) {
      // Service down
    }
  }
};

// Run every 30 seconds
setInterval(monitorServices, 30000);
```

---

## 🚀 Hosting Service (Priority: 🟠 Medium)

**Current:** Mock endpoints  
**Target:** Real Zap Hosting integration  
**Effort:** 4 days | 200 lines

### Implementation Plan

```typescript
// Zap Hosting API integration
const zapHosting = {
  async createServer(config) {
    // Call Zap Hosting API
    // Create VPS
    // Configure network
    // Return endpoint
  },

  async deployApp(serverId, appBundle) {
    // SCP files to server
    // Run installation script
    // Start PM2 services
    // Enable SSL
  },

  async getServerStatus(serverId) {
    // Check uptime
    // CPU/memory usage
    // Disk space
  }
};
```

---

## 📊 Refactoring Roadmap

### Week 1
- [ ] Day 1-3: Gateway Service (proxy + routing)
- [ ] Day 4-5: Start Workflow Engine (DAG setup)

### Week 2
- [ ] Day 6-9: Complete Workflow Engine (execution + steps)
- [ ] Day 10-12: Integration Hub (Stripe, Slack, etc.)

### Week 3
- [ ] Day 13-15: Delivery Service (queue + retry)
- [ ] Day 16-17: Core Platform (orchestration)
- [ ] Day 18-20: Hosting Service (Zap integration)

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test each service independently
describe('Gateway Service', () => {
  test('Proxies to auth service', async () => {
    const response = await gateway.post('/v1/auth/login', {
      email, password
    });
    expect(response.status).toBe(200);
  });
});
```

### Integration Tests
```typescript
// Test services communicating
describe('End-to-End Workflow', () => {
  test('Full workflow from auth to billing', async () => {
    1. Register user
    2. Create subscription
    3. Record usage
    4. Generate invoice
    5. Verify delivery
  });
});
```

### Performance Tests
```typescript
// Load testing
describe('Load Testing', () => {
  test('1000 concurrent requests', async () => {
    // Send 1000 requests
    // Measure response time
    // Verify no data loss
  });
});
```

---

## 📈 Metrics to Track

| Metric | Target | Measure |
|--------|--------|---------|
| **Response Time** | <100ms p95 | Load test |
| **Throughput** | 1000 RPS | Load test |
| **Error Rate** | <0.1% | Monitor logs |
| **Uptime** | 99.9% | PM2 logs |
| **DB Query Time** | <50ms | SQLite logs |

---

## ✅ Completion Checklist

### Gateway Service
- [ ] Create index.ts (150 lines)
- [ ] Implement HTTP proxying
- [ ] Add request header passthrough
- [ ] Add service registry
- [ ] Test with all 5 services

### Workflow Engine
- [ ] Create index.ts (300 lines)
- [ ] Create migration schema (40 lines)
- [ ] Implement DAG topological sort
- [ ] Implement node execution
- [ ] Add execution logging
- [ ] Test with various workflows

### Integration Hub
- [ ] Create index.ts (250 lines)
- [ ] Implement Stripe adapter
- [ ] Implement Slack adapter
- [ ] Implement SendGrid adapter
- [ ] Implement OpenAI adapter
- [ ] Add config encryption

### Delivery Service
- [ ] Create index.ts (200 lines)
- [ ] Implement webhook queue
- [ ] Add exponential backoff retry
- [ ] Implement signature verification
- [ ] Add delivery tracking

### Core Platform
- [ ] Create index.ts (150 lines)
- [ ] Implement health monitoring
- [ ] Add service registry
- [ ] Implement auto-restart logic

### Hosting Service
- [ ] Create index.ts (200 lines)
- [ ] Implement Zap Hosting API calls
- [ ] Add server provisioning
- [ ] Add app deployment
- [ ] Add SSL provisioning

---

## 📚 Resources

- [Hono.js Proxy](https://hono.dev/api/middleware/proxy)
- [DAG Topological Sort](https://en.wikipedia.org/wiki/Topological_sorting)
- [Webhook Best Practices](https://docs.stripe.com/webhooks)
- [Exponential Backoff](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

---

**Status:** ✅ Roadmap Ready | Implementation Scheduled | 2 weeks to completion

Next: Execute Week 1 plan (Gateway + Workflow starter)
