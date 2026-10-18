const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FieldTechnician = sequelize.define('FieldTechnician', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  employeeId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  certifications: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  specialties: {
    type: DataTypes.ARRAY(DataTypes.ENUM(
      'hardwood', 'laminate', 'vinyl', 'tile',
      'carpet', 'concrete', 'epoxy', 'natural_stone'
    )),
    defaultValue: []
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  currentLocation: {
    type: DataTypes.GEOGRAPHY,
    allowNull: true
  },
  lastLocationUpdate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0,
    validate: { min: 0, max: 5 }
  },
  completedJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'field_technicians',
  indexes: [
    { fields: ['userId'] },
    { fields: ['employeeId'] },
    { fields: ['isActive'] },
    { fields: ['specialties'], using: 'gin' }
  ]
});

module.exports = FieldTechnician;