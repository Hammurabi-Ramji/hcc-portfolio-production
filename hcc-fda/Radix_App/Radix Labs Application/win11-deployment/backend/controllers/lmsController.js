"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateTrainingProgress = exports.getUserTraining = exports.getLMSDashboard = exports.getCourses = exports.getComplianceReport = exports.createCourse = exports.assignTraining = void 0;
var _expressValidator = require("express-validator");
var _TrainingRecord = require("../models/TrainingRecord.js");
var _User = require("../models/User.js");
var _logger = require("../utils/logger.js");
var _database = require("../config/database.js");
/**
 * Get training courses/modules
 * GET /api/v1/lms/courses
 */
const getCourses = exports.getCourses = [(0, _expressValidator.query)('category').optional().isString(), (0, _expressValidator.query)('required').optional().isBoolean(), (0, _expressValidator.query)('status').optional().isIn(['active', 'inactive', 'draft']), async (req, res) => {
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
      category,
      required,
      status
    } = req.query;

    // Build where clause
    let whereClause = '';
    const replacements = [];
    if (category) {
      whereClause += ' AND category = ?';
      replacements.push(category);
    }
    if (required !== undefined) {
      whereClause += ' AND is_required = ?';
      replacements.push(required === 'true' ? 1 : 0);
    }
    if (status) {
      whereClause += ' AND status = ?';
      replacements.push(status);
    }

    // Get training courses (simplified - in real implementation would have a Course model)
    const courses = await _database.sequelize.query(`
        SELECT
          id,
          title,
          description,
          category,
          duration_hours,
          is_required,
          status,
          created_at,
          updated_at
        FROM training_courses
        WHERE 1=1 ${whereClause}
        ORDER BY title
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Training courses retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Training courses retrieved successfully',
      data: courses
    });
  } catch (error) {
    _logger.logger.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Create training course
 * POST /api/v1/lms/courses
 */
const createCourse = exports.createCourse = [(0, _expressValidator.body)('title').isString().notEmpty().withMessage('Course title is required'), (0, _expressValidator.body)('description').isString().notEmpty().withMessage('Course description is required'), (0, _expressValidator.body)('category').isString().notEmpty().withMessage('Course category is required'), (0, _expressValidator.body)('durationHours').isFloat({
  min: 0.1
}).withMessage('Duration must be greater than 0'), (0, _expressValidator.body)('isRequired').optional().isBoolean(), (0, _expressValidator.body)('content').optional().isString(), (0, _expressValidator.body)('prerequisites').optional().isArray(), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const courseData = req.body;

    // Create training course (simplified - in real implementation would use a Course model)
    const [courseId] = await _database.sequelize.query(`
        INSERT INTO training_courses (
          title, description, category, duration_hours,
          is_required, content, prerequisites, status,
          created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW())
      `, {
      replacements: [courseData.title, courseData.description, courseData.category, courseData.durationHours, courseData.isRequired || false, courseData.content, JSON.stringify(courseData.prerequisites || []), req.user.id],
      type: _database.sequelize.QueryTypes.INSERT
    });
    _logger.logger.info(`Training course created: ${courseData.title} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Training course created successfully',
      data: {
        courseId
      }
    });
  } catch (error) {
    _logger.logger.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get user training records
 * GET /api/v1/lms/users/:userId/training
 */
const getUserTraining = exports.getUserTraining = [(0, _expressValidator.param)('userId').isInt({
  min: 1
}).withMessage('Valid user ID is required'), (0, _expressValidator.query)('status').optional().isIn(['assigned', 'in-progress', 'completed', 'overdue', 'expired']), (0, _expressValidator.query)('required').optional().isBoolean(), async (req, res) => {
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
      userId
    } = req.params;
    const {
      status,
      required
    } = req.query;

    // Build where clause
    let whereClause = 'tr.user_id = ?';
    const replacements = [userId];
    if (status) {
      whereClause += ' AND tr.status = ?';
      replacements.push(status);
    }
    if (required !== undefined) {
      whereClause += ' AND tc.is_required = ?';
      replacements.push(required === 'true' ? 1 : 0);
    }

    // Get user training records
    const trainingRecords = await _database.sequelize.query(`
        SELECT
          tr.*,
          tc.title as course_title,
          tc.category,
          tc.duration_hours,
          tc.is_required,
          CASE
            WHEN tr.expiry_date < NOW() THEN 'expired'
            WHEN tr.status = 'completed' THEN 'completed'
            WHEN tr.due_date < NOW() THEN 'overdue'
            ELSE tr.status
          END as effective_status
        FROM training_records tr
        JOIN training_courses tc ON tr.course_id = tc.id
        WHERE ${whereClause}
        ORDER BY tr.due_date ASC
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`User training records retrieved for user ID: ${userId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'User training records retrieved successfully',
      data: trainingRecords
    });
  } catch (error) {
    _logger.logger.error('Get user training error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Assign training to user
 * POST /api/v1/lms/assignments
 */
const assignTraining = exports.assignTraining = [(0, _expressValidator.body)('userId').isInt({
  min: 1
}).withMessage('Valid user ID is required'), (0, _expressValidator.body)('courseId').isInt({
  min: 1
}).withMessage('Valid course ID is required'), (0, _expressValidator.body)('assignedBy').isInt({
  min: 1
}).withMessage('Valid assigner ID is required'), (0, _expressValidator.body)('dueDate').isISO8601().withMessage('Valid due date is required'), (0, _expressValidator.body)('notes').optional().isString(), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const assignmentData = req.body;

    // Check if user already has this training assigned
    const existing = await _database.sequelize.query(`
        SELECT id FROM training_records
        WHERE user_id = ? AND course_id = ? AND status IN ('assigned', 'in-progress')
      `, {
      replacements: [assignmentData.userId, assignmentData.courseId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already has this training assigned'
      });
    }

    // Create training record
    const trainingRecord = await _TrainingRecord.TrainingRecord.create({
      userId: assignmentData.userId,
      courseId: assignmentData.courseId,
      status: 'assigned',
      assignedBy: assignmentData.assignedBy,
      dueDate: assignmentData.dueDate,
      notes: assignmentData.notes
    });
    _logger.logger.info(`Training assigned to user ID: ${assignmentData.userId}, course ID: ${assignmentData.courseId} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Training assigned successfully',
      data: trainingRecord
    });
  } catch (error) {
    _logger.logger.error('Assign training error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Update training progress
 * PUT /api/v1/lms/training/:trainingId/progress
 */
const updateTrainingProgress = exports.updateTrainingProgress = [(0, _expressValidator.param)('trainingId').isInt({
  min: 1
}).withMessage('Valid training ID is required'), (0, _expressValidator.body)('status').isIn(['assigned', 'in-progress', 'completed']).withMessage('Valid status is required'), (0, _expressValidator.body)('progress').optional().isFloat({
  min: 0,
  max: 100
}), (0, _expressValidator.body)('completionDate').optional().isISO8601(), (0, _expressValidator.body)('score').optional().isFloat({
  min: 0,
  max: 100
}), (0, _expressValidator.body)('notes').optional().isString(), async (req, res) => {
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
      trainingId
    } = req.params;
    const progressData = req.body;

    // Find training record
    const trainingRecord = await _TrainingRecord.TrainingRecord.findByPk(trainingId);
    if (!trainingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Training record not found'
      });
    }

    // Update training record
    const updateData = {
      status: progressData.status,
      progress: progressData.progress,
      notes: progressData.notes
    };
    if (progressData.status === 'completed') {
      updateData.completionDate = progressData.completionDate || new Date();
      updateData.score = progressData.score;

      // Calculate expiry date (typically 1-2 years from completion)
      const expiryDate = new Date(updateData.completionDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year expiry
      updateData.expiryDate = expiryDate;
    }
    await trainingRecord.update(updateData);
    _logger.logger.info(`Training progress updated for training ID: ${trainingId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Training progress updated successfully',
      data: trainingRecord
    });
  } catch (error) {
    _logger.logger.error('Update training progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get training compliance report
 * GET /api/v1/lms/compliance
 */
const getComplianceReport = exports.getComplianceReport = [(0, _expressValidator.query)('department').optional().isString(), (0, _expressValidator.query)('includeExpired').optional().isBoolean(), async (req, res) => {
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
      department,
      includeExpired
    } = req.query;

    // Build where clause
    let whereClause = '';
    const replacements = [];
    if (department) {
      whereClause += ' AND u.department = ?';
      replacements.push(department);
    }
    if (includeExpired !== 'true') {
      whereClause += ' AND (tr.expiry_date IS NULL OR tr.expiry_date > NOW())';
    }

    // Get compliance data
    const complianceData = await _database.sequelize.query(`
        SELECT
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.department,
          u.role,
          COUNT(CASE WHEN tr.status = 'completed' THEN 1 END) as completed_trainings,
          COUNT(CASE WHEN tr.status IN ('assigned', 'in-progress') THEN 1 END) as pending_trainings,
          COUNT(CASE WHEN tr.expiry_date < NOW() THEN 1 END) as expired_trainings,
          COUNT(tc.id) as total_required_trainings,
          ROUND(
            (COUNT(CASE WHEN tr.status = 'completed' THEN 1 END) /
             NULLIF(COUNT(tc.id), 0)) * 100, 2
          ) as compliance_percentage
        FROM users u
        CROSS JOIN training_courses tc
        LEFT JOIN training_records tr ON u.id = tr.user_id AND tc.id = tr.course_id
        WHERE tc.is_required = 1 ${whereClause}
        GROUP BY u.id, u.first_name, u.last_name, u.department, u.role
        ORDER BY compliance_percentage ASC
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Training compliance report generated by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Training compliance report generated successfully',
      data: complianceData
    });
  } catch (error) {
    _logger.logger.error('Get compliance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get LMS dashboard data
 * GET /api/v1/lms/dashboard
 */
const getLMSDashboard = exports.getLMSDashboard = [async (req, res) => {
  try {
    // Get LMS metrics
    const metrics = await _database.sequelize.query(`
        SELECT
          COUNT(DISTINCT tc.id) as total_courses,
          COUNT(DISTINCT CASE WHEN tc.is_required = 1 THEN tc.id END) as required_courses,
          COUNT(DISTINCT tr.id) as total_assignments,
          COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.id END) as completed_trainings,
          COUNT(DISTINCT CASE WHEN tr.expiry_date < NOW() THEN tr.id END) as expired_trainings,
          AVG(CASE WHEN tr.status = 'completed' THEN tr.score END) as avg_score
        FROM training_courses tc
        LEFT JOIN training_records tr ON tc.id = tr.course_id
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get recent training completions
    const recentCompletions = await _database.sequelize.query(`
        SELECT
          tr.*,
          u.first_name,
          u.last_name,
          tc.title as course_title,
          tc.category
        FROM training_records tr
        JOIN users u ON tr.user_id = u.id
        JOIN training_courses tc ON tr.course_id = tc.id
        WHERE tr.status = 'completed' AND tr.completion_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY tr.completion_date DESC
        LIMIT 10
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get overdue trainings
    const overdueTrainings = await _database.sequelize.query(`
        SELECT
          tr.*,
          u.first_name,
          u.last_name,
          tc.title as course_title,
          DATEDIFF(NOW(), tr.due_date) as days_overdue
        FROM training_records tr
        JOIN users u ON tr.user_id = u.id
        JOIN training_courses tc ON tr.course_id = tc.id
        WHERE tr.status IN ('assigned', 'in-progress') AND tr.due_date < NOW()
        ORDER BY tr.due_date ASC
        LIMIT 10
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`LMS dashboard data retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'LMS dashboard data retrieved successfully',
      data: {
        metrics: metrics[0],
        recentCompletions,
        overdueTrainings,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    _logger.logger.error('Get LMS dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];