/**
 * HOLO-9 Integration Tests
 * Test all services communicating together
 * Run: npm test (services must be running with the same JWT_SECRET)
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

// Test tenant and user
const TENANT_ID = 'test-' + Date.now();
const EMAIL = `user-${Date.now()}@example.com`;
const PASSWORD = 'TestPass123!long';
let authToken = '';

const authed = (extra: Record<string, string> = {}) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authToken}`,
  ...extra,
});

describe('Auth Service Integration', () => {
  test('Register User', async () => {
    const response = await fetch(`${SERVICES.auth}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        tenant_id: TENANT_ID,
        tenant_name: 'Test Org',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Registering into an existing tenant is refused', async () => {
    const response = await fetch(`${SERVICES.auth}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `intruder-${Date.now()}@example.com`,
        password: PASSWORD,
        tenant_id: TENANT_ID,
      }),
    });

    expect(response.status).toBe(409);
  });

  test('Login User', async () => {
    const response = await fetch(`${SERVICES.auth}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, tenant_id: TENANT_ID }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
    authToken = data.token;
  });
});

describe('Data Service Integration', () => {
  test('Create Collection', async () => {
    const response = await fetch(`${SERVICES.data}/collections`, {
      method: 'POST',
      headers: authed(),
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
      headers: authed(),
      body: JSON.stringify({ plan: 'pro' }),
    });

    expect([200, 201]).toContain(response.status);
  });
});

describe('Analytics Service Integration', () => {
  test('Track Event', async () => {
    const response = await fetch(`${SERVICES.analytics}/events`, {
      method: 'POST',
      headers: authed(),
      body: JSON.stringify({
        event_name: 'test_event',
        event_data: { value: 1 },
      }),
    });

    expect([200, 201]).toContain(response.status);
  });
});

describe('Multi-Tenant Isolation', () => {
  test('Requests without a session are rejected', async () => {
    const response = await fetch(`${SERVICES.data}/collections`, {
      headers: { 'X-Tenant-ID': TENANT_ID },
    });
    expect(response.status).toBe(401);
  });

  test('A session cannot claim another tenant', async () => {
    const response = await fetch(`${SERVICES.data}/collections`, {
      headers: authed({ 'X-Tenant-ID': 'other-tenant' }),
    });
    expect(response.status).toBe(403);
  });

  test('Billing path parameters are bound to the session tenant', async () => {
    const response = await fetch(`${SERVICES.billing}/subscriptions/other-tenant`, {
      headers: authed(),
    });
    expect(response.status).toBe(403);
  });

  test('Logout revokes the token for every service', async () => {
    const logout = await fetch(`${SERVICES.auth}/logout`, { method: 'POST', headers: authed() });
    expect(logout.status).toBe(200);
    const after = await fetch(`${SERVICES.data}/collections`, { headers: authed() });
    expect(after.status).toBe(401);
  });
});
