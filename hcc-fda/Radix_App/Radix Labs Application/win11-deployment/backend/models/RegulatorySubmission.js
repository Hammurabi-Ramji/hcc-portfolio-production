"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RegulatorySubmission = void 0;
var _sequelize = require("sequelize");
var _database = require("../config/database.js");
const RegulatorySubmission = exports.RegulatorySubmission = _database.sequelize.define("RegulatorySubmission", {
  id: {
    type: _sequelize.DataTypes.UUID,
    defaultValue: _sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: _sequelize.DataTypes.INTEGER,
    allowNull: false
  },
  regulatoryBody: {
    type: _sequelize.DataTypes.STRING(100),
    allowNull: false
  },
  submissionType: {
    type: _sequelize.DataTypes.STRING(100),
    allowNull: false
  },
  submissionNumber: {
    type: _sequelize.DataTypes.STRING(100),
    allowNull: false
  },
  submissionDate: {
    type: _sequelize.DataTypes.DATE,
    allowNull: false
  },
  expectedApprovalDate: {
    type: _sequelize.DataTypes.DATE
  },
  status: {
    type: _sequelize.DataTypes.ENUM("submitted", "under_review", "approved", "rejected", "withdrawn"),
    defaultValue: "submitted"
  },
  approvalDate: {
    type: _sequelize.DataTypes.DATE
  },
  notes: {
    type: _sequelize.DataTypes.TEXT
  }
}, {
  tableName: "regulatory_submissions",
  timestamps: true
});