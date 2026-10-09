"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getResourceUtilization = exports.getProductionPlanning = exports.getInventoryStatus = exports.getDashboard = exports.generateReport = exports.createProductionPlan = void 0;
var _expressValidator = require("express-validator");
var _WorkOrder = require("../models/WorkOrder.js");
var _ProductionPlan = require("../models/ProductionPlan.js");
var _BillOfMaterials = require("../models/BillOfMaterials.js");
var _logger = require("../utils/logger.js");
var _database = require("../config/database.js");
/**
 * Get ERP dashboard overview
 * GET /api/v1/erp/dashboard
 */
const getDashboard = exports.getDashboard = [async (req, res) => {
  try {
    // Get key ERP metrics
    const metrics = await _database.sequelize.query(`
        SELECT
          COUNT(CASE WHEN status IN ('planned', 'released', 'in-progress') THEN 1 END) as active_work_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_work_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_work_orders,
          SUM(CASE WHEN status = 'completed' THEN completed_quantity ELSE 0 END) as total_produced_quantity,
          COUNT(DISTINCT plan_id) as active_production_plans
        FROM work_orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get recent work orders
    const recentWorkOrders = await _database.sequelize.query(`
        SELECT
          wo.*,
          pp.product_id,
          p.product_name
        FROM work_orders wo
        JOIN production_plans pp ON wo.plan_id = pp.id
        LEFT JOIN products p ON pp.product_id = p.id
        ORDER BY wo.created_at DESC
        LIMIT 10
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get production efficiency
    const efficiency = await _database.sequelize.query(`
        SELECT
          AVG(CASE WHEN required_quantity > 0 THEN (completed_quantity / required_quantity) * 100 ELSE 0 END) as avg_efficiency,
          SUM(completed_quantity) as total_completed,
          SUM(required_quantity) as total_required
        FROM work_orders
        WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`ERP dashboard data retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'ERP dashboard data retrieved successfully',
      data: {
        metrics: metrics[0],
        recentWorkOrders,
        efficiency: efficiency[0],
        generatedAt: new Date()
      }
    });
  } catch (error) {
    _logger.logger.error('Get ERP dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get production planning data
 * GET /api/v1/erp/production-planning
 */
const getProductionPlanning = exports.getProductionPlanning = [(0, _expressValidator.query)('startDate').optional().isISO8601(), (0, _expressValidator.query)('endDate').optional().isISO8601(), (0, _expressValidator.query)('status').optional().isIn(['draft', 'approved', 'in-progress', 'completed', 'cancelled']), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      startDate,
      endDate,
      status
    } = req.query;

    // Build where clause
    let whereClause = '';
    const replacements = [];
    if (startDate) {
      whereClause += ' AND pp.start_date >= ?';
      replacements.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND pp.end_date <= ?';
      replacements.push(endDate);
    }
    if (status) {
      whereClause += ' AND pp.status = ?';
      replacements.push(status);
    }

    // Get production plans with work orders
    const plans = await _database.sequelize.query(`
        SELECT
          pp.*,
          p.product_name,
          COUNT(wo.id) as work_order_count,
          SUM(wo.completed_quantity) as completed_quantity,
          SUM(wo.required_quantity) as total_required_quantity
        FROM production_plans pp
        LEFT JOIN products p ON pp.product_id = p.id
        LEFT JOIN work_orders wo ON pp.id = wo.plan_id
        WHERE 1=1 ${whereClause}
        GROUP BY pp.id, p.product_name
        ORDER BY pp.created_at DESC
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Production planning data retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Production planning data retrieved successfully',
      data: plans
    });
  } catch (error) {
    _logger.logger.error('Get production planning error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Create production plan
 * POST /api/v1/erp/production-plans
 */
const createProductionPlan = exports.createProductionPlan = [(0, _expressValidator.body)('productId').isInt({
  min: 1
}).withMessage('Valid product ID is required'), (0, _expressValidator.body)('quantity').isFloat({
  min: 0.01
}).withMessage('Quantity must be greater than 0'), (0, _expressValidator.body)('startDate').isISO8601().withMessage('Valid start date is required'), (0, _expressValidator.body)('endDate').isISO8601().withMessage('Valid end date is required'), (0, _expressValidator.body)('priority').optional().isIn(['low', 'medium', 'high', 'critical']), (0, _expressValidator.body)('notes').optional().isString(), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const planData = req.body;

    // Create production plan
    const [planId] = await _database.sequelize.query(`
        INSERT INTO production_plans (
          product_id, quantity, start_date, end_date,
          priority, status, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, NOW())
      `, {
      replacements: [planData.productId, planData.quantity, planData.startDate, planData.endDate, planData.priority || 'medium', planData.notes, req.user.id],
      type: _database.sequelize.QueryTypes.INSERT
    });
    _logger.logger.info(`Production plan created with ID: ${planId} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Production plan created successfully',
      data: {
        planId
      }
    });
  } catch (error) {
    _logger.logger.error('Create production plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get inventory status
 * GET /api/v1/erp/inventory
 */
const getInventoryStatus = exports.getInventoryStatus = [(0, _expressValidator.query)('productId').optional().isInt({
  min: 1
}), (0, _expressValidator.query)('lowStock').optional().isBoolean(), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      productId,
      lowStock
    } = req.query;

    // Build where clause
    let whereClause = '';
    const replacements = [];
    if (productId) {
      whereClause += ' AND product_id = ?';
      replacements.push(productId);
    }
    if (lowStock === 'true') {
      whereClause += ' AND quantity_on_hand <= reorder_point';
    }

    // Get inventory status (simplified - in real implementation would have an Inventory model)
    const inventory = await _database.sequelize.query(`
        SELECT
          product_id,
          product_name,
          quantity_on_hand,
          unit_of_measure,
          reorder_point,
          last_updated,
          CASE WHEN quantity_on_hand <= reorder_point THEN 'low_stock' ELSE 'in_stock' END as status
        FROM inventory
        WHERE 1=1 ${whereClause}
        ORDER BY product_name
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Inventory status retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Inventory status retrieved successfully',
      data: inventory
    });
  } catch (error) {
    _logger.logger.error('Get inventory status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get resource utilization
 * GET /api/v1/erp/resources/utilization
 */
const getResourceUtilization = exports.getResourceUtilization = [(0, _expressValidator.query)('startDate').optional().isISO8601(), (0, _expressValidator.query)('endDate').optional().isISO8601(), (0, _expressValidator.query)('resourceType').optional().isIn(['equipment', 'labor', 'materials']), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      startDate,
      endDate,
      resourceType
    } = req.query;

    // Get resource utilization data (simplified implementation)
    const utilization = await _database.sequelize.query(`
        SELECT
          'equipment' as resource_type,
          COUNT(DISTINCT equipment_id) as total_resources,
          COUNT(DISTINCT CASE WHEN status = 'in-use' THEN equipment_id END) as utilized_resources,
          ROUND(
            (COUNT(DISTINCT CASE WHEN status = 'in-use' THEN equipment_id END) /
             COUNT(DISTINCT equipment_id)) * 100, 2
          ) as utilization_percentage
        FROM equipment
        WHERE (? IS NULL OR created_at >= ?)
          AND (? IS NULL OR created_at <= ?)

        UNION ALL

        SELECT
          'work_orders' as resource_type,
          COUNT(*) as total_resources,
          COUNT(CASE WHEN status IN ('in-progress', 'completed') THEN 1 END) as utilized_resources,
          ROUND(
            (COUNT(CASE WHEN status IN ('in-progress', 'completed') THEN 1 END) /
             COUNT(*)) * 100, 2
          ) as utilization_percentage
        FROM work_orders
        WHERE (? IS NULL OR created_at >= ?)
          AND (? IS NULL OR created_at <= ?)
      `, {
      replacements: [startDate, startDate, endDate, endDate, startDate, startDate, endDate, endDate],
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Resource utilization data retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Resource utilization data retrieved successfully',
      data: utilization
    });
  } catch (error) {
    _logger.logger.error('Get resource utilization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Generate ERP reports
 * GET /api/v1/erp/reports/:reportType
 */
const generateReport = exports.generateReport = [(0, _expressValidator.param)('reportType').isIn(['production', 'inventory', 'quality', 'efficiency']).withMessage('Valid report type is required'), (0, _expressValidator.query)('startDate').optional().isISO8601(), (0, _expressValidator.query)('endDate').optional().isISO8601(), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      reportType
    } = req.params;
    const {
      startDate,
      endDate
    } = req.query;
    let reportData;
    switch (reportType) {
      case 'production':
        reportData = await _database.sequelize.query(`
            SELECT
              DATE(created_at) as date,
              COUNT(*) as work_orders_created,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as work_orders_completed,
              SUM(completed_quantity) as total_quantity_produced
            FROM work_orders
            WHERE (? IS NULL OR created_at >= ?)
              AND (? IS NULL OR created_at <= ?)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `, {
          replacements: [startDate, startDate, endDate, endDate],
          type: _database.sequelize.QueryTypes.SELECT
        });
        break;
      case 'inventory':
        reportData = await _database.sequelize.query(`
            SELECT
              product_name,
              quantity_on_hand,
              reorder_point,
              last_updated
            FROM inventory
            ORDER BY quantity_on_hand / reorder_point ASC
          `, {
          type: _database.sequelize.QueryTypes.SELECT
        });
        break;
      case 'quality':
        reportData = await _database.sequelize.query(`
            SELECT
              DATE(created_at) as date,
              COUNT(*) as tests_performed,
              COUNT(CASE WHEN status = 'passed' THEN 1 END) as tests_passed,
              COUNT(CASE WHEN status = 'failed' THEN 1 END) as tests_failed
            FROM quality_tests
            WHERE (? IS NULL OR created_at >= ?)
              AND (? IS NULL OR created_at <= ?)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `, {
          replacements: [startDate, startDate, endDate, endDate],
          type: _database.sequelize.QueryTypes.SELECT
        });
        break;
      case 'efficiency':
        reportData = await _database.sequelize.query(`
            SELECT
              DATE(created_at) as date,
              AVG(CASE WHEN required_quantity > 0 THEN (completed_quantity / required_quantity) * 100 ELSE 0 END) as avg_efficiency,
              SUM(completed_quantity) as total_produced,
              SUM(required_quantity) as total_required
            FROM work_orders
            WHERE status = 'completed'
              AND (? IS NULL OR created_at >= ?)
              AND (? IS NULL OR created_at <= ?)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `, {
          replacements: [startDate, startDate, endDate, endDate],
          type: _database.sequelize.QueryTypes.SELECT
        });
        break;
    }
    _logger.logger.info(`ERP report generated: ${reportType} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: `${reportType} report generated successfully`,
      data: {
        reportType,
        generatedAt: new Date(),
        dateRange: {
          startDate,
          endDate
        },
        data: reportData
      }
    });
  } catch (error) {
    _logger.logger.error('Generate ERP report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];