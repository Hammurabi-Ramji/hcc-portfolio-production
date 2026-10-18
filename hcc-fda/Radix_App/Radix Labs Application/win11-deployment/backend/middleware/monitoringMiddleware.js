"use strict";

// Monitoring middleware (example: request logging)
module.exports = function monitoringMiddleware(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};