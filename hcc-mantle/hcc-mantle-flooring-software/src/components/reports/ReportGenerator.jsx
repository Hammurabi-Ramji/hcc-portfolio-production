import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './ReportGenerator.css';

const {
  FiFileText, FiDownload, FiCalendar, FiFilter, FiTrendingUp,
  FiBarChart2, FiUsers, FiDollarSign, FiSettings, FiCheckCircle
} = FiIcons;

const ReportGenerator = () => {
  const [reportType, setReportType] = useState('financial');
  const [dateRange, setDateRange] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const reportTypes = [
    { id: 'financial', name: 'Financial Summary', icon: FiDollarSign, color: '#10b981' },
    { id: 'projects', name: 'Project Status', icon: FiCheckCircle, color: '#0078d4' },
    { id: 'inventory', name: 'Inventory Analysis', icon: FiBarChart2, color: '#f59e0b' },
    { id: 'team', name: 'Team Performance', icon: FiUsers, color: '#9333ea' },
    { id: 'customers', name: 'Customer Report', icon: FiUsers, color: '#ef4444' }
  ];

  const generateReport = async () => {
    setIsGenerating(true);

    // Simulate report generation
    setTimeout(() => {
      const mockReport = {
        id: `RPT-${Date.now()}`,
        type: reportType,
        dateRange: dateRange,
        generatedAt: new Date().toISOString(),
        summary: {
          revenue: 847230,
          expenses: 634580,
          profit: 212650,
          projects: 23,
          customers: 156
        },
        insights: [
          'Revenue increased 12.5% compared to last period',
          'Project completion rate at 94%',
          'Inventory turnover improved by 8%',
          'Customer satisfaction rating: 4.8/5'
        ],
        recommendations: [
          'Focus on high-margin projects',
          'Optimize material purchasing',
          'Expand team capacity',
          'Implement customer retention program'
        ]
      };
      setGeneratedReport(mockReport);
      setIsGenerating(false);
    }, 2000);
  };

  const downloadReport = () => {
    if (!generatedReport) return;
    
    // Simulate PDF download
    const reportData = JSON.stringify(generatedReport, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedReport.type}_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="report-generator"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="generator-header">
        <div>
          <h2>Report Generator</h2>
          <p>Create comprehensive business reports with AI insights</p>
        </div>
      </div>

      <div className="generator-form">
        <div className="form-section">
          <h3>Report Type</h3>
          <div className="report-type-grid">
            {reportTypes.map((type) => (
              <motion.button
                key={type.id}
                className={`type-card ${reportType === type.id ? 'selected' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setReportType(type.id)}
              >
                <SafeIcon icon={type.icon} style={{ color: type.color }} />
                <span>{type.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Date Range</h3>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="date-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
            <option value="custom">Custom range</option>
          </select>
        </div>

        <div className="form-section">
          <h3>Include Sections</h3>
          <div className="checkbox-group">
            <label className="checkbox-item">
              <input type="checkbox" defaultChecked />
              <span>Executive Summary</span>
            </label>
            <label className="checkbox-item">
              <input type="checkbox" defaultChecked />
              <span>Detailed Analytics</span>
            </label>
            <label className="checkbox-item">
              <input type="checkbox" defaultChecked />
              <span>AI Insights</span>
            </label>
            <label className="checkbox-item">
              <input type="checkbox" defaultChecked />
              <span>Recommendations</span>
            </label>
            <label className="checkbox-item">
              <input type="checkbox" />
              <span>Raw Data Export</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="generate-btn"
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="spinner"></div>
                Generating Report...
              </>
            ) : (
              <>
                <SafeIcon icon={FiFileText} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {generatedReport && (
        <motion.div
          className="report-preview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="preview-header">
            <h3>Report Preview</h3>
            <span className="report-id">{generatedReport.id}</span>
          </div>

          <div className="preview-content">
            <div className="summary-section">
              <h4>Executive Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Revenue</span>
                  <strong>${generatedReport.summary.revenue.toLocaleString()}</strong>
                </div>
                <div className="summary-item">
                  <span>Profit</span>
                  <strong>${generatedReport.summary.profit.toLocaleString()}</strong>
                </div>
                <div className="summary-item">
                  <span>Projects</span>
                  <strong>{generatedReport.summary.projects}</strong>
                </div>
                <div className="summary-item">
                  <span>Customers</span>
                  <strong>{generatedReport.summary.customers}</strong>
                </div>
              </div>
            </div>

            <div className="insights-section">
              <h4>AI Insights</h4>
              <ul>
                {generatedReport.insights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>

            <div className="recommendations-section">
              <h4>Recommendations</h4>
              <ul>
                {generatedReport.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="preview-actions">
            <button className="download-btn" onClick={downloadReport}>
              <SafeIcon icon={FiDownload} />
              Download PDF
            </button>
            <button 
              className="share-btn"
              onClick={() => alert('Share functionality would be implemented here')}
            >
              <SafeIcon icon={FiUsers} />
              Share
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ReportGenerator;