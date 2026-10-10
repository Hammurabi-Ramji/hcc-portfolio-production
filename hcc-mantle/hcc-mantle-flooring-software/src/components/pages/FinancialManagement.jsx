import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './FinancialManagement.css';

const { 
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart,
  FiFileText, FiCreditCard, FiTarget, FiCalendar,
  FiArrowUpRight, FiArrowDownLeft, FiFilter, FiDownload
} = FiIcons;

const FinancialManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30');

  const financialData = {
    revenue: {
      current: 847230,
      previous: 756890,
      change: 11.9
    },
    expenses: {
      current: 634580,
      previous: 598320,
      change: 6.1
    },
    profit: {
      current: 212650,
      previous: 158570,
      change: 34.1
    },
    margin: {
      current: 25.1,
      previous: 21.0,
      change: 4.1
    }
  };

  const recentTransactions = [
    {
      id: 'TXN-001',
      type: 'income',
      description: 'Payment - Invoice #1024',
      customer: 'Sarah Johnson',
      amount: 3450.00,
      date: '2024-01-20',
      status: 'completed',
      category: 'Project Payment'
    },
    {
      id: 'TXN-002',
      type: 'expense',
      description: 'Material Purchase - Oak Hardwood',
      vendor: 'Forest Premium Woods',
      amount: -1250.00,
      date: '2024-01-19',
      status: 'completed',
      category: 'Materials'
    },
    {
      id: 'TXN-003',
      type: 'income',
      description: 'Payment - Invoice #1025',
      customer: 'TechCorp Inc.',
      amount: 12500.00,
      date: '2024-01-18',
      status: 'pending',
      category: 'Project Payment'
    },
    {
      id: 'TXN-004',
      type: 'expense',
      description: 'Equipment Rental - Floor Sander',
      vendor: 'Tool Rental Pro',
      amount: -450.00,
      date: '2024-01-17',
      status: 'completed',
      category: 'Equipment'
    },
    {
      id: 'TXN-005',
      type: 'expense',
      description: 'Payroll - Team Payment',
      vendor: 'Payroll System',
      amount: -8750.00,
      date: '2024-01-15',
      status: 'completed',
      category: 'Payroll'
    }
  ];

  const invoices = [
    {
      id: 'INV-1024',
      customer: 'Sarah Johnson',
      project: 'Luxury Hardwood Installation',
      amount: 12750.00,
      issued: '2024-01-15',
      due: '2024-02-15',
      status: 'paid',
      paidDate: '2024-01-20'
    },
    {
      id: 'INV-1025',
      customer: 'TechCorp Inc.',
      project: 'Commercial Tile Flooring',
      amount: 48500.00,
      issued: '2024-01-12',
      due: '2024-02-12',
      status: 'pending',
      paidDate: null
    },
    {
      id: 'INV-1026',
      customer: 'Robert Davis',
      project: 'Residential Laminate Upgrade',
      amount: 8950.00,
      issued: '2024-01-10',
      due: '2024-02-10',
      status: 'overdue',
      paidDate: null
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': case 'completed': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      case 'overdue': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const getChangeIcon = (change) => {
    return change > 0 ? FiTrendingUp : FiTrendingDown;
  };

  const getChangeColor = (change) => {
    return change > 0 ? 'var(--success)' : 'var(--error)';
  };

  return (
    <motion.div
      className="financial-management"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Management</h1>
          <p className="page-subtitle">Track revenue, expenses, and profitability</p>
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
          <button className="fluent-button secondary">
            <SafeIcon icon={FiDownload} />
            Export Report
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <motion.div 
        className="financial-overview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="overview-card revenue">
          <div className="card-header">
            <div className="card-icon">
              <SafeIcon icon={FiTrendingUp} />
            </div>
            <div className="card-change" style={{ color: getChangeColor(financialData.revenue.change) }}>
              <SafeIcon icon={getChangeIcon(financialData.revenue.change)} />
              {Math.abs(financialData.revenue.change)}%
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">{formatCurrency(financialData.revenue.current)}</div>
            <div className="card-label">Total Revenue</div>
            <div className="card-comparison">
              vs {formatCurrency(financialData.revenue.previous)} last period
            </div>
          </div>
        </div>

        <div className="overview-card expenses">
          <div className="card-header">
            <div className="card-icon">
              <SafeIcon icon={FiArrowDownLeft} />
            </div>
            <div className="card-change" style={{ color: getChangeColor(-financialData.expenses.change) }}>
              <SafeIcon icon={getChangeIcon(financialData.expenses.change)} />
              {Math.abs(financialData.expenses.change)}%
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">{formatCurrency(financialData.expenses.current)}</div>
            <div className="card-label">Total Expenses</div>
            <div className="card-comparison">
              vs {formatCurrency(financialData.expenses.previous)} last period
            </div>
          </div>
        </div>

        <div className="overview-card profit">
          <div className="card-header">
            <div className="card-icon">
              <SafeIcon icon={FiTarget} />
            </div>
            <div className="card-change" style={{ color: getChangeColor(financialData.profit.change) }}>
              <SafeIcon icon={getChangeIcon(financialData.profit.change)} />
              {Math.abs(financialData.profit.change)}%
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">{formatCurrency(financialData.profit.current)}</div>
            <div className="card-label">Net Profit</div>
            <div className="card-comparison">
              vs {formatCurrency(financialData.profit.previous)} last period
            </div>
          </div>
        </div>

        <div className="overview-card margin">
          <div className="card-header">
            <div className="card-icon">
              <SafeIcon icon={FiPieChart} />
            </div>
            <div className="card-change" style={{ color: getChangeColor(financialData.margin.change) }}>
              <SafeIcon icon={getChangeIcon(financialData.margin.change)} />
              {Math.abs(financialData.margin.change)}%
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">{financialData.margin.current}%</div>
            <div className="card-label">Profit Margin</div>
            <div className="card-comparison">
              vs {financialData.margin.previous}% last period
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        className="tab-navigation"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <SafeIcon icon={FiPieChart} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <SafeIcon icon={FiCreditCard} />
          Transactions ({recentTransactions.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <SafeIcon icon={FiFileText} />
          Invoices ({invoices.length})
        </button>
      </motion.div>

      {/* Content Area */}
      <motion.div 
        className="content-area"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="charts-section">
              <div className="chart-card fluent-card">
                <div className="chart-header">
                  <h3>Revenue vs Expenses</h3>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color revenue"></div>
                      <span>Revenue</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color expenses"></div>
                      <span>Expenses</span>
                    </div>
                  </div>
                </div>
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    <div className="bar-group">
                      <div className="bar revenue" style={{ height: '80%' }}></div>
                      <div className="bar expenses" style={{ height: '60%' }}></div>
                      <span>Jan</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar revenue" style={{ height: '90%' }}></div>
                      <div className="bar expenses" style={{ height: '65%' }}></div>
                      <span>Feb</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar revenue" style={{ height: '85%' }}></div>
                      <div className="bar expenses" style={{ height: '70%' }}></div>
                      <span>Mar</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profit-breakdown fluent-card">
                <div className="breakdown-header">
                  <h3>Profit Breakdown</h3>
                  <SafeIcon icon={FiTarget} />
                </div>
                <div className="breakdown-items">
                  <div className="breakdown-item">
                    <div className="item-label">Material Costs</div>
                    <div className="item-value">45%</div>
                    <div className="item-bar">
                      <div className="item-fill" style={{ width: '45%', backgroundColor: '#ef4444' }}></div>
                    </div>
                  </div>
                  <div className="breakdown-item">
                    <div className="item-label">Labor Costs</div>
                    <div className="item-value">30%</div>
                    <div className="item-bar">
                      <div className="item-fill" style={{ width: '30%', backgroundColor: '#f97316' }}></div>
                    </div>
                  </div>
                  <div className="breakdown-item">
                    <div className="item-label">Overhead</div>
                    <div className="item-value">15%</div>
                    <div className="item-bar">
                      <div className="item-fill" style={{ width: '15%', backgroundColor: '#eab308' }}></div>
                    </div>
                  </div>
                  <div className="breakdown-item">
                    <div className="item-label">Profit</div>
                    <div className="item-value">25%</div>
                    <div className="item-bar">
                      <div className="item-fill" style={{ width: '25%', backgroundColor: 'var(--success)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-content">
            <div className="transactions-header">
              <div className="search-filters">
                <button className="fluent-button secondary">
                  <SafeIcon icon={FiFilter} />
                  Filters
                </button>
              </div>
            </div>

            <div className="transactions-list">
              {recentTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  className="transaction-item fluent-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="transaction-info">
                    <div className={`transaction-icon ${transaction.type}`}>
                      <SafeIcon icon={transaction.type === 'income' ? FiArrowUpRight : FiArrowDownLeft} />
                    </div>
                    <div className="transaction-details">
                      <h4>{transaction.description}</h4>
                      <p>{transaction.customer || transaction.vendor}</p>
                      <span className="transaction-category">{transaction.category}</span>
                    </div>
                  </div>
                  
                  <div className="transaction-meta">
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                    </div>
                    <div className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                    <div 
                      className="transaction-status"
                      style={{ 
                        backgroundColor: `${getStatusColor(transaction.status)}15`, 
                        color: getStatusColor(transaction.status) 
                      }}
                    >
                      {transaction.status}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="invoices-content">
            <div className="invoices-grid">
              {invoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  className="invoice-card fluent-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -4 }}
                >
                  <div className="invoice-header">
                    <div className="invoice-id">{invoice.id}</div>
                    <div 
                      className="invoice-status"
                      style={{ 
                        backgroundColor: `${getStatusColor(invoice.status)}15`, 
                        color: getStatusColor(invoice.status) 
                      }}
                    >
                      {invoice.status}
                    </div>
                  </div>

                  <div className="invoice-info">
                    <h3>{invoice.project}</h3>
                    <div className="invoice-customer">
                      <SafeIcon icon={FiFileText} />
                      <span>{invoice.customer}</span>
                    </div>
                  </div>

                  <div className="invoice-amount">
                    <div className="amount-main">
                      <span className="currency">$</span>
                      <span className="value">{invoice.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="invoice-dates">
                    <div className="date-item">
                      <span>Issued:</span>
                      <span>{new Date(invoice.issued).toLocaleDateString()}</span>
                    </div>
                    <div className="date-item">
                      <span>Due:</span>
                      <span>{new Date(invoice.due).toLocaleDateString()}</span>
                    </div>
                    {invoice.paidDate && (
                      <div className="date-item">
                        <span>Paid:</span>
                        <span>{new Date(invoice.paidDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="invoice-actions">
                    <button className="invoice-action-btn">
                      View Details
                    </button>
                    {invoice.status === 'pending' && (
                      <button className="invoice-action-btn primary">
                        Send Reminder
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FinancialManagement;