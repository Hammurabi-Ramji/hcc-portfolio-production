"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var usersController = _interopRequireWildcard(require("../controllers/usersController.js"));
var _authMiddleware = require("../middleware/authMiddleware.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// All user routes require authentication
router.use(_authMiddleware.authenticateToken);

// Get users dashboard (admin/manager only)
router.get('/dashboard', (0, _authMiddleware.requireRole)(['admin', 'manager']), usersController.getUsersDashboard);

// Get all users with filtering and pagination
router.get('/', (0, _authMiddleware.requireRole)(['admin', 'manager']), usersController.getUsers);

// Get user by ID
router.get('/:userId', (0, _authMiddleware.requireRole)(['admin', 'manager']), usersController.getUserById);

// Get user permissions
router.get('/:userId/permissions', (0, _authMiddleware.requireRole)(['admin', 'manager']), usersController.getUserPermissions);

// Get user activity log
router.get('/:userId/activity', (0, _authMiddleware.requireRole)(['admin', 'manager']), usersController.getUserActivity);

// Create new user (admin only)
router.post('/', (0, _authMiddleware.requireRole)(['admin']), usersController.createUser);

// Update user
router.put('/:userId', (0, _authMiddleware.requireRole)(['admin', 'manager']), usersController.updateUser);

// Change user password
router.put('/:userId/password', (0, _authMiddleware.requireRole)(['admin', 'manager']), usersController.changeUserPassword);
var _default = exports.default = router;