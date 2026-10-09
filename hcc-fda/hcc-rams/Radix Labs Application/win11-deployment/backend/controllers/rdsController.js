"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateSubmissionStatus = exports.getSubmissions = exports.getSubmissionDocuments = exports.getRegulatoryBodies = exports.getRDSDashboard = exports.createSubmission = exports.addDocumentToSubmission = void 0;
var _expressValidator = require("express-validator");
var _RegulatorySubmission = require("../models/RegulatorySubmission.js");
var _Document = require("../models/Document.js");
var _logger = require("../utils/logger.js");
var _database = require("../config/database.js");
/**
 * Get regulatory submissions
 * GET /api/v1/rds/submissions
 */
const getSubmissions = exports.getSubmissions = [(0, _expressValidator.query)('status').optional().isIn(['draft', 'submitted', 'under-review', 'approved', 'rejected', 'withdrawn']), (0, _expressValidator.query)('regulatoryBody').optional().isString(), (0, _expressValidator.query)('submissionType').optional().isString(), (0, _expressValidator.query)('startDate').optional().isISO8601(), (0, _expressValidator.query)('endDate').optional().isISO8601(), async (req, res) => {
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
      status,
      regulatoryBody,
      submissionType,
      startDate,
      endDate
    } = req.query;

    // Build where clause
    let whereClause = '';
    const replacements = [];
    if (status) {
      whereClause += ' AND rs.status = ?';
      replacements.push(status);
    }
    if (regulatoryBody) {
      whereClause += ' AND rs.regulatory_body = ?';
      replacements.push(regulatoryBody);
    }
    if (submissionType) {
      whereClause += ' AND rs.submission_type = ?';
      replacements.push(submissionType);
    }
    if (startDate) {
      whereClause += ' AND rs.submission_date >= ?';
      replacements.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND rs.submission_date <= ?';
      replacements.push(endDate);
    }

    // Get regulatory submissions
    const submissions = await _database.sequelize.query(`
        SELECT
          rs.*,
          p.product_name,
          u.first_name as submitted_by_name,
          u.last_name as submitted_by_last_name
        FROM regulatory_submissions rs
        LEFT JOIN products p ON rs.product_id = p.id
        LEFT JOIN users u ON rs.submitted_by = u.id
        WHERE 1=1 ${whereClause}
        ORDER BY rs.submission_date DESC
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Regulatory submissions retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Regulatory submissions retrieved successfully',
      data: submissions
    });
  } catch (error) {
    _logger.logger.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Create regulatory submission
 * POST /api/v1/rds/submissions
 */
const createSubmission = exports.createSubmission = [(0, _expressValidator.body)('productId').isInt({
  min: 1
}).withMessage('Valid product ID is required'), (0, _expressValidator.body)('regulatoryBody').isString().notEmpty().withMessage('Regulatory body is required'), (0, _expressValidator.body)('submissionType').isString().notEmpty().withMessage('Submission type is required'), (0, _expressValidator.body)('submissionNumber').optional().isString(), (0, _expressValidator.body)('submissionDate').isISO8601().withMessage('Valid submission date is required'), (0, _expressValidator.body)('expectedApprovalDate').optional().isISO8601(), (0, _expressValidator.body)('description').isString().notEmpty().withMessage('Description is required'), (0, _expressValidator.body)('priority').optional().isIn(['low', 'medium', 'high', 'critical']), (0, _expressValidator.body)('documents').optional().isArray(), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const submissionData = req.body;

    // Create regulatory submission
    const submission = await _RegulatorySubmission.RegulatorySubmission.create({
      productId: submissionData.productId,
      regulatoryBody: submissionData.regulatoryBody,
      submissionType: submissionData.submissionType,
      submissionNumber: submissionData.submissionNumber,
      submissionDate: submissionData.submissionDate,
      expectedApprovalDate: submissionData.expectedApprovalDate,
      status: 'draft',
      description: submissionData.description,
      priority: submissionData.priority || 'medium',
      submittedBy: req.user.id
    });

    // Associate documents if provided
    if (submissionData.documents && submissionData.documents.length > 0) {
      for (const docId of submissionData.documents) {
        await _database.sequelize.query(`
            INSERT INTO submission_documents (submission_id, document_id, created_at)
            VALUES (?, ?, NOW())
          `, {
          replacements: [submission.id, docId],
          type: _database.sequelize.QueryTypes.INSERT
        });
      }
    }
    _logger.logger.info(`Regulatory submission created: ${submission.submissionNumber} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Regulatory submission created successfully',
      data: submission
    });
  } catch (error) {
    _logger.logger.error('Create submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Update submission status
 * PUT /api/v1/rds/submissions/:submissionId/status
 */
const updateSubmissionStatus = exports.updateSubmissionStatus = [(0, _expressValidator.param)('submissionId').isInt({
  min: 1
}).withMessage('Valid submission ID is required'), (0, _expressValidator.body)('status').isIn(['draft', 'submitted', 'under-review', 'approved', 'rejected', 'withdrawn']).withMessage('Valid status is required'), (0, _expressValidator.body)('approvalDate').optional().isISO8601(), (0, _expressValidator.body)('rejectionReason').optional().isString(), (0, _expressValidator.body)('comments').optional().isString(), async (req, res) => {
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
      submissionId
    } = req.params;
    const statusData = req.body;

    // Find submission
    const submission = await _RegulatorySubmission.RegulatorySubmission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Regulatory submission not found'
      });
    }

    // Update submission
    const updateData = {
      status: statusData.status,
      comments: statusData.comments
    };
    if (statusData.status === 'approved' && statusData.approvalDate) {
      updateData.approvalDate = statusData.approvalDate;
    }
    if (statusData.status === 'rejected') {
      updateData.rejectionReason = statusData.rejectionReason;
    }
    await submission.update(updateData);
    _logger.logger.info(`Regulatory submission status updated: ${submissionId} to ${statusData.status} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Submission status updated successfully',
      data: submission
    });
  } catch (error) {
    _logger.logger.error('Update submission status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get submission documents
 * GET /api/v1/rds/submissions/:submissionId/documents
 */
const getSubmissionDocuments = exports.getSubmissionDocuments = [(0, _expressValidator.param)('submissionId').isInt({
  min: 1
}).withMessage('Valid submission ID is required'), async (req, res) => {
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
      submissionId
    } = req.params;

    // Get submission documents
    const documents = await _database.sequelize.query(`
        SELECT
          d.*,
          sd.created_at as associated_date
        FROM documents d
        JOIN submission_documents sd ON d.id = sd.document_id
        WHERE sd.submission_id = ?
        ORDER BY sd.created_at DESC
      `, {
      replacements: [submissionId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Submission documents retrieved for submission ID: ${submissionId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Submission documents retrieved successfully',
      data: documents
    });
  } catch (error) {
    _logger.logger.error('Get submission documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Add document to submission
 * POST /api/v1/rds/submissions/:submissionId/documents
 */
const addDocumentToSubmission = exports.addDocumentToSubmission = [(0, _expressValidator.param)('submissionId').isInt({
  min: 1
}).withMessage('Valid submission ID is required'), (0, _expressValidator.body)('documentId').isInt({
  min: 1
}).withMessage('Valid document ID is required'), async (req, res) => {
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
      submissionId
    } = req.params;
    const {
      documentId
    } = req.body;

    // Verify submission exists
    const submission = await _RegulatorySubmission.RegulatorySubmission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Regulatory submission not found'
      });
    }

    // Verify document exists
    const document = await _Document.Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if document is already associated
    const existing = await _database.sequelize.query(`
        SELECT id FROM submission_documents
        WHERE submission_id = ? AND document_id = ?
      `, {
      replacements: [submissionId, documentId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Document is already associated with this submission'
      });
    }

    // Associate document with submission
    await _database.sequelize.query(`
        INSERT INTO submission_documents (submission_id, document_id, created_at)
        VALUES (?, ?, NOW())
      `, {
      replacements: [submissionId, documentId],
      type: _database.sequelize.QueryTypes.INSERT
    });
    _logger.logger.info(`Document ${documentId} added to submission ${submissionId} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Document added to submission successfully'
    });
  } catch (error) {
    _logger.logger.error('Add document to submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get regulatory bodies and requirements
 * GET /api/v1/rds/regulatory-bodies
 */
const getRegulatoryBodies = exports.getRegulatoryBodies = [async (req, res) => {
  try {
    // Get regulatory bodies and their requirements (simplified - in real implementation would have a RegulatoryBody model)
    const regulatoryBodies = await _database.sequelize.query(`
        SELECT
          regulatory_body,
          COUNT(*) as submission_count,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          AVG(CASE WHEN approval_date IS NOT NULL THEN DATEDIFF(approval_date, submission_date) END) as avg_approval_days
        FROM regulatory_submissions
        GROUP BY regulatory_body
        ORDER BY submission_count DESC
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Regulatory bodies data retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Regulatory bodies data retrieved successfully',
      data: regulatoryBodies
    });
  } catch (error) {
    _logger.logger.error('Get regulatory bodies error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get RDS dashboard data
 * GET /api/v1/rds/dashboard
 */
const getRDSDashboard = exports.getRDSDashboard = [async (req, res) => {
  try {
    // Get RDS metrics
    const metrics = await _database.sequelize.query(`
        SELECT
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_submissions,
          COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_submissions,
          COUNT(CASE WHEN status = 'under-review' THEN 1 END) as under_review_submissions,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions,
          AVG(CASE WHEN approval_date IS NOT NULL THEN DATEDIFF(approval_date, submission_date) END) as avg_approval_time_days
        FROM regulatory_submissions
        WHERE submission_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get recent submissions
    const recentSubmissions = await _database.sequelize.query(`
        SELECT
          rs.*,
          p.product_name,
          u.first_name as submitted_by_name
        FROM regulatory_submissions rs
        LEFT JOIN products p ON rs.product_id = p.id
        LEFT JOIN users u ON rs.submitted_by = u.id
        ORDER BY rs.submission_date DESC
        LIMIT 10
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get upcoming deadlines
    const upcomingDeadlines = await _database.sequelize.query(`
        SELECT
          rs.*,
          p.product_name,
          DATEDIFF(rs.expected_approval_date, NOW()) as days_until_deadline
        FROM regulatory_submissions rs
        LEFT JOIN products p ON rs.product_id = p.id
        WHERE rs.expected_approval_date >= NOW()
          AND rs.expected_approval_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)
          AND rs.status IN ('submitted', 'under-review')
        ORDER BY rs.expected_approval_date ASC
        LIMIT 10
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`RDS dashboard data retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'RDS dashboard data retrieved successfully',
      data: {
        metrics: metrics[0],
        recentSubmissions,
        upcomingDeadlines,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    _logger.logger.error('Get RDS dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];