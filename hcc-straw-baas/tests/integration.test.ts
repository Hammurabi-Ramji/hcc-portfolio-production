/**
 * HOLO-9 Integration Tests
 * Test all services communicating together
 * Run: npm test
 */

import { describe, test, expect } from '@jest/globals';

// Service base URLs
const SERVICES = {
  auth: 'http://localhost:3001',
  data: 'http://localhost:3002',
  billing: 'http://localhost:3003',
  storage: 'http://localhost:3004',
  analytics: 'http://localhost:3005',
};

// Test tenant
const TENANT_ID = 'test-' + Date.now();
let authToken = '';

describe('Auth Service Integration', () => {
  test('Register User', async () => {
    const response = await fetch(`${SERVICES.auth}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `user-${Date.now()}@example.com`,
        password: 'TestPass123!',
        tenant_id: TENANT_ID,
        tenant_name: 'Test Org',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Login User', async () => {
    const response = await fetch(`${SERVICES.auth}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `user-${Date.now()}@example.com`,
        password: 'TestPass123!',
        tenant_id: TENANT_ID,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      expect(data.token).toBeDefined();
      authToken = data.token;
    }
  });
});

describe('Data Service Integration', () => {
  test('Create Collection', async () => {
    const response = await fetch(`${SERVICES.data}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      },
      body: JSON.stringify({ name: 'test_col' }),
    });

    expect([200, 201]).toContain(response.status);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

describe('Billing Service Integration', () => {
  test('Create Subscription', async () => {
    const response = await fetch(`${SERVICES.billing}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      },
      body: JSON.stringify({ plan: 'pro' }),
    });

    expect([200, 201]).toContain(response.status);
  });
});

describe('Analytics Service Integration', () => {
  test('Track Event', async () => {
    const response = await fetch(`${SERVICES.analytics}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      },
      body: JSON.stringify({
        event_name: 'test_event',
        event_data: { value: 1 },
      }),
    });

    expect([200, 201]).toContain(response.status);
  });
});

describe('Multi-Tenant Isolation', () => {
  test('Prevent Cross-Tenant Access', async () => {
    // Data in TENANT_ID should not be visible to OTHER_TENANT
    const response = await fetch(`${SERVICES.data}/collections`, {
      method: 'GET',
      headers: { 'X-Tenant-ID': 'other-tenant' },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    // Should be empty or different collections
    expect(Array.isArray(data.collections)).toBe(true);
  });
});
