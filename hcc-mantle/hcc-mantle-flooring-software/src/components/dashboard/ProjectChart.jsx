import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './ProjectChart.css';

const { FiBarChart3, FiTrendingUp, FiCalendar } = FiIcons;

const ProjectChart = ({ timeRange }) => {
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('revenue');

  useEffect(() => {
    // Generate mock data based on time range
    const generateData = () => {
      const days = parseInt(timeRange);
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 50000) + 10000,
          projects: Math.floor(Math.random() * 8) + 2,
          completion: Math.floor(Math.random() * 30) + 70
        });
      }
      
      setChartData(data);
    };

    generateData();
  }, [timeRange]);

  const tabs = [
    { id: 'revenue', label: 'Revenue', icon: FiTrendingUp },
    { id: 'projects', label: 'Projects', icon: FiBarChart3 },
    { id: 'completion', label: 'Completion', icon: FiCalendar }
  ];

  const getMaxValue = () => {
    if (activeTab === 'revenue') return Math.max(...chartData.map(d => d.revenue));
    if (activeTab === 'projects') return Math.max(...chartData.map(d => d.projects));
    return 100;
  };

  const formatValue = (value) => {
    if (activeTab === 'revenue') return `$${(value / 1000).toFixed(0)}k`;
    if (activeTab === 'completion') return `${value}%`;
    return value.toString();
  };

  const maxValue = getMaxValue();

  return (
    <motion.div
      className="project-chart fluent-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>Performance Analytics</h3>
          <p>Track your business metrics over time</p>
        </div>
        
        <div className="chart-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`chart-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <SafeIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-y-axis">
          {[100, 75, 50, 25, 0].map((percent) => (
            <div key={percent} className="y-axis-label">
              {formatValue((maxValue * percent) / 100)}
            </div>
          ))}
        </div>

        <div className="chart-area">
          <div className="chart-grid">
            {[0, 25, 50, 75, 100].map((line) => (
              <div
                key={line}
                className="grid-line"
                style={{ bottom: `${line}%` }}
              />
            ))}
          </div>

          <div className="chart-bars">
            {chartData.map((data, index) => {
              const value = data[activeTab];
              const height = (value / maxValue) * 100;
              
              return (
                <motion.div
                  key={index}
                  className="chart-bar-container"
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  transition={{ delay: index * 0.02 }}
                >
                  <motion.div
                    className="chart-bar"
                    style={{ height: `${height}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.02, duration: 0.6 }}
                    whileHover={{ opacity: 0.8, scale: 1.05 }}
                  >
                    <div className="bar-tooltip">
                      <div className="tooltip-date">
                        {new Date(data.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="tooltip-value">
                        {formatValue(value)}
                      </div>
                    </div>
                  </motion.div>
                  
                  <div className="x-axis-label">
                    {new Date(data.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Total</span>
          <span className="summary-value">
            {activeTab === 'revenue' 
              ? `$${(chartData.reduce((sum, d) => sum + d.revenue, 0) / 1000).toFixed(0)}k`
              : activeTab === 'projects'
              ? chartData.reduce((sum, d) => sum + d.projects, 0)
              : `${Math.round(chartData.reduce((sum, d) => sum + d.completion, 0) / chartData.length)}%`
            }
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Average</span>
          <span className="summary-value">
            {activeTab === 'revenue' 
              ? `$${(chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length / 1000).toFixed(1)}k`
              : activeTab === 'projects'
              ? Math.round(chartData.reduce((sum, d) => sum + d.projects, 0) / chartData.length)
              : `${Math.round(chartData.reduce((sum, d) => sum + d.completion, 0) / chartData.length)}%`
            }
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Trend</span>
          <span className="summary-value trend-up">
            <SafeIcon icon={FiTrendingUp} />
            +12.5%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectChart;