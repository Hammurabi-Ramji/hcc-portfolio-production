'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('regulatory_submissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      regulatoryBody: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      submissionType: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      submissionNumber: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      submissionDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      expectedApprovalDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('submitted', 'under_review', 'approved', 'rejected', 'withdrawn'),
        defaultValue: 'submitted',
        allowNull: false
      },
      approvalDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('regulatory_submissions');
  }
};