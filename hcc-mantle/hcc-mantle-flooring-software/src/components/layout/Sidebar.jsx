import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './Sidebar.css';

const { 
  FiHome, FiFolder, FiPackage, FiCalculator, 
  FiUsers, FiDollarSign, FiHeart, FiMenu,
  FiSettings, FiHelpCircle, FiBrain
} = FiIcons;

const menuItems = [
  { path: '/dashboard', icon: FiHome, label: 'Dashboard', description: 'Overview & Analytics' },
  { path: '/projects', icon: FiFolder, label: 'Projects', description: 'Job Management' },
  { path: '/inventory', icon: FiPackage, label: 'Inventory', description: 'Materials & Stock' },
  { path: '/estimating', icon: FiCalculator, label: 'Estimating', description: 'Quotes & Pricing' },
  { path: '/workforce', icon: FiUsers, label: 'Workforce', description: 'Team Management' },
  { path: '/financial', icon: FiDollarSign, label: 'Financial', description: 'Accounting & Reports' },
  { path: '/customers', icon: FiHeart, label: 'Customers', description: 'CRM & Support' }
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  return (
    <motion.aside 
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      initial={false}
      animate={{ width: collapsed ? 60 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="sidebar-header">
        <motion.button
          className="sidebar-toggle"
          onClick={onToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <SafeIcon icon={FiMenu} />
        </motion.button>
        
        {!collapsed && (
          <motion.div 
            className="sidebar-brand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="brand-icon">
              <SafeIcon icon={FiBrain} />
            </div>
            <div className="brand-text">
              <h2>FloorPro ERP</h2>
              <span>Venice.AI Powered</span>
            </div>
          </motion.div>
        )}
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item, index) => (
            <motion.li
              key={item.path}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <div className="nav-icon">
                  <SafeIcon icon={item.icon} />
                </div>
                {!collapsed && (
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                )}
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <motion.div 
          className="sidebar-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="ai-status">
            <div className="ai-indicator">
              <div className="ai-pulse"></div>
              <SafeIcon icon={FiBrain} />
            </div>
            <div className="ai-info">
              <span>Venice.AI Active</span>
              <small>Privacy-First Intelligence</small>
            </div>
          </div>
          
          <div className="footer-actions">
            <button className="footer-btn">
              <SafeIcon icon={FiSettings} />
            </button>
            <button className="footer-btn">
              <SafeIcon icon={FiHelpCircle} />
            </button>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
};

export default Sidebar;