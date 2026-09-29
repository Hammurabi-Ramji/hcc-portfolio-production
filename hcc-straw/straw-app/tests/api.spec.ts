import { test, expect } from '@playwright/test';

// API Tests - Auth Service
test.describe('API - Auth Service (Port 3001)', () => {
  const BASE_URL = 'http://localhost:3001';
  const TENANT_ID = 'test-tenant-' + Date.now();

  test('POST /register - Register new user', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/register`, {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123!',
        tenant_id: TENANT_ID,
        tenant_name: 'Test Organization',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.email).toBeDefined();
  });

  test('POST /login - Authenticate user', async ({ request }) => {
    const email = `test-${Date.now()}@example.com`;
    
    // First register
    await request.post(`${BASE_URL}/register`, {
      data: {
        email,
        password: 'TestPass123!',
        tenant_id: TENANT_ID,
        tenant_name: 'Test Org',
      },
    });

    // Then login
    const response = await request.post(`${BASE_URL}/login`, {
      data: {
        email,
        password: 'TestPass123!',
        tenant_id: TENANT_ID,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
  });

  test('GET /me - Get current user', async ({ request }) => {
    const email = `test-${Date.now()}@example.com`;
    
    // Register and login
    await request.post(`${BASE_URL}/register`, {
      data: {
        email,
        password: 'TestPass123!',
        tenant_id: TENANT_ID,
        tenant_name: 'Test Org',
      },
    });

    const loginRes = await request.post(`${BASE_URL}/login`, {
      data: { email, password: 'TestPass123!', tenant_id: TENANT_ID },
    });

    const loginBody = await loginRes.json();
    const token = loginBody.token;

    // Get user info
    const response = await request.get(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user.email).toBe(email);
  });

  test('Error handling - Missing fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/register`, {
      data: { email: 'test@example.com' }, // Missing password
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

// API Tests - Data Service
test.describe('API - Data Service (Port 3002)', () => {
  const BASE_URL = 'http://localhost:3002';
  const TENANT_ID = 'test-tenant-' + Date.now();

  test('POST /collections - Create collection', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/collections`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: {
        name: 'test_collection',
        schema: { fields: ['id', 'name', 'email'] },
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.collection.id).toBeDefined();
  });

  test('POST /records - Insert record', async ({ request }) => {
    // Create collection first
    const collRes = await request.post(`${BASE_URL}/collections`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: { name: 'test_col_' + Date.now() },
    });
    const collBody = await collRes.json();
    const collectionId = collBody.collection.id;

    // Insert record
    const response = await request.post(`${BASE_URL}/records`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: {
        collection_id: collectionId,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.record.data.name).toBe('John Doe');
  });

  test('GET /records - Query records', async ({ request }) => {
    // Create collection and insert record
    const collRes = await request.post(`${BASE_URL}/collections`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: { name: 'test_col_' + Date.now() },
    });
    const collBody = await collRes.json();
    const collectionId = collBody.collection.id;

    await request.post(`${BASE_URL}/records`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: {
        collection_id: collectionId,
        data: { name: 'Test User' },
      },
    });

    // Query records
    const response = await request.get(
      `${BASE_URL}/records?collection_id=${collectionId}&limit=10`,
      {
        headers: { 'X-Tenant-ID': TENANT_ID },
      }
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.records)).toBe(true);
  });
});

// API Tests - Billing Service
test.describe('API - Billing Service (Port 3003)', () => {
  const BASE_URL = 'http://localhost:3003';
  const TENANT_ID = 'test-tenant-' + Date.now();

  test('POST /subscriptions - Create subscription', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/subscriptions`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: { plan: 'pro' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.subscription.plan).toBe('pro');
  });

  test('POST /usage/record - Record usage', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/usage/record`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: {
        metric_name: 'api_calls',
        value: 100,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /usage/:tenantId - Get usage', async ({ request }) => {
    // Record usage first
    await request.post(`${BASE_URL}/usage/record`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: { metric_name: 'api_calls', value: 50 },
    });

    // Get usage
    const response = await request.get(`${BASE_URL}/usage/${TENANT_ID}`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.usage).toBeGreaterThan(0);
  });
});

// API Tests - Storage Service
test.describe('API - Storage Service (Port 3004)', () => {
  const BASE_URL = 'http://localhost:3004';
  const TENANT_ID = 'test-tenant-' + Date.now();

  test('POST /upload - Upload file', async ({ request }) => {
    const formData = new FormData();
    const blob = new Blob(['test content'], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);

    const response = await request.post(`${BASE_URL}/upload`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: formData,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.file.id).toBeDefined();
  });

  test('GET /files - List files', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/files`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.files)).toBe(true);
  });

  test('GET /quota - Get storage quota', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/quota`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.quota.max_bytes).toBeDefined();
  });
});

// API Tests - Analytics Service
test.describe('API - Analytics Service (Port 3005)', () => {
  const BASE_URL = 'http://localhost:3005';
  const TENANT_ID = 'test-tenant-' + Date.now();

  test('POST /events - Track event', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/events`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: {
        event_name: 'test_event',
        event_data: { value: 1, category: 'test' },
        user_id: 'user-123',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /events - Query events', async ({ request }) => {
    // Track event first
    await request.post(`${BASE_URL}/events`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
      data: {
        event_name: 'test_event',
        event_data: { value: 1 },
      },
    });

    // Query events
    const response = await request.get(
      `${BASE_URL}/events?event_name=test_event&limit=10`,
      {
        headers: { 'X-Tenant-ID': TENANT_ID },
      }
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /health - Service health', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });
});

// Integration Tests
test.describe('Full Integration - End-to-End Flow', () => {
  test('Complete workflow: Register → Create Data → Track Event → Generate Invoice', async ({ request }) => {
    const tenantId = 'e2e-tenant-' + Date.now();

    // 1. Register user (Auth Service)
    const registerRes = await request.post('http://localhost:3001/register', {
      data: {
        email: `e2e-${Date.now()}@example.com`,
        password: 'E2EPass123!',
        tenant_id: tenantId,
        tenant_name: 'E2E Test Org',
      },
    });
    expect(registerRes.status()).toBe(200);

    // 2. Create subscription (Billing Service)
    const subRes = await request.post('http://localhost:3003/subscriptions', {
      headers: { 'X-Tenant-ID': tenantId },
      data: { plan: 'pro' },
    });
    expect(subRes.status()).toBe(200);

    // 3. Create collection (Data Service)
    const collRes = await request.post('http://localhost:3002/collections', {
      headers: { 'X-Tenant-ID': tenantId },
      data: { name: 'e2e_collection' },
    });
    expect(collRes.status()).toBe(200);
    const collBody = await collRes.json();

    // 4. Insert record (Data Service)
    const recRes = await request.post('http://localhost:3002/records', {
      headers: { 'X-Tenant-ID': tenantId },
      data: {
        collection_id: collBody.collection.id,
        data: { name: 'E2E Test Record' },
      },
    });
    expect(recRes.status()).toBe(200);

    // 5. Track event (Analytics Service)
    const eventRes = await request.post('http://localhost:3005/events', {
      headers: { 'X-Tenant-ID': tenantId },
      data: {
        event_name: 'e2e_test_event',
        event_data: { step: 'complete' },
      },
    });
    expect(eventRes.status()).toBe(200);

    // 6. Record usage (Billing Service)
    const usageRes = await request.post('http://localhost:3003/usage/record', {
      headers: { 'X-Tenant-ID': tenantId },
      data: { metric_name: 'api_calls', value: 5 },
    });
    expect(usageRes.status()).toBe(200);

    // 7. Generate invoice (Billing Service)
    const invoiceRes = await request.post('http://localhost:3003/invoices/generate', {
      data: { tenant_id: tenantId },
    });
    expect(invoiceRes.status()).toBe(200);
    const invoiceBody = await invoiceRes.json();
    expect(invoiceBody.invoice.amount).toBeDefined();
  });
});
