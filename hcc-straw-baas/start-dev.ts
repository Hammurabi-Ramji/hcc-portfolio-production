#!/usr/bin/env node

import authService from './packages/auth-service/index.ts';
import dataService from './packages/data-service/index.ts';
import billingService from './packages/billing-service/index.ts';
import storageService from './packages/storage-service/index.ts';
import analyticsService from './packages/analytics-service/index.ts';

// Start services on different ports
const services = [
  { app: authService, port: 3001, name: 'Auth Service' },
  { app: dataService, port: 3002, name: 'Data Service' },
  { app: billingService, port: 3003, name: 'Billing Service' },
  { app: storageService, port: 3004, name: 'Storage Service' },
  { app: analyticsService, port: 3005, name: 'Analytics Service' },
];

services.forEach(({ app, port, name }) => {
  app.listen(port, () => {
    console.log(`✓ ${name} listening on http://localhost:${port}`);
  });
});

console.log('\n🎉 All services started! Available at:');
console.log('  http://localhost:3001 - Auth Service');
console.log('  http://localhost:3002 - Data Service');
console.log('  http://localhost:3003 - Billing Service');
console.log('  http://localhost:3004 - Storage Service');
console.log('  http://localhost:3005 - Analytics Service');
console.log('\nDatabases created in: .data/');
console.log('Files stored in: .storage/');
