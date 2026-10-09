import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './CustomerRelationship.css';

const { 
  FiPlus, FiSearch, FiFilter, FiUser, FiPhone, FiMail,
  FiMapPin, FiCalendar, FiStar, FiMessageSquare, FiEdit3,
  FiMoreVertical, FiHeart, FiTrendingUp, FiClock, FiCheckCircle
} = FiIcons;

const CustomerRelationship = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('customers');

  const customers = [
    {
      id: 'CUST-001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 123-4567',
      address: '123 Oak Street, Downtown',
      status: 'active',
      lastContact: '2024-01-20',
      totalProjects: 3,
      totalSpent: 28450,
      rating: 5,
      preferredContact: 'email',
      notes: 'Prefers premium materials, flexible on timeline',
      nextFollowUp: '2024-02-01'
    },
    {
      id: 'CUST-002',
      name: 'TechCorp Inc.',
      email: 'facilities@techcorp.com',
      phone: '(555) 234-5678',
      address: '456 Business Plaza, Suite 200',
      status: 'active',
      lastContact: '2024-01-18',
      totalProjects: 1,
      totalSpent: 48500,
      rating: 4,
      preferredContact: 'phone',
      notes: 'Corporate client, requires detailed documentation',
      nextFollowUp: '2024-01-25'
    },
    {
      id: 'CUST-003',
      name: 'Robert Davis',
      email: 'robert.davis@email.com',
      phone: '(555) 345-6789',
      address: '789 Maple Avenue, Suburbs',
      status: 'completed',
      lastContact: '2024-01-15',
      totalProjects: 2,
      totalSpent: 16750,
      rating: 4,
      preferredContact: 'phone',
      notes: 'Budget-conscious, prefers laminate options',
      nextFollowUp: null
    },
    {
      id: 'CUST-004',
      name: 'Emma Wilson',
      email: 'emma.wilson@email.com',
      phone: '(555) 456-7890',
      address: '321 Pine Street, Midtown',
      status: 'prospect',
      lastContact: '2024-01-22',
      totalProjects: 0,
      totalSpent: 0,
      rating: null,
      preferredContact: 'email',
      notes: 'Interested in luxury vinyl, scheduling estimate',
      nextFollowUp: '2024-01-28'
    }
  ];

  const communications = [
    {
      id: 'COMM-001',
      customerId: 'CUST-001',
      customerName: 'Sarah Johnson',
      type: 'email',
      subject: 'Project completion follow-up',
      date: '2024-01-20',
      status: 'sent',
      notes: 'Satisfaction survey sent'
    },
    {
      id: 'COMM-002',
      customerId: 'CUST-002',
      customerName: 'TechCorp Inc.',
      type: 'phone',
      subject: 'Project status update',
      date: '2024-01-18',
      status: 'completed',
      notes: 'Discussed timeline adjustments'
    },
    {
      id: 'COMM-003',
      customerId: 'CUST-004',
      customerName: 'Emma Wilson',
      type: 'email',
      subject: 'Estimate scheduling',
      date: '2024-01-22',
      status: 'pending',
      notes: 'Awaiting response for appointment'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success)';
      case 'prospect': return 'var(--accent-primary)';
      case 'completed': return 'var(--warning)';
      case 'inactive': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getCommunicationIcon = (type) => {
    switch (type) {
      case 'email': return FiMail;
      case 'phone': return FiPhone;
      case 'meeting': return FiCalendar;
      default: return FiMessageSquare;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgRating = customers.filter(c => c.rating).reduce((sum, c) => sum + c.rating, 0) / customers.filter(c => c.rating).length;

  return (
    <motion.div
      className="customer-relationship"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Relationship</h1>
          <p className="page-subtitle">Manage customer relationships and communications</p>
        </div>
        <div className="header-actions">
          <button className="fluent-button secondary">
            <SafeIcon icon={FiMessageSquare} />
            Send Message
          </button>
          <button className="fluent-button">
            <SafeIcon icon={FiPlus} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Customer Stats */}
      <motion.div 
        className="customer-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon total">
            <SafeIcon icon={FiUser} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalCustomers}</div>
            <div className="stat-label">Total Customers</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              +8 this month
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <SafeIcon icon={FiCheckCircle} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{activeCustomers}</div>
            <div className="stat-label">Active Customers</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              {Math.round((activeCustomers / totalCustomers) * 100)}% active
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <SafeIcon icon={FiTrendingUp} />
          </div>
          <div className="stat-content">
            <div className="stat-value">${totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              Lifetime value
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rating">
            <SafeIcon icon={FiStar} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{avgRating.toFixed(1)}</div>
            <div className="stat-label">Avg Rating</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              Excellent service
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
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <SafeIcon icon={FiUser} />
          Customers ({customers.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'communications' ? 'active' : ''}`}
          onClick={() => setActiveTab('communications')}
        >
          <SafeIcon icon={FiMessageSquare} />
          Communications ({communications.length})
        </button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div 
        className="customer-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="search-section">
          <div className="search-input-container">
            <SafeIcon icon={FiSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="fluent-input search-input"
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="fluent-input status-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="completed">Completed</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <button className="fluent-button secondary">
            <SafeIcon icon={FiFilter} />
            Advanced Filters
          </button>
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div 
        className="content-area"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {activeTab === 'customers' && (
          <div className="customers-grid">
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                className="customer-card fluent-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -4 }}
              >
                <div className="customer-header">
                  <div className="customer-avatar">
                    <SafeIcon icon={FiUser} />
                  </div>
                  <div className="customer-actions">
                    <button className="action-btn">
                      <SafeIcon icon={FiEdit3} />
                    </button>
                    <button className="action-btn">
                      <SafeIcon icon={FiMoreVertical} />
                    </button>
                  </div>
                </div>

                <div className="customer-info">
                  <h3 className="customer-name">{customer.name}</h3>
                  <div className="customer-contact">
                    <div className="contact-item">
                      <SafeIcon icon={FiMail} />
                      <span>{customer.email}</span>
                    </div>
                    <div className="contact-item">
                      <SafeIcon icon={FiPhone} />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="contact-item">
                      <SafeIcon icon={FiMapPin} />
                      <span>{customer.address}</span>
                    </div>
                  </div>
                </div>

                <div className="customer-stats">
                  <div className="stat-item">
                    <span className="stat-label">Projects:</span>
                    <span className="stat-value">{customer.totalProjects}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Spent:</span>
                    <span className="stat-value">${customer.totalSpent.toLocaleString()}</span>
                  </div>
                  {customer.rating && (
                    <div className="stat-item">
                      <span className="stat-label">Rating:</span>
                      <span className="stat-value rating">
                        <SafeIcon icon={FiStar} />
                        {customer.rating}
                      </span>
                    </div>
                  )}
                </div>

                <div className="customer-notes">
                  <p>{customer.notes}</p>
                </div>

                <div className="customer-footer">
                  <div 
                    className="status-badge"
                    style={{ 
                      backgroundColor: `${getStatusColor(customer.status)}15`, 
                      color: getStatusColor(customer.status) 
                    }}
                  >
                    {getStatusLabel(customer.status)}
                  </div>
                  
                  <div className="last-contact">
                    <SafeIcon icon={FiClock} />
                    <span>Last: {new Date(customer.lastContact).toLocaleDateString()}</span>
                  </div>
                </div>

                {customer.nextFollowUp && (
                  <div className="follow-up-section">
                    <button className="follow-up-btn">
                      <SafeIcon icon={FiCalendar} />
                      Follow up: {new Date(customer.nextFollowUp).toLocaleDateString()}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'communications' && (
          <div className="communications-list">
            {communications.map((comm, index) => (
              <motion.div
                key={comm.id}
                className="communication-item fluent-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="comm-header">
                  <div className="comm-icon">
                    <SafeIcon icon={getCommunicationIcon(comm.type)} />
                  </div>
                  <div className="comm-info">
                    <h4>{comm.subject}</h4>
                    <p>{comm.customerName}</p>
                  </div>
                  <div className="comm-meta">
                    <span className="comm-date">
                      {new Date(comm.date).toLocaleDateString()}
                    </span>
                    <div 
                      className="comm-status"
                      style={{ 
                        backgroundColor: `${getStatusColor(comm.status)}15`, 
                        color: getStatusColor(comm.status) 
                      }}
                    >
                      {comm.status}
                    </div>
                  </div>
                </div>
                
                <div className="comm-notes">
                  <p>{comm.notes}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CustomerRelationship;