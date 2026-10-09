"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateRequest = void 0;
var _expressValidator = require("express-validator");
/**
 * Middleware to handle validation results from express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = (0, _expressValidator.validationResult)(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};
exports.validateRequest = validateRequest;