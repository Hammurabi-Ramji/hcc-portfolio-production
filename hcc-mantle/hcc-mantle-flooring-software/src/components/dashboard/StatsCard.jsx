import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './StatsCard.css';

const { FiTrendingUp, FiTrendingDown } = FiIcons;

const StatsCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  color = 'info',
  subtitle,
  loading = false,
  delay = 0 
}) => {
  if (loading) {
    return (
      <div className="stats-card loading">
        <div className="loading-skeleton" style={{ height: '20px', marginBottom: '8px' }}></div>
        <div className="loading-skeleton" style={{ height: '32px', marginBottom: '8px' }}></div>
        <div className="loading-skeleton" style={{ height: '16px', width: '60%' }}></div>
      </div>
    );
  }

  return (
    <motion.div
      className={`stats-card ${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      <div className="stats-header">
        <div className="stats-info">
          <h3 className="stats-title">{title}</h3>
          <div className="stats-value">{value}</div>
          <p className="stats-subtitle">{subtitle}</p>
        </div>
        <div className={`stats-icon ${color}`}>
          <SafeIcon icon={icon} />
        </div>
      </div>
      
      <div className="stats-footer">
        <div className={`stats-change ${trend}`}>
          <SafeIcon icon={trend === 'up' ? FiTrendingUp : FiTrendingDown} />
          <span>{change}</span>
        </div>
        <div className="stats-sparkline">
          <svg width="80" height="20" viewBox="0 0 80 20">
            <path
              d="M0,15 Q20,5 40,10 T80,8"
              fill="none"
              stroke={trend === 'up' ? 'var(--success)' : 'var(--error)'}
              strokeWidth="2"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;