'use strict';

const Joi = require('joi');
const { FieldJob, FieldTechnician, JobAssignment, TimeEntry } = require('../models');
const { autoAssignJob } = require('../services/schedulingEngine');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const createJobSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  estimationId: Joi.string().uuid().optional().allow(null),
  customerId: Joi.string().uuid().required(),
  jobType: Joi.string().valid(
    'installation', 'measurement', 'inspection',
    'repair', 'maintenance', 'removal'
  ).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'emergency').default('medium'),
  scheduledDate: Joi.date().iso().required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  siteAddress: Joi.string().required(),
  siteCity: Joi.string().max(100).required(),
  siteState: Joi.string().max(50).required(),
  siteZip: Joi.string().max(10).required(),
  siteLat: Joi.number().optional(),
  siteLng: Joi.number().optional(),
  siteInstructions: Joi.string().max(2000).optional().allow(''),
  siteAccessCode: Joi.string().max(50).optional().allow(''),
  floorType: Joi.string().valid(
    'hardwood', 'laminate', 'vinyl', 'tile',
    'carpet', 'concrete', 'epoxy', 'natural_stone'
  ).required(),
  squareFootage: Joi.number().positive().optional(),
  estimatedHours: Joi.number().positive().max(40).optional(),
  notes: Joi.string().max(2000).optional().allow('')
});

const updateJobSchema = createJobSchema.fork(
  ['projectId', 'customerId', 'jobType', 'scheduledDate', 'floorType'],
  s => s.optional()
);

exports.createFieldJob = async (req, res, next) => {
  try {
    const { error, value } = createJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }

    const job = await FieldJob.create({
      ...value,
      jobId: `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      status: 'scheduled'
    });

    // Attempt auto-assignment
    try {
      const assignment = await autoAssignJob(job.id);
      if (assignment) {
        logger.info('Job auto-assigned on creation', { jobId: job.id });
      }
    } catch (err) {
      logger.warn('Auto-assignment failed, manual assignment required', { jobId: job.id });
    }

    logger.info('Field job created', { jobId: job.id, userId: req.user.id });
    return res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

exports.getFieldJobs = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, status, jobType,
      technicianId, customerId, scheduledDate, sortBy = 'scheduledDate', sortDir = 'ASC'
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (jobType) where.jobType = jobType;
    if (technicianId) where.technicianId = technicianId;
    if (customerId) where.customerId = customerId;
    if (scheduledDate) where.scheduledDate = scheduledDate;

    // Non-admins only see their own jobs
    if (!['admin', 'manager', 'dispatcher'].includes(req.user.role)) {
      where.technicianId = req.user.id;
    }

    const { count, rows } = await FieldJob.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sortBy, sortDir]],
      include: [
        { model: FieldTechnician, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: JobAssignment, as: 'assignments', include: [{ model: FieldTechnician, attributes: ['id', 'firstName', 'lastName'] }] }
      ]
    });

    return res.json({
      jobs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getFieldJobById = async (req, res, next) => {
  try {
    const job = await FieldJob.findByPk(req.params.id, {
      include: [
        { model: FieldTechnician, as: 'technician' },
        { model: JobAssignment, as: 'assignments', include: [{ model: FieldTechnician }] },
        { model: TimeEntry, as: 'timeEntries' }
      ]
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json(job);
  } catch (err) {
    next(err);
  }
};

exports.updateFieldJob = async (req, res, next) => {
  try {
    const { error, value } = updateJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }

    const job = await FieldJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Prevent updates to completed/cancelled jobs
    if (['completed', 'cancelled'].includes(job.status)) {
      return res.status(409).json({ error: `Cannot update ${job.status} job` });
    }

    await job.update(value);
    logger.info('Field job updated', { jobId: req.params.id, userId: req.user.id });
    return res.json(job);
  } catch (err) {
    next(err);
  }
};

exports.updateJobStatus = async (req, res, next) => {
  try {
    const { status, completionPhotos, customerSignature, customerRating, customerFeedback } = req.body;
    
    const validTransitions = {
      scheduled: ['dispatched', 'cancelled'],
      dispatched: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'on_hold'],
      on_hold: ['in_progress', 'cancelled'],
      completed: [],
      cancelled: []
    };

    const job = await FieldJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const allowed = validTransitions[job.status] || [];
    if (!allowed.includes(status)) {
      return res.status(409).json({
        error: `Cannot transition from '${job.status}' to '${status}'`,
        allowedTransitions: allowed
      });
    }

    const updateData = { status };
    if (status === 'completed') {
      updateData.actualEndTime = new Date();
      if (completionPhotos) updateData.completionPhotos = completionPhotos;
      if (customerSignature) updateData.customerSignature = customerSignature;
      if (customerRating) updateData.customerRating = customerRating;
      if (customerFeedback) updateData.customerFeedback = customerFeedback;
    }
    if (status === 'in_progress') {
      updateData.actualStartTime = new Date();
    }

    await job.update(updateData);

    // Update technician completed jobs count
    if (status === 'completed' && job.technicianId) {
      await FieldTechnician.increment('completedJobs', {
        where: { id: job.technicianId }
      });
    }

    logger.info('Job status updated', {
      jobId: req.params.id,
      from: job.status,
      to: status
    });

    return res.json(job);
  } catch (err) {
    next(err);
  }
};

exports.assignTechnician = async (req, res, next) => {
  try {
    const { technicianId, role = 'lead' } = req.body;

    if (!technicianId) {
      return res.status(400).json({ error: 'technicianId required' });
    }

    const job = await FieldJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const technician = await FieldTechnician.findByPk(technicianId);
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    const assignment = await JobAssignment.create({
      jobId: job.id,
      technicianId,
      assignedBy: req.user.id,
      role
    });

    await job.update({ technicianId, status: 'dispatched' });

    logger.info('Technician assigned to job', {
      jobId: job.id,
      technicianId,
      assignedBy: req.user.id
    });

    return res.json({ job, assignment });
  } catch (err) {
    next(err);
  }
};

exports.deleteFieldJob = async (req, res, next) => {
  try {
    const job = await FieldJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!['scheduled', 'cancelled'].includes(job.status)) {
      return res.status(409).json({
        error: 'Only scheduled or cancelled jobs can be deleted'
      });
    }

    await job.destroy();
    logger.info('Field job deleted', { jobId: req.params.id, userId: req.user.id });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};