import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './MonthlyPerformanceReport.css';

const { FiTrendingUp, FiDollarSign, FiUsers, FiTarget, FiCalendar, FiDownload, FiShare2, FiBarChart2 } = FiIcons;

const MonthlyPerformanceReport = () => {
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const [reportGenerated, setReportGenerated] = useState(false);

  const monthlyData = {
    revenue: { current: 847230, previous: 756890, change: 11.9, target: 800000 },
    profit: { current: 212650, previous: 158570, change: 34.1, target: 200000 },
    projects: { current: 23, previous: 19, change: 21.1, target: 20 },
    customers: { current: 156, previous: 142, change: 9.9, target: 150 }
  };

  const generateReport = () => {
    setReportGenerated(true);
  };

  return (
    <motion.div className="monthly-performance-report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="report-header">
        <div>
          <h2>Monthly Performance Report</h2>
          <p>Comprehensive business performance analysis and insights</p>
        </div>
        <div className="report-controls">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="fluent-input month-select">
            <option value="2024-01">January 2024</option>
            <option value="2023-12">December 2023</option>
            <option value="2023-11">November 2023</option>
          </select>
          <button className="fluent-button" onClick={generateReport}>
            <SafeIcon icon={FiBarChart2} />
            Generate Report
          </button>
          {reportGenerated && (
            <>
              <button className="fluent-button secondary">
                <SafeIcon icon={FiDownload} />
                Download PDF
              </button>
              <button className="fluent-button secondary">
                <SafeIcon icon={FiShare2} />
                Share
              </button>
            </>
          )}
        </div>
      </div>

      <div className="kpi-overview">
        <div className="kpi-card">
          <div className="kpi-icon revenue">
            <SafeIcon icon={FiDollarSign} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Revenue</div>
            <div className="kpi-value">${monthlyData.revenue.current.toLocaleString()}</div>
            <div className="kpi-change positive">
              <SafeIcon icon={FiTrendingUp} />
              +{monthlyData.revenue.change}% vs last month
            </div>
          </div>
          <div className="kpi-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(monthlyData.revenue.current / monthlyData.revenue.target) * 100}%` }} />
            </div>
            <div className="progress-label">{Math.round((monthlyData.revenue.current / monthlyData.revenue.target) * 100)}% of target</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon profit">
            <SafeIcon icon={FiTarget} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Net Profit</div>
            <div className="kpi-value">${monthlyData.profit.current.toLocaleString()}</div>
            <div className="kpi-change positive">
              <SafeIcon icon={FiTrendingUp} />
              +{monthlyData.profit.change}% vs last month
            </div>
          </div>
          <div className="kpi-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(monthlyData.profit.current / monthlyData.profit.target) * 100}%` }} />
            </div>
            <div className="progress-label">{Math.round((monthlyData.profit.current / monthlyData.profit.target) * 100)}% of target</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon projects">
            <SafeIcon icon={FiCalendar} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Projects Completed</div>
            <div className="kpi-value">{monthlyData.projects.current}</div>
            <div className="kpi-change positive">
              <SafeIcon icon={FiTrendingUp} />
              +{monthlyData.projects.change}% vs last month
            </div>
          </div>
          <div className="kpi-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(monthlyData.projects.current / monthlyData.projects.target) * 100}%` }} />
            </div>
            <div className="progress-label">{Math.round((monthlyData.projects.current / monthlyData.projects.target) * 100)}% of target</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon customers">
            <SafeIcon icon={FiUsers} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">New Customers</div>
            <div className="kpi-value">{monthlyData.customers.current}</div>
            <div className="kpi-change positive">
              <SafeIcon icon={FiTrendingUp} />
              +{monthlyData.customers.change}% vs last month
            </div>
          </div>
          <div className="kpi-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(monthlyData.customers.current / monthlyData.customers.target) * 100}%` }} />
            </div>
            <div className="progress-label">{Math.round((monthlyData.customers.current / monthlyData.customers.target) * 100)}% of target</div>
          </div>
        </div>
      </div>

      {reportGenerated && (
        <motion.div className="report-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="report-section">
            <h3>Executive Summary</h3>
            <p>January 2024 showed strong performance across all key metrics. Revenue exceeded targets by 5.9%, driven by successful commercial project completions and improved pricing strategies. Profit margins improved significantly due to better material cost management and optimized labor allocation.</p>
          </div>

          <div className="report-section">
            <h3>Key Highlights</h3>
            <ul className="highlights-list">
              <li>Revenue increased 11.9% month-over-month, surpassing $847K</li>
              <li>Profit margin improved to 25.1%, up from 21.0% in previous month</li>
              <li>23 projects completed with 94% on-time delivery rate</li>
              <li>Customer acquisition up 9.9% with 156 new customers</li>
              <li>Team efficiency increased 8% through AI-powered scheduling</li>
            </ul>
          </div>

          <div className="report-section">
            <h3>Areas for Improvement</h3>
            <ul className="improvements-list">
              <li>Material waste reduced but still above 8% target in some projects</li>
              <li>Customer follow-up response time averaging 4.2 hours (target: 2 hours)</li>
              <li>Three projects experienced minor delays due to material availability</li>
            </ul>
          </div>

          <div className="report-section">
            <h3>Recommendations</h3>
            <div className="recommendations-grid">
              <div className="recommendation-card">
                <SafeIcon icon={FiTrendingUp} />
                <h4>Expand Commercial Division</h4>
                <p>Commercial projects show 23% higher margins. Consider dedicated team expansion.</p>
              </div>
              <div className="recommendation-card">
                <SafeIcon icon={FiUsers} />
                <h4>Team Development</h4>
                <p>Invest in specialized training for luxury vinyl and eco-friendly installations.</p>
              </div>
              <div className="recommendation-card">
                <SafeIcon icon={FiTarget} />
                <h4>Process Optimization</h4>
                <p>Implement AI forecasting to reduce material waste and improve project timelines.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MonthlyPerformanceReport;