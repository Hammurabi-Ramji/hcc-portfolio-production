"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _passport = _interopRequireDefault(require("passport"));
var _authController = require("../controllers/authController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// Public routes
router.post('/register', _authController.register);
router.post('/login', _authController.login);
router.post('/forgot-password', _authController.forgotPassword);
router.post('/reset-password', _authController.resetPassword);

// Protected routes (require authentication)
router.use((req, res, next) => {
  _passport.default.authenticate('jwt', {
    session: false
  }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: (info === null || info === void 0 ? void 0 : info.message) || 'Access token required'
      });
    }
    req.user = user;
    next();
  })(req, res, next);
});
router.get('/verify', _authController.verify);
router.get('/profile', _authController.getProfile);
router.put('/profile', _authController.updateProfile);
router.put('/change-password', _authController.changePassword);
router.post('/logout', _authController.logout);
router.post('/refresh', _authController.refreshToken);
router.post('/setup-2fa', _authController.setup2FA);
router.post('/verify-2fa', _authController.verify2FA);
var _default = exports.default = router;