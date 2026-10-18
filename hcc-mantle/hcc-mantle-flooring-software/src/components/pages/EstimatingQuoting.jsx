import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './EstimatingQuoting.css';

const { 
  FiPlus, FiCalculator, FiEye, FiSend, FiEdit3,
  FiDollarSign, FiClock, FiUser, FiHome, FiTarget,
  FiTrendingUp, FiCheckCircle, FiMoreVertical, FiBrain
} = FiIcons;

const EstimatingQuoting = () => {
  const [activeTab, setActiveTab] = useState('quotes');
  const [showCalculator, setShowCalculator] = useState(false);

  const quotes = [
    {
      id: 'QUO-001',
      customerName: 'Sarah Johnson',
      projectName: 'Living Room Hardwood',
      floorType: 'Hardwood',
      area: 450,
      totalAmount: 12750,
      status: 'pending',
      createdDate: '2024-01-15',
      validUntil: '2024-02-15',
      margin: 28,
      probability: 85
    },
    {
      id: 'QUO-002',
      customerName: 'TechCorp Inc.',
      projectName: 'Office Renovation - Tile',
      floorType: 'Tile',
      area: 2200,
      totalAmount: 48500,
      status: 'accepted',
      createdDate: '2024-01-12',
      validUntil: '2024-02-12',
      margin: 22,
      probability: 100
    },
    {
      id: 'QUO-003',
      customerName: 'Robert Davis',
      projectName: 'Basement Laminate',
      floorType: 'Laminate',
      area: 680,
      totalAmount: 8950,
      status: 'rejected',
      createdDate: '2024-01-10',
      validUntil: '2024-02-10',
      margin: 25,
      probability: 0
    },
    {
      id: 'QUO-004',
      customerName: 'Emma Wilson',
      projectName: 'Kitchen & Dining Vinyl',
      floorType: 'Vinyl',
      area: 320,
      totalAmount: 6200,
      status: 'sent',
      createdDate: '2024-01-18',
      validUntil: '2024-02-18',
      margin: 30,
      probability: 70
    }
  ];

  const estimates = [
    {
      id: 'EST-001',
      customerName: 'Michael Brown',
      projectName: 'Master Bedroom Carpet',
      floorType: 'Carpet',
      area: 280,
      estimatedAmount: 4200,
      status: 'draft',
      createdDate: '2024-01-19',
      lastModified: '2024-01-20'
    },
    {
      id: 'EST-002',
      customerName: 'Lisa Chen',
      projectName: 'Bathroom Tile Renovation',
      floorType: 'Tile',
      area: 85,
      estimatedAmount: 2850,
      status: 'in-progress',
      createdDate: '2024-01-17',
      lastModified: '2024-01-20'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'var(--success)';
      case 'sent': return 'var(--accent-primary)';
      case 'pending': return 'var(--warning)';
      case 'rejected': return 'var(--error)';
      case 'draft': return 'var(--text-tertiary)';
      case 'in-progress': return 'var(--accent-primary)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const totalQuoteValue = quotes.reduce((sum, quote) => sum + quote.totalAmount, 0);
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const averageMargin = quotes.reduce((sum, quote) => sum + quote.margin, 0) / quotes.length;

  return (
    <motion.div
      className="estimating-quoting"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Estimating & Quoting</h1>
          <p className="page-subtitle">Create accurate estimates and professional quotes</p>
        </div>
        <div className="header-actions">
          <button 
            className="fluent-button secondary"
            onClick={() => setShowCalculator(true)}
          >
            <SafeIcon icon={FiCalculator} />
            AI Calculator
          </button>
          <button className="fluent-button">
            <SafeIcon icon={FiPlus} />
            New Quote
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <motion.div 
        className="quote-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon total">
            <SafeIcon icon={FiDollarSign} />
          </div>
          <div className="stat-content">
            <div className="stat-value">${totalQuoteValue.toLocaleString()}</div>
            <div className="stat-label">Total Quote Value</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              +12.5% vs last month
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon accepted">
            <SafeIcon icon={FiCheckCircle} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{acceptedQuotes}</div>
            <div className="stat-label">Accepted Quotes</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              78% acceptance rate
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon margin">
            <SafeIcon icon={FiTarget} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{averageMargin.toFixed(1)}%</div>
            <div className="stat-label">Avg Margin</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              +2.3% vs target
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <SafeIcon icon={FiClock} />
          </div>
          <div className="stat-content">
            <div className="stat-value">2</div>
            <div className="stat-label">Pending Quotes</div>
            <div className="stat-trend neutral">
              Awaiting response
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
          className={`tab-btn ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotes')}
        >
          <SafeIcon icon={FiDollarSign} />
          Quotes ({quotes.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'estimates' ? 'active' : ''}`}
          onClick={() => setActiveTab('estimates')}
        >
          <SafeIcon icon={FiCalculator} />
          Estimates ({estimates.length})
        </button>
      </motion.div>

      {/* Content Area */}
      <motion.div 
        className="content-area"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {activeTab === 'quotes' && (
          <div className="quotes-grid">
            {quotes.map((quote, index) => (
              <motion.div
                key={quote.id}
                className="quote-card fluent-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -4 }}
              >
                <div className="quote-header">
                  <div className="quote-id">{quote.id}</div>
                  <div className="quote-actions">
                    <button className="action-btn">
                      <SafeIcon icon={FiEye} />
                    </button>
                    <button className="action-btn">
                      <SafeIcon icon={FiEdit3} />
                    </button>
                    <button className="action-btn">
                      <SafeIcon icon={FiSend} />
                    </button>
                    <button className="action-btn">
                      <SafeIcon icon={FiMoreVertical} />
                    </button>
                  </div>
                </div>

                <div className="quote-info">
                  <h3 className="quote-project">{quote.projectName}</h3>
                  <div className="quote-customer">
                    <SafeIcon icon={FiUser} />
                    <span>{quote.customerName}</span>
                  </div>
                  <div className="quote-details">
                    <div className="detail-item">
                      <SafeIcon icon={FiHome} />
                      <span>{quote.floorType}</span>
                    </div>
                    <div className="detail-item">
                      <span>{quote.area} sq ft</span>
                    </div>
                  </div>
                </div>

                <div className="quote-amount">
                  <div className="amount-main">
                    <span className="currency">$</span>
                    <span className="value">{quote.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="amount-details">
                    <span>Margin: {quote.margin}%</span>
                    <span>Probability: {quote.probability}%</span>
                  </div>
                </div>

                <div className="quote-progress">
                  <div className="progress-header">
                    <span>Win Probability</span>
                    <span>{quote.probability}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${quote.probability}%`,
                        backgroundColor: getStatusColor(quote.status)
                      }}
                    />
                  </div>
                </div>

                <div className="quote-footer">
                  <div 
                    className="status-badge"
                    style={{ 
                      backgroundColor: `${getStatusColor(quote.status)}15`, 
                      color: getStatusColor(quote.status) 
                    }}
                  >
                    {getStatusLabel(quote.status)}
                  </div>
                  
                  <div className="quote-dates">
                    <div>Created: {new Date(quote.createdDate).toLocaleDateString()}</div>
                    <div>Valid until: {new Date(quote.validUntil).toLocaleDateString()}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'estimates' && (
          <div className="estimates-grid">
            {estimates.map((estimate, index) => (
              <motion.div
                key={estimate.id}
                className="estimate-card fluent-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -4 }}
              >
                <div className="estimate-header">
                  <div className="estimate-id">{estimate.id}</div>
                  <div className="estimate-actions">
                    <button className="action-btn">
                      <SafeIcon icon={FiEdit3} />
                    </button>
                    <button className="action-btn convert-btn">
                      Convert to Quote
                    </button>
                  </div>
                </div>

                <div className="estimate-info">
                  <h3 className="estimate-project">{estimate.projectName}</h3>
                  <div className="estimate-customer">
                    <SafeIcon icon={FiUser} />
                    <span>{estimate.customerName}</span>
                  </div>
                  <div className="estimate-details">
                    <div className="detail-item">
                      <SafeIcon icon={FiHome} />
                      <span>{estimate.floorType}</span>
                    </div>
                    <div className="detail-item">
                      <span>{estimate.area} sq ft</span>
                    </div>
                  </div>
                </div>

                <div className="estimate-amount">
                  <div className="amount-main">
                    <span className="currency">$</span>
                    <span className="value">{estimate.estimatedAmount.toLocaleString()}</span>
                  </div>
                  <div className="amount-label">Estimated Cost</div>
                </div>

                <div className="estimate-footer">
                  <div 
                    className="status-badge"
                    style={{ 
                      backgroundColor: `${getStatusColor(estimate.status)}15`, 
                      color: getStatusColor(estimate.status) 
                    }}
                  >
                    {getStatusLabel(estimate.status)}
                  </div>
                  
                  <div className="estimate-dates">
                    <div>Created: {new Date(estimate.createdDate).toLocaleDateString()}</div>
                    <div>Modified: {new Date(estimate.lastModified).toLocaleDateString()}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* AI Calculator Modal */}
      {showCalculator && (
        <motion.div 
          className="calculator-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowCalculator(false)}
        >
          <motion.div 
            className="calculator-modal fluent-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="calculator-header">
              <h3>AI-Powered Cost Calculator</h3>
              <div className="ai-badge">
                <SafeIcon icon={FiBrain} />
                Venice.AI
              </div>
            </div>
            
            <div className="calculator-content">
              <div className="calc-section">
                <label>Floor Type</label>
                <select className="fluent-input">
                  <option>Hardwood</option>
                  <option>Tile</option>
                  <option>Laminate</option>
                  <option>Vinyl</option>
                  <option>Carpet</option>
                </select>
              </div>
              
              <div className="calc-section">
                <label>Room Dimensions</label>
                <div className="dimension-inputs">
                  <input type="number" placeholder="Length (ft)" className="fluent-input" />
                  <span>×</span>
                  <input type="number" placeholder="Width (ft)" className="fluent-input" />
                </div>
              </div>
              
              <div className="calc-section">
                <label>Complexity Level</label>
                <select className="fluent-input">
                  <option>Standard</option>
                  <option>Moderate</option>
                  <option>Complex</option>
                </select>
              </div>
              
              <div className="calc-results">
                <div className="result-item">
                  <span>Material Cost:</span>
                  <span>$2,450</span>
                </div>
                <div className="result-item">
                  <span>Labor Cost:</span>
                  <span>$1,850</span>
                </div>
                <div className="result-item">
                  <span>Total Cost:</span>
                  <span className="total">$4,300</span>
                </div>
                <div className="result-item">
                  <span>Suggested Price:</span>
                  <span className="suggested">$5,590</span>
                </div>
              </div>
            </div>
            
            <div className="calculator-actions">
              <button className="fluent-button secondary" onClick={() => setShowCalculator(false)}>
                Close
              </button>
              <button className="fluent-button">
                Create Quote
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EstimatingQuoting;