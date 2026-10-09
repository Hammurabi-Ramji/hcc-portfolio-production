"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.configurePassport = void 0;
var _passport = _interopRequireDefault(require("passport"));
var _passportJwt = require("passport-jwt");
var _passportLocal = require("passport-local");
var _bcryptjs = _interopRequireDefault(require("bcryptjs"));
var _User = require("../models/User.js");
var _logger = require("../utils/logger.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const jwtOptions = {
  jwtFromRequest: _passportJwt.ExtractJwt.fromExtractors([_passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(), req => {
    var _req$cookies;
    // Check for token in cookie
    return req === null || req === void 0 ? void 0 : (_req$cookies = req.cookies) === null || _req$cookies === void 0 ? void 0 : _req$cookies.token;
  }]),
  secretOrKey: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
};

// JWT Strategy
_passport.default.use(new _passportJwt.Strategy(jwtOptions, async (payload, done) => {
  try {
    const user = await _User.User.findByPk(payload.id, {
      attributes: {
        exclude: ["password"]
      }
    });
    if (user) {
      // Check if user is active
      if (!user.is_active) {
        return done(null, false, {
          message: "Account is deactivated"
        });
      }

      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return done(null, false, {
          message: "Token expired"
        });
      }
      return done(null, user);
    }
    return done(null, false, {
      message: "User not found"
    });
  } catch (error) {
    _logger.logger.error("JWT Strategy Error:", error);
    return done(error, false);
  }
}));

// Local Strategy (email/password)
_passport.default.use(new _passportLocal.Strategy({
  usernameField: "email",
  passwordField: "password"
}, async (email, password, done) => {
  try {
    const user = await _User.User.findOne({
      where: {
        email: email.toLowerCase()
      }
    });
    if (!user) {
      return done(null, false, {
        message: "Invalid email or password"
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return done(null, false, {
        message: "Account is deactivated"
      });
    }

    // Check password
    const isValidPassword = await _bcryptjs.default.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, {
        message: "Invalid email or password"
      });
    }

    // Remove password from user object
    const userWithoutPassword = {
      ...user.toJSON()
    };
    delete userWithoutPassword.password;
    return done(null, userWithoutPassword);
  } catch (error) {
    _logger.logger.error("Local Strategy Error:", error);
    return done(error);
  }
}));

// Serialize user for session
_passport.default.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
_passport.default.deserializeUser(async (id, done) => {
  try {
    const user = await _User.User.findByPk(id, {
      attributes: {
        exclude: ["password"]
      }
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});
const configurePassport = () => {
  _logger.logger.info("🔐 Passport authentication configured");
};
exports.configurePassport = configurePassport;
var _default = exports.default = _passport.default;