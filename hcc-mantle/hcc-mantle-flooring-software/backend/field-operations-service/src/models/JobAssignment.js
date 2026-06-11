const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobAssignment = sequelize.define('JobAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  technicianId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  assignedBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  role: {
    type: DataTypes.ENUM('lead', 'assistant', 'support'),
    defaultValue: 'assistant'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined', 'completed'),
    defaultValue: 'pending'
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  declinedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  declineReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  actualHours: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'job_assignments',
  indexes: [
    { fields: ['jobId'] },
    { fields: ['technicianId'] },
    { fields: ['assignedBy'] },
    { fields: ['status'] }
  ]
});

module.exports = JobAssignment;