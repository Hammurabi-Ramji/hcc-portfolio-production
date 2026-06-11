const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TimeEntry = sequelize.define('TimeEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  technicianId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  clockInTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  clockOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  breakStartTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  breakEndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalHours: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  billableHours: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  isLunchTaken: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  location: {
    type: DataTypes.GEOGRAPHY,
    allowNull: true
  },
  activityType: {
    type: DataTypes.ENUM(
      'job', 'travel', 'training', 'meeting',
      'break', 'lunch', 'admin'
    ),
    defaultValue: 'job'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'time_entries',
  indexes: [
    { fields: ['technicianId'] },
    { fields: ['jobId'] },
    { fields: ['clockInTime'] },
    { fields: ['isApproved'] }
  ]
});

module.exports = TimeEntry;