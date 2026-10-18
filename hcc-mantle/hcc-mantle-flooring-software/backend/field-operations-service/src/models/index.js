const FieldTechnician = require('./FieldTechnician');
const FieldJob = require('./FieldJob');
const TimeEntry = require('./TimeEntry');
const JobAssignment = require('./JobAssignment');

// Associations
FieldTechnician.hasMany(FieldJob, { foreignKey: 'technicianId', as: 'jobs' });
FieldJob.belongsTo(FieldTechnician, { foreignKey: 'technicianId', as: 'technician' });

FieldTechnician.hasMany(TimeEntry, { foreignKey: 'technicianId', as: 'timeEntries' });
TimeEntry.belongsTo(FieldTechnician, { foreignKey: 'technicianId', as: 'technician' });

FieldJob.hasMany(TimeEntry, { foreignKey: 'jobId', as: 'timeEntries' });
TimeEntry.belongsTo(FieldJob, { foreignKey: 'jobId', as: 'job' });

FieldJob.hasMany(JobAssignment, { foreignKey: 'jobId', as: 'assignments' });
JobAssignment.belongsTo(FieldJob, { foreignKey: 'jobId', as: 'job' });

FieldTechnician.hasMany(JobAssignment, { foreignKey: 'technicianId', as: 'assignments' });
JobAssignment.belongsTo(FieldTechnician, { foreignKey: 'technicianId', as: 'technician' });

module.exports = {
  FieldTechnician,
  FieldJob,
  TimeEntry,
  JobAssignment
};