"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.notFound = exports.errorHandler = exports.catchAsync = exports.AppError = void 0;
var _logger = require("../utils/logger.js");
// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Sequelize errors
exports.AppError = AppError;
const handleSequelizeError = err => {
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
    return new AppError("Validation Error", 400);
  }
  if (err.name === "SequelizeUniqueConstraintError") {
    return new AppError("Duplicate entry found", 409);
  }
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return new AppError("Related record not found", 404);
  }
  if (err.name === "SequelizeConnectionError") {
    return new AppError("Database connection error", 503);
  }
  return new AppError("Database error", 500);
};

// Handle JWT errors
const handleJWTError = () => new AppError("Invalid token. Please log in again.", 401);
const handleJWTExpiredError = () => new AppError("Your token has expired. Please log in again.", 401);

// Handle Multer errors
const handleMulterError = err => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return new AppError("File too large", 400);
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    return new AppError("Too many files", 400);
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return new AppError("Unexpected file field", 400);
  }
  return new AppError("File upload error", 400);
};

// Send error in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send error in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    _logger.logger.error("ERROR 💥", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong!"
    });
  }
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = {
    ...err
  };
  error.message = err.message;

  // Log error
  _logger.logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.email : "anonymous"
  });

  // Handle specific error types
  if (err.name === "SequelizeError") {
    error = handleSequelizeError(err);
  }
  if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  }
  if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }
  if (err.name === "MulterError") {
    error = handleMulterError(err);
  }

  // Send appropriate error response
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error wrapper
exports.errorHandler = errorHandler;
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler
exports.catchAsync = catchAsync;
const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};
exports.notFound = notFound;