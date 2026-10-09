'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      workOrderNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      planId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      componentId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      requiredQuantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      unitOfMeasure: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('planned', 'released', 'in_progress', 'completed', 'cancelled', 'on_hold'),
        defaultValue: 'planned',
        allowNull: false
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      productionLineId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      endDate: {
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
    await queryInterface.dropTable('work_orders');
  }
};