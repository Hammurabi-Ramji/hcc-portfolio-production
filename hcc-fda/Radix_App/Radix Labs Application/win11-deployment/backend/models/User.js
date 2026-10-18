"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.User = void 0;
var _sequelize = require("sequelize");
var _bcryptjs = _interopRequireDefault(require("bcryptjs"));
var _database = require("../config/database.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const User = exports.User = _database.sequelize.define("User", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [8, 255]
    }
  },
  first_name: {
    type: _sequelize.DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  last_name: {
    type: _sequelize.DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  role: {
    type: _sequelize.DataTypes.ENUM("admin", "quality_manager", "compliance_manager", "production_manager", "lab_technician", "auditor", "regulatory_specialist", "training_coordinator", "customer_service", "vendor_manager", "hr_manager", "finance_manager", "it_admin", "user"),
    allowNull: false,
    defaultValue: "user"
  },
  department: {
    type: _sequelize.DataTypes.ENUM("quality", "production", "regulatory", "training", "customer_service", "vendor_management", "hr", "finance", "it", "executive", "research"),
    allowNull: true
  },
  is_active: {
    type: _sequelize.DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_email_verified: {
    type: _sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_verification_token: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_token: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_expires: {
    type: _sequelize.DataTypes.DATE,
    allowNull: true
  },
  last_login: {
    type: _sequelize.DataTypes.DATE,
    allowNull: true
  },
  login_attempts: {
    type: _sequelize.DataTypes.INTEGER,
    defaultValue: 0
  },
  lock_until: {
    type: _sequelize.DataTypes.DATE,
    allowNull: true
  },
  mfa_enabled: {
    type: _sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  },
  mfa_secret: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  profile_image: {
    type: _sequelize.DataTypes.STRING(500),
    allowNull: true
  },
  phone: {
    type: _sequelize.DataTypes.STRING(20),
    allowNull: true
  },
  employee_id: {
    type: _sequelize.DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  hire_date: {
    type: _sequelize.DataTypes.DATE,
    allowNull: true
  },
  certifications: {
    type: _sequelize.DataTypes.JSON,
    defaultValue: [],
    comment: "Array of certification objects with name, issuer, expiry, etc."
  },
  training_completed: {
    type: _sequelize.DataTypes.JSON,
    defaultValue: [],
    comment: "Array of completed training modules"
  },
  permissions: {
    type: _sequelize.DataTypes.JSON,
    defaultValue: {},
    comment: "Custom permissions beyond role defaults"
  },
  preferences: {
    type: _sequelize.DataTypes.JSON,
    defaultValue: {
      theme: "light",
      language: "en",
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    }
  }
}, {
  tableName: "users",
  indexes: [{
    unique: true,
    fields: ["email"]
  }, {
    fields: ["role"]
  }, {
    fields: ["department"]
  }, {
    fields: ["is_active"]
  }, {
    fields: ["employee_id"]
  }],
  hooks: {
    beforeCreate: async user => {
      if (user.password) {
        const salt = await _bcryptjs.default.genSalt(12);
        user.password = await _bcryptjs.default.hash(user.password, salt);
      }
    },
    beforeUpdate: async user => {
      if (user.changed("password")) {
        const salt = await _bcryptjs.default.genSalt(12);
        user.password = await _bcryptjs.default.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.checkPassword = async function (password) {
  return await _bcryptjs.default.compare(password, this.password);
};
User.prototype.getFullName = function () {
  return `${this.first_name} ${this.last_name}`;
};
User.prototype.isLocked = function () {
  return !!(this.lock_until && this.lock_until > Date.now());
};
User.prototype.incLoginAttempts = function () {
  if (this.login_attempts + 1 >= 5) {
    this.lock_until = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  this.login_attempts += 1;
};
User.prototype.resetLoginAttempts = function () {
  this.login_attempts = 0;
  this.lock_until = null;
};
var _default = exports.default = User;