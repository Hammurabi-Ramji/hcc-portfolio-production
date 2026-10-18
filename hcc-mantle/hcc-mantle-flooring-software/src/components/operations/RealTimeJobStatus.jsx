import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './RealTimeJobStatus.css';

const { FiActivity, FiClock, FiCheckCircle, FiAlertCircle, FiMapPin, FiUser, FiRefreshCw } = FiIcons;

const RealTimeJobStatus = () => {
  const [jobs, setJobs] = useState([
    { id: 'JOB-001', name: 'Hardwood Installation', customer: 'Sarah Johnson', status: 'in-progress', progress: 65, location: '123 Oak Street', technician: 'Mike Chen', lastUpdate: '5 minutes ago', estimatedCompletion: '2024-01-25' },
    { id: 'JOB-002', name: 'Tile Flooring', customer: 'TechCorp Inc.', status: 'scheduled', progress: 0, location: '456 Business Plaza', technician: 'Lisa Wang', lastUpdate: '1 hour ago', estimatedCompletion: '2024-01-28' },
    { id: 'JOB-003', name: 'Laminate Upgrade', customer: 'Robert Davis', status: 'completed', progress: 100, location: '789 Maple Avenue', technician: 'Carlos Rodriguez', lastUpdate: '2 hours ago', estimatedCompletion: '2024-01-20' },
    { id: 'JOB-004', name: 'Vinyl Installation', customer: 'Emma Wilson', status: 'delayed', progress: 30, location: '321 Pine Street', technician: 'David Kim', lastUpdate: '15 minutes ago', estimatedCompletion: '2024-01-26' }
  ]);

  const [lastRefresh, setLastRefresh] = useState(new Date());

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success)';
      case 'in-progress': return 'var(--accent-primary)';
      case 'scheduled': return 'var(--warning)';
      case 'delayed': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return FiCheckCircle;
      case 'in-progress': return FiActivity;
      case 'scheduled': return FiClock;
      case 'delayed': return FiAlertCircle;
      default: return FiClock;
    }
  };

  const refreshStatus = () => {
    setLastRefresh(new Date());
    // In production, this would fetch real-time data via WebSocket
  };

  return (
    <motion.div className="real-time-job-status fluent-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="status-header">
        <div>
          <h2>Real-Time Job Status</h2>
          <p>Live tracking of all active jobs</p>
        </div>
        <div className="refresh-info">
          <button className="refresh-btn" onClick={refreshStatus}>
            <SafeIcon icon={FiRefreshCw} />
          </button>
          <span className="last-update">Updated: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="live-indicator">
        <span className="live-dot"></span>
        <span>Live Updates Active</span>
      </div>

      <div className="jobs-grid">
        {jobs.map((job, index) => (
          <motion.div key={job.id} className="job-status-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}>
            <div className="job-status-header">
              <div className="job-id">{job.id}</div>
              <div className="status-badge" style={{ backgroundColor: `${getStatusColor(job.status)}15`, color: getStatusColor(job.status) }}>
                <SafeIcon icon={getStatusIcon(job.status)} />
                {job.status}
              </div>
            </div>
            <h3 className="job-name">{job.name}</h3>
            <div className="job-customer">
              <SafeIcon icon={FiUser} />
              {job.customer}
            </div>
            <div className="job-progress">
              <div className="progress-header">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${job.progress}%`, backgroundColor: getStatusColor(job.status) }} />
              </div>
            </div>
            <div className="job-details">
              <div className="detail-item">
                <SafeIcon icon={FiMapPin} />
                {job.location}
              </div>
              <div className="detail-item">
                <SafeIcon icon={FiUser} />
                {job.technician}
              </div>
              <div className="detail-item">
                <SafeIcon icon={FiClock} />
                {job.lastUpdate}
              </div>
            </div>
            <div className="job-footer">
              <span className="completion-date">Est. Completion: {new Date(job.estimatedCompletion).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RealTimeJobStatus;