import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './EnhancedCustomerProfile.css';

const { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiStar, FiTrendingUp, FiDollarSign, FiHeart, FiMessageSquare, FiEdit3, FiX, FiSave } = FiIcons;

const EnhancedCustomerProfile = ({ customer, onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState(customer);

  const handleSave = () => {
    onSave(editedCustomer);
    setIsEditing(false);
  };

  const calculateLifetimeValue = () => {
    return customer.projects?.reduce((sum, p) => sum + p.value, 0) || 0;
  };

  return (
    <motion.div 
      className="customer-profile-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="customer-profile-modal"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-header">
          <div className="profile-avatar">
            <SafeIcon icon={FiUser} />
          </div>
          <div className="profile-header-actions">
            <button 
              className="action-btn" 
              onClick={() => setIsEditing(!isEditing)}
            >
              <SafeIcon icon={isEditing ? FiX : FiEdit3} />
            </button>
            <button className="action-btn" onClick={onClose}>
              <SafeIcon icon={FiX} />
            </button>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h3>Customer Information</h3>
            {isEditing ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editedCustomer.name}
                  onChange={(e) => setEditedCustomer({...editedCustomer, name: e.target.value})}
                  className="fluent-input"
                />
                <input
                  type="email"
                  value={editedCustomer.email}
                  onChange={(e) => setEditedCustomer({...editedCustomer, email: e.target.value})}
                  className="fluent-input"
                />
                <input
                  type="tel"
                  value={editedCustomer.phone}
                  onChange={(e) => setEditedCustomer({...editedCustomer, phone: e.target.value})}
                  className="fluent-input"
                />
              </div>
            ) : (
              <div className="info-grid">
                <div className="info-item">
                  <SafeIcon icon={FiUser} />
                  <span>{customer.name}</span>
                </div>
                <div className="info-item">
                  <SafeIcon icon={FiMail} />
                  <span>{customer.email}</span>
                </div>
                <div className="info-item">
                  <SafeIcon icon={FiPhone} />
                  <span>{customer.phone}</span>
                </div>
                <div className="info-item">
                  <SafeIcon icon={FiMapPin} />
                  <span>{customer.address}</span>
                </div>
              </div>
            )}
          </div>

          <div className="profile-section">
            <h3>Lifetime Value Analysis</h3>
            <div className="value-grid">
              <div className="value-card">
                <div className="value-amount">${calculateLifetimeValue().toLocaleString()}</div>
                <div className="value-label">Lifetime Value</div>
              </div>
              <div className="value-card">
                <div className="value-amount">{customer.projects?.length || 0}</div>
                <div className="value-label">Total Projects</div>
              </div>
              <div className="value-card">
                <div className="value-amount">{customer.avgProjectValue?.toLocaleString() || 0}</div>
                <div className="value-label">Avg Project Value</div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Recent Projects</h3>
            <div className="projects-list">
              {customer.projects?.slice(0, 3).map((project) => (
                <div key={project.id} className="project-item">
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <span className="project-date">
                      {new Date(project.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="project-value">${project.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-section">
            <h3>Communication Preferences</h3>
            <div className="preferences-grid">
              <div className="preference-item">
                <SafeIcon icon={FiMessageSquare} />
                <span>Email: {customer.preferences?.email ? 'Preferred' : 'Available'}</span>
              </div>
              <div className="preference-item">
                <SafeIcon icon={FiPhone} />
                <span>Calls: {customer.preferences?.calls ? 'Preferred' : 'Available'}</span>
              </div>
              <div className="preference-item">
                <SafeIcon icon={FiCalendar} />
                <span>Best Time: {customer.preferences?.bestTime || 'Flexible'}</span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="profile-actions">
              <button className="fluent-button secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="fluent-button" onClick={handleSave}>
                <SafeIcon icon={FiSave} /> Save Changes
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedCustomerProfile;