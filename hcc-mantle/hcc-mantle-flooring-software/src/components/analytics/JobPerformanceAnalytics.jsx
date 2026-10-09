import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './JobPerformanceAnalytics.css';

const { FiTrendingUp, FiTrendingDown, FiClock, FiCheckCircle, FiAlertCircle, FiCalendar, FiBarChart2, FiTarget, FiDollarSign } = FiIcons;

const JobPerformanceAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('completion');

  const performanceData = {
    completion: {
      current: 94,
      previous: 89,
      trend: 'up',
      jobs: [
        { id: 'JOB-001', name: 'Hardwood Installation', customer: 'Sarah Johnson', completedDate: '2024-01-20', daysToComplete: 8, scheduledDays: 10, status: 'early' },
        { id: 'JOB-002', name: 'Tile Flooring', customer: 'TechCorp Inc.', completedDate: '2024-01-18', daysToComplete: 12, scheduledDays: 12, status: 'on-time' },
        { id: 'JOB-003', name: 'Laminate Upgrade', customer: 'Robert Davis', completedDate: '2024-01-22', daysToComplete: 9, scheduledDays: 7, status: 'delayed' },
        { id: 'JOB-004', name: 'Vinyl Installation', customer: 'Emma Wilson', completedDate: '2024-01-19', daysToComplete: 5, scheduledDays: 6, status: 'early' }
      ]
    },
    efficiency: {
      current: 87,
      previous: 82,
      trend: 'up',
      metrics: [
        { name: 'Labor Utilization', value: 89, target: 85 },
        { name: 'Material Waste', value: 8.2, target: 10 },
        { name: 'Rework Rate', value: 3.1, target: 5 },
        { name: 'First-Time Completion', value: 91, target: 90 }
      ]
    },
    profitability: {
      current: 25.1,
      previous: 22.3,
      trend: 'up',
      projects: [
        { name: 'Luxury Hardwood', margin: 28.5, budget: 12500, actual: 11875 },
        { name: 'Commercial Tile', margin: 22.0, budget: 45000, actual: 46200 },
        { name: 'Residential Laminate', margin: 25.0, budget: 8500, actual: 8100 },
        { name: 'Vinyl Plank', margin: 30.0, budget: 15200, actual: 14500 }
      ]
    }
  };

  const getMetricData = () => performanceData[selectedMetric];
  const data = getMetricData();

  const getStatusColor = (status) => {
    switch (status) {
      case 'early': return 'var(--success)';
      case 'on-time': return 'var(--accent-primary)';
      case 'delayed': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  return (
    <motion.div className="job-performance-analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="analytics-header">
        <div>
          <h2>Job Performance Analytics</h2>
          <p>Comprehensive insights into project delivery and efficiency</p>
        </div>
        <div className="analytics-controls">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="fluent-input time-range-select">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
          </select>
        </div>
      </div>

      <div className="metric-tabs">
        <button className={`metric-tab ${selectedMetric === 'completion' ? 'active' : ''}`} onClick={() => setSelectedMetric('completion')}>
          <SafeIcon icon={FiCheckCircle} />
          Completion Rate
        </button>
        <button className={`metric-tab ${selectedMetric === 'efficiency' ? 'active' : ''}`} onClick={() => setSelectedMetric('efficiency')}>
          <SafeIcon icon={FiTrendingUp} />
          Efficiency
        </button>
        <button className={`metric-tab ${selectedMetric === 'profitability' ? 'active' : ''}`} onClick={() => setSelectedMetric('profitability')}>
          <SafeIcon icon={FiDollarSign} />
          Profitability
        </button>
      </div>

      <div className="performance-overview">
        <div className="overview-card primary">
          <div className="card-icon">
            <SafeIcon icon={FiTarget} />
          </div>
          <div className="card-content">
            <div className="card-value">{data.current}{selectedMetric === 'profitability' ? '%' : ''}</div>
            <div className="card-label">
              {selectedMetric === 'completion' ? 'Completion Rate' : selectedMetric === 'efficiency' ? 'Efficiency Score' : 'Avg Margin'}
            </div>
          </div>
        </div>
        <div className="overview-card secondary">
          <div className="card-icon">
            <SafeIcon icon={FiCalendar} />
          </div>
          <div className="card-content">
            <div className="card-value">{data.previous}{selectedMetric === 'profitability' ? '%' : ''}</div>
            <div className="card-label">Previous Period</div>
          </div>
        </div>
        <div className="overview-card trend">
          <div className="card-icon">
            <SafeIcon icon={data.trend === 'up' ? FiTrendingUp : FiTrendingDown} />
          </div>
          <div className="card-content">
            <div className="card-value">+{Math.abs(data.current - data.previous)}{selectedMetric === 'profitability' ? '%' : ''}</div>
            <div className="card-label">Change</div>
          </div>
        </div>
      </div>

      {selectedMetric === 'completion' && (
        <div className="jobs-table">
          <div className="table-header">
            <div className="table-cell">Job ID</div>
            <div className="table-cell">Project Name</div>
            <div className="table-cell">Customer</div>
            <div className="table-cell">Days to Complete</div>
            <div className="table-cell">Scheduled</div>
            <div className="table-cell">Status</div>
          </div>
          <div className="table-body">
            {data.jobs.map((job, index) => (
              <motion.div key={job.id} className="table-row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                <div className="table-cell">{job.id}</div>
                <div className="table-cell">{job.name}</div>
                <div className="table-cell">{job.customer}</div>
                <div className="table-cell">{job.daysToComplete} days</div>
                <div className="table-cell">{job.scheduledDays} days</div>
                <div className="table-cell">
                  <span className="status-badge" style={{ backgroundColor: `${getStatusColor(job.status)}15`, color: getStatusColor(job.status) }}>
                    {job.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {selectedMetric === 'efficiency' && (
        <div className="efficiency-grid">
          {data.metrics.map((metric, index) => (
            <motion.div key={metric.name} className="efficiency-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <div className="efficiency-header">
                <h4>{metric.name}</h4>
                <span className="efficiency-value">{metric.value}{metric.name.includes('Rate') || metric.name.includes('Utilization') ? '%' : ''}</span>
              </div>
              <div className="efficiency-bar">
                <div className="efficiency-fill" style={{ width: `${Math.min(metric.value, 100)}%`, backgroundColor: metric.value >= metric.target ? 'var(--success)' : 'var(--warning)' }} />
              </div>
              <div className="efficiency-target">Target: {metric.target}{metric.name.includes('Rate') || metric.name.includes('Utilization') ? '%' : ''}</div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedMetric === 'profitability' && (
        <div className="profitability-list">
          {data.projects.map((project, index) => (
            <motion.div key={project.name} className="project-profit-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
              <div className="project-header">
                <h4>{project.name}</h4>
                <span className="margin-badge">{project.margin}% margin</span>
              </div>
              <div className="project-financials">
                <div className="financial-item">
                  <span className="label">Budget:</span>
                  <span className="value">${project.budget.toLocaleString()}</span>
                </div>
                <div className="financial-item">
                  <span className="label">Actual:</span>
                  <span className="value">${project.actual.toLocaleString()}</span>
                </div>
                <div className="financial-item">
                  <span className="label">Variance:</span>
                  <span className={`value ${project.actual <= project.budget ? 'positive' : 'negative'}`}>
                    {project.actual <= project.budget ? '+' : ''}${(project.budget - project.actual).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default JobPerformanceAnalytics;