"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProductionPlan = void 0;
var _sequelize = require("sequelize");
var _database = require("../config/database.js");
const ProductionPlan = exports.ProductionPlan = _database.sequelize.define("ProductionPlan", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  startDate: {
    type: _sequelize.DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: _sequelize.DataTypes.DATE,
    allowNull: false
  },
  priority: {
    type: _sequelize.DataTypes.INTEGER,
    defaultValue: 1
  },
  productionLineId: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: _sequelize.DataTypes.ENUM("planned", "in_progress", "completed", "cancelled"),
    defaultValue: "planned"
  }
}, {
  tableName: "production_plans",
  timestamps: true
});