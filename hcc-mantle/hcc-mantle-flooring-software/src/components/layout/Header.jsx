import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './Header.css';

const { 
  FiBell, FiSearch, FiSun, FiMoon, FiUser, 
  FiSettings, FiLogOut, FiBrain, FiChevronDown 
} = FiIcons;

const Header = ({ user, onLogout, onToggleTheme, theme, onToggleAI }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, type: 'info', message: 'New project "Oak Flooring Install" created', time: '2 min ago' },
    { id: 2, type: 'success', message: 'Invoice #1024 payment received', time: '15 min ago' },
    { id: 3, type: 'warning', message: 'Low inventory: Hardwood Planks', time: '1 hour ago' },
    { id: 4, type: 'info', message: 'AI analysis completed for Project #2045', time: '2 hours ago' }
  ];

  return (
    <header className="header">
      <div className="header-left">
        <div className="search-container">
          <SafeIcon icon={FiSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search projects, customers, materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="header-right">
        <motion.button
          className="header-btn ai-assistant-btn"
          onClick={onToggleAI}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SafeIcon icon={FiBrain} />
          <span>AI Assistant</span>
          <div className="ai-status-dot"></div>
        </motion.button>

        <div className="header-divider"></div>

        <motion.button
          className="header-btn"
          onClick={onToggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SafeIcon icon={theme === 'light' ? FiMoon : FiSun} />
        </motion.button>

        <div className="notification-container">
          <motion.button
            className="header-btn notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SafeIcon icon={FiBell} />
            <span className="notification-badge">4</span>
          </motion.button>

          {showNotifications && (
            <motion.div
              className="notification-dropdown"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="notification-header">
                <h3>Notifications</h3>
                <button className="mark-all-read">Mark all read</button>
              </div>
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`notification-item ${notification.type}`}>
                    <div className="notification-content">
                      <p>{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="user-container">
          <motion.button
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="user-avatar">
              <SafeIcon icon={FiUser} />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'John Smith'}</span>
              <span className="user-role">{user?.role || 'Project Manager'}</span>
            </div>
            <SafeIcon icon={FiChevronDown} className="dropdown-icon" />
          </motion.button>

          {showUserMenu && (
            <motion.div
              className="user-dropdown"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="user-dropdown-header">
                <div className="user-avatar-large">
                  <SafeIcon icon={FiUser} />
                </div>
                <div className="user-details">
                  <h4>{user?.name || 'John Smith'}</h4>
                  <p>{user?.email || 'john.smith@floorpro.com'}</p>
                  <span className="user-badge">{user?.role || 'Project Manager'}</span>
                </div>
              </div>
              
              <div className="user-dropdown-menu">
                <button className="dropdown-item">
                  <SafeIcon icon={FiUser} />
                  <span>Profile Settings</span>
                </button>
                <button className="dropdown-item">
                  <SafeIcon icon={FiSettings} />
                  <span>Preferences</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={onLogout}>
                  <SafeIcon icon={FiLogOut} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;