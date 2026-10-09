import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './RecentActivity.css';

const { 
  FiUser, FiDollarSign, FiPackage, FiCalendar,
  FiCheckCircle, FiAlertCircle, FiClock, FiMoreHorizontal
} = FiIcons;

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'project',
      icon: FiCheckCircle,
      title: 'Project Completed',
      description: 'Hardwood installation at 123 Main St',
      time: '2 minutes ago',
      status: 'success',
      user: 'Mike Johnson'
    },
    {
      id: 2,
      type: 'payment',
      icon: FiDollarSign,
      title: 'Payment Received',
      description: 'Invoice #1024 - $3,450.00',
      time: '15 minutes ago',
      status: 'success',
      user: 'Sarah Wilson'
    },
    {
      id: 3,
      type: 'inventory',
      icon: FiPackage,
      title: 'Low Inventory Alert',
      description: 'Oak hardwood planks below threshold',
      time: '1 hour ago',
      status: 'warning',
      user: 'System'
    },
    {
      id: 4,
      type: 'schedule',
      icon: FiCalendar,
      title: 'Job Scheduled',
      description: 'Tile installation - Tomorrow 9:00 AM',
      time: '2 hours ago',
      status: 'info',
      user: 'Lisa Chen'
    },
    {
      id: 5,
      type: 'customer',
      icon: FiUser,
      title: 'New Customer',
      description: 'Robert Davis - Laminate flooring inquiry',
      time: '3 hours ago',
      status: 'info',
      user: 'Tom Anderson'
    },
    {
      id: 6,
      type: 'issue',
      icon: FiAlertCircle,
      title: 'Issue Reported',
      description: 'Subfloor moisture detected at job site',
      time: '4 hours ago',
      status: 'error',
      user: 'David Kim'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'var(--success)';
      case 'warning': return 'var(--warning)';
      case 'error': return 'var(--error)';
      default: return 'var(--accent-primary)';
    }
  };

  return (
    <motion.div
      className="recent-activity fluent-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="activity-header">
        <div>
          <h3>Recent Activity</h3>
          <p>Latest updates from your team</p>
        </div>
        <button className="activity-menu-btn">
          <SafeIcon icon={FiMoreHorizontal} />
        </button>
      </div>

      <div className="activity-list">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            className="activity-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 4 }}
          >
            <div 
              className="activity-icon"
              style={{ backgroundColor: `${getStatusColor(activity.status)}15` }}
            >
              <SafeIcon 
                icon={activity.icon} 
                style={{ color: getStatusColor(activity.status) }}
              />
            </div>
            
            <div className="activity-content">
              <div className="activity-main">
                <h4 className="activity-title">{activity.title}</h4>
                <p className="activity-description">{activity.description}</p>
              </div>
              
              <div className="activity-meta">
                <span className="activity-user">{activity.user}</span>
                <span className="activity-time">
                  <SafeIcon icon={FiClock} />
                  {activity.time}
                </span>
              </div>
            </div>
            
            <div className={`activity-status ${activity.status}`}>
              <div className="status-dot"></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="activity-footer">
        <button className="view-all-btn">
          View All Activity
        </button>
      </div>
    </motion.div>
  );
};

export default RecentActivity;