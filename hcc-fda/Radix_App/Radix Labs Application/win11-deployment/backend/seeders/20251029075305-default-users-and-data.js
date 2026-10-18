'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Seed accounts never ship with a known password. The operator supplies one
    // for this run only, and production refuses to seed these demo accounts
    // unless that is explicitly intended.
    const seedPassword = process.env.RADIX_SEED_PASSWORD;
    if (!seedPassword || seedPassword.length < 16) {
      throw new Error('Set RADIX_SEED_PASSWORD (at least 16 characters) for this seed run; there is no default password.');
    }
    if (process.env.NODE_ENV === 'production' && process.env.RADIX_ALLOW_SEED_USERS !== 'true') {
      throw new Error('Refusing to seed demo accounts in production. Create the first administrator explicitly, or set RADIX_ALLOW_SEED_USERS=true.');
    }
    const passwordHash = await require('bcryptjs').hash(seedPassword, 12);

    // Seed default users
    await queryInterface.bulkInsert('users', [{
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'admin@radixlabs.com',
      password: passwordHash,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
      department: 'it',
      is_active: true,
      is_email_verified: true,
      employee_id: 'ADMIN001',
      hire_date: new Date('2025-01-01'),
      created_at: new Date(),
      updated_at: new Date()
    }, {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'quality@radixlabs.com',
      password: passwordHash,
      first_name: 'Quality',
      last_name: 'Manager',
      role: 'quality_manager',
      department: 'quality',
      is_active: true,
      is_email_verified: true,
      employee_id: 'QM001',
      hire_date: new Date('2025-01-01'),
      created_at: new Date(),
      updated_at: new Date()
    }, {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'production@radixlabs.com',
      password: passwordHash,
      first_name: 'Production',
      last_name: 'Manager',
      role: 'production_manager',
      department: 'production',
      is_active: true,
      is_email_verified: true,
      employee_id: 'PM001',
      hire_date: new Date('2025-01-01'),
      created_at: new Date(),
      updated_at: new Date()
    }, {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'compliance@radixlabs.com',
      password: passwordHash,
      first_name: 'Compliance',
      last_name: 'Officer',
      role: 'compliance_manager',
      department: 'regulatory',
      is_active: true,
      is_email_verified: true,
      employee_id: 'CO001',
      hire_date: new Date('2025-01-01'),
      created_at: new Date(),
      updated_at: new Date()
    }, {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'technician@radixlabs.com',
      password: passwordHash,
      first_name: 'Lab',
      last_name: 'Technician',
      role: 'lab_technician',
      department: 'quality',
      is_active: true,
      is_email_verified: true,
      employee_id: 'LT001',
      hire_date: new Date('2025-01-01'),
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Seed sample documents
    await queryInterface.bulkInsert('documents', [{
      id: 'doc_training_sop_001',
      title: 'Good Manufacturing Practices Training',
      category: 'training',
      department: 'quality',
      version: '1.0',
      status: 'active',
      content_text: 'Comprehensive GMP training module covering pharmaceutical manufacturing standards.',
      compliance_standard: 'FDA 21 CFR Part 211',
      effective_date: new Date('2025-01-01'),
      owner_id: '550e8400-e29b-41d4-a716-446655440001',
      created_by: '550e8400-e29b-41d4-a716-446655440000',
      updated_by: '550e8400-e29b-41d4-a716-446655440000',
      created_at: new Date(),
      updated_at: new Date()
    }, {
      id: 'doc_sop_batch_record_001',
      title: 'Batch Record Documentation SOP',
      category: 'procedures',
      department: 'production',
      version: '2.1',
      status: 'active',
      content_text: 'Standard operating procedure for batch record documentation and review.',
      compliance_standard: 'FDA 21 CFR Part 11',
      effective_date: new Date('2025-01-01'),
      owner_id: '550e8400-e29b-41d4-a716-446655440002',
      created_by: '550e8400-e29b-41d4-a716-446655440000',
      updated_by: '550e8400-e29b-41d4-a716-446655440000',
      created_at: new Date(),
      updated_at: new Date()
    }, {
      id: 'doc_regulatory_fda_guidance_001',
      title: 'FDA Guidance on Data Integrity',
      category: 'regulatory',
      department: 'regulatory',
      version: '1.0',
      status: 'active',
      content_text: 'FDA guidance document on data integrity and compliance requirements.',
      compliance_standard: 'FDA Guidance for Industry',
      effective_date: new Date('2025-01-01'),
      owner_id: '550e8400-e29b-41d4-a716-446655440003',
      created_by: '550e8400-e29b-41d4-a716-446655440000',
      updated_by: '550e8400-e29b-41d4-a716-446655440000',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Seed training records
    await queryInterface.bulkInsert('training_records', [{
      id: '550e8400-e29b-41d4-a716-446655440010',
      user_id: '550e8400-e29b-41d4-a716-446655440004',
      document_id: 'doc_training_sop_001',
      training_date: new Date('2025-01-15'),
      completion_status: 'completed',
      score: 95,
      trainer_id: '550e8400-e29b-41d4-a716-446655440001',
      expiry_date: new Date('2026-01-15'),
      notes: 'Completed GMP training with excellent understanding of procedures.',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Seed sample production plans
    await queryInterface.bulkInsert('production_plans', [{
      id: '550e8400-e29b-41d4-a716-446655440020',
      productId: 1001,
      quantity: 1000,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-05'),
      priority: 1,
      productionLineId: 1,
      status: 'planned',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Seed sample work orders
    await queryInterface.bulkInsert('work_orders', [{
      id: '550e8400-e29b-41d4-a716-446655440030',
      workOrderNumber: 'WO-2025-001',
      productId: 1001,
      planId: '550e8400-e29b-41d4-a716-446655440020',
      quantity: 500,
      status: 'planned',
      priority: 1,
      productionLineId: 1,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-03'),
      notes: 'First batch of Product 1001 for Q1 production.',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Seed bill of materials
    await queryInterface.bulkInsert('bill_of_materials', [{
      id: '550e8400-e29b-41d4-a716-446655440040',
      productId: 1001,
      componentId: 2001,
      quantityRequired: 10.5,
      unitOfMeasure: 'kg',
      isActive: true,
      created_at: new Date(),
      updated_at: new Date()
    }, {
      id: '550e8400-e29b-41d4-a716-446655440041',
      productId: 1001,
      componentId: 2002,
      quantityRequired: 5.0,
      unitOfMeasure: 'L',
      isActive: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Seed regulatory submissions
    await queryInterface.bulkInsert('regulatory_submissions', [{
      id: '550e8400-e29b-41d4-a716-446655440050',
      productId: 1001,
      regulatoryBody: 'FDA',
      submissionType: 'NDA',
      submissionNumber: 'NDA-2025-001',
      submissionDate: new Date('2025-01-15'),
      expectedApprovalDate: new Date('2025-12-15'),
      status: 'under_review',
      notes: 'New Drug Application for Product 1001 submitted to FDA.',
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('regulatory_submissions', null, {});
    await queryInterface.bulkDelete('bill_of_materials', null, {});
    await queryInterface.bulkDelete('work_orders', null, {});
    await queryInterface.bulkDelete('production_plans', null, {});
    await queryInterface.bulkDelete('training_records', null, {});
    await queryInterface.bulkDelete('documents', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};