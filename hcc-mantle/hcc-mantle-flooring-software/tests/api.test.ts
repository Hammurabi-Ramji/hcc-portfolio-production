/**
 * HCC Mantle - Complete Test Suite
 * Unit Tests, Integration Tests, and End-to-End Tests
 * Uses Jest + Supertest + Prisma
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'test-secret-key';

// ============================================================================
// TEST SETUP & TEARDOWN
// ============================================================================

beforeAll(async () => {
  // Ensure test database is clean
  await prisma.user.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.project.deleteMany({});
  console.log('✓ Test database initialized');
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ============================================================================
// UNIT TESTS - Authentication
// ============================================================================

describe('Authentication Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123',
    firstName: 'Test',
    lastName: 'User',
    companyName: 'Test Company'
  };

  test('Register new user - Success', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/auth/register')
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(testUser.email);
  });

  test('Register with duplicate email - Fails', async () => {
    // Create first user
    await request('http://localhost:3001')
      .post('/api/auth/register')
      .send(testUser);

    // Try duplicate
    const response = await request('http://localhost:3001')
      .post('/api/auth/register')
      .send(testUser);

    expect(response.status).toBe(409);
    expect(response.body.error).toContain('exists');
  });

  test('Login with valid credentials - Success', async () => {
    // Register user
    await request('http://localhost:3001')
      .post('/api/auth/register')
      .send(testUser);

    // Login
    const response = await request('http://localhost:3001')
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(testUser.email);
  });

  test('Login with invalid password - Fails', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Invalid');
  });

  test('Login without email - Fails', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/auth/login')
      .send({
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('required');
  });
});

// ============================================================================
// UNIT TESTS - Customer Management
// ============================================================================

describe('Customer Management Tests', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // Register and login user
    const registerResponse = await request('http://localhost:3001')
      .post('/api/auth/register')
      .send({
        email: 'customer-test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'Manager',
        companyName: 'Test Company'
      });

    token = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  const testCustomer = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701'
  };

  test('Create customer - Success', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send(testCustomer);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(testCustomer.name);
    expect(response.body.data.email).toBe(testCustomer.email);
  });

  test('Get all customers - Success', async () => {
    const response = await request('http://localhost:3001')
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.count).toBeGreaterThan(0);
  });

  test('Update customer - Success', async () => {
    // Get customer ID
    const listResponse = await request('http://localhost:3001')
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`);

    const customerId = listResponse.body.data[0].id;

    const response = await request('http://localhost:3001')
      .put(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Jane Doe' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Jane Doe');
  });

  test('Delete customer - Success', async () => {
    // Get customer ID
    const listResponse = await request('http://localhost:3001')
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`);

    const customerId = listResponse.body.data[0].id;

    const response = await request('http://localhost:3001')
      .delete(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Unauthorized request - Fails', async () => {
    const response = await request('http://localhost:3001')
      .get('/api/customers')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(403);
  });
});

// ============================================================================
// UNIT TESTS - Project Management
// ============================================================================

describe('Project Management Tests', () => {
  let token: string;
  let userId: string;
  let customerId: string;

  beforeAll(async () => {
    // Register user
    const registerResponse = await request('http://localhost:3001')
      .post('/api/auth/register')
      .send({
        email: 'project-test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'Manager',
        companyName: 'Test Company'
      });

    token = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // Create customer
    const customerResponse = await request('http://localhost:3001')
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '555-1234'
      });

    customerId = customerResponse.body.data.id;
  });

  const testProject = {
    name: 'Kitchen Flooring Renovation',
    customerId: '',
    description: 'Complete kitchen flooring installation',
    address: '456 Oak Ave',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    squareFootage: 250,
    startDate: new Date().toISOString(),
    budget: 5000,
    flooringType: 'hardwood'
  };

  test('Create project - Success', async () => {
    const projectData = { ...testProject, customerId };

    const response = await request('http://localhost:3001')
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(testProject.name);
    expect(response.body.data.status).toBe('planning');
  });

  test('Get all projects - Success', async () => {
    const response = await request('http://localhost:3001')
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('Update project status - Success', async () => {
    // Get project
    const listResponse = await request('http://localhost:3001')
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    const projectId = listResponse.body.data[0].id;

    const response = await request('http://localhost:3001')
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('active');
  });

  test('Create project without customer - Fails', async () => {
    const projectData = { ...testProject, customerId: 'invalid-id' };

    const response = await request('http://localhost:3001')
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData);

    expect(response.status).toBe(500);
  });
});

// ============================================================================
// UNIT TESTS - Quoting System
// ============================================================================

describe('Quoting System Tests', () => {
  let token: string;
  let projectId: string;

  beforeAll(async () => {
    // Setup: Register user, create customer, create project
    const registerResponse = await request('http://localhost:3001')
      .post('/api/auth/register')
      .send({
        email: 'quote-test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'Manager',
        companyName: 'Test Company'
      });

    token = registerResponse.body.token;

    const customerResponse = await request('http://localhost:3001')
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Customer',
        email: 'customer@example.com'
      });

    const projectResponse = await request('http://localhost:3001')
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Project',
        customerId: customerResponse.body.data.id,
        squareFootage: 100
      });

    projectId = projectResponse.body.data.id;
  });

  test('Create quote with items - Success', async () => {
    const quoteData = {
      projectId,
      items: [
        { description: 'Hardwood Flooring', quantity: 100, unitPrice: 10 },
        { description: 'Installation Labor', quantity: 8, unitPrice: 50 }
      ],
      laborCost: 400,
      taxRate: 0.08
    };

    const response = await request('http://localhost:3001')
      .post('/api/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send(quoteData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items.length).toBe(2);
    expect(response.body.data.total).toBeGreaterThan(0);
  });

  test('Quote calculations are accurate - Success', async () => {
    const quoteData = {
      projectId,
      items: [
        { description: 'Material', quantity: 100, unitPrice: 10 } // $1000
      ],
      laborCost: 500,
      taxRate: 0.08
    };

    const response = await request('http://localhost:3001')
      .post('/api/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send(quoteData);

    const quote = response.body.data;
    const expectedSubtotal = 1000 + 500; // 1500
    const expectedTax = 1500 * 0.08; // 120
    const expectedTotal = 1500 + 120; // 1620

    expect(quote.materialCost).toBe(1000);
    expect(quote.laborCost).toBe(500);
    expect(quote.tax).toBeCloseTo(expectedTax, 2);
    expect(quote.total).toBeCloseTo(expectedTotal, 2);
  });
});

// ============================================================================
// UNIT TESTS - Inventory Management
// ============================================================================

describe('Inventory Management Tests', () => {
  let token: string;

  beforeAll(async () => {
    const registerResponse = await request('http://localhost:3001')
      .post('/api/auth/register')
      .send({
        email: 'inventory-test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'Manager',
        companyName: 'Test Company'
      });

    token = registerResponse.body.token;
  });

  const testItem = {
    name: 'Oak Hardwood Flooring',
    sku: 'OAK-001',
    category: 'Hardwood',
    quantity: 100,
    unitPrice: 8.99,
    reorderLevel: 20
  };

  test('Add inventory item - Success', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send(testItem);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.sku).toBe(testItem.sku);
    expect(response.body.data.quantity).toBe(testItem.quantity);
  });

  test('Get inventory - Success', async () => {
    const response = await request('http://localhost:3001')
      .get('/api/inventory')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('Update inventory quantity - Success', async () => {
    const listResponse = await request('http://localhost:3001')
      .get('/api/inventory')
      .set('Authorization', `Bearer ${token}`);

    const itemId = listResponse.body.data[0].id;

    const response = await request('http://localhost:3001')
      .patch(`/api/inventory/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 50 });

    expect(response.status).toBe(200);
    expect(response.body.data.quantity).toBe(50);
  });

  test('Duplicate SKU - Fails', async () => {
    // Add first item
    await request('http://localhost:3001')
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send(testItem);

    // Try duplicate SKU
    const response = await request('http://localhost:3001')
      .post('/api/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send(testItem);

    expect(response.status).toBe(500);
  });
});

// ============================================================================
// INTEGRATION TESTS - Full Workflow
// ============================================================================

describe('Full Workflow Integration Tests', () => {
  test('Complete project workflow - Success', async () => {
    // 1. Register user
    const registerResponse = await request('http://localhost:3001')
      .post('/api/auth/register')
      .send({
        email: 'workflow-test@example.com',
        password: 'TestPassword123',
        firstName: 'Workflow',
        lastName: 'Test',
        companyName: 'Workflow Company'
      });

    const token = registerResponse.body.token;
    expect(registerResponse.status).toBe(201);

    // 2. Create customer
    const customerResponse = await request('http://localhost:3001')
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Workflow Customer',
        email: 'customer@workflow.com',
        phone: '555-9999'
      });

    expect(customerResponse.status).toBe(201);
    const customerId = customerResponse.body.data.id;

    // 3. Create project
    const projectResponse = await request('http://localhost:3001')
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Workflow Project',
        customerId,
        squareFootage: 500,
        budget: 10000
      });

    expect(projectResponse.status).toBe(201);
    const projectId = projectResponse.body.data.id;

    // 4. Create quote
    const quoteResponse = await request('http://localhost:3001')
      .post('/api/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId,
        items: [
          { description: 'Premium Hardwood', quantity: 500, unitPrice: 15 }
        ],
        laborCost: 2000,
        taxRate: 0.08
      });

    expect(quoteResponse.status).toBe(201);
    expect(quoteResponse.body.data.total).toBeGreaterThan(0);

    // 5. Get analytics
    const analyticsResponse = await request('http://localhost:3001')
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.body.data.totalCustomers).toBeGreaterThan(0);
    expect(analyticsResponse.body.data.totalProjects).toBeGreaterThan(0);
  });
});

// ============================================================================
// ENDPOINT VALIDATION TESTS
// ============================================================================

describe('Endpoint Validation Tests', () => {
  test('Health check endpoint - Success', async () => {
    const response = await request('http://localhost:3001')
      .get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.database).toBe('connected');
  });

  test('Invalid endpoint - 404', async () => {
    const response = await request('http://localhost:3001')
      .get('/api/nonexistent');

    expect(response.status).toBe(404);
  });

  test('Missing authorization header - 401', async () => {
    const response = await request('http://localhost:3001')
      .get('/api/customers');

    expect(response.status).toBe(401);
  });

  test('Invalid JSON in request - 400', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/auth/login')
      .send('invalid json');

    expect(response.status).toBe(400);
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance Tests', () => {
  let token: string;

  beforeAll(async () => {
    const registerResponse = await request('http://localhost:3001')
      .post('/api/auth/register')
      .send({
        email: 'performance-test@example.com',
        password: 'TestPassword123',
        firstName: 'Perf',
        lastName: 'Test',
        companyName: 'Perf Company'
      });

    token = registerResponse.body.token;
  });

  test('API response time < 500ms', async () => {
    const startTime = Date.now();

    await request('http://localhost:3001')
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500);
  });

  test('Health check response time < 100ms', async () => {
    const startTime = Date.now();

    await request('http://localhost:3001')
      .get('/api/health');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100);
  });
});

export { };
