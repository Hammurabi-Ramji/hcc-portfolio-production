"use strict";

// Error handling middleware
module.exports = function errorMiddleware(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error'
  });
};