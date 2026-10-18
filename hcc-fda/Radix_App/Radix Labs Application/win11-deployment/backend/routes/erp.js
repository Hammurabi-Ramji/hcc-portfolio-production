"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _erpController = require("../controllers/erpController.js");
var _authMiddleware = require("../middleware/authMiddleware.js");
var _validationMiddleware = require("../middleware/validationMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// All ERP routes require authentication
router.use(_authMiddleware.authenticateToken);

/**
 * @route GET /api/v1/erp/dashboard
 * @desc Get ERP dashboard overview
 * @access Private
 */
router.get('/dashboard', _erpController.getDashboard);

/**
 * @route GET /api/v1/erp/production-planning
 * @desc Get production planning data
 * @access Private
 */
router.get('/production-planning', _erpController.getProductionPlanning);

/**
 * @route POST /api/v1/erp/production-plans
 * @desc Create a new production plan
 * @access Private
 */
router.post('/production-plans', _erpController.createProductionPlan);

/**
 * @route GET /api/v1/erp/inventory
 * @desc Get inventory status
 * @access Private
 */
router.get('/inventory', _erpController.getInventoryStatus);

/**
 * @route GET /api/v1/erp/resources/utilization
 * @desc Get resource utilization data
 * @access Private
 */
router.get('/resources/utilization', _erpController.getResourceUtilization);

/**
 * @route GET /api/v1/erp/reports/:reportType
 * @desc Generate ERP reports
 * @access Private
 */
router.get('/reports/:reportType', _erpController.generateReport);
var _default = exports.default = router;