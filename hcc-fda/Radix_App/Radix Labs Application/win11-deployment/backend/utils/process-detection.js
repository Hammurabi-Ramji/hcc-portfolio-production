"use strict";

// Utility for process detection (basic example)
const {
  exec
} = require('child_process');
module.exports = function detectProcess(processName, callback) {
  exec(`tasklist`, (err, stdout, stderr) => {
    if (err) return callback(err);
    const found = stdout.toLowerCase().includes(processName.toLowerCase());
    callback(null, found);
  });
};