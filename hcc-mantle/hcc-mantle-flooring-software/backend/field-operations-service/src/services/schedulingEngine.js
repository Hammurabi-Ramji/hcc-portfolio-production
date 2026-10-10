'use strict';

const { FieldTechnician, FieldJob, JobAssignment, TimeEntry } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * Find available technicians for a job based on:
 * - Specialty match
 * - Schedule availability
 * - Geographic proximity
 * - Current workload
 */
const findAvailableTechnicians = async ({
  requiredSpecialty,
  scheduledDate,
  siteLat,
  siteLng,
  estimatedHours,
  priority = 'medium'
}) => {
  const availableDate = new Date(scheduledDate);
  
  // Get all active technicians with required specialty
  const technicians = await FieldTechnician.findAll({
    where: {
      isActive: true,
      specialties: { [Op.contains]: [requiredSpecialty] }
    },
    include: [{
      model: JobAssignment,
      as: 'assignments',
      where: {
        scheduledDate: {
          [Op.eq]: availableDate.toISOString().split('T')[0]
        },
        status: { [Op.in]: ['accepted', 'pending'] }
      },
      required: false
    }],
    attributes: {
      include: [
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(actual_hours), 0)
            FROM job_assignments
            WHERE technician_id = "FieldTechnician".id
            AND scheduled_date = '${availableDate.toISOString().split('T')[0]}'
            AND status IN ('accepted', 'completed')
          )`),
          'scheduledHours'
        ]
      ]
    }
  });

  // Filter by availability (8-hour max day)
  const maxDailyHours = parseFloat(process.env.MAX_DAILY_HOURS || '8');
  const available = technicians.filter(t => {
    const scheduledHours = parseFloat(t.dataValues.scheduledHours || 0);
    return (scheduledHours + estimatedHours) <= maxDailyHours;
  });

  // Sort by proximity if location provided
  if (siteLat && siteLng && available.length > 1) {
    available.sort((a, b) => {
      const distA = a.currentLocation ? calculateDistance(
        siteLat, siteLng,
        a.currentLocation.coordinates[1],
        a.currentLocation.coordinates[0]
      ) : Infinity;
      const distB = b.currentLocation ? calculateDistance(
        siteLat, siteLng,
        b.currentLocation.coordinates[1],
        b.currentLocation.coordinates[0]
      ) : Infinity;
      return distA - distB;
    });
  }

  logger.info('Found available technicians', {
    requiredSpecialty,
    total: technicians.length,
    available: available.length
  });

  return available;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Auto-assign job to best available technician
 */
const autoAssignJob = async (jobId) => {
  const job = await FieldJob.findByPk(jobId, {
    include: [{ model: JobAssignment, as: 'assignments' }]
  });

  if (!job) {
    throw Object.assign(new Error('Job not found'), { status: 404 });
  }

  if (job.assignments.length > 0) {
    throw Object.assign(new Error('Job already assigned'), { status: 409 });
  }

  const available = await findAvailableTechnicians({
    requiredSpecialty: job.floorType,
    scheduledDate: job.scheduledDate,
    siteLat: job.siteLat,
    siteLng: job.siteLng,
    estimatedHours: parseFloat(job.estimatedHours) || 4,
    priority: job.priority
  });

  if (available.length === 0) {
    logger.warn('No available technicians for auto-assignment', { jobId });
    return null;
  }

  // Assign to first available (best match)
  const technician = available[0];
  
  const assignment = await JobAssignment.create({
    jobId,
    technicianId: technician.id,
    assignedBy: 'system',
    role: 'lead',
    estimatedHours: job.estimatedHours
  });

  await job.update({ technicianId: technician.id, status: 'dispatched' });

  logger.info('Job auto-assigned', {
    jobId,
    technicianId: technician.id,
    technicianName: `${technician.firstName} ${technician.lastName}`
  });

  return { job, assignment, technician };
};

module.exports = {
  findAvailableTechnicians,
  autoAssignJob,
  calculateDistance
};