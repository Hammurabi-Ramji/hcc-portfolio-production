import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './AIInsights.css';

const { 
  FiBrain, FiTrendingUp, FiAlertTriangle, FiTarget,
  FiRefreshCw, FiEye, FiZap, FiShield
} = FiIcons;

const AIInsights = () => {
  const [refreshing, setRefreshing] = useState(false);

  const insights = [
    {
      id: 1,
      type: 'opportunity',
      icon: FiTrendingUp,
      title: 'Revenue Optimization',
      description: 'AI detected 15% profit increase opportunity by adjusting material sourcing for upcoming projects.',
      confidence: 92,
      action: 'Review Suggestions',
      priority: 'high'
    },
    {
      id: 2,
      type: 'warning',
      icon: FiAlertTriangle,
      title: 'Inventory Risk',
      description: 'Predictive analysis shows potential stockout of hardwood planks in 12 days based on current project pipeline.',
      confidence: 87,
      action: 'Order Materials',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'efficiency',
      icon: FiTarget,
      title: 'Team Optimization',
      description: 'Crew assignment algorithm suggests reassigning Mike\'s team to increase project completion rate by 8%.',
      confidence: 78,
      action: 'Optimize Schedule',
      priority: 'low'
    },
    {
      id: 4,
      type: 'insight',
      icon: FiEye,
      title: 'Customer Behavior',
      description: 'Pattern analysis reveals customers are 23% more likely to accept quotes with 3D floor visualizations.',
      confidence: 95,
      action: 'Enable Feature',
      priority: 'high'
    }
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--accent-primary)';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'opportunity': return 'var(--success)';
      case 'warning': return 'var(--warning)';
      case 'efficiency': return 'var(--accent-primary)';
      case 'insight': return '#9333ea';
      default: return 'var(--accent-primary)';
    }
  };

  return (
    <motion.div
      className="ai-insights fluent-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="insights-header">
        <div className="header-left">
          <div className="ai-badge">
            <SafeIcon icon={FiBrain} />
            <span>Venice.AI</span>
          </div>
          <div>
            <h3>AI Insights</h3>
            <p>Privacy-first intelligence for your business</p>
          </div>
        </div>
        
        <motion.button
          className="refresh-btn"
          onClick={handleRefresh}
          animate={{ rotate: refreshing ? 360 : 0 }}
          transition={{ duration: 1 }}
        >
          <SafeIcon icon={FiRefreshCw} />
        </motion.button>
      </div>

      <div className="insights-status">
        <div className="status-item">
          <SafeIcon icon={FiShield} />
          <span>Privacy Protected</span>
        </div>
        <div className="status-item">
          <SafeIcon icon={FiZap} />
          <span>Real-time Analysis</span>
        </div>
      </div>

      <div className="insights-list">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            className="insight-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="insight-header">
              <div 
                className="insight-icon"
                style={{ backgroundColor: `${getTypeColor(insight.type)}15` }}
              >
                <SafeIcon 
                  icon={insight.icon}
                  style={{ color: getTypeColor(insight.type) }}
                />
              </div>
              
              <div className="insight-meta">
                <div className="insight-title">{insight.title}</div>
                <div className="insight-confidence">
                  {insight.confidence}% confidence
                  <div 
                    className="confidence-bar"
                    style={{ 
                      '--confidence': `${insight.confidence}%`,
                      '--color': getTypeColor(insight.type)
                    }}
                  />
                </div>
              </div>
              
              <div 
                className="priority-indicator"
                style={{ backgroundColor: getPriorityColor(insight.priority) }}
              />
            </div>
            
            <p className="insight-description">{insight.description}</p>
            
            <button className="insight-action">
              {insight.action}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="insights-footer">
        <div className="footer-stats">
          <div className="stat">
            <span className="stat-value">4</span>
            <span className="stat-label">Active Insights</span>
          </div>
          <div className="stat">
            <span className="stat-value">92%</span>
            <span className="stat-label">Avg Confidence</span>
          </div>
          <div className="stat">
            <span className="stat-value">$12.3k</span>
            <span className="stat-label">Est. Savings</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIInsights;