"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Document = void 0;
var _sequelize = require("sequelize");
var _database = require("../config/database.js");
const Document = exports.Document = _database.sequelize.define("Document", {
  id: {
    type: _sequelize.DataTypes.STRING(255),
    primaryKey: true
  },
  title: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: false
  },
  category: {
    type: _sequelize.DataTypes.STRING(100),
    allowNull: false
  },
  department: {
    type: _sequelize.DataTypes.STRING(100),
    allowNull: false
  },
  version: {
    type: _sequelize.DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: _sequelize.DataTypes.ENUM("active", "archived", "draft", "review"),
    defaultValue: "active"
  },
  file_path: {
    type: _sequelize.DataTypes.STRING(500),
    allowNull: true
  },
  file_name: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  file_size: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: true
  },
  file_type: {
    type: _sequelize.DataTypes.STRING(50),
    allowNull: true
  },
  mime_type: {
    type: _sequelize.DataTypes.STRING(100),
    allowNull: true
  },
  checksum: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  content_text: {
    type: _sequelize.DataTypes.TEXT,
    allowNull: true
  },
  compliance_standard: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  effective_date: {
    type: _sequelize.DataTypes.DATE,
    allowNull: true
  },
  review_date: {
    type: _sequelize.DataTypes.DATE,
    allowNull: true
  },
  expiry_date: {
    type: _sequelize.DataTypes.DATE,
    allowNull: true
  },
  owner_id: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  created_by: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  updated_by: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [{
    fields: ["category"]
  }, {
    fields: ["department"]
  }, {
    fields: ["status"]
  }, {
    fields: ["effective_date"]
  }]
});