import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './AdvancedBudgetManagement.css';

const { FiDollarSign, FiTrendingUp, FiTrendingDown, FiTarget, FiAlertCircle, FiPlus, FiDownload } = FiIcons;

const AdvancedBudgetManagement = () => {
  const [selectedProject, setSelectedProject] = useState('all');
  const [timeRange, setTimeRange] = useState('30');

  const budgetData = {
    totalBudget: 125000,
    totalSpent: 87450,
    remaining: 37550,
    projectedOverrun: 0,
    projects: [
      { id: 'PRJ-001', name: 'Luxury Hardwood Installation', budget: 12500, spent: 9375, remaining: 3125, status: 'on-track', forecast: 12100 },
      { id: 'PRJ-002', name: 'Commercial Tile Flooring', budget: 45000, spent: 6750, remaining: 38250, status: 'under-budget', forecast: 42000 },
      { id: 'PRJ-003', name: 'Residential Laminate', budget: 8500, spent: 8100, remaining: 400, status: 'at-risk', forecast: 8600 },
      { id: 'PRJ-004', name: 'Vinyl Plank Installation', budget: 15200, spent: 6840, remaining: 8360, status: 'on-track', forecast: 14800 }
    ],
    categories: [
      { name: 'Materials', budgeted: 62500, actual: 45230, variance: 17270 },
      { name: 'Labor', budgeted: 37500, actual: 28450, variance: 9050 },
      { name: 'Equipment', budgeted: 12500, actual: 8920, variance: 3580 },
      { name: 'Overhead', budgeted: 12500, actual: 4850, variance: 7650 }
    ]
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-track': return 'var(--success)';
      case 'under-budget': return 'var(--accent-primary)';
      case 'at-risk': return 'var(--warning)';
      case 'over-budget': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getVarianceColor = (variance) => {
    return variance >= 0 ? 'var(--success)' : 'var(--error)';
  };

  return (
    <motion.div className="advanced-budget-management" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Advanced Budget Management</h1>
          <p className="page-subtitle">Track project budgets and financial performance</p>
        </div>
        <div className="header-actions">
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="fluent-input project-select">
            <option value="all">All Projects</option>
            <option value="PRJ-001">PRJ-001</option>
            <option value="PRJ-002">PRJ-002</option>
          </select>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="fluent-input time-range-select">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
          </select>
          <button className="fluent-button">
            <SafeIcon icon={FiDownload} /> Export Report
          </button>
        </div>
      </div>

      <div className="budget-overview">
        <div className="budget-card total">
          <div className="card-icon">
            <SafeIcon icon={FiDollarSign} />
          </div>
          <div className="card-content">
            <div className="card-label">Total Budget</div>
            <div className="card-value">${budgetData.totalBudget.toLocaleString()}</div>
          </div>
        </div>
        <div className="budget-card spent">
          <div className="card-icon">
            <SafeIcon icon={FiTrendingDown} />
          </div>
          <div className="card-content">
            <div className="card-label">Total Spent</div>
            <div className="card-value">${budgetData.totalSpent.toLocaleString()}</div>
          </div>
        </div>
        <div className="budget-card remaining">
          <div className="card-icon">
            <SafeIcon icon={FiTarget} />
          </div>
          <div className="card-content">
            <div className="card-label">Remaining</div>
            <div className="card-value">${budgetData.remaining.toLocaleString()}</div>
          </div>
        </div>
        <div className="budget-card forecast">
          <div className="card-icon">
            <SafeIcon icon={FiTrendingUp} />
          </div>
          <div className="card-content">
            <div className="card-label">Projected Variance</div>
            <div className="card-value" style={{ color: budgetData.projectedOverrun > 0 ? 'var(--error)' : 'var(--success)' }}>
              {budgetData.projectedOverrun >= 0 ? '+' : ''}${budgetData.projectedOverrun.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="budget-sections">
        <div className="budget-section">
          <div className="section-header">
            <h3>Project Budgets</h3>
            <button className="fluent-button secondary">
              <SafeIcon icon={FiPlus} /> Add Project
            </button>
          </div>
          <div className="projects-table">
            <div className="table-header">
              <div className="table-cell">Project</div>
              <div className="table-cell">Budget</div>
              <div className="table-cell">Spent</div>
              <div className="table-cell">Remaining</div>
              <div className="table-cell">Forecast</div>
              <div className="table-cell">Status</div>
            </div>
            <div className="table-body">
              {budgetData.projects.map((project, index) => (
                <motion.div key={project.id} className="table-row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                  <div className="table-cell project-name">{project.name}</div>
                  <div className="table-cell">${project.budget.toLocaleString()}</div>
                  <div className="table-cell">${project.spent.toLocaleString()}</div>
                  <div className="table-cell">${project.remaining.toLocaleString()}</div>
                  <div className="table-cell forecast">${project.forecast.toLocaleString()}</div>
                  <div className="table-cell">
                    <span className="status-badge" style={{ backgroundColor: `${getStatusColor(project.status)}15`, color: getStatusColor(project.status) }}>
                      {project.status.replace('-', ' ')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="budget-section">
          <div className="section-header">
            <h3>Budget Categories</h3>
          </div>
          <div className="categories-grid">
            {budgetData.categories.map((category, index) => (
              <motion.div key={category.name} className="category-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <div className="category-header">
                  <h4>{category.name}</h4>
                  <div className="variance" style={{ color: getVarianceColor(category.variance) }}>
                    {category.variance >= 0 ? '+' : ''}${category.variance.toLocaleString()}
                  </div>
                </div>
                <div className="category-stats">
                  <div className="stat">
                    <span className="label">Budgeted:</span>
                    <span className="value">${category.budgeted.toLocaleString()}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Actual:</span>
                    <span className="value">${category.actual.toLocaleString()}</span>
                  </div>
                </div>
                <div className="category-bar">
                  <div className="bar-fill" style={{ width: `${(category.actual / category.budgeted) * 100}%`, backgroundColor: getVarianceColor(category.variance) }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdvancedBudgetManagement;