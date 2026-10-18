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
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _User = require("./models/User.js");
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
//
// Every socket must present the same JWT as the REST API, in
// `io(url, { auth: { token } })` or an `Authorization: Bearer` handshake header.
// Identity and role come from the database, and a socket can only join its own
// user and role rooms. Client-originated broadcasts are limited to roles that
// own that kind of update, and carry the verified sender.
const SOCKET_BROADCAST_ROLES = {
  notification: ['admin', 'it_admin'],
  'erp-update': ['admin', 'production_manager', 'quality_manager'],
  'regulatory-update': ['admin', 'compliance_manager', 'regulatory_specialist']
};
io.use(async (socket, next) => {
  try {
    const header = socket.handshake.headers?.authorization;
    const token = socket.handshake.auth?.token || (typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null);
    if (!token) return next(new Error('Unauthorized'));
    const decoded = _jsonwebtoken.default.verify(token, _security.securityConfig.jwt.secret, {
      issuer: _security.securityConfig.jwt.issuer,
      audience: _security.securityConfig.jwt.audience
    });
    const user = await _User.User.findByPk(decoded.id);
    if (!user || user.status !== 'active') return next(new Error('Unauthorized'));
    socket.data.user = {
      id: String(user.id),
      role: user.role
    };
    next();
  } catch (error) {
    next(new Error('Unauthorized'));
  }
});
const canBroadcast = (socket, event) => SOCKET_BROADCAST_ROLES[event].includes(socket.data.user.role);
io.on('connection', socket => {
  const {
    id: userId,
    role: userRole
  } = socket.data.user;
  _logger.logger.info(`Client connected: ${socket.id} (user ${userId})`);
  socket.join(`user_${userId}`);
  socket.join(`role_${userRole}`);

  // Kept for existing clients; only the caller's own rooms can be joined.
  socket.on('join', requestedUserId => {
    if (String(requestedUserId) !== userId) {
      _logger.logger.warn(`Socket ${socket.id} (user ${userId}) refused join for user ${requestedUserId}`);
      return;
    }
    socket.join(`user_${userId}`);
  });
  socket.on('join-role', requestedRole => {
    if (requestedRole !== userRole) {
      _logger.logger.warn(`Socket ${socket.id} (user ${userId}) refused join for role ${requestedRole}`);
      return;
    }
    socket.join(`role_${userRole}`);
  });

  // Real-time notifications
  socket.on('notification', data => {
    if (!canBroadcast(socket, 'notification') || !data || typeof data !== 'object') return;
    const message = {
      ...data,
      from: userId
    };
    if (data.userId) {
      io.to(`user_${data.userId}`).emit('notification', message);
    }
    if (data.role) {
      io.to(`role_${data.role}`).emit('notification', message);
    }
  });

  // ERP real-time updates
  socket.on('erp-update', data => {
    if (!canBroadcast(socket, 'erp-update')) return;
    const message = {
      ...(data && typeof data === 'object' ? data : {
        value: data
      }),
      from: userId
    };
    io.to(`role_production_manager`).emit('erp-update', message);
    io.to(`role_quality_manager`).emit('erp-update', message);
  });

  // Regulatory updates
  socket.on('regulatory-update', data => {
    if (!canBroadcast(socket, 'regulatory-update')) return;
    const message = {
      ...(data && typeof data === 'object' ? data : {
        value: data
      }),
      from: userId
    };
    io.to(`role_compliance_manager`).emit('regulatory-update', message);
    io.to(`role_auditor`).emit('regulatory-update', message);
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