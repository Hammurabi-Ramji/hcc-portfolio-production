"use strict";

// Utility to get system info (basic example)
const os = require('os');
module.exports = function getSystemInfo() {
  return {
    platform: os.platform(),
    cpus: os.cpus().length,
    memory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime()
  };
};