"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _manufacturingController = require("../controllers/manufacturingController.js");
var _authMiddleware = require("../middleware/authMiddleware.js");
var _validationMiddleware = require("../middleware/validationMiddleware.js");
var _expressValidator = require("express-validator");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// All manufacturing routes require authentication
router.use(_authMiddleware.authenticateToken);

/**
 * @route GET /api/v1/manufacturing/work-orders
 * @desc Get all work orders with optional filtering
 * @access Private
 */
router.get('/work-orders', [(0, _expressValidator.query)('status').optional().isIn(['planned', 'released', 'in-progress', 'completed', 'cancelled']), (0, _expressValidator.query)('page').optional().isInt({
  min: 1
}), (0, _expressValidator.query)('limit').optional().isInt({
  min: 1,
  max: 100
}), (0, _expressValidator.query)('sortBy').optional().isIn(['createdAt', 'workOrderNumber', 'status', 'priority']), (0, _expressValidator.query)('sortOrder').optional().isIn(['asc', 'desc'])], _validationMiddleware.validateRequest, _manufacturingController.getWorkOrders);

/**
 * @route POST /api/v1/manufacturing/work-orders
 * @desc Create a new work order
 * @access Private
 */
router.post('/work-orders', [(0, _expressValidator.body)('workOrderNumber').isString().notEmpty().withMessage('Work order number is required'), (0, _expressValidator.body)('planId').isInt({
  min: 1
}).withMessage('Valid plan ID is required'), (0, _expressValidator.body)('componentId').optional().isInt({
  min: 1
}), (0, _expressValidator.body)('requiredQuantity').isFloat({
  min: 0.01
}).withMessage('Required quantity must be greater than 0'), (0, _expressValidator.body)('unitOfMeasure').isString().notEmpty().withMessage('Unit of measure is required'), (0, _expressValidator.body)('priority').optional().isIn(['low', 'medium', 'high', 'critical']), (0, _expressValidator.body)('scheduledStartDate').optional().isISO8601(), (0, _expressValidator.body)('scheduledEndDate').optional().isISO8601(), (0, _expressValidator.body)('notes').optional().isString()], _validationMiddleware.validateRequest, _manufacturingController.createWorkOrder);

/**
 * @route PUT /api/v1/manufacturing/work-orders/:id
 * @desc Update a work order
 * @access Private
 */
router.put('/work-orders/:id', [(0, _expressValidator.param)('id').isInt({
  min: 1
}).withMessage('Valid work order ID is required'), (0, _expressValidator.body)('status').optional().isIn(['planned', 'released', 'in-progress', 'completed', 'cancelled']), (0, _expressValidator.body)('requiredQuantity').optional().isFloat({
  min: 0.01
}), (0, _expressValidator.body)('completedQuantity').optional().isFloat({
  min: 0
}), (0, _expressValidator.body)('scrapQuantity').optional().isFloat({
  min: 0
}), (0, _expressValidator.body)('priority').optional().isIn(['low', 'medium', 'high', 'critical']), (0, _expressValidator.body)('scheduledStartDate').optional().isISO8601(), (0, _expressValidator.body)('scheduledEndDate').optional().isISO8601(), (0, _expressValidator.body)('actualStartDate').optional().isISO8601(), (0, _expressValidator.body)('actualEndDate').optional().isISO8601(), (0, _expressValidator.body)('notes').optional().isString()], _validationMiddleware.validateRequest, _manufacturingController.updateWorkOrder);

/**
 * @route GET /api/v1/manufacturing/metrics
 * @desc Get production metrics and KPIs
 * @access Private
 */
router.get('/metrics', [(0, _expressValidator.query)('startDate').optional().isISO8601(), (0, _expressValidator.query)('endDate').optional().isISO8601(), (0, _expressValidator.query)('workOrderId').optional().isInt({
  min: 1
}), (0, _expressValidator.query)('planId').optional().isInt({
  min: 1
})], _validationMiddleware.validateRequest, _manufacturingController.getProductionMetrics);

/**
 * @route POST /api/v1/manufacturing/batch-operations
 * @desc Record a batch operation for a work order
 * @access Private
 */
router.post('/batch-operations', [(0, _expressValidator.body)('workOrderId').isInt({
  min: 1
}).withMessage('Valid work order ID is required'), (0, _expressValidator.body)('operationType').isString().notEmpty().withMessage('Operation type is required'), (0, _expressValidator.body)('batchNumber').isString().notEmpty().withMessage('Batch number is required'), (0, _expressValidator.body)('quantity').isFloat({
  min: 0.01
}).withMessage('Quantity must be greater than 0'), (0, _expressValidator.body)('unitOfMeasure').isString().notEmpty().withMessage('Unit of measure is required'), (0, _expressValidator.body)('startTime').isISO8601().withMessage('Valid start time is required'), (0, _expressValidator.body)('endTime').isISO8601().withMessage('Valid end time is required'), (0, _expressValidator.body)('operatorId').isInt({
  min: 1
}).withMessage('Valid operator ID is required'), (0, _expressValidator.body)('equipmentId').optional().isInt({
  min: 1
}), (0, _expressValidator.body)('parameters').optional().isObject(), (0, _expressValidator.body)('qualityChecks').optional().isArray(), (0, _expressValidator.body)('notes').optional().isString()], _validationMiddleware.validateRequest, _manufacturingController.recordBatchOperation);
var _default = exports.default = router;