'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      version: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'archived', 'draft', 'review'),
        defaultValue: 'active',
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      file_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      checksum: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      content_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      compliance_standard: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      effective_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      review_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      owner_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_by: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(255),
        allowNull: true
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
    await queryInterface.addIndex('documents', ['category']);
    await queryInterface.addIndex('documents', ['department']);
    await queryInterface.addIndex('documents', ['status']);
    await queryInterface.addIndex('documents', ['effective_date']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('documents');
  }
};