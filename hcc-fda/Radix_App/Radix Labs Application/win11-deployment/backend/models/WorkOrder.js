"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WorkOrder = void 0;
var _sequelize = require("sequelize");
var _database = require("../config/database.js");
const WorkOrder = exports.WorkOrder = _database.sequelize.define("WorkOrder", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  workOrderNumber: {
    type: _sequelize.DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  productId: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  planId: {
    type: _sequelize.DataTypes.UUID,
    allowNull: true
  },
  componentId: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: true
  },
  requiredQuantity: {
    type: _sequelize.DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  unitOfMeasure: {
    type: _sequelize.DataTypes.STRING(50),
    allowNull: true
  },
  quantity: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: _sequelize.DataTypes.ENUM("planned", "released", "in_progress", "completed", "cancelled", "on_hold"),
    defaultValue: "planned"
  },
  priority: {
    type: _sequelize.DataTypes.INTEGER,
    defaultValue: 1
  },
  productionLineId: {
    type: _sequelize.DataTypes.INTEGER
  },
  startDate: {
    type: _sequelize.DataTypes.DATE
  },
  endDate: {
    type: _sequelize.DataTypes.DATE
  },
  notes: {
    type: _sequelize.DataTypes.TEXT
  }
}, {
  tableName: "work_orders",
  timestamps: true
});