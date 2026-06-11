"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateUser = exports.getUsersDashboard = exports.getUsers = exports.getUserPermissions = exports.getUserById = exports.getUserActivity = exports.createUser = exports.changeUserPassword = void 0;
var _expressValidator = require("express-validator");
var _User = require("../models/User.js");
var _TrainingRecord = require("../models/TrainingRecord.js");
var _bcryptjs = _interopRequireDefault(require("bcryptjs"));
var _logger = require("../utils/logger.js");
var _database = require("../config/database.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Get all users with optional filtering
 * GET /api/v1/users
 */
const getUsers = exports.getUsers = [(0, _expressValidator.query)('role').optional().isIn(['admin', 'manager', 'operator', 'quality', 'regulatory', 'training']), (0, _expressValidator.query)('department').optional().isString(), (0, _expressValidator.query)('status').optional().isIn(['active', 'inactive', 'suspended']), (0, _expressValidator.query)('page').optional().isInt({
  min: 1
}), (0, _expressValidator.query)('limit').optional().isInt({
  min: 1,
  max: 100
}), async (req, res) => {
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
      role,
      department,
      status,
      page = 1,
      limit = 20
    } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = '';
    const replacements = [];
    if (role) {
      whereClause += ' AND role = ?';
      replacements.push(role);
    }
    if (department) {
      whereClause += ' AND department = ?';
      replacements.push(department);
    }
    if (status) {
      whereClause += ' AND status = ?';
      replacements.push(status);
    }

    // Get users with pagination
    const users = await _database.sequelize.query(`
        SELECT
          id,
          first_name,
          last_name,
          email,
          role,
          department,
          status,
          last_login,
          created_at,
          updated_at
        FROM users
        WHERE 1=1 ${whereClause}
        ORDER BY last_name, first_name
        LIMIT ? OFFSET ?
      `, {
      replacements: [...replacements, limit, offset],
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get total count
    const countResult = await _database.sequelize.query(`
        SELECT COUNT(*) as total FROM users WHERE 1=1 ${whereClause}
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.SELECT
    });
    const total = countResult[0].total;
    _logger.logger.info(`Users retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    _logger.logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get user by ID
 * GET /api/v1/users/:userId
 */
const getUserById = exports.getUserById = [(0, _expressValidator.param)('userId').isInt({
  min: 1
}).withMessage('Valid user ID is required'), async (req, res) => {
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

    // Get user details
    const user = await _database.sequelize.query(`
        SELECT
          id,
          first_name,
          last_name,
          email,
          role,
          department,
          status,
          employee_id,
          hire_date,
          last_login,
          created_at,
          updated_at
        FROM users
        WHERE id = ?
      `, {
      replacements: [userId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    _logger.logger.info(`User details retrieved for ID: ${userId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'User details retrieved successfully',
      data: user[0]
    });
  } catch (error) {
    _logger.logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Create new user
 * POST /api/v1/users
 */
const createUser = exports.createUser = [(0, _expressValidator.body)('firstName').isString().notEmpty().withMessage('First name is required'), (0, _expressValidator.body)('lastName').isString().notEmpty().withMessage('Last name is required'), (0, _expressValidator.body)('email').isEmail().withMessage('Valid email is required'), (0, _expressValidator.body)('password').isLength({
  min: 8
}).withMessage('Password must be at least 8 characters'), (0, _expressValidator.body)('role').isIn(['admin', 'manager', 'operator', 'quality', 'regulatory', 'training']).withMessage('Valid role is required'), (0, _expressValidator.body)('department').isString().notEmpty().withMessage('Department is required'), (0, _expressValidator.body)('employeeId').optional().isString(), async (req, res) => {
  try {
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const userData = req.body;

    // Check if email already exists
    const existingUser = await _database.sequelize.query(`
        SELECT id FROM users WHERE email = ?
      `, {
      replacements: [userData.email],
      type: _database.sequelize.QueryTypes.SELECT
    });
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await _bcryptjs.default.hash(userData.password, saltRounds);

    // Create user
    const [userId] = await _database.sequelize.query(`
        INSERT INTO users (
          first_name, last_name, email, password_hash,
          role, department, employee_id, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
      `, {
      replacements: [userData.firstName, userData.lastName, userData.email, hashedPassword, userData.role, userData.department, userData.employeeId],
      type: _database.sequelize.QueryTypes.INSERT
    });
    _logger.logger.info(`User created: ${userData.email} by user: ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        userId
      }
    });
  } catch (error) {
    _logger.logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Update user
 * PUT /api/v1/users/:userId
 */
const updateUser = exports.updateUser = [(0, _expressValidator.param)('userId').isInt({
  min: 1
}).withMessage('Valid user ID is required'), (0, _expressValidator.body)('firstName').optional().isString().notEmpty(), (0, _expressValidator.body)('lastName').optional().isString().notEmpty(), (0, _expressValidator.body)('email').optional().isEmail(), (0, _expressValidator.body)('role').optional().isIn(['admin', 'manager', 'operator', 'quality', 'regulatory', 'training']), (0, _expressValidator.body)('department').optional().isString(), (0, _expressValidator.body)('status').optional().isIn(['active', 'inactive', 'suspended']), (0, _expressValidator.body)('employeeId').optional().isString(), async (req, res) => {
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
    const updateData = req.body;

    // Check if user exists
    const existingUser = await _database.sequelize.query(`
        SELECT id FROM users WHERE id = ?
      `, {
      replacements: [userId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (updateData.email) {
      const emailCheck = await _database.sequelize.query(`
          SELECT id FROM users WHERE email = ? AND id != ?
        `, {
        replacements: [updateData.email, userId],
        type: _database.sequelize.QueryTypes.SELECT
      });
      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Build update query
    const updateFields = [];
    const replacements = [];
    if (updateData.firstName) {
      updateFields.push('first_name = ?');
      replacements.push(updateData.firstName);
    }
    if (updateData.lastName) {
      updateFields.push('last_name = ?');
      replacements.push(updateData.lastName);
    }
    if (updateData.email) {
      updateFields.push('email = ?');
      replacements.push(updateData.email);
    }
    if (updateData.role) {
      updateFields.push('role = ?');
      replacements.push(updateData.role);
    }
    if (updateData.department) {
      updateFields.push('department = ?');
      replacements.push(updateData.department);
    }
    if (updateData.status) {
      updateFields.push('status = ?');
      replacements.push(updateData.status);
    }
    if (updateData.employeeId !== undefined) {
      updateFields.push('employee_id = ?');
      replacements.push(updateData.employeeId);
    }
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    updateFields.push('updated_at = NOW()');
    replacements.push(userId);
    await _database.sequelize.query(`
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, {
      replacements,
      type: _database.sequelize.QueryTypes.UPDATE
    });
    _logger.logger.info(`User updated: ${userId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    _logger.logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Change user password
 * PUT /api/v1/users/:userId/password
 */
const changeUserPassword = exports.changeUserPassword = [(0, _expressValidator.param)('userId').isInt({
  min: 1
}).withMessage('Valid user ID is required'), (0, _expressValidator.body)('currentPassword').optional().isLength({
  min: 8
}), (0, _expressValidator.body)('newPassword').isLength({
  min: 8
}).withMessage('New password must be at least 8 characters'), async (req, res) => {
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
      currentPassword,
      newPassword
    } = req.body;

    // Get user
    const user = await _database.sequelize.query(`
        SELECT id, password_hash FROM users WHERE id = ?
      `, {
      replacements: [userId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password if provided (for non-admin password changes)
    if (currentPassword && req.user.id !== userId) {
      const isValidPassword = await _bcryptjs.default.compare(currentPassword, user[0].password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await _bcryptjs.default.hash(newPassword, saltRounds);

    // Update password
    await _database.sequelize.query(`
        UPDATE users
        SET password_hash = ?, updated_at = NOW()
        WHERE id = ?
      `, {
      replacements: [hashedPassword, userId],
      type: _database.sequelize.QueryTypes.UPDATE
    });
    _logger.logger.info(`Password changed for user: ${userId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    _logger.logger.error('Change user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get user permissions
 * GET /api/v1/users/:userId/permissions
 */
const getUserPermissions = exports.getUserPermissions = [(0, _expressValidator.param)('userId').isInt({
  min: 1
}).withMessage('Valid user ID is required'), async (req, res) => {
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

    // Get user role
    const user = await _database.sequelize.query(`
        SELECT role FROM users WHERE id = ?
      `, {
      replacements: [userId],
      type: _database.sequelize.QueryTypes.SELECT
    });
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Define permissions based on role
    const rolePermissions = {
      admin: ['users.create', 'users.read', 'users.update', 'users.delete', 'work_orders.create', 'work_orders.read', 'work_orders.update', 'quality_tests.create', 'quality_tests.read', 'quality_tests.update', 'regulatory_submissions.create', 'regulatory_submissions.read', 'regulatory_submissions.update', 'training.create', 'training.read', 'training.update', 'reports.read', 'system.admin'],
      manager: ['users.read', 'users.update', 'work_orders.create', 'work_orders.read', 'work_orders.update', 'quality_tests.read', 'quality_tests.update', 'regulatory_submissions.read', 'regulatory_submissions.update', 'training.create', 'training.read', 'training.update', 'reports.read'],
      operator: ['work_orders.read', 'work_orders.update', 'quality_tests.read', 'training.read'],
      quality: ['quality_tests.create', 'quality_tests.read', 'quality_tests.update', 'work_orders.read', 'training.read', 'reports.read'],
      regulatory: ['regulatory_submissions.create', 'regulatory_submissions.read', 'regulatory_submissions.update', 'compliance_documents.create', 'compliance_documents.read', 'compliance_documents.update', 'training.read', 'reports.read'],
      training: ['training.create', 'training.read', 'training.update', 'users.read', 'reports.read']
    };
    const permissions = rolePermissions[user[0].role] || [];
    _logger.logger.info(`User permissions retrieved for user ID: ${userId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'User permissions retrieved successfully',
      data: {
        userId,
        role: user[0].role,
        permissions
      }
    });
  } catch (error) {
    _logger.logger.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get user activity log
 * GET /api/v1/users/:userId/activity
 */
const getUserActivity = exports.getUserActivity = [(0, _expressValidator.param)('userId').isInt({
  min: 1
}).withMessage('Valid user ID is required'), (0, _expressValidator.query)('startDate').optional().isISO8601(), (0, _expressValidator.query)('endDate').optional().isISO8601(), (0, _expressValidator.query)('limit').optional().isInt({
  min: 1,
  max: 100
}), async (req, res) => {
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
      startDate,
      endDate,
      limit = 50
    } = req.query;

    // Build where clause
    let whereClause = 'user_id = ?';
    const replacements = [userId];
    if (startDate) {
      whereClause += ' AND created_at >= ?';
      replacements.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND created_at <= ?';
      replacements.push(endDate);
    }

    // Get user activity (simplified - in real implementation would have an ActivityLog model)
    const activities = await _database.sequelize.query(`
        SELECT
          id,
          action,
          resource_type,
          resource_id,
          description,
          ip_address,
          created_at
        FROM user_activity_logs
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ?
      `, {
      replacements: [...replacements, limit],
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`User activity retrieved for user ID: ${userId} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'User activity retrieved successfully',
      data: activities
    });
  } catch (error) {
    _logger.logger.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Get users dashboard data
 * GET /api/v1/users/dashboard
 */
const getUsersDashboard = exports.getUsersDashboard = [async (req, res) => {
  try {
    // Get user statistics
    const stats = await _database.sequelize.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
          COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_users,
          COUNT(CASE WHEN role = 'operator' THEN 1 END) as operator_users,
          COUNT(CASE WHEN role = 'quality' THEN 1 END) as quality_users,
          COUNT(CASE WHEN role = 'regulatory' THEN 1 END) as regulatory_users,
          COUNT(CASE WHEN role = 'training' THEN 1 END) as training_users
        FROM users
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get recent user registrations
    const recentUsers = await _database.sequelize.query(`
        SELECT
          id,
          first_name,
          last_name,
          email,
          role,
          department,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });

    // Get users by department
    const departmentStats = await _database.sequelize.query(`
        SELECT
          department,
          COUNT(*) as user_count,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
        FROM users
        GROUP BY department
        ORDER BY user_count DESC
      `, {
      type: _database.sequelize.QueryTypes.SELECT
    });
    _logger.logger.info(`Users dashboard data retrieved by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Users dashboard data retrieved successfully',
      data: {
        stats: stats[0],
        recentUsers,
        departmentStats,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    _logger.logger.error('Get users dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];