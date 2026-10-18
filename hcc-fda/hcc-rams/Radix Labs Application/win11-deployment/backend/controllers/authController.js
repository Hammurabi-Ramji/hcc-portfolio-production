"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.verify2FA = exports.verify = exports.updateProfile = exports.setup2FA = exports.resetPassword = exports.register = exports.refreshToken = exports.logout = exports.login = exports.getProfile = exports.forgotPassword = exports.changePassword = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _passport = _interopRequireDefault(require("passport"));
var _crypto = _interopRequireDefault(require("crypto"));
var _expressValidator = require("express-validator");
var _sequelize = require("sequelize");
var _User = require("../models/User.js");
var _logger = require("../utils/logger.js");
var _emailService = require("../services/emailService.js");
var _auditMiddleware = require("../middleware/auditMiddleware.js");
var _security = require("../config/security.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const JWT_SECRET = _security.securityConfig.jwt.secret;
const JWT_EXPIRES_IN = _security.securityConfig.jwt.expiresIn;

// Generate JWT token
const generateToken = user => {
  return _jsonwebtoken.default.sign({
    id: user.id,
    email: user.email,
    role: user.role,
    department: user.department
  }, _security.securityConfig.jwt.secret, {
    expiresIn: _security.securityConfig.jwt.expiresIn,
    issuer: _security.securityConfig.jwt.issuer,
    audience: _security.securityConfig.jwt.audience
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = exports.register = [
// Validation
(0, _expressValidator.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'), (0, _expressValidator.body)('password').isLength({
  min: 8
}).withMessage('Password must be at least 8 characters long').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'), (0, _expressValidator.body)('firstName').if((value, {
  req
}) => req.body.firstName !== undefined).trim().isLength({
  min: 1
}).withMessage('First name is required'), (0, _expressValidator.body)('lastName').if((value, {
  req
}) => req.body.lastName !== undefined).trim().isLength({
  min: 1
}).withMessage('Last name is required'),
// Public self-registration only ever creates a standard user. Privileged roles
// are assigned afterwards by an administrator through the protected users API.
(0, _expressValidator.body)('role').optional({
  checkFalsy: true
}).equals('user').withMessage('Public registration creates standard user accounts; privileged roles are assigned by an administrator'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      email,
      password,
      firstName,
      lastName,
      first_name,
      last_name,
      department,
      employee_id
    } = req.body;

    // Support both camelCase (frontend) and snake_case formats
    const normalizedFirstName = firstName || first_name;
    const normalizedLastName = lastName || last_name;

    // Check if user already exists
    const existingUser = await _User.User.findOne({
      where: {
        email: email.toLowerCase()
      }
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check employee ID uniqueness if provided
    if (employee_id) {
      const existingEmployee = await _User.User.findOne({
        where: {
          employee_id
        }
      });
      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Create user
    const user = await _User.User.create({
      email: email.toLowerCase(),
      password,
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      role: 'user',
      department,
      employee_id
    });

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = {
      ...user.toJSON()
    };
    delete userResponse.password;
    _logger.logger.info(`New user registered: ${user.email} (${user.role})`);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    _logger.logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = exports.login = [
// Validation
(0, _expressValidator.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'), (0, _expressValidator.body)('password').notEmpty().withMessage('Password is required'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    _passport.default.authenticate('local', {
      session: false
    }, async (err, user, info) => {
      if (err) {
        _logger.logger.error('Login error:', err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
      if (!user) {
        (0, _auditMiddleware.auditAuthEvent)('login_failure', {
          reason: 'invalid_credentials',
          email: req.body.email
        }, req);
        return res.status(401).json({
          success: false,
          message: info.message || 'Invalid credentials'
        });
      }

      // Update last login
      await _User.User.update({
        last_login: new Date()
      }, {
        where: {
          id: user.id
        }
      });

      // Generate token
      const token = generateToken(user);
      _logger.logger.info(`User logged in: ${user.email}`);
      (0, _auditMiddleware.auditAuthEvent)('login_success', {
        userId: user.id,
        email: user.email,
        role: user.role
      }, req, user);
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token
        }
      });
    })(req, res);
  } catch (error) {
    _logger.logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// @desc    Verify JWT token
// @route   GET /api/v1/auth/verify
// @access  Private
const verify = async (req, res) => {
  try {
    const user = await _User.User.findByPk(req.user.id, {
      attributes: {
        exclude: ['password']
      }
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    _logger.logger.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/profile
// @access  Private
exports.verify = verify;
const getProfile = async (req, res) => {
  try {
    const user = await _User.User.findByPk(req.user.id, {
      attributes: {
        exclude: ['password']
      }
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    _logger.logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.getProfile = getProfile;
const updateProfile = exports.updateProfile = [
// Validation
(0, _expressValidator.body)('first_name').optional().trim().isLength({
  min: 1
}).withMessage('First name cannot be empty'), (0, _expressValidator.body)('last_name').optional().trim().isLength({
  min: 1
}).withMessage('Last name cannot be empty'), (0, _expressValidator.body)('phone').optional().isMobilePhone().withMessage('Invalid phone number'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      first_name,
      last_name,
      phone,
      preferences
    } = req.body;
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (preferences) updateData.preferences = preferences;
    await _User.User.update(updateData, {
      where: {
        id: req.user.id
      }
    });
    const updatedUser = await _User.User.findByPk(req.user.id, {
      attributes: {
        exclude: ['password']
      }
    });
    _logger.logger.info(`User profile updated: ${req.user.email}`);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    _logger.logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = exports.changePassword = [
// Validation
(0, _expressValidator.body)('current_password').notEmpty().withMessage('Current password is required'), (0, _expressValidator.body)('new_password').isLength({
  min: 8
}).withMessage('New password must be at least 8 characters long').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      current_password,
      new_password
    } = req.body;

    // Get user with password
    const user = await _User.User.findByPk(req.user.id);

    // Check current password
    const isValidPassword = await user.checkPassword(current_password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password using instance method to trigger hooks
    user.password = new_password;
    await user.save();
    _logger.logger.info(`Password changed for user: ${req.user.email}`);
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    _logger.logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// @desc    Refresh JWT token
// @route   POST /api/v1/auth/refresh
// @access  Private
const refreshToken = async (req, res) => {
  try {
    // Generate new token with current user data
    const token = generateToken(req.user);
    _logger.logger.info(`Token refreshed for user: ${req.user.email}`);
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });
  } catch (error) {
    _logger.logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Setup 2FA for user
// @route   POST /api/v1/auth/setup-2fa
// @access  Private
exports.refreshToken = refreshToken;
const setup2FA = exports.setup2FA = [
// Validation
(0, _expressValidator.body)('enable').isBoolean().withMessage('Enable must be a boolean'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      enable
    } = req.body;
    const userId = req.user.id;
    if (enable) {
      // Generate TOTP secret
      const speakeasy = await Promise.resolve().then(() => _interopRequireWildcard(require('speakeasy')));
      const secret = speakeasy.generateSecret({
        name: `Radix Labs (${req.user.email})`,
        issuer: 'Radix Unified ERP'
      });

      // Update user with 2FA secret
      await _User.User.update({
        mfa_enabled: false,
        // Will be enabled after verification
        mfa_secret: secret.base32
      }, {
        where: {
          id: userId
        }
      });

      // Generate QR code URL for authenticator apps
      const qrCodeUrl = `otpauth://totp/Radix%20Labs%3A${encodeURIComponent(req.user.email)}?secret=${secret.base32}&issuer=Radix%20Unified%20ERP`;
      _logger.logger.info(`2FA setup initiated for user: ${req.user.email}`);
      res.json({
        success: true,
        message: '2FA setup initiated. Please verify with authenticator app.',
        data: {
          secret: secret.base32,
          qrCodeUrl,
          otpauth_url: secret.otpauth_url
        }
      });
    } else {
      // Disable 2FA
      await _User.User.update({
        mfa_enabled: false,
        mfa_secret: null
      }, {
        where: {
          id: userId
        }
      });
      _logger.logger.info(`2FA disabled for user: ${req.user.email}`);
      res.json({
        success: true,
        message: '2FA disabled successfully'
      });
    }
  } catch (error) {
    _logger.logger.error('Setup 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// @desc    Verify 2FA setup
// @route   POST /api/v1/auth/verify-2fa
// @access  Private
const verify2FA = exports.verify2FA = [
// Validation
(0, _expressValidator.body)('token').isLength({
  min: 6,
  max: 6
}).isNumeric().withMessage('Token must be a 6-digit number'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      token
    } = req.body;
    const userId = req.user.id;

    // Get user with MFA secret
    const user = await _User.User.findByPk(userId);
    if (!user.mfa_secret) {
      return res.status(400).json({
        success: false,
        message: '2FA not set up for this user'
      });
    }

    // Verify TOTP token
    const speakeasy = await Promise.resolve().then(() => _interopRequireWildcard(require('speakeasy')));
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (30 seconds) tolerance
    });
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

    // Enable 2FA for user
    await _User.User.update({
      mfa_enabled: true
    }, {
      where: {
        id: userId
      }
    });
    _logger.logger.info(`2FA enabled for user: ${req.user.email}`);
    res.json({
      success: true,
      message: '2FA setup completed successfully'
    });
  } catch (error) {
    _logger.logger.error('Verify 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// @desc    Request password reset
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = exports.forgotPassword = [
// Validation
(0, _expressValidator.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      email
    } = req.body;

    // Find user by email
    const user = await _User.User.findOne({
      where: {
        email: email.toLowerCase()
      }
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = _crypto.default.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await _User.User.update({
      password_reset_token: resetToken,
      password_reset_expires: resetTokenExpiry
    }, {
      where: {
        id: user.id
      }
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const emailData = {
      to: user.email,
      subject: 'Password Reset Request - Radix Labs',
      html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Radix Labs account.</p>
          <p>Please click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        `
    };
    await (0, _emailService.sendEmail)(emailData);
    _logger.logger.info(`Password reset requested for user: ${user.email}`);
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    _logger.logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = exports.resetPassword = [
// Validation
(0, _expressValidator.body)('token').notEmpty().withMessage('Reset token is required'), (0, _expressValidator.body)('password').isLength({
  min: 8
}).withMessage('Password must be at least 8 characters long').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'), async (req, res) => {
  try {
    // Check validation errors
    const errors = (0, _expressValidator.validationResult)(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const {
      token,
      password
    } = req.body;

    // Find user with valid reset token
    const user = await _User.User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          [_sequelize.Op.gt]: new Date()
        }
      }
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    await _User.User.update({
      password,
      password_reset_token: null,
      password_reset_expires: null
    }, {
      where: {
        id: user.id
      }
    });
    _logger.logger.info(`Password reset completed for user: ${user.email}`);
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    _logger.logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
const logout = async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // We can optionally blacklist the token on the server side, but for simplicity,
    // we'll just return a success response

    _logger.logger.info(`User logged out: ${req.user.email}`);
    (0, _auditMiddleware.auditAuthEvent)('logout', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    }, req, req.user);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    _logger.logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
exports.logout = logout;