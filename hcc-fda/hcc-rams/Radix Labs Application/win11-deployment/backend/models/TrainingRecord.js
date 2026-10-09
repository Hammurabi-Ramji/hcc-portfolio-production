"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TrainingRecord = void 0;
var _sequelize = require("sequelize");
var _database = require("../config/database.js");
const TrainingRecord = exports.TrainingRecord = _database.sequelize.define("TrainingRecord", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: _sequelize.DataTypes.UUID,
    allowNull: false,
    references: {
      model: "users",
      key: "id"
    }
  },
  document_id: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: "documents",
      key: "id"
    }
  },
  training_date: {
    type: _sequelize.DataTypes.DATE,
    allowNull: false
  },
  completion_status: {
    type: _sequelize.DataTypes.ENUM("completed", "in_progress", "failed", "expired"),
    defaultValue: "completed"
  },
  score: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  trainer_id: {
    type: _sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  expiry_date: {
    type: _sequelize.DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: _sequelize.DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [{
    fields: ["user_id"]
  }, {
    fields: ["document_id"]
  }, {
    fields: ["completion_status"]
  }, {
    fields: ["expiry_date"]
  }]
});