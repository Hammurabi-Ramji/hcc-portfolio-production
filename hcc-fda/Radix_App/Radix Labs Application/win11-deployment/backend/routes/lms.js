"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _lmsController = require("../controllers/lmsController.js");
var _authMiddleware = require("../middleware/authMiddleware.js");
var _validationMiddleware = require("../middleware/validationMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// All LMS routes require authentication
router.use(_authMiddleware.authenticateToken);

/**
 * @route GET /api/v1/lms/courses
 * @desc Get training courses/modules
 * @access Private
 */
router.get('/courses', _lmsController.getCourses);

/**
 * @route POST /api/v1/lms/courses
 * @desc Create a new training course
 * @access Private
 */
router.post('/courses', _lmsController.createCourse);

/**
 * @route GET /api/v1/lms/users/:userId/training
 * @desc Get user training records
 * @access Private
 */
router.get('/users/:userId/training', _lmsController.getUserTraining);

/**
 * @route POST /api/v1/lms/assignments
 * @desc Assign training to user
 * @access Private
 */
router.post('/assignments', _lmsController.assignTraining);

/**
 * @route PUT /api/v1/lms/training/:trainingId/progress
 * @desc Update training progress
 * @access Private
 */
router.put('/training/:trainingId/progress', _lmsController.updateTrainingProgress);

/**
 * @route GET /api/v1/lms/compliance
 * @desc Get training compliance report
 * @access Private
 */
router.get('/compliance', _lmsController.getComplianceReport);

/**
 * @route GET /api/v1/lms/dashboard
 * @desc Get LMS dashboard data
 * @access Private
 */
router.get('/dashboard', _lmsController.getLMSDashboard);
var _default = exports.default = router;