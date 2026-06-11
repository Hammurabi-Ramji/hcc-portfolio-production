"use strict";

// Utility to capture errors
module.exports = function capture(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};