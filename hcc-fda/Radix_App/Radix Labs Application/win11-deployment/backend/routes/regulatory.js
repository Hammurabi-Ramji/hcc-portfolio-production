"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _regulatoryController = require("../controllers/regulatoryController.js");
var _authMiddleware = require("../middleware/authMiddleware.js");
var _validationMiddleware = require("../middleware/validationMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// All regulatory routes require authentication
router.use(_authMiddleware.authenticateToken);

/**
 * @route GET /api/v1/regulatory/documents
 * @desc Get compliance documents
 * @access Private
 */
router.get('/documents', _regulatoryController.getComplianceDocuments);

/**
 * @route POST /api/v1/regulatory/documents
 * @desc Create a new compliance document
 * @access Private
 */
router.post('/documents', _regulatoryController.createComplianceDocument);

/**
 * @route PUT /api/v1/regulatory/documents/:documentId/approval
 * @desc Update document approval status
 * @access Private
 */
router.put('/documents/:documentId/approval', _regulatoryController.updateDocumentApproval);

/**
 * @route GET /api/v1/regulatory/audits
 * @desc Get compliance audits
 * @access Private
 */
router.get('/audits', _regulatoryController.getComplianceAudits);

/**
 * @route POST /api/v1/regulatory/audits
 * @desc Create a new compliance audit
 * @access Private
 */
router.post('/audits', _regulatoryController.createComplianceAudit);

/**
 * @route POST /api/v1/regulatory/audits/:auditId/findings
 * @desc Record audit findings
 * @access Private
 */
router.post('/audits/:auditId/findings', _regulatoryController.recordAuditFindings);

/**
 * @route GET /api/v1/regulatory/compliance-status
 * @desc Get regulatory compliance status
 * @access Private
 */
router.get('/compliance-status', _regulatoryController.getComplianceStatus);

/**
 * @route GET /api/v1/regulatory/dashboard
 * @desc Get regulatory dashboard data
 * @access Private
 */
router.get('/dashboard', _regulatoryController.getRegulatoryDashboard);
var _default = exports.default = router;