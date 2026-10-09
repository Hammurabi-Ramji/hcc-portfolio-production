import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './QuarterlyOverview.css';

const { FiTrendingUp, FiDollarSign, FiUsers, FiPackage, FiCalendar, FiTarget, FiAward } = FiIcons;

const QuarterlyOverview = () => {
  const [quarter, setQuarter] = useState('Q1-2024');

  const quarterlyData = {
    'Q1-2024': {
      revenue: 847230,
      profit: 212650,
      projects: 23,
      customers: 156,
      avgProjectValue: 36880,
      satisfaction: 4.8,
      teamUtilization: 87
    }
  };

  const data = quarterlyData[quarter];

  return (
    <motion.div 
      className="quarterly-overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="overview-header">
        <div>
          <h1 className="page-title">Quarterly Performance Overview</h1>
          <p className="page-subtitle">Comprehensive business performance analysis</p>
        </div>
        <select 
          value={quarter} 
          onChange={(e) => setQuarter(e.target.value)}
          className="fluent-input quarter-select"
        >
          <option value="Q1-2024">Q1 2024</option>
          <option value="Q4-2023">Q4 2023</option>
          <option value="Q3-2023">Q3 2023</option>
          <option value="Q2-2023">Q2 2023</option>
        </select>
      </div>

      <div className="quarterly-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <SafeIcon icon={FiDollarSign} />
          </div>
          <div className="metric-content">
            <div className="metric-value">${data.revenue.toLocaleString()}</div>
            <div className="metric-label">Total Revenue</div>
            <div className="metric-change up">+12.5% vs Q4</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <SafeIcon icon={FiTrendingUp} />
          </div>
          <div className="metric-content">
            <div className="metric-value">${data.profit.toLocaleString()}</div>
            <div className="metric-label">Net Profit</div>
            <div className="metric-change up">+25.1% margin</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <SafeIcon icon={FiTarget} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{data.projects}</div>
            <div className="metric-label">Projects Completed</div>
            <div className="metric-change up">94% on-time delivery</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <SafeIcon icon={FiUsers} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{data.customers}</div>
            <div className="metric-label">New Customers</div>
            <div className="metric-change up">+18 vs last quarter</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <SafeIcon icon={FiAward} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{data.satisfaction}</div>
            <div className="metric-label">Satisfaction Score</div>
            <div className="metric-change up">Excellent service</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <SafeIcon icon={FiCalendar} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{data.teamUtilization}%</div>
            <div className="metric-label">Team Utilization</div>
            <div className="metric-change neutral">Optimal capacity</div>
          </div>
        </div>
      </div>

      <div className="analysis-section">
        <h3>Quarterly Analysis</h3>
        <div className="analysis-grid">
          <div className="analysis-card">
            <h4>Revenue Growth</h4>
            <p>Strong performance driven by commercial projects and premium material sales. Average project value increased by 8% due to upselling 3D visualization services.</p>
          </div>
          <div className="analysis-card">
            <h4>Operational Efficiency</h4>
            <p>Team utilization at 87% with improved project completion rates. AI scheduling reduced idle time by 12% compared to previous quarter.</p>
          </div>
          <div className="analysis-card">
            <h4>Customer Acquisition</h4>
            <p>156 new customers acquired, primarily through referrals and online presence. Customer lifetime value increased by 15% with enhanced retention programs.</p>
          </div>
        </div>
      </div>

      <div className="recommendations-section">
        <h3>Strategic Recommendations</h3>
        <div className="recommendations-list">
          <div className="recommendation-item">
            <SafeIcon icon={FiTrendingUp} />
            <div>
              <h4>Expand Commercial Division</h4>
              <p>Commercial projects show 23% higher margins. Consider dedicated team expansion.</p>
            </div>
          </div>
          <div className="recommendation-item">
            <SafeIcon icon={FiPackage} />
            <div>
              <h4>Optimize Inventory Management</h4>
              <p>Implement AI forecasting to reduce stockouts and overstock situations.</p>
            </div>
          </div>
          <div className="recommendation-item">
            <SafeIcon icon={FiUsers} />
            <div>
              <h4>Team Development</h4>
              <p>Invest in specialized training for luxury vinyl and eco-friendly installations.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuarterlyOverview;