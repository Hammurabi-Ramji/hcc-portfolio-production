"use strict";

// Utility to add a timeout to async operations
module.exports = function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))]);
};