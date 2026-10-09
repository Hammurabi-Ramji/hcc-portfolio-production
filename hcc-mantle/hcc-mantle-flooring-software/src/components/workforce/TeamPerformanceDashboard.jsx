import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './TeamPerformanceDashboard.css';

const { FiTrendingUp, FiTarget, FiAward, FiUsers, FiClock, FiCheckCircle, FiCalendar, FiDollarSign, FiStar } = FiIcons;

const TeamPerformanceDashboard = () => {
  const [timeRange, setTimeRange] = useState('30');

  const performanceData = [
    { name: 'Mike Chen', jobs: 8, rating: 4.9, efficiency: 92, revenue: 28450 },
    { name: 'Lisa Wang', jobs: 6, rating: 4.8, efficiency: 88, revenue: 22100 },
    { name: 'David Kim', jobs: 10, rating: 4.7, efficiency: 95, revenue: 35600 },
    { name: 'Carlos Rodriguez', jobs: 4, rating: 4.6, efficiency: 85, revenue: 14200 }
  ];

  const teamStats = {
    totalJobs: performanceData.reduce((sum, m) => sum + m.jobs, 0),
    avgRating: performanceData.reduce((sum, m) => sum + m.rating, 0) / performanceData.length,
    avgEfficiency: performanceData.reduce((sum, m) => sum + m.efficiency, 0) / performanceData.length,
    totalRevenue: performanceData.reduce((sum, m) => sum + m.revenue, 0)
  };

  return (
    <motion.div 
      className="performance-dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="dashboard-header">
        <div>
          <h2>Team Performance Dashboard</h2>
          <p>Monitor team productivity and efficiency metrics</p>
        </div>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="fluent-input time-range-select"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 3 months</option>
        </select>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">
            <SafeIcon icon={FiCheckCircle} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{teamStats.totalJobs}</div>
            <div className="stat-label">Total Jobs</div>
            <div className="stat-change up">+15% vs last period</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <SafeIcon icon={FiStar} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{teamStats.avgRating.toFixed(1)}</div>
            <div className="stat-label">Avg Rating</div>
            <div className="stat-change up">+0.2 improvement</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <SafeIcon icon={FiTrendingUp} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{teamStats.avgEfficiency}%</div>
            <div className="stat-label">Avg Efficiency</div>
            <div className="stat-change up">+8% vs target</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <SafeIcon icon={FiDollarSign} />
          </div>
          <div className="stat-content">
            <div className="stat-value">${teamStats.totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-change up">+12% vs last period</div>
          </div>
        </div>
      </div>

      <div className="performance-table">
        <div className="table-header">
          <div className="table-row">
            <div className="table-cell">Team Member</div>
            <div className="table-cell">Jobs Completed</div>
            <div className="table-cell">Avg Rating</div>
            <div className="table-cell">Efficiency</div>
            <div className="table-cell">Revenue Generated</div>
            <div className="table-cell">Status</div>
          </div>
        </div>
        <div className="table-body">
          {performanceData.map((member, index) => (
            <motion.div 
              key={member.name} 
              className="table-row"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="table-cell member-name">
                <div className="member-avatar">
                  <SafeIcon icon={FiUsers} />
                </div>
                <span>{member.name}</span>
              </div>
              <div className="table-cell">{member.jobs}</div>
              <div className="table-cell rating">
                <SafeIcon icon={FiStar} />
                {member.rating}
              </div>
              <div className="table-cell efficiency">
                <div className="efficiency-bar">
                  <div className="efficiency-fill" style={{ width: `${member.efficiency}%` }} />
                </div>
                <span>{member.efficiency}%</span>
              </div>
              <div className="table-cell">${member.revenue.toLocaleString()}</div>
              <div className="table-cell">
                <div className="status-badge success">
                  <SafeIcon icon={FiCheckCircle} />
                  Active
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="insights-section">
        <h3>AI Performance Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <SafeIcon icon={FiAward} />
            <div>
              <h4>Top Performer</h4>
              <p>David Kim leads with highest efficiency (95%)</p>
            </div>
          </div>
          <div className="insight-card">
            <SafeIcon icon={FiTrendingUp} />
            <div>
              <h4>Growth Trend</h4>
              <p>Team productivity up 15% this month</p>
            </div>
          </div>
          <div className="insight-card">
            <SafeIcon icon={FiTarget} />
            <div>
              <h4>Quality Focus</h4>
              <p>Maintain rating above 4.5 for premium pricing</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TeamPerformanceDashboard;