"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unblockIP = exports.securityMonitor = exports.getSecurityStats = exports.clearBlockedIPs = void 0;
var _auditMiddleware = require("./auditMiddleware.js");
/**
 * Security monitoring middleware
 * Detects and logs suspicious activities
 */

// Store for tracking suspicious patterns
const suspiciousActivityTracker = new Map();
const BLOCKED_IPS = new Set();
const SUSPICIOUS_PATTERNS = {
  // SQL injection patterns
  sqlInjection: /(\bUNION\b|\bSELECT\b.*\bFROM\b|\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b).*(\bor\b|\band\b).*(\d+\s*=\s*\d+)/i,
  // XSS patterns
  xss: /<script[^>]*>.*?<\/script>|<iframe[^>]*>.*?<\/iframe>|<object[^>]*>.*?<\/object>/i,
  // Path traversal
  pathTraversal: /\.\.[\/\\]/,
  // Command injection
  commandInjection: /[;&|`$()]/
};

/**
 * Middleware to detect and prevent suspicious activities
 */
const securityMonitor = (req, res, next) => {
  const clientIP = req.ip;
  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl;
  const method = req.method;

  // Skip monitoring for health checks and static files
  if (url === '/health' || url.startsWith('/public') || url.startsWith('/uploads')) {
    return next();
  }

  // Check if IP is blocked
  if (BLOCKED_IPS.has(clientIP)) {
    (0, _auditMiddleware.auditSecurityEvent)('blocked_ip_access', {
      ip: clientIP,
      url,
      method,
      userAgent
    }, req, req.user);
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Detect suspicious patterns in request
  const suspiciousPatterns = detectSuspiciousPatterns(req);
  if (suspiciousPatterns.length > 0) {
    var _suspiciousActivityTr;
    // Track suspicious activity
    trackSuspiciousActivity(clientIP, suspiciousPatterns, req);

    // Check if this IP has exceeded suspicious activity threshold
    const activityCount = ((_suspiciousActivityTr = suspiciousActivityTracker.get(clientIP)) === null || _suspiciousActivityTr === void 0 ? void 0 : _suspiciousActivityTr.count) || 0;
    if (activityCount >= 5) {
      // Block after 5 suspicious activities
      BLOCKED_IPS.add(clientIP);
      (0, _auditMiddleware.auditSecurityEvent)('ip_blocked', {
        ip: clientIP,
        reason: 'excessive_suspicious_activity',
        patterns: suspiciousPatterns
      }, req, req.user);
      return res.status(403).json({
        success: false,
        message: 'Access denied due to suspicious activity'
      });
    }

    // Log suspicious activity
    (0, _auditMiddleware.auditSecurityEvent)('suspicious_activity', {
      ip: clientIP,
      patterns: suspiciousPatterns,
      url,
      method,
      userAgent
    }, req, req.user);
  }

  // Detect unusual request patterns
  detectUnusualPatterns(req);
  next();
};

/**
 * Detect suspicious patterns in the request
 */
exports.securityMonitor = securityMonitor;
function detectSuspiciousPatterns(req) {
  const patterns = [];
  const checkString = `${req.originalUrl} ${JSON.stringify(req.body || {})} ${JSON.stringify(req.query || {})}`;
  Object.entries(SUSPICIOUS_PATTERNS).forEach(([patternName, regex]) => {
    if (regex.test(checkString)) {
      patterns.push(patternName);
    }
  });
  return patterns;
}

/**
 * Track suspicious activity for an IP
 */
function trackSuspiciousActivity(ip, patterns, req) {
  const existing = suspiciousActivityTracker.get(ip) || {
    count: 0,
    patterns: new Set(),
    lastActivity: null
  };
  existing.count += 1;
  patterns.forEach(pattern => existing.patterns.add(pattern));
  existing.lastActivity = new Date();

  // Clean up old entries (older than 1 hour)
  if (existing.lastActivity - (existing.firstActivity || existing.lastActivity) > 60 * 60 * 1000) {
    existing.count = 1;
    existing.patterns.clear();
    existing.firstActivity = existing.lastActivity;
  }
  suspiciousActivityTracker.set(ip, existing);
}

/**
 * Detect unusual request patterns
 */
function detectUnusualPatterns(req) {
  const clientIP = req.ip;
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || '';

  // Detect rapid requests to the same endpoint
  // This would need a more sophisticated implementation with a proper cache/store

  // Detect requests with unusual user agents
  if (!userAgent || userAgent.length < 10) {
    (0, _auditMiddleware.auditSecurityEvent)('unusual_user_agent', {
      ip: clientIP,
      userAgent,
      url,
      method
    }, req, req.user);
  }

  // Detect requests to non-existent endpoints (handled by 404 handler)
  // This will be logged by the audit middleware

  // Detect potential brute force on auth endpoints
  if (url.includes('/auth/') && method === 'POST') {
    // Additional brute force detection could be implemented here
  }
}

/**
 * Get security monitoring stats
 */
const getSecurityStats = () => {
  return {
    blockedIPs: Array.from(BLOCKED_IPS),
    suspiciousActivityCount: suspiciousActivityTracker.size,
    suspiciousActivities: Array.from(suspiciousActivityTracker.entries()).map(([ip, data]) => ({
      ip,
      count: data.count,
      patterns: Array.from(data.patterns),
      lastActivity: data.lastActivity
    }))
  };
};

/**
 * Clear blocked IPs (admin function)
 */
exports.getSecurityStats = getSecurityStats;
const clearBlockedIPs = () => {
  BLOCKED_IPS.clear();
  suspiciousActivityTracker.clear();
};

/**
 * Unblock specific IP
 */
exports.clearBlockedIPs = clearBlockedIPs;
const unblockIP = ip => {
  BLOCKED_IPS.delete(ip);
  suspiciousActivityTracker.delete(ip);
};
exports.unblockIP = unblockIP;