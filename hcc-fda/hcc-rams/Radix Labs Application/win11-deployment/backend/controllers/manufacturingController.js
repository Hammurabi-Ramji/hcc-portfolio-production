"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateWorkOrder = exports.recordBatchOperation = exports.getWorkOrders = exports.getWorkOrder = exports.getProductionMetrics = exports.deleteWorkOrder = exports.createWorkOrder = void 0;
var _expressValidator = require("express-validator");
var _sequelize = require("sequelize");
var _index = require("../models/index.js");
var _logger = require("../utils/logger.js");
var _database = require("../config/database.js");
// @desc    Get all work orders
// @route   GET /api/v1/manufacturing/work-orders
// @access  Private
const getWorkOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      productionLineId,
      startDate,
      endDate
    } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (productionLineId) where.productionLineId = productionLineId;
    if (startDate && endDate) {
      where.startDate = {
        [_sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    const {
      count,
      rows: workOrders
    } = await _index.WorkOrder.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [{
        model: _index.ProductionPlan,
        as: 'productionPlan',
        attributes: ['productId', 'quantity', 'startDate', 'endDate']
      }]
    });
    res.json({
      success: true,
      data: {
        workOrders,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    _logger.logger.error('Get work orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get single work order
// @route   GET /api/v1/manufacturing/work-orders/:id
// @access  Private
exports.getWorkOrders = getWorkOrders;
const getWorkOrder = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const workOrder = await _index.WorkOrder.findByPk(id, {
      include: [{
        model: _index.ProductionPlan,
        as: 'productionPlan',
        attributes: ['productId', 'quantity', 'startDate', 'endDate']
      }]
    });
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }
    res.json({
      success: true,
      data: {
        workOrder
      }
    });
  } catch (error) {
    _logger.logger.error('Get work order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Create work order
// @route   POST /api/v1/manufacturing/work-orders
// @access  Private
exports.getWorkOrder = getWorkOrder;
const createWorkOrder = exports.createWorkOrder = [
// Validation
(0, _expressValidator.body)('workOrderNumber').notEmpty().withMessage('Work order number is required'), (0, _expressValidator.body)('productId').isInt({
  min: 1
}).withMessage('Valid product ID is required'), (0, _expressValidator.body)('quantity').isInt({
  min: 1
}).withMessage('Quantity must be a positive integer'), (0, _expressValidator.body)('priority').optional().isInt({
  min: 1,
  max: 5
}).withMessage('Priority must be between 1 and 5'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      workOrderNumber,
      productId,
      planId,
      componentId,
      requiredQuantity,
      unitOfMeasure,
      quantity,
      priority = 1,
      productionLineId,
      startDate,
      endDate,
      notes
    } = req.body;

    // Check if work order number already exists
    const existingWorkOrder = await _index.WorkOrder.findOne({
      where: {
        workOrderNumber
      }
    });
    if (existingWorkOrder) {
      return res.status(409).json({
        success: false,
        message: 'Work order number already exists'
      });
    }
    const workOrder = await _index.WorkOrder.create({
      workOrderNumber,
      productId,
      planId,
      componentId,
      requiredQuantity,
      unitOfMeasure,
      quantity,
      priority,
      productionLineId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      notes
    });
    _logger.logger.info(`Work order created: ${workOrderNumber} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Work order created successfully',
      data: {
        workOrder
      }
    });
  } catch (error) {
    _logger.logger.error('Create work order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// @desc    Update work order
// @route   PUT /api/v1/manufacturing/work-orders/:id
// @access  Private
const updateWorkOrder = exports.updateWorkOrder = [
// Validation
(0, _expressValidator.body)('status').optional().isIn(['planned', 'released', 'in_progress', 'completed', 'cancelled', 'on_hold']).withMessage('Invalid status'), (0, _expressValidator.body)('priority').optional().isInt({
  min: 1,
  max: 5
}).withMessage('Priority must be between 1 and 5'), (0, _expressValidator.body)('quantity').optional().isInt({
  min: 1
}).withMessage('Quantity must be a positive integer'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      id
    } = req.params;
    const updateData = req.body;

    // Convert date strings to Date objects
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    const [updatedRowsCount] = await _index.WorkOrder.update(updateData, {
      where: {
        id
      }
    });
    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }
    const updatedWorkOrder = await _index.WorkOrder.findByPk(id);
    _logger.logger.info(`Work order updated: ${updatedWorkOrder.workOrderNumber} by user: ${req.user.email}`);
    res.json({
      success: true,
      message: 'Work order updated successfully',
      data: {
        workOrder: updatedWorkOrder
      }
    });
  } catch (error) {
    _logger.logger.error('Update work order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// @desc    Delete work order
// @route   DELETE /api/v1/manufacturing/work-orders/:id
// @access  Private
const deleteWorkOrder = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const deletedRowsCount = await _index.WorkOrder.destroy({
      where: {
        id
      }
    });
    if (deletedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }
    _logger.logger.info(`Work order deleted: ${id} by user: ${req.user.email}`);
    res.json({
      success: true,
      message: 'Work order deleted successfully'
    });
  } catch (error) {
    _logger.logger.error('Delete work order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get production metrics
// @route   GET /api/v1/manufacturing/metrics
// @access  Private
exports.deleteWorkOrder = deleteWorkOrder;
const getProductionMetrics = async (req, res) => {
  try {
    const {
      startDate,
      endDate
    } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.created_at = {
        [_sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get work order statistics
    const totalWorkOrders = await _index.WorkOrder.count({
      where: dateFilter
    });
    const statusCounts = await _index.WorkOrder.findAll({
      where: dateFilter,
      attributes: ['status', [_database.sequelize.fn('COUNT', _database.sequelize.col('status')), 'count']],
      group: ['status'],
      raw: true
    });

    // Get production plan statistics
    const totalPlans = await _index.ProductionPlan.count({
      where: dateFilter
    });
    const planStatusCounts = await _index.ProductionPlan.findAll({
      where: dateFilter,
      attributes: ['status', [_database.sequelize.fn('COUNT', _database.sequelize.col('status')), 'count']],
      group: ['status'],
      raw: true
    });

    // Calculate efficiency metrics (simplified)
    const completedWorkOrders = await _index.WorkOrder.count({
      where: {
        ...dateFilter,
        status: 'completed'
      }
    });
    const efficiency = totalWorkOrders > 0 ? completedWorkOrders / totalWorkOrders * 100 : 0;
    res.json({
      success: true,
      data: {
        workOrders: {
          total: totalWorkOrders,
          byStatus: statusCounts,
          completed: completedWorkOrders
        },
        productionPlans: {
          total: totalPlans,
          byStatus: planStatusCounts
        },
        efficiency: {
          rate: Math.round(efficiency * 100) / 100,
          completed: completedWorkOrders,
          total: totalWorkOrders
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });
  } catch (error) {
    _logger.logger.error('Get production metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Record batch operation
// @route   POST /api/v1/manufacturing/batch-operations
// @access  Private
exports.getProductionMetrics = getProductionMetrics;
const recordBatchOperation = exports.recordBatchOperation = [
// Validation
(0, _expressValidator.body)('workOrderId').notEmpty().withMessage('Work order ID is required'), (0, _expressValidator.body)('operation').notEmpty().withMessage('Operation description is required'), (0, _expressValidator.body)('quantity').isInt({
  min: 0
}).withMessage('Quantity must be a non-negative integer'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      workOrderId,
      operation,
      quantity,
      notes,
      equipmentId,
      operatorId,
      startTime,
      endTime
    } = req.body;

    // Verify work order exists
    const workOrder = await _index.WorkOrder.findByPk(workOrderId);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // In a real implementation, you'd create a BatchOperation model
    // For now, we'll just log the operation and update work order status if needed
    const batchOperation = {
      id: `batch_${Date.now()}`,
      workOrderId,
      operation,
      quantity,
      notes,
      equipmentId,
      operatorId,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : null,
      recordedBy: req.user.id,
      recordedAt: new Date()
    };

    // If this completes the work order, update status
    if (operation.toLowerCase().includes('complete') && quantity >= workOrder.quantity) {
      await _index.WorkOrder.update({
        status: 'completed',
        endDate: new Date()
      }, {
        where: {
          id: workOrderId
        }
      });
    }
    _logger.logger.info(`Batch operation recorded for work order: ${workOrder.workOrderNumber} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Batch operation recorded successfully',
      data: {
        batchOperation
      }
    });
  } catch (error) {
    _logger.logger.error('Record batch operation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];