"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _qualityController = require("../controllers/qualityController.js");
var _authMiddleware = require("../middleware/authMiddleware.js");
var _validationMiddleware = require("../middleware/validationMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// All quality routes require authentication
router.use(_authMiddleware.authenticateToken);

/**
 * @route GET /api/v1/quality/work-orders/:workOrderId/tests
 * @desc Get quality tests for a work order
 * @access Private
 */
router.get('/work-orders/:workOrderId/tests', _qualityController.getQualityTests);

/**
 * @route POST /api/v1/quality/tests
 * @desc Create a new quality test
 * @access Private
 */
router.post('/tests', _qualityController.createQualityTest);

/**
 * @route PUT /api/v1/quality/tests/:testId/results
 * @desc Update quality test results
 * @access Private
 */
router.put('/tests/:testId/results', _qualityController.updateQualityTestResults);

/**
 * @route POST /api/v1/quality/batches/:batchId/release
 * @desc Release a batch for distribution
 * @access Private
 */
router.post('/batches/:batchId/release', _qualityController.releaseBatch);

/**
 * @route GET /api/v1/quality/batches/:batchId/releases
 * @desc Get batch release history
 * @access Private
 */
router.get('/batches/:batchId/releases', _qualityController.getBatchReleaseHistory);

/**
 * @route GET /api/v1/quality/dashboard
 * @desc Get quality control dashboard data
 * @access Private
 */
router.get('/dashboard', _qualityController.getQualityDashboard);
var _default = exports.default = router;