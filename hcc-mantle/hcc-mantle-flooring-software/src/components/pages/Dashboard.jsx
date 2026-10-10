import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import StatsCard from '../dashboard/StatsCard';
import ProjectChart from '../dashboard/ProjectChart';
import RecentActivity from '../dashboard/RecentActivity';
import AIInsights from '../dashboard/AIInsights';
import './Dashboard.css';

const { 
  FiTrendingUp, FiDollarSign, FiUsers, FiPackage,
  FiCalendar, FiClock, FiTarget, FiAward
} = FiIcons;

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      title: 'Total Revenue',
      value: '$847,230',
      change: '+12.5%',
      trend: 'up',
      icon: FiDollarSign,
      color: 'success',
      subtitle: 'vs last month'
    },
    {
      title: 'Active Projects',
      value: '23',
      change: '+3',
      trend: 'up',
      icon: FiTarget,
      color: 'info',
      subtitle: 'in progress'
    },
    {
      title: 'Team Members',
      value: '47',
      change: '+5',
      trend: 'up',
      icon: FiUsers,
      color: 'warning',
      subtitle: 'available today'
    },
    {
      title: 'Inventory Value',
      value: '$234,890',
      change: '-2.3%',
      trend: 'down',
      icon: FiPackage,
      color: 'error',
      subtitle: 'current stock'
    }
  ];

  const quickActions = [
    { label: 'New Project', icon: FiTarget, path: '/projects' },
    { label: 'Create Quote', icon: FiDollarSign, path: '/estimating' },
    { label: 'Schedule Job', icon: FiCalendar, path: '/workforce' },
    { label: 'Add Material', icon: FiPackage, path: '/inventory' }
  ];

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with your flooring business.</p>
        </div>
        <div className="header-actions">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="fluent-input time-range-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
          <button className="fluent-button">
            <SafeIcon icon={FiTrendingUp} />
            View Reports
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="quick-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              className="quick-action-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <SafeIcon icon={action.icon} />
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            {...stat}
            loading={loading}
            delay={index * 0.1}
          />
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        <motion.div
          className="chart-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ProjectChart timeRange={timeRange} />
        </motion.div>

        <motion.div
          className="activity-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RecentActivity />
        </motion.div>

        <motion.div
          className="ai-insights-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AIInsights />
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        className="performance-metrics"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="fluent-card">
          <div className="card-header">
            <h3>Performance Metrics</h3>
            <SafeIcon icon={FiAward} />
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-value">94%</div>
              <div className="metric-label">Project Completion Rate</div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-value">4.8/5</div>
              <div className="metric-label">Customer Satisfaction</div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: '96%' }}></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-value">87%</div>
              <div className="metric-label">On-Time Delivery</div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: '87%' }}></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-value">23%</div>
              <div className="metric-label">Profit Margin</div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;