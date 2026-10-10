"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _rdsController = require("../controllers/rdsController.js");
var _authMiddleware = require("../middleware/authMiddleware.js");
var _validationMiddleware = require("../middleware/validationMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// All RDS routes require authentication
router.use(_authMiddleware.authenticateToken);

/**
 * @route GET /api/v1/rds/submissions
 * @desc Get regulatory submissions
 * @access Private
 */
router.get('/submissions', _rdsController.getSubmissions);

/**
 * @route POST /api/v1/rds/submissions
 * @desc Create a new regulatory submission
 * @access Private
 */
router.post('/submissions', _rdsController.createSubmission);

/**
 * @route PUT /api/v1/rds/submissions/:submissionId/status
 * @desc Update submission status
 * @access Private
 */
router.put('/submissions/:submissionId/status', _rdsController.updateSubmissionStatus);

/**
 * @route GET /api/v1/rds/submissions/:submissionId/documents
 * @desc Get submission documents
 * @access Private
 */
router.get('/submissions/:submissionId/documents', _rdsController.getSubmissionDocuments);

/**
 * @route POST /api/v1/rds/submissions/:submissionId/documents
 * @desc Add document to submission
 * @access Private
 */
router.post('/submissions/:submissionId/documents', _rdsController.addDocumentToSubmission);

/**
 * @route GET /api/v1/rds/regulatory-bodies
 * @desc Get regulatory bodies and requirements
 * @access Private
 */
router.get('/regulatory-bodies', _rdsController.getRegulatoryBodies);

/**
 * @route GET /api/v1/rds/dashboard
 * @desc Get RDS dashboard data
 * @access Private
 */
router.get('/dashboard', _rdsController.getRDSDashboard);
var _default = exports.default = router;