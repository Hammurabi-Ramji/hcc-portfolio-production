"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _cors = _interopRequireDefault(require("cors"));
var _helmet = _interopRequireDefault(require("helmet"));
var _compression = _interopRequireDefault(require("compression"));
var _dotenv = _interopRequireDefault(require("dotenv"));
var _http = require("http");
var _socket = require("socket.io");
var _path = _interopRequireDefault(require("path"));
var _url = require("url");
var _database = require("./config/database.js");
var _passport = require("./config/passport.js");
var _security = require("./config/security.js");
var _logger = require("./utils/logger.js");
var _errorHandler = require("./middleware/errorHandler.js");
var _rateLimiter = require("./middleware/rateLimiter.js");
var _auditMiddleware = require("./middleware/auditMiddleware.js");
var _securityMonitor = require("./middleware/securityMonitor.js");
var _auth = _interopRequireDefault(require("./routes/auth.js"));
var _users = _interopRequireDefault(require("./routes/users.js"));
var _erp = _interopRequireDefault(require("./routes/erp.js"));
var _rds = _interopRequireDefault(require("./routes/rds.js"));
var _lms = _interopRequireDefault(require("./routes/lms.js"));
var _regulatory = _interopRequireDefault(require("./routes/regulatory.js"));
var _manufacturingRoutes = _interopRequireDefault(require("./routes/manufacturingRoutes.js"));
var _qualityRoutes = _interopRequireDefault(require("./routes/qualityRoutes.js"));
var _api = _interopRequireDefault(require("./routes/api.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Import configurations and middleware

// Import routes

// Load environment variables
_dotenv.default.config();

// Get directory paths
const _dirname = process.cwd();
const app = (0, _express.default)();
const server = (0, _http.createServer)(app);
const io = new _socket.Server(server, {
  cors: {
    origin: _security.securityConfig.cors.origin,
    methods: _security.securityConfig.cors.methods,
    credentials: _security.securityConfig.cors.credentials
  }
});

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use((0, _helmet.default)({
  contentSecurityPolicy: _security.securityConfig.helmet.contentSecurityPolicy,
  hsts: _security.securityConfig.helmet.hsts,
  noSniff: _security.securityConfig.helmet.noSniff,
  xssFilter: _security.securityConfig.helmet.xssFilter,
  referrerPolicy: _security.securityConfig.helmet.referrerPolicy
}));

// CORS configuration
app.use((0, _cors.default)({
  origin: _security.securityConfig.cors.origin,
  credentials: _security.securityConfig.cors.credentials,
  methods: _security.securityConfig.cors.methods,
  allowedHeaders: _security.securityConfig.cors.allowedHeaders,
  maxAge: _security.securityConfig.cors.maxAge
}));

// Body parsing middleware
app.use(_express.default.json({
  limit: _security.securityConfig.validation.maxRequestSize
}));
app.use(_express.default.urlencoded({
  extended: true,
  limit: _security.securityConfig.validation.maxRequestSize
}));

// Compression middleware
app.use((0, _compression.default)());

// Rate limiting
app.use(_rateLimiter.rateLimiter);

// Audit logging middleware
app.use(_auditMiddleware.auditMiddleware);

// Security monitoring middleware
app.use(_securityMonitor.securityMonitor);

// Static files
app.use('/uploads', _express.default.static(_path.default.join(_dirname, 'uploads')));
app.use('/public', _express.default.static(_path.default.join(_dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/v1/auth', _auth.default);
app.use('/api/v1/users', _users.default);
app.use('/api/v1/erp', _erp.default);
app.use('/api/v1/rds', _rds.default);
app.use('/api/v1/lms', _lms.default);
app.use('/api/v1/regulatory', _regulatory.default);
app.use('/api/v1/manufacturing', _manufacturingRoutes.default);
app.use('/api/v1/quality', _qualityRoutes.default);
app.use('/api/v1', _api.default);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(_errorHandler.errorHandler);

// Socket.IO configuration
io.on('connection', socket => {
  _logger.logger.info(`Client connected: ${socket.id}`);

  // Join user-specific room
  socket.on('join', userId => {
    socket.join(`user_${userId}`);
    _logger.logger.info(`User ${userId} joined room`);
  });

  // Join role-specific room
  socket.on('join-role', role => {
    socket.join(`role_${role}`);
    _logger.logger.info(`Socket joined role room: ${role}`);
  });

  // Real-time notifications
  socket.on('notification', data => {
    // Broadcast to relevant users/roles
    if (data.userId) {
      io.to(`user_${data.userId}`).emit('notification', data);
    }
    if (data.role) {
      io.to(`role_${data.role}`).emit('notification', data);
    }
  });

  // ERP real-time updates
  socket.on('erp-update', data => {
    io.to(`role_production_manager`).emit('erp-update', data);
    io.to(`role_quality_manager`).emit('erp-update', data);
  });

  // Regulatory updates
  socket.on('regulatory-update', data => {
    io.to(`role_compliance_manager`).emit('regulatory-update', data);
    io.to(`role_auditor`).emit('regulatory-update', data);
  });
  socket.on('disconnect', () => {
    _logger.logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Global socket instance for use in other modules
global.io = io;

// Initialize and start server
(async () => {
  try {
    // Initialize database connection
    await (0, _database.connectDatabase)();

    // Initialize passport
    (0, _passport.configurePassport)();

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      _logger.logger.info(`🚀 Radix Unified ERP Backend Server running on port ${PORT}`);
      _logger.logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      _logger.logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      _logger.logger.info(`🗄️  Database: ${process.env.DB_NAME || 'radix_erp'}`);
    });
  } catch (error) {
    _logger.logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  _logger.logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    _logger.logger.info('Process terminated');
    process.exit(0);
  });
});
process.on('SIGINT', () => {
  _logger.logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    _logger.logger.info('Process terminated');
    process.exit(0);
  });
});
var _default = exports.default = app;