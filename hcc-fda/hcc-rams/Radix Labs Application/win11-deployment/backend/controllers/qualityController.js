"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateQualityTestResults = exports.releaseBatch = exports.getQualityTests = exports.getQualityDashboard = exports.getBatchReleaseHistory = exports.createQualityTest = void 0;
var _expressValidator = require("express-validator");
var _WorkOrder = require("../models/WorkOrder.js");
var _ProductionPlan = require("../models/ProductionPlan.js");
var _BillOfMaterials = require("../models/BillOfMaterials.js");
var _RegulatorySubmission = require("../models/RegulatorySubmission.js");
var _TrainingRecord = require("../models/TrainingRecord.js");
var _logger = require("../utils/logger.js");
var _database = require("../config/database.js");
/**
 * Get quality control tests for a work order
 * GET /api/v1/quality/work-orders/:workOrderId/tests
 */
const getQualityTests = exports.getQualityTests = [(0, _expressValidator.param)('workOrderId').isInt({
  min: 1
}).withMessage('Valid work order ID is required'), (0, _expressValidator.query)('status').optional().isIn(['pending', 'in-progress', 'completed', 'failed']), (0, _expressValidator.query)('testType').optional().isIn(['chemical', 'microbiological', 'physical', 'stability', 'release']), async (req, res) => {
  try {
    var _workOrder$production;
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      workOrderId
    } = req.params;
    const {
      status,
      testType
    } = req.query;

    // Get work order details
    const workOrder = await _WorkOrder.WorkOrder.findByPk(workOrderId, {
      include: [{
        model: _ProductionPlan.ProductionPlan,
        as: 'productionPlan',
        include: ['product']
      }]
    });
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Build where clause for quality tests
    const whereClause = {
      workOrderId
    };
    if (status) whereClause.status = status;
    if (testType) whereClause.testType = testType;

    // Get quality tests (simplified - in real implementation would have a QualityTest model)
    const qualityTests = await _database.sequelize.query(`
        SELECT * FROM quality_tests
        WHERE work_order_id = ?
        ${status ? 'AND status = ?' : ''}
        ${testType ? 'AND test_type = ?' : ''}
        ORDER BY created_at DESC
      `, {
      replacements: [workOrderId, ...(status ? [status] : []), ...(testType ? [testType] : [])],
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Quality tests retrieved for work order: ${workOrder.workOrderNumber} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Quality tests retrieved successfully',
      data: {
        workOrder: {
          id: workOrder.id,
          workOrderNumber: workOrder.workOrderNumber,
          status: workOrder.status,
          product: (_workOrder$production = workOrder.productionPlan) === null || _workOrder$production === void 0 ? void 0 : _workOrder$production.product
        },
        tests: qualityTests
      }
    });
  } catch (error) {
    _logger.logger.error('Get quality tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Create a quality control test
 * POST /api/v1/quality/tests
 */
const createQualityTest = exports.createQualityTest = [(0, _expressValidator.body)('workOrderId').isInt({
  min: 1
}).withMessage('Valid work order ID is required'), (0, _expressValidator.body)('testType').isIn(['chemical', 'microbiological', 'physical', 'stability', 'release']).withMessage('Valid test type is required'), (0, _expressValidator.body)('testName').isString().notEmpty().withMessage('Test name is required'), (0, _expressValidator.body)('specification').isString().notEmpty().withMessage('Test specification is required'), (0, _expressValidator.body)('sampleId').isString().notEmpty().withMessage('Sample ID is required'), (0, _expressValidator.body)('batchNumber').isString().notEmpty().withMessage('Batch number is required'), (0, _expressValidator.body)('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'), (0, _expressValidator.body)('priority').optional().isIn(['low', 'medium', 'high', 'critical']), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const testData = req.body;

    // Verify work order exists
    const workOrder = await _WorkOrder.WorkOrder.findByPk(testData.workOrderId);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Create quality test (simplified - in real implementation would use a QualityTest model)
    const [testId] = await _database.sequelize.query(`
        INSERT INTO quality_tests (
          work_order_id, test_type, test_name, specification,
          sample_id, batch_number, scheduled_date, priority,
          status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
      `, {
      replacements: [testData.workOrderId, testData.testType, testData.testName, testData.specification, testData.sampleId, testData.batchNumber, testData.scheduledDate, testData.priority || 'medium', req.user.id],
      type: _database.sequelize.QueryTypes.INSERT
    });
    _logger.logger.info(`Quality test created for work order: ${workOrder.workOrderNumber} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Quality test created successfully',
      data: {
        testId
      }
    });
  } catch (error) {
    _logger.logger.error('Create quality test error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Update quality test results
 * PUT /api/v1/quality/tests/:testId/results
 */
const updateQualityTestResults = exports.updateQualityTestResults = [(0, _expressValidator.param)('testId').isInt({
  min: 1
}).withMessage('Valid test ID is required'), (0, _expressValidator.body)('result').isString().notEmpty().withMessage('Test result is required'), (0, _expressValidator.body)('value').optional(), (0, _expressValidator.body)('unit').optional().isString(), (0, _expressValidator.body)('status').isIn(['completed', 'failed']).withMessage('Valid status is required'), (0, _expressValidator.body)('comments').optional().isString(), (0, _expressValidator.body)('testedBy').isInt({
  min: 1
}).withMessage('Valid tester ID is required'), (0, _expressValidator.body)('testedDate').isISO8601().withMessage('Valid test date is required'), async (req, res) => {
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
      testId
    } = req.params;
    const resultData = req.body;

    // Update test results (simplified - in real implementation would use a QualityTest model)
    await _database.sequelize.query(`
        UPDATE quality_tests
        SET
          result = ?,
          value = ?,
          unit = ?,
          status = ?,
          comments = ?,
          tested_by = ?,
          tested_date = ?,
          updated_at = NOW()
        WHERE id = ?
      `, {
      replacements: [resultData.result, resultData.value, resultData.unit, resultData.status, resultData.comments, resultData.testedBy, resultData.testedDate, testId],
      type: _database.sequelize.QueryTypes.UPDATE
    });
    _logger.logger.info(`Quality test results updated for test ID: ${testId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Quality test results updated successfully'
    });
  } catch (error) {
    _logger.logger.error('Update quality test results error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Release batch for distribution
 * POST /api/v1/quality/batches/:batchId/release
 */
const releaseBatch = exports.releaseBatch = [(0, _expressValidator.param)('batchId').isString().notEmpty().withMessage('Batch ID is required'), (0, _expressValidator.body)('workOrderId').isInt({
  min: 1
}).withMessage('Valid work order ID is required'), (0, _expressValidator.body)('releaseType').isIn(['full', 'partial']).withMessage('Valid release type is required'), (0, _expressValidator.body)('quantity').isFloat({
  min: 0.01
}).withMessage('Release quantity must be greater than 0'), (0, _expressValidator.body)('unitOfMeasure').isString().notEmpty().withMessage('Unit of measure is required'), (0, _expressValidator.body)('approvedBy').isInt({
  min: 1
}).withMessage('Valid approver ID is required'), (0, _expressValidator.body)('releaseNotes').optional().isString(), (0, _expressValidator.body)('certificateOfAnalysis').optional().isString(), async (req, res) => {
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
      batchId
    } = req.params;
    const releaseData = req.body;

    // Verify work order exists and is completed
    const workOrder = await _WorkOrder.WorkOrder.findByPk(releaseData.workOrderId);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }
    if (workOrder.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Work order must be completed before batch release'
      });
    }

    // Check if all quality tests are passed
    const failedTests = await _database.sequelize.query(`
        SELECT COUNT(*) as failed_count
        FROM quality_tests
        WHERE work_order_id = ? AND status = 'failed'
      `, {
      replacements: [releaseData.workOrderId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    if (failedTests[0].failed_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot release batch with failed quality tests'
      });
    }

    // Create batch release record
    const [releaseId] = await _database.sequelize.query(`
        INSERT INTO batch_releases (
          batch_id, work_order_id, release_type, quantity,
          unit_of_measure, approved_by, release_date,
          release_notes, certificate_of_analysis, status
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, 'released')
      `, {
      replacements: [batchId, releaseData.workOrderId, releaseData.releaseType, releaseData.quantity, releaseData.unitOfMeasure, releaseData.approvedBy, releaseData.releaseNotes, releaseData.certificateOfAnalysis],
      type: _database.sequelize.QueryTypes.INSERT
    });

    // Update work order status to released
    await workOrder.update({
      status: 'released'
    });
    _logger.logger.info(`Batch released: ${batchId} for work order: ${workOrder.workOrderNumber} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Batch released successfully',
      data: {
        releaseId,
        batchId,
        workOrderNumber: workOrder.workOrderNumber,
        releaseDate: new Date()
      }
    });
  } catch (error) {
    _logger.logger.error('Release batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get batch release history
 * GET /api/v1/quality/batches/:batchId/releases
 */
const getBatchReleaseHistory = exports.getBatchReleaseHistory = [(0, _expressValidator.param)('batchId').isString().notEmpty().withMessage('Batch ID is required'), async (req, res) => {
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
      batchId
    } = req.params;

    // Get batch release history
    const releases = await _database.sequelize.query(`
        SELECT
          br.*,
          wo.work_order_number,
          u.first_name as approved_by_name,
          u.last_name as approved_by_last_name
        FROM batch_releases br
        JOIN work_orders wo ON br.work_order_id = wo.id
        LEFT JOIN users u ON br.approved_by = u.id
        WHERE br.batch_id = ?
        ORDER BY br.release_date DESC
      `, {
      replacements: [batchId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Batch release history retrieved for batch: ${batchId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Batch release history retrieved successfully',
      data: releases
    });
  } catch (error) {
    _logger.logger.error('Get batch release history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get quality control dashboard data
 * GET /api/v1/quality/dashboard
 */
const getQualityDashboard = exports.getQualityDashboard = [async (req, res) => {
  try {
    // Get quality metrics
    const metrics = await _database.sequelize.query(`
        SELECT
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tests,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tests,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tests,
          COUNT(*) as total_tests
        FROM quality_tests
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get recent batch releases
    const recentReleases = await _database.sequelize.query(`
        SELECT
          br.batch_id,
          br.release_date,
          br.quantity,
          br.unit_of_measure,
          wo.work_order_number,
          p.product_name
        FROM batch_releases br
        JOIN work_orders wo ON br.work_order_id = wo.id
        JOIN production_plans pp ON wo.plan_id = pp.id
        JOIN products p ON pp.product_id = p.id
        WHERE br.release_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY br.release_date DESC
        LIMIT 10
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get compliance status
    const complianceStatus = await _database.sequelize.query(`
        SELECT
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_trainings,
          COUNT(CASE WHEN next_audit_date < NOW() THEN 1 END) as overdue_audits
        FROM training_records tr
        CROSS JOIN (
          SELECT MIN(next_audit_date) as next_audit_date
          FROM audits
          WHERE status = 'scheduled'
        ) a
        WHERE tr.expiry_date < NOW()
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Quality dashboard data retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Quality dashboard data retrieved successfully',
      data: {
        metrics: metrics[0],
        recentReleases,
        complianceStatus: complianceStatus[0],
        generatedAt: new Date()
      }
    });
  } catch (error) {
    _logger.logger.error('Get quality dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];