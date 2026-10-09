"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BillOfMaterials = void 0;
var _sequelize = require("sequelize");
var _database = require("../config/database.js");
const BillOfMaterials = exports.BillOfMaterials = _database.sequelize.define("BillOfMaterials", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  componentId: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  quantityRequired: {
    type: _sequelize.DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unitOfMeasure: {
    type: _sequelize.DataTypes.STRING(50),
    allowNull: false
  },
  isActive: {
    type: _sequelize.DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "bill_of_materials",
  timestamps: true
});