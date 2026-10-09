import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './CustomerFollowUpAutomation.css';

const { FiClock, FiCheckCircle, FiCalendar, FiMail, FiPhone, FiMessageSquare, FiBell, FiSettings } = FiIcons;

const CustomerFollowUpAutomation = () => {
  const [followUps, setFollowUps] = useState([
    { id: 'FU-001', customerId: 'CUST-001', customerName: 'Sarah Johnson', type: 'satisfaction-survey', scheduledDate: '2024-01-25', status: 'pending', channel: 'email', priority: 'high' },
    { id: 'FU-002', customerId: 'CUST-002', customerName: 'TechCorp Inc.', type: 'project-update', scheduledDate: '2024-01-22', status: 'completed', channel: 'phone', priority: 'medium' },
    { id: 'FU-003', customerId: 'CUST-004', customerName: 'Emma Wilson', type: 'estimate-followup', scheduledDate: '2024-01-28', status: 'scheduled', channel: 'email', priority: 'high' },
    { id: 'FU-004', customerId: 'CUST-005', customerName: 'Michael Brown', type: 'maintenance-reminder', scheduledDate: '2024-02-01', status: 'pending', channel: 'sms', priority: 'low' }
  ]);

  const [autoFollowUpEnabled, setAutoFollowUpEnabled] = useState(true);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return FiMail;
      case 'phone': return FiPhone;
      case 'sms': return FiMessageSquare;
      default: return FiBell;
    }
  };

  const completeFollowUp = (id) => {
    setFollowUps(followUps.map(fu => fu.id === id ? { ...fu, status: 'completed' } : fu));
  };

  return (
    <motion.div className="customer-followup-automation fluent-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="followup-header">
        <div>
          <h2>Customer Follow-Up Automation</h2>
          <p>Automated customer engagement and follow-up scheduling</p>
        </div>
        <div className="auto-toggle">
          <label className="toggle-switch">
            <input type="checkbox" checked={autoFollowUpEnabled} onChange={(e) => setAutoFollowUpEnabled(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
          <span>Auto Follow-Up</span>
        </div>
      </div>

      <div className="followup-stats">
        <div className="stat-item">
          <span className="stat-value">{followUps.filter(f => f.status === 'pending').length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{followUps.filter(f => f.status === 'scheduled').length}</span>
          <span className="stat-label">Scheduled</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{followUps.filter(f => f.status === 'completed').length}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      <div className="followup-list">
        {followUps.map((followUp, index) => (
          <motion.div key={followUp.id} className="followup-item" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
            <div className="followup-icon" style={{ backgroundColor: `${getPriorityColor(followUp.priority)}15` }}>
              <SafeIcon icon={getChannelIcon(followUp.channel)} style={{ color: getPriorityColor(followUp.priority) }} />
            </div>
            <div className="followup-content">
              <div className="followup-header-row">
                <h4>{followUp.customerName}</h4>
                <span className="priority-badge" style={{ backgroundColor: `${getPriorityColor(followUp.priority)}15`, color: getPriorityColor(followUp.priority) }}>
                  {followUp.priority}
                </span>
              </div>
              <p className="followup-type">{followUp.type.replace('-', ' ')}</p>
              <div className="followup-meta">
                <span className="meta-item">
                  <SafeIcon icon={FiCalendar} />
                  {new Date(followUp.scheduledDate).toLocaleDateString()}
                </span>
                <span className="meta-item">
                  <SafeIcon icon={FiClock} />
                  {followUp.status}
                </span>
              </div>
            </div>
            <div className="followup-actions">
              {followUp.status !== 'completed' && (
                <button className="action-btn" onClick={() => completeFollowUp(followUp.id)}>
                  <SafeIcon icon={FiCheckCircle} />
                  Complete
                </button>
              )}
              <button className="action-btn secondary">
                <SafeIcon icon={FiSettings} />
                Configure
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CustomerFollowUpAutomation;