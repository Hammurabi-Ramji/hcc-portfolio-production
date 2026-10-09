import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './EnhancedProjectTimeline.css';

const { FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiUser, FiMapPin, FiDollarSign, FiTrendingUp } = FiIcons;

const EnhancedProjectTimeline = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('timeline');
  const [timeRange, setTimeRange] = useState('30');

  const projects = [
    {
      id: 'PRJ-001',
      name: 'Luxury Hardwood Installation',
      customer: 'Sarah Johnson',
      status: 'in-progress',
      progress: 75,
      startDate: '2024-01-15',
      endDate: '2024-01-25',
      budget: 12500,
      spent: 9375,
      team: ['Mike Chen', 'David Kim'],
      milestones: [
        { id: 1, name: 'Initial Consultation', date: '2024-01-15', status: 'completed', completedDate: '2024-01-15' },
        { id: 2, name: 'Material Delivery', date: '2024-01-17', status: 'completed', completedDate: '2024-01-17' },
        { id: 3, name: 'Subfloor Preparation', date: '2024-01-19', status: 'completed', completedDate: '2024-01-20' },
        { id: 4, name: 'Installation Phase 1', date: '2024-01-21', status: 'in-progress', completedDate: null },
        { id: 5, name: 'Installation Phase 2', date: '2024-01-23', status: 'pending', completedDate: null },
        { id: 6, name: 'Final Inspection', date: '2024-01-25', status: 'pending', completedDate: null }
      ]
    },
    {
      id: 'PRJ-002',
      name: 'Commercial Tile Flooring',
      customer: 'TechCorp Inc.',
      status: 'planning',
      progress: 15,
      startDate: '2024-01-20',
      endDate: '2024-02-10',
      budget: 45000,
      spent: 6750,
      team: ['Lisa Wang', 'Tom Anderson', 'Jake Miller'],
      milestones: [
        { id: 1, name: 'Site Survey', date: '2024-01-20', status: 'completed', completedDate: '2024-01-20' },
        { id: 2, name: 'Design Approval', date: '2024-01-25', status: 'pending', completedDate: null },
        { id: 3, name: 'Material Ordering', date: '2024-01-28', status: 'pending', completedDate: null },
        { id: 4, name: 'Installation', date: '2024-02-05', status: 'pending', completedDate: null },
        { id: 5, name: 'Final Walkthrough', date: '2024-02-10', status: 'pending', completedDate: null }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success)';
      case 'in-progress': return 'var(--accent-primary)';
      case 'pending': return 'var(--text-tertiary)';
      case 'delayed': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <motion.div className="enhanced-project-timeline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Timeline</h1>
          <p className="page-subtitle">Track project milestones and deadlines</p>
        </div>
        <div className="header-actions">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="fluent-input time-range-select">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
          </select>
          <div className="view-mode-toggle">
            <button className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`} onClick={() => setViewMode('timeline')}>
              <SafeIcon icon={FiCalendar} /> Timeline
            </button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
              <SafeIcon icon={FiClock} /> List
            </button>
          </div>
        </div>
      </div>

      <div className="timeline-content">
        {projects.map((project, index) => (
          <motion.div key={project.id} className="project-timeline-card fluent-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
            <div className="project-timeline-header">
              <div className="project-info">
                <h3 className="project-name">{project.name}</h3>
                <div className="project-meta">
                  <span className="meta-item">
                    <SafeIcon icon={FiUser} /> {project.customer}
                  </span>
                  <span className="meta-item">
                    <SafeIcon icon={FiCalendar} /> {calculateDaysRemaining(project.endDate)} days remaining
                  </span>
                  <span className="meta-item">
                    <SafeIcon icon={FiDollarSign} /> ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="project-progress-summary">
                <div className="progress-percentage">{project.progress}%</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progress}%`, backgroundColor: getStatusColor(project.status) }} />
                </div>
              </div>
            </div>

            <div className="milestones-timeline">
              {project.milestones.map((milestone, mIndex) => (
                <motion.div key={milestone.id} className="milestone-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: mIndex * 0.05 }}>
                  <div className="milestone-marker" style={{ backgroundColor: getStatusColor(milestone.status) }}>
                    {milestone.status === 'completed' ? <SafeIcon icon={FiCheckCircle} /> : milestone.status === 'in-progress' ? <SafeIcon icon={FiClock} /> : <div className="pending-dot" />}
                  </div>
                  <div className="milestone-content">
                    <div className="milestone-header">
                      <h4 className="milestone-name">{milestone.name}</h4>
                      <span className="milestone-date">{new Date(milestone.date).toLocaleDateString()}</span>
                    </div>
                    {milestone.completedDate && (
                      <div className="milestone-completion">
                        <SafeIcon icon={FiCheckCircle} /> Completed on {new Date(milestone.completedDate).toLocaleDateString()}
                      </div>
                    )}
                    {milestone.status === 'delayed' && (
                      <div className="milestone-alert">
                        <SafeIcon icon={FiAlertCircle} /> This milestone is delayed
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="timeline-actions">
              <button className="fluent-button secondary">
                <SafeIcon icon={FiTrendingUp} /> View Details
              </button>
              <button className="fluent-button">
                <SafeIcon icon={FiCalendar} /> Update Timeline
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default EnhancedProjectTimeline;