"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateDocumentApproval = exports.recordAuditFindings = exports.getRegulatoryDashboard = exports.getComplianceStatus = exports.getComplianceDocuments = exports.getComplianceAudits = exports.createComplianceDocument = exports.createComplianceAudit = void 0;
var _expressValidator = require("express-validator");
var _RegulatorySubmission = require("../models/RegulatorySubmission.js");
var _Document = require("../models/Document.js");
var _logger = require("../utils/logger.js");
var _database = require("../config/database.js");
/**
 * Get compliance documents
 * GET /api/v1/regulatory/documents
 */
const getComplianceDocuments = exports.getComplianceDocuments = [(0, _expressValidator.query)('documentType').optional().isIn(['SOP', 'PROTOCOL', 'REPORT', 'RECORD', 'PLAN', 'POLICY']), (0, _expressValidator.query)('status').optional().isIn(['draft', 'review', 'approved', 'obsolete']), (0, _expressValidator.query)('regulatoryBody').optional().isString(), async (req, res) => {
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
      documentType,
      status,
      regulatoryBody
    } = req.query;

    // Build where clause
    let whereClause = '';
    const replacements = [];
    if (documentType) {
      whereClause += ' AND document_type = ?';
      replacements.push(documentType);
    }
    if (status) {
      whereClause += ' AND status = ?';
      replacements.push(status);
    }
    if (regulatoryBody) {
      whereClause += ' AND regulatory_body = ?';
      replacements.push(regulatoryBody);
    }

    // Get compliance documents (simplified - in real implementation would have a ComplianceDocument model)
    const documents = await _database.sequelize.query(`
        SELECT
          id,
          title,
          document_type,
          regulatory_body,
          version,
          status,
          effective_date,
          review_date,
          created_by,
          created_at,
          updated_at
        FROM compliance_documents
        WHERE 1=1 ${whereClause}
        ORDER BY created_at DESC
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Compliance documents retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Compliance documents retrieved successfully',
      data: documents
    });
  } catch (error) {
    _logger.logger.error('Get compliance documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Create compliance document
 * POST /api/v1/regulatory/documents
 */
const createComplianceDocument = exports.createComplianceDocument = [(0, _expressValidator.body)('title').isString().notEmpty().withMessage('Document title is required'), (0, _expressValidator.body)('documentType').isIn(['SOP', 'PROTOCOL', 'REPORT', 'RECORD', 'PLAN', 'POLICY']).withMessage('Valid document type is required'), (0, _expressValidator.body)('regulatoryBody').optional().isString(), (0, _expressValidator.body)('content').isString().notEmpty().withMessage('Document content is required'), (0, _expressValidator.body)('effectiveDate').optional().isISO8601(), (0, _expressValidator.body)('reviewFrequencyMonths').optional().isInt({
  min: 1
}), (0, _expressValidator.body)('approvers').optional().isArray(), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const docData = req.body;

    // Calculate review date
    let reviewDate = null;
    if (docData.reviewFrequencyMonths) {
      reviewDate = new Date();
      reviewDate.setMonth(reviewDate.getMonth() + docData.reviewFrequencyMonths);
    }

    // Create compliance document (simplified - in real implementation would use a ComplianceDocument model)
    const [documentId] = await _database.sequelize.query(`
        INSERT INTO compliance_documents (
          title, document_type, regulatory_body, version,
          content, status, effective_date, review_date,
          review_frequency_months, created_by, created_at
        ) VALUES (?, ?, ?, '1.0', ?, 'draft', ?, ?, ?, ?, NOW())
      `, {
      replacements: [docData.title, docData.documentType, docData.regulatoryBody, docData.content, docData.effectiveDate, reviewDate, docData.reviewFrequencyMonths, req.user.id],
      type: _database.sequelize.QueryTypes.INSERT
    });

    // Add approvers if provided
    if (docData.approvers && docData.approvers.length > 0) {
      for (const approverId of docData.approvers) {
        await _database.sequelize.query(`
            INSERT INTO document_approvals (document_id, approver_id, status, created_at)
            VALUES (?, ?, 'pending', NOW())
          `, {
          replacements: [documentId, approverId],
          type: _database.sequelize.QueryTypes.INSERT
        });
      }
    }
    _logger.logger.info(`Compliance document created: ${docData.title} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Compliance document created successfully',
      data: {
        documentId
      }
    });
  } catch (error) {
    _logger.logger.error('Create compliance document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Update document approval status
 * PUT /api/v1/regulatory/documents/:documentId/approval
 */
const updateDocumentApproval = exports.updateDocumentApproval = [(0, _expressValidator.param)('documentId').isInt({
  min: 1
}).withMessage('Valid document ID is required'), (0, _expressValidator.body)('status').isIn(['approved', 'rejected']).withMessage('Valid approval status is required'), (0, _expressValidator.body)('comments').optional().isString(), async (req, res) => {
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
      documentId
    } = req.params;
    const approvalData = req.body;

    // Update approval status
    await _database.sequelize.query(`
        UPDATE document_approvals
        SET
          status = ?,
          comments = ?,
          approved_at = NOW()
        WHERE document_id = ? AND approver_id = ?
      `, {
      replacements: [approvalData.status, approvalData.comments, documentId, req.user.id],
      type: _database.sequelize.QueryTypes.UPDATE
    });

    // Check if all approvals are complete
    const approvals = await _database.sequelize.query(`
        SELECT
          COUNT(*) as total_approvals,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
        FROM document_approvals
        WHERE document_id = ?
      `, {
      replacements: [documentId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    const approvalStats = approvals[0];

    // Update document status based on approvals
    let documentStatus = 'review';
    if (approvalStats.rejected_count > 0) {
      documentStatus = 'rejected';
    } else if (approvalStats.approved_count === approvalStats.total_approvals) {
      documentStatus = 'approved';
    }
    await _database.sequelize.query(`
        UPDATE compliance_documents
        SET status = ?, updated_at = NOW()
        WHERE id = ?
      `, {
      replacements: [documentStatus, documentId],
      type: _database.sequelize.QueryTypes.UPDATE
    });
    _logger.logger.info(`Document approval updated: ${documentId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Document approval updated successfully'
    });
  } catch (error) {
    _logger.logger.error('Update document approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get compliance audits
 * GET /api/v1/regulatory/audits
 */
const getComplianceAudits = exports.getComplianceAudits = [(0, _expressValidator.query)('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled']), (0, _expressValidator.query)('auditType').optional().isIn(['internal', 'external', 'regulatory', 'supplier']), (0, _expressValidator.query)('startDate').optional().isISO8601(), (0, _expressValidator.query)('endDate').optional().isISO8601(), async (req, res) => {
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
      auditType,
      startDate,
      endDate
    } = req.query;

    // Build where clause
    let whereClause = '';
    const replacements = [];
    if (status) {
      whereClause += ' AND status = ?';
      replacements.push(status);
    }
    if (auditType) {
      whereClause += ' AND audit_type = ?';
      replacements.push(auditType);
    }
    if (startDate) {
      whereClause += ' AND audit_date >= ?';
      replacements.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND audit_date <= ?';
      replacements.push(endDate);
    }

    // Get compliance audits (simplified - in real implementation would have an Audit model)
    const audits = await _database.sequelize.query(`
        SELECT
          id,
          audit_type,
          title,
          description,
          audit_date,
          status,
          auditor,
          findings_count,
          critical_findings,
          created_by,
          created_at
        FROM compliance_audits
        WHERE 1=1 ${whereClause}
        ORDER BY audit_date DESC
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Compliance audits retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Compliance audits retrieved successfully',
      data: audits
    });
  } catch (error) {
    _logger.logger.error('Get compliance audits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Create compliance audit
 * POST /api/v1/regulatory/audits
 */
const createComplianceAudit = exports.createComplianceAudit = [(0, _expressValidator.body)('auditType').isIn(['internal', 'external', 'regulatory', 'supplier']).withMessage('Valid audit type is required'), (0, _expressValidator.body)('title').isString().notEmpty().withMessage('Audit title is required'), (0, _expressValidator.body)('description').isString().notEmpty().withMessage('Audit description is required'), (0, _expressValidator.body)('auditDate').isISO8601().withMessage('Valid audit date is required'), (0, _expressValidator.body)('auditor').isString().notEmpty().withMessage('Auditor name is required'), (0, _expressValidator.body)('scope').optional().isString(), (0, _expressValidator.body)('objectives').optional().isArray(), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const auditData = req.body;

    // Create compliance audit (simplified - in real implementation would use an Audit model)
    const [auditId] = await _database.sequelize.query(`
        INSERT INTO compliance_audits (
          audit_type, title, description, audit_date,
          auditor, scope, objectives, status,
          created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW())
      `, {
      replacements: [auditData.auditType, auditData.title, auditData.description, auditData.auditDate, auditData.auditor, auditData.scope, JSON.stringify(auditData.objectives || []), req.user.id],
      type: _database.sequelize.QueryTypes.INSERT
    });
    _logger.logger.info(`Compliance audit created: ${auditData.title} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Compliance audit created successfully',
      data: {
        auditId
      }
    });
  } catch (error) {
    _logger.logger.error('Create compliance audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Record audit findings
 * POST /api/v1/regulatory/audits/:auditId/findings
 */
const recordAuditFindings = exports.recordAuditFindings = [(0, _expressValidator.param)('auditId').isInt({
  min: 1
}).withMessage('Valid audit ID is required'), (0, _expressValidator.body)('findings').isArray().withMessage('Findings array is required'), (0, _expressValidator.body)('findings.*.description').isString().notEmpty().withMessage('Finding description is required'), (0, _expressValidator.body)('findings.*.severity').isIn(['critical', 'major', 'minor']).withMessage('Valid severity is required'), (0, _expressValidator.body)('findings.*.category').isString().notEmpty().withMessage('Finding category is required'), async (req, res) => {
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
      auditId
    } = req.params;
    const {
      findings
    } = req.body;

    // Insert audit findings
    for (const finding of findings) {
      await _database.sequelize.query(`
          INSERT INTO audit_findings (
            audit_id, description, severity, category,
            status, created_by, created_at
          ) VALUES (?, ?, ?, ?, 'open', ?, NOW())
        `, {
        replacements: [auditId, finding.description, finding.severity, finding.category, req.user.id],
        type: _database.sequelize.QueryTypes.INSERT
      });
    }

    // Update audit with findings count
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    await _database.sequelize.query(`
        UPDATE compliance_audits
        SET
          findings_count = findings_count + ?,
          critical_findings = critical_findings + ?,
          status = 'completed',
          completed_at = NOW()
        WHERE id = ?
      `, {
      replacements: [findings.length, criticalFindings, auditId],
      type: _database.sequelize.QueryTypes.UPDATE
    });
    _logger.logger.info(`Audit findings recorded for audit ID: ${auditId} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Audit findings recorded successfully'
    });
  } catch (error) {
    _logger.logger.error('Record audit findings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get regulatory compliance status
 * GET /api/v1/regulatory/compliance-status
 */
const getComplianceStatus = exports.getComplianceStatus = [async (req, res) => {
  try {
    // Get overall compliance metrics
    const complianceMetrics = await _database.sequelize.query(`
        SELECT
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as compliant_documents,
          COUNT(CASE WHEN status = 'obsolete' THEN 1 END) as obsolete_documents,
          COUNT(CASE WHEN review_date < NOW() THEN 1 END) as overdue_reviews,
          COUNT(*) as total_documents
        FROM compliance_documents
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get audit status
    const auditMetrics = await _database.sequelize.query(`
        SELECT
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_audits,
          COUNT(CASE WHEN critical_findings > 0 THEN 1 END) as audits_with_critical_findings,
          COUNT(*) as total_audits
        FROM compliance_audits
        WHERE audit_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get regulatory submission status
    const submissionMetrics = await _database.sequelize.query(`
        SELECT
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions,
          COUNT(CASE WHEN expected_approval_date < NOW() AND status NOT IN ('approved', 'rejected') THEN 1 END) as overdue_submissions,
          COUNT(*) as total_submissions
        FROM regulatory_submissions
        WHERE submission_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });
    const metrics = {
      documents: complianceMetrics[0],
      audits: auditMetrics[0],
      submissions: submissionMetrics[0]
    };

    // Calculate overall compliance percentage
    const documentCompliance = metrics.documents.total_documents > 0 ? metrics.documents.compliant_documents / metrics.documents.total_documents * 100 : 100;
    const auditCompliance = metrics.audits.total_audits > 0 ? (metrics.audits.total_audits - metrics.audits.audits_with_critical_findings) / metrics.audits.total_audits * 100 : 100;
    const submissionCompliance = metrics.submissions.total_submissions > 0 ? metrics.submissions.approved_submissions / metrics.submissions.total_submissions * 100 : 100;
    const overallCompliance = (documentCompliance + auditCompliance + submissionCompliance) / 3;
    _logger.logger.info(`Regulatory compliance status retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Regulatory compliance status retrieved successfully',
      data: {
        metrics,
        compliance: {
          documentCompliance: Math.round(documentCompliance * 100) / 100,
          auditCompliance: Math.round(auditCompliance * 100) / 100,
          submissionCompliance: Math.round(submissionCompliance * 100) / 100,
          overallCompliance: Math.round(overallCompliance * 100) / 100
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    _logger.logger.error('Get compliance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get regulatory dashboard data
 * GET /api/v1/regulatory/dashboard
 */
const getRegulatoryDashboard = exports.getRegulatoryDashboard = [async (req, res) => {
  try {
    // Get dashboard metrics
    const metrics = await _database.sequelize.query(`
        SELECT
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_documents,
          COUNT(CASE WHEN review_date < NOW() THEN 1 END) as overdue_reviews,
          COUNT(CASE WHEN audit_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as recent_audits,
          COUNT(CASE WHEN critical_findings > 0 THEN 1 END) as critical_findings
        FROM compliance_documents cd
        CROSS JOIN compliance_audits ca
        WHERE cd.status = 'approved'
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get upcoming reviews
    const upcomingReviews = await _database.sequelize.query(`
        SELECT
          id,
          title,
          review_date,
          DATEDIFF(review_date, NOW()) as days_until_review
        FROM compliance_documents
        WHERE review_date >= NOW()
          AND review_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)
          AND status = 'approved'
        ORDER BY review_date ASC
        LIMIT 5
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get recent audit findings
    const recentFindings = await _database.sequelize.query(`
        SELECT
          af.*,
          ca.title as audit_title,
          ca.audit_date
        FROM audit_findings af
        JOIN compliance_audits ca ON af.audit_id = ca.id
        WHERE af.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY af.created_at DESC
        LIMIT 10
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Regulatory dashboard data retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Regulatory dashboard data retrieved successfully',
      data: {
        metrics: metrics[0],
        upcomingReviews,
        recentFindings,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    _logger.logger.error('Get regulatory dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];