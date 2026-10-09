"use strict";

// API Key middleware
module.exports = function apiKeyMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.API_KEY) {
    return next();
  }
  res.status(403).json({
    error: 'Forbidden: Invalid API Key'
  });
};