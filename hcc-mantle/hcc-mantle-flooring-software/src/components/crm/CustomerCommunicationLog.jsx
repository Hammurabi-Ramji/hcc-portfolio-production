import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './CustomerCommunicationLog.css';

const { FiMail, FiPhone, FiMessageSquare, FiCalendar, FiPlus, FiSearch, FiFilter, FiUser, FiCheckCircle } = FiIcons;

const CustomerCommunicationLog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showNewCommunication, setShowNewCommunication] = useState(false);

  const communications = [
    {
      id: 'COMM-001',
      customerId: 'CUST-001',
      customerName: 'Sarah Johnson',
      type: 'email',
      subject: 'Project completion follow-up',
      message: 'Hi Sarah, I wanted to follow up on your recent hardwood installation. How are you enjoying your new floors? Please let us know if you have any questions about maintenance.',
      direction: 'outbound',
      status: 'sent',
      date: '2024-01-20',
      time: '14:30',
      employee: 'Mike Chen',
      notes: 'Satisfaction survey sent'
    },
    {
      id: 'COMM-002',
      customerId: 'CUST-002',
      customerName: 'TechCorp Inc.',
      type: 'phone',
      subject: 'Project status update',
      message: 'Discussed timeline adjustments for the office renovation project. Client approved the new schedule.',
      direction: 'inbound',
      status: 'completed',
      date: '2024-01-18',
      time: '10:15',
      employee: 'Lisa Wang',
      notes: 'Timeline adjusted, new completion date: Feb 15'
    },
    {
      id: 'COMM-003',
      customerId: 'CUST-004',
      customerName: 'Emma Wilson',
      type: 'email',
      subject: 'Estimate scheduling',
      message: 'Thank you for your interest in our luxury vinyl flooring. I\'d like to schedule a time to measure your space and provide an accurate estimate.',
      direction: 'outbound',
      status: 'pending',
      date: '2024-01-22',
      time: '09:00',
      employee: 'Tom Anderson',
      notes: 'Awaiting response for appointment'
    },
    {
      id: 'COMM-004',
      customerId: 'CUST-003',
      customerName: 'Robert Davis',
      type: 'meeting',
      subject: 'Initial consultation',
      message: 'Met with Robert to discuss laminate flooring options for his basement. Showed samples and discussed budget constraints.',
      direction: 'inbound',
      status: 'completed',
      date: '2024-01-15',
      time: '15:00',
      employee: 'Carlos Rodriguez',
      notes: 'Interested in budget-friendly options, follow up in 1 week'
    }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email': return FiMail;
      case 'phone': return FiPhone;
      case 'meeting': return FiCalendar;
      default: return FiMessageSquare;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': case 'completed': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      default: return 'var(--text-tertiary)';
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = comm.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || comm.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || comm.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div className="customer-communication-log" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="log-header">
        <div>
          <h2>Customer Communication Log</h2>
          <p>Track all customer interactions and follow-ups</p>
        </div>
        <button className="fluent-button" onClick={() => setShowNewCommunication(!showNewCommunication)}>
          <SafeIcon icon={FiPlus} /> Log Communication
        </button>
      </div>

      {showNewCommunication && (
        <motion.div className="new-communication-form fluent-card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <div className="form-row">
            <select className="fluent-input">
              <option value="">Select Customer</option>
              <option value="CUST-001">Sarah Johnson</option>
              <option value="CUST-002">TechCorp Inc.</option>
            </select>
            <select className="fluent-input">
              <option value="email">Email</option>
              <option value="phone">Phone Call</option>
              <option value="meeting">Meeting</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <input type="text" placeholder="Subject" className="fluent-input" />
          <textarea placeholder="Communication details..." className="fluent-input" rows="4" />
          <div className="form-actions">
            <button className="fluent-button secondary" onClick={() => setShowNewCommunication(false)}>Cancel</button>
            <button className="fluent-button">
              <SafeIcon icon={FiCheckCircle} /> Save Communication
            </button>
          </div>
        </motion.div>
      )}

      <div className="log-filters">
        <div className="search-container">
          <SafeIcon icon={FiSearch} className="search-icon" />
          <input type="text" placeholder="Search communications..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="fluent-input search-input" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="fluent-input type-filter">
          <option value="all">All Types</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="meeting">Meeting</option>
          <option value="sms">SMS</option>
        </select>
        <button className="fluent-button secondary">
          <SafeIcon icon={FiFilter} /> Advanced Filters
        </button>
      </div>

      <div className="communications-list">
        {filteredCommunications.map((comm, index) => (
          <motion.div key={comm.id} className="communication-entry fluent-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
            <div className="comm-icon" style={{ backgroundColor: `${getStatusColor(comm.status)}15` }}>
              <SafeIcon icon={getTypeIcon(comm.type)} style={{ color: getStatusColor(comm.status) }} />
            </div>
            <div className="comm-content">
              <div className="comm-header">
                <div className="comm-meta">
                  <h3 className="comm-customer">{comm.customerName}</h3>
                  <span className="comm-type">{comm.type}</span>
                  <span className="comm-direction" style={{ color: comm.direction === 'inbound' ? 'var(--success)' : 'var(--accent-primary)' }}>
                    {comm.direction === 'inbound' ? '← Inbound' : 'Outbound →'}
                  </span>
                </div>
                <div className="comm-timestamp">
                  <span className="comm-date">{new Date(comm.date).toLocaleDateString()}</span>
                  <span className="comm-time">{comm.time}</span>
                </div>
              </div>
              <h4 className="comm-subject">{comm.subject}</h4>
              <p className="comm-message">{comm.message}</p>
              {comm.notes && (
                <div className="comm-notes">
                  <SafeIcon icon={FiMessageSquare} />
                  <span>{comm.notes}</span>
                </div>
              )}
              <div className="comm-footer">
                <span className="comm-employee">
                  <SafeIcon icon={FiUser} /> {comm.employee}
                </span>
                <span className="comm-status" style={{ backgroundColor: `${getStatusColor(comm.status)}15`, color: getStatusColor(comm.status) }}>
                  {comm.status}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CustomerCommunicationLog;