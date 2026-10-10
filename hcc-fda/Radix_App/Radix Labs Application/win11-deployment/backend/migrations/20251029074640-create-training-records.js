'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('training_records', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      document_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        references: {
          model: 'documents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      training_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      completion_status: {
        type: Sequelize.ENUM('completed', 'in_progress', 'failed', 'expired'),
        defaultValue: 'completed',
        allowNull: false
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
      },
      trainer_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      expiry_date: {
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

    // Add indexes
    await queryInterface.addIndex('training_records', ['user_id']);
    await queryInterface.addIndex('training_records', ['document_id']);
    await queryInterface.addIndex('training_records', ['completion_status']);
    await queryInterface.addIndex('training_records', ['expiry_date']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('training_records');
  }
};