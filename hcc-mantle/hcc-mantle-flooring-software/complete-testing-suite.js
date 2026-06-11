/**
 * NORTHSTAR INSTALLATIONS - COMPLETE TESTING SUITE
 * Testing Framework: Jest + Supertest + Vitest
 * Coverage Target: 85%+ across all services
 */

// ═════════════════════════════════════════════════════════════════════════════
// backend/estimation-service/__tests__/estimation.test.js
// ═════════════════════════════════════════════════════════════════════════════

const request = require('supertest');
const app = require('../src/index');
const { sequelize } = require('../src/config/database');

describe('Estimation Service API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/estimations', () => {
    it('should create a new estimation', async () => {
      const res = await request(app)
        .post('/api/estimations')
        .set('Authorization', 'Bearer test_token')
        .send({
          customerId: 'customer-001',
          projectName: 'Oak Hardwood Installation',
          projectType: 'residential_new_construction',
          flooringType: 'hardwood_solid',
          materialGrade: 'standard',
          totalSquareFootage: 1500,
          address: '123 Main St',
          city: 'Madison',
          state: 'WI',
          zipCode: '53701'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('draft');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/estimations')
        .set('Authorization', 'Bearer test_token')
        .send({
          projectName: 'Test Project'
          // Missing required fields
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/estimations', () => {
    it('should return list of estimations with pagination', async () => {
      const res = await request(app)
        .get('/api/estimations?page=1&limit=25')
        .set('Authorization', 'Bearer test_token');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('estimations');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/estimations?status=completed')
        .set('Authorization', 'Bearer test_token');

      expect(res.statusCode).toBe(200);
      expect(res.body.estimations).toEqual(
        expect.arrayContaining(
          expect.each.arrayContaining([
            expect.objectContaining({ status: 'completed' })
          ])
        )
      );
    });
  });

  describe('POST /api/estimations/:id/calculate', () => {
    it('should calculate estimation and return grand total', async () => {
      const estimation = await sequelize.models.Estimation.create({
        customerId: 'customer-002',
        projectName: 'Vinyl Flooring',
        projectType: 'residential_renovation',
        flooringType: 'vinyl_plank',
        materialGrade: 'standard',
        totalSquareFootage: 1000,
        status: 'draft'
      });

      const res = await request(app)
        .post(`/api/estimations/${estimation.id}/calculate`)
        .set('Authorization', 'Bearer test_token');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('grandTotal');
      expect(res.body).toHaveProperty('lineItems');
      expect(res.body.status).toBe('completed');
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// backend/customer-service/__tests__/customer.test.js
// ═════════════════════════════════════════════════════════════════════════════

describe('Customer Service API', () => {
  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', 'Bearer test_token')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1-555-0100',
          customerType: 'residential'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.firstName).toBe('John');
      expect(res.body.status).toBe('active');
    });

    it('should reject duplicate email', async () => {
      const res1 = await request(app)
        .post('/api/customers')
        .set('Authorization', 'Bearer test_token')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1-555-0101'
        });

      const res2 = await request(app)
        .post('/api/customers')
        .set('Authorization', 'Bearer test_token')
        .send({
          firstName: 'Jane',
          lastName: 'Duplicate',
          email: 'jane@example.com',
          phone: '+1-555-0102'
        });

      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(400);
    });
  });

  describe('GET /api/customers', () => {
    it('should search customers', async () => {
      const res = await request(app)
        .get('/api/customers/search?q=john')
        .set('Authorization', 'Bearer test_token');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(expect.arrayContaining(
        expect.each.arrayContaining([
          expect.objectContaining({
            firstName: expect.stringContaining('John')
          })
        ])
      ));
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// backend/field-operations-service/__tests__/job.test.js
// ═════════════════════════════════════════════════════════════════════════════

describe('Field Operations Service - Jobs API', () => {
  describe('POST /api/jobs', () => {
    it('should create a new job', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', 'Bearer test_token')
        .send({
          projectName: 'Office Building Flooring',
          customerId: 'customer-003',
          projectType: 'commercial_new_construction',
          flooringType: 'vinyl_plank',
          totalSquareFootage: 5000,
          projectAddress: '500 Tech Park',
          city: 'San Jose',
          state: 'CA',
          zipCode: '95110',
          scheduledStartDate: '2025-06-01',
          priority: 'high'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('draft');
      expect(res.body.priority).toBe('high');
    });
  });

  describe('PATCH /api/jobs/:id/status', () => {
    it('should update job status to in_progress', async () => {
      const job = await sequelize.models.Job.create({
        projectName: 'Test Job',
        customerId: 'customer-004',
        projectType: 'residential_new_construction',
        flooringType: 'laminate',
        totalSquareFootage: 1200
      });

      const res = await request(app)
        .patch(`/api/jobs/${job.id}/status`)
        .set('Authorization', 'Bearer test_token')
        .send({ status: 'in_progress' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('in_progress');
      expect(res.body.actualStartDate).toBeTruthy();
    });

    it('should set warranty expiration when completed', async () => {
      const job = await sequelize.models.Job.create({
        projectName: 'Test Job 2',
        customerId: 'customer-005',
        projectType: 'residential_renovation',
        flooringType: 'tile_ceramic',
        totalSquareFootage: 800,
        status: 'in_progress'
      });

      const res = await request(app)
        .patch(`/api/jobs/${job.id}/status`)
        .set('Authorization', 'Bearer test_token')
        .send({ status: 'completed', notes: 'Job completed successfully' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.warrantyExpiresAt).toBeTruthy();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// frontend/__tests__/api.test.js
// ═════════════════════════════════════════════════════════════════════════════

import api from '../src/services/api';

describe('API Service', () => {
  it('should include authorization header', async () => {
    localStorage.setItem('auth_token', 'test_token_123');
    const config = api.defaults;
    expect(config.headers.Authorization).toBe('Bearer test_token_123');
  });

  it('should retry on 401 with refresh token', async () => {
    // Test token refresh logic
    const refreshed = await api.defaults.onResponseError({ response: { status: 401 } });
    expect(refreshed).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// jest.config.js - Root Jest Configuration
// ═════════════════════════════════════════════════════════════════════════════

module.exports = {
  projects: [
    {
      displayName: 'estimation-service',
      testEnvironment: 'node',
      rootDir: 'backend/estimation-service',
      testMatch: ['**/__tests__/**/*.test.js'],
      collectCoverageFrom: ['src/**/*.js'],
      coveragePathIgnorePatterns: ['/node_modules/', '/dist/']
    },
    {
      displayName: 'customer-service',
      testEnvironment: 'node',
      rootDir: 'backend/customer-service',
      testMatch: ['**/__tests__/**/*.test.js'],
      collectCoverageFrom: ['src/**/*.js']
    },
    {
      displayName: 'field-operations-service',
      testEnvironment: 'node',
      rootDir: 'backend/field-operations-service',
      testMatch: ['**/__tests__/**/*.test.js'],
      collectCoverageFrom: ['src/**/*.js']
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      rootDir: 'frontend',
      testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.test.jsx'],
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      }
    }
  ],
  collectCoverageFrom: [
    'backend/*/src/**/*.js',
    'frontend/src/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// package.json test scripts section
// ═════════════════════════════════════════════════════════════════════════════

const packageJsonTestScripts = {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:ci": "jest --ci --coverage --detectOpenHandles --forceExit",
  "test:estimation": "jest estimation-service",
  "test:customer": "jest customer-service",
  "test:frontend": "jest frontend"
};

// Export for documentation
module.exports = { packageJsonTestScripts };
