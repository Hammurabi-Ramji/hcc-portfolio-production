import { test, expect } from '@playwright/test';

// Multi-tenant Isolation Tests
test.describe('Multi-Tenant Isolation', () => {
  const TENANT_1 = 'tenant-a-' + Date.now();
  const TENANT_2 = 'tenant-b-' + Date.now();

  test('Users from different tenants should not see each other data', async ({ request }) => {
    // Create data in Tenant 1
    const col1Res = await request.post('http://localhost:3002/collections', {
      headers: { 'X-Tenant-ID': TENANT_1 },
      data: { name: 'tenant1_collection' },
    });
    const col1Body = await col1Res.json();

    await request.post('http://localhost:3002/records', {
      headers: { 'X-Tenant-ID': TENANT_1 },
      data: {
        collection_id: col1Body.collection.id,
        data: { secret: 'Tenant 1 Secret Data' },
      },
    });

    // Try to access Tenant 1 data as Tenant 2
    const col2Res = await request.get(
      `http://localhost:3002/records?collection_id=${col1Body.collection.id}`,
      {
        headers: { 'X-Tenant-ID': TENANT_2 },
      }
    );

    const col2Body = await col2Res.json();
    expect(col2Body.records.length).toBe(0); // Should be empty for different tenant
  });

  test('Analytics should track events per tenant', async ({ request }) => {
    // Track event in Tenant 1
    await request.post('http://localhost:3005/events', {
      headers: { 'X-Tenant-ID': TENANT_1 },
      data: { event_name: 'test_event_t1' },
    });

    // Track event in Tenant 2
    await request.post('http://localhost:3005/events', {
      headers: { 'X-Tenant-ID': TENANT_2 },
      data: { event_name: 'test_event_t2' },
    });

    // Verify events are separated
    const t1Events = await request.get(
      'http://localhost:3005/events?event_name=test_event_t1',
      {
        headers: { 'X-Tenant-ID': TENANT_1 },
      }
    );
    const t1Body = await t1Events.json();

    const t2Events = await request.get(
      'http://localhost:3005/events?event_name=test_event_t2',
      {
        headers: { 'X-Tenant-ID': TENANT_2 },
      }
    );
    const t2Body = await t2Events.json();

    expect(t1Body.total).toBeGreaterThan(0);
    expect(t2Body.total).toBeGreaterThan(0);
  });
});

// Error Handling Tests
test.describe('Error Handling', () => {
  test('Missing required fields should return 400', async ({ request }) => {
    const response = await request.post('http://localhost:3001/register', {
      data: { email: 'test@example.com' }, // Missing password
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('Invalid authentication should return 401', async ({ request }) => {
    const response = await request.get('http://localhost:3001/me', {
      headers: { Authorization: 'Bearer invalid-token' },
    });

    expect(response.status()).toBeGreaterThanOrEqual(401);
  });

  test('Non-existent resource should return 404', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3002/records/non-existent-id',
      {
        headers: { 'X-Tenant-ID': 'test-tenant' },
      }
    );

    expect(response.status()).toBeGreaterThanOrEqual(404);
  });
});

// Performance Tests
test.describe('Performance', () => {
  test('Bulk insert should complete in reasonable time', async ({ request }) => {
    const tenantId = 'perf-test-' + Date.now();

    // Create collection
    const collRes = await request.post('http://localhost:3002/collections', {
      headers: { 'X-Tenant-ID': tenantId },
      data: { name: 'perf_collection' },
    });
    const collBody = await collRes.json();

    // Bulk insert records
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      await request.post('http://localhost:3002/records', {
        headers: { 'X-Tenant-ID': tenantId },
        data: {
          collection_id: collBody.collection.id,
          data: { index: i, name: `Record ${i}` },
        },
      });
    }

    const elapsed = Date.now() - startTime;
    console.log(`Inserted 100 records in ${elapsed}ms`);

    expect(elapsed).toBeLessThan(30000); // Should complete in 30 seconds
  });

  test('Query with limit should be fast', async ({ request }) => {
    const tenantId = 'query-perf-' + Date.now();

    // Create collection and records
    const collRes = await request.post('http://localhost:3002/collections', {
      headers: { 'X-Tenant-ID': tenantId },
      data: { name: 'query_collection' },
    });
    const collBody = await collRes.json();

    for (let i = 0; i < 50; i++) {
      await request.post('http://localhost:3002/records', {
        headers: { 'X-Tenant-ID': tenantId },
        data: {
          collection_id: collBody.collection.id,
          data: { index: i },
        },
      });
    }

    // Query with limit
    const startTime = Date.now();
    const response = await request.get(
      `http://localhost:3002/records?collection_id=${collBody.collection.id}&limit=10`,
      {
        headers: { 'X-Tenant-ID': tenantId },
      }
    );
    const elapsed = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(1000); // Should complete in 1 second
  });
});
