"use strict";

// Utility to track usage (basic example)
let usage = {};
module.exports = {
  increment: function (key) {
    usage[key] = (usage[key] || 0) + 1;
  },
  get: function (key) {
    return usage[key] || 0;
  },
  reset: function (key) {
    usage[key] = 0;
  }
};