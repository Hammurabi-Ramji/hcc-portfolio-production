'use strict';

/**
 * NORTHSTAR INSTALLATIONS - DOCUMENT SERVICE
 * Port: 8085 | Database: SQLite3 (document.db)
 * Manages project documents, contracts, photos, compliance documents
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./config/database');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8085;

// Storage configuration
const UPLOAD_DIR = process.env.STORAGE_PATH || path.join(__dirname, '../storage');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const jobId = req.params.jobId || 'general';
    const jobDir = path.join(UPLOAD_DIR, jobId);
    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
    cb(null, jobDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_UPLOAD_SIZE || 52428800) },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type ${file.mimetype} not allowed`));
  }
});

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000' }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  logger.info('Document service request', { method: req.method, url: req.url });
  next();
});

// Health endpoints
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'document-service', timestamp: new Date() }));
app.get('/health/live', (req, res) => res.json({ live: true }));
app.get('/health/ready', (req, res) => res.json({ ready: true }));

// File serving (protected)
app.use('/api', authenticateToken);

// Document routes
app.post('/api/jobs/:jobId/documents', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const document = {
      id: require('crypto').randomUUID(),
      jobId: req.params.jobId,
      filename: req.file.originalname,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      category: req.body.category || 'general',
      description: req.body.description || ''
    };

    logger.info('Document uploaded', { documentId: document.id, jobId: req.params.jobId });
    res.status(201).json(document);
  } catch (err) { next(err); }
});

app.get('/api/jobs/:jobId/documents', async (req, res, next) => {
  try {
    // In production: Query database
    res.json({ documents: [] });
  } catch (err) { next(err); }
});

app.get('/api/documents/:documentId', async (req, res, next) => {
  try {
    // In production: Find document and return file
    res.status(200).download('filepath');
  } catch (err) { next(err); }
});

app.delete('/api/documents/:documentId', async (req, res, next) => {
  try {
    const { documentId } = req.params;
    // Delete file from storage
    logger.info('Document deleted', { documentId });
    res.status(204).send();
  } catch (err) { next(err); }
});

// Project documents (contracts, estimates, etc.)
app.post('/api/projects/:projectId/contract', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No contract file uploaded' });

    const contract = {
      id: require('crypto').randomUUID(),
      projectId: req.params.projectId,
      documentType: 'contract',
      filename: req.file.originalname,
      filepath: req.file.path,
      signedAt: req.body.signedAt || null,
      signatureUrl: req.body.signatureUrl || null
    };

    logger.info('Contract uploaded', { projectId: req.params.projectId });
    res.status(201).json(contract);
  } catch (err) { next(err); }
});

// Photo gallery for job
app.post('/api/jobs/:jobId/photos', upload.array('photos', 20), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }

    const photos = req.files.map(file => ({
      id: require('crypto').randomUUID(),
      jobId: req.params.jobId,
      url: file.path,
      caption: req.body.captions?.[file.fieldname] || '',
      uploadedAt: new Date()
    }));

    logger.info('Photos uploaded', { jobId: req.params.jobId, count: photos.length });
    res.status(201).json(photos);
  } catch (err) { next(err); }
});

app.get('/api/jobs/:jobId/photos', async (req, res, next) => {
  try {
    res.json({ photos: [] });
  } catch (err) { next(err); }
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'production') await sequelize.sync({ alter: true });
    app.listen(PORT, () => logger.info(`🚀 Document Service initialized on ${PORT}`));
  } catch (err) {
    logger.error('Fatal startup error', { error: err.message });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await sequelize.close(); process.exit(0); });
process.on('SIGINT', async () => { await sequelize.close(); process.exit(0); });

if (require.main === module) startServer();
module.exports = app;
