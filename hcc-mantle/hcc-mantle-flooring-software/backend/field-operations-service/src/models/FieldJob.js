const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FieldJob = sequelize.define('FieldJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  estimationId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  technicianId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  jobType: {
    type: DataTypes.ENUM(
      'installation', 'measurement', 'inspection',
      'repair', 'maintenance', 'removal'
    ),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'scheduled', 'dispatched', 'in_progress',
      'on_hold', 'completed', 'cancelled'
    ),
    defaultValue: 'scheduled',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'emergency'),
    defaultValue: 'medium',
    allowNull: false
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  actualStartTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualEndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  siteAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  siteCity: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  siteState: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  siteZip: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  siteLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  siteLng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  siteInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  siteAccessCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  floorType: {
    type: DataTypes.ENUM(
      'hardwood', 'laminate', 'vinyl', 'tile',
      'carpet', 'concrete', 'epoxy', 'natural_stone'
    ),
    allowNull: false
  },
  squareFootage: {
    type: DataTypes.DECIMAL(10, 2),
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
  },
  completionPhotos: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  customerSignature: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customerRating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true
  },
  customerFeedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'field_jobs',
  indexes: [
    { fields: ['jobId'] },
    { fields: ['technicianId'] },
    { fields: ['customerId'] },
    { fields: ['status'] },
    { fields: ['scheduledDate'] },
    { fields: ['jobType'] }
  ]
});

module.exports = FieldJob;