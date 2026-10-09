'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'quality_manager', 'compliance_manager', 'production_manager', 'lab_technician', 'auditor', 'regulatory_specialist', 'training_coordinator', 'customer_service', 'vendor_manager', 'hr_manager', 'finance_manager', 'it_admin', 'user'),
        allowNull: false,
        defaultValue: 'user'
      },
      department: {
        type: Sequelize.ENUM('quality', 'production', 'regulatory', 'training', 'customer_service', 'vendor_management', 'hr', 'finance', 'it', 'executive', 'research'),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      email_verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      lock_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      mfa_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      mfa_secret: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      profile_image: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      employee_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      hire_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      certifications: {
        type: Sequelize.JSON,
        defaultValue: [],
        allowNull: false
      },
      training_completed: {
        type: Sequelize.JSON,
        defaultValue: [],
        allowNull: false
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: {},
        allowNull: false
      },
      preferences: {
        type: Sequelize.JSON,
        defaultValue: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['email'], {
      unique: true
    });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['department']);
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['employee_id'], {
      unique: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};