import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './WorkforceManagement.css';

const { 
  FiPlus, FiCalendar, FiUser, FiUsers, FiClock,
  FiStar, FiMapPin, FiPhone, FiMail, FiTool,
  FiTrendingUp, FiTarget, FiAward, FiMoreVertical
} = FiIcons;

const WorkforceManagement = () => {
  const [activeTab, setActiveTab] = useState('team');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const teamMembers = [
    {
      id: 'EMP-001',
      name: 'Mike Chen',
      role: 'Lead Installer',
      specialties: ['Hardwood', 'Laminate'],
      rating: 4.9,
      experience: 8,
      phone: '(555) 123-4567',
      email: 'mike.chen@floorpro.com',
      status: 'available',
      currentProject: null,
      completedJobs: 156,
      certifications: ['Hardwood Specialist', 'Safety Certified'],
      hourlyRate: 28.50
    },
    {
      id: 'EMP-002',
      name: 'Lisa Wang',
      role: 'Tile Specialist',
      specialties: ['Tile', 'Stone'],
      rating: 4.8,
      experience: 6,
      phone: '(555) 234-5678',
      email: 'lisa.wang@floorpro.com',
      status: 'busy',
      currentProject: 'TechCorp Office Renovation',
      completedJobs: 98,
      certifications: ['Tile Installation', 'Waterproofing'],
      hourlyRate: 26.00
    },
    {
      id: 'EMP-003',
      name: 'David Kim',
      role: 'Senior Installer',
      specialties: ['Vinyl', 'Carpet', 'Hardwood'],
      rating: 4.7,
      experience: 12,
      phone: '(555) 345-6789',
      email: 'david.kim@floorpro.com',
      status: 'available',
      currentProject: null,
      completedJobs: 234,
      certifications: ['Master Installer', 'Team Lead'],
      hourlyRate: 32.00
    },
    {
      id: 'EMP-004',
      name: 'Carlos Rodriguez',
      role: 'Installer',
      specialties: ['Laminate', 'Vinyl'],
      rating: 4.6,
      experience: 4,
      phone: '(555) 456-7890',
      email: 'carlos.rodriguez@floorpro.com',
      status: 'busy',
      currentProject: 'Residential Laminate Upgrade',
      completedJobs: 67,
      certifications: ['Basic Installation'],
      hourlyRate: 22.00
    }
  ];

  const schedule = [
    {
      id: 'SCH-001',
      employeeId: 'EMP-002',
      employeeName: 'Lisa Wang',
      projectId: 'PRJ-002',
      projectName: 'TechCorp Office Renovation',
      date: '2024-01-22',
      startTime: '08:00',
      endTime: '17:00',
      location: '456 Business Plaza, Suite 200',
      status: 'scheduled'
    },
    {
      id: 'SCH-002',
      employeeId: 'EMP-004',
      employeeName: 'Carlos Rodriguez',
      projectId: 'PRJ-003',
      projectName: 'Residential Laminate Upgrade',
      date: '2024-01-22',
      startTime: '09:00',
      endTime: '16:00',
      location: '789 Maple Avenue, Suburbs',
      status: 'in-progress'
    },
    {
      id: 'SCH-003',
      employeeId: 'EMP-001',
      employeeName: 'Mike Chen',
      projectId: 'PRJ-001',
      projectName: 'Luxury Hardwood Installation',
      date: '2024-01-23',
      startTime: '08:30',
      endTime: '17:30',
      location: '123 Oak Street, Downtown',
      status: 'scheduled'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'var(--success)';
      case 'busy': return 'var(--warning)';
      case 'off': return 'var(--error)';
      case 'scheduled': return 'var(--accent-primary)';
      case 'in-progress': return 'var(--warning)';
      case 'completed': return 'var(--success)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const availableTeam = teamMembers.filter(member => member.status === 'available').length;
  const busyTeam = teamMembers.filter(member => member.status === 'busy').length;
  const totalJobs = teamMembers.reduce((sum, member) => sum + member.completedJobs, 0);
  const avgRating = teamMembers.reduce((sum, member) => sum + member.rating, 0) / teamMembers.length;

  return (
    <motion.div
      className="workforce-management"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Workforce Management</h1>
          <p className="page-subtitle">Manage your team and schedule installations</p>
        </div>
        <div className="header-actions">
          <button className="fluent-button secondary">
            <SafeIcon icon={FiCalendar} />
            Schedule View
          </button>
          <button className="fluent-button">
            <SafeIcon icon={FiPlus} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Workforce Stats */}
      <motion.div 
        className="workforce-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon available">
            <SafeIcon icon={FiUsers} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{availableTeam}</div>
            <div className="stat-label">Available Today</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              Ready for assignment
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon busy">
            <SafeIcon icon={FiClock} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{busyTeam}</div>
            <div className="stat-label">On Active Jobs</div>
            <div className="stat-trend neutral">
              Currently working
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rating">
            <SafeIcon icon={FiStar} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{avgRating.toFixed(1)}</div>
            <div className="stat-label">Avg Team Rating</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              Excellent performance
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon jobs">
            <SafeIcon icon={FiTarget} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalJobs}</div>
            <div className="stat-label">Total Jobs Completed</div>
            <div className="stat-trend up">
              <SafeIcon icon={FiTrendingUp} />
              +15 this month
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
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <SafeIcon icon={FiUsers} />
          Team Members ({teamMembers.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <SafeIcon icon={FiCalendar} />
          Schedule ({schedule.length})
        </button>
      </motion.div>

      {/* Content Area */}
      <motion.div 
        className="content-area"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {activeTab === 'team' && (
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                className="team-card fluent-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -4 }}
              >
                <div className="team-header">
                  <div className="member-avatar">
                    <SafeIcon icon={FiUser} />
                  </div>
                  <div className="member-actions">
                    <button className="action-btn">
                      <SafeIcon icon={FiMoreVertical} />
                    </button>
                  </div>
                </div>

                <div className="member-info">
                  <h3 className="member-name">{member.name}</h3>
                  <div className="member-role">{member.role}</div>
                  <div className="member-experience">
                    {member.experience} years experience
                  </div>
                </div>

                <div className="member-contact">
                  <div className="contact-item">
                    <SafeIcon icon={FiPhone} />
                    <span>{member.phone}</span>
                  </div>
                  <div className="contact-item">
                    <SafeIcon icon={FiMail} />
                    <span>{member.email}</span>
                  </div>
                </div>

                <div className="member-specialties">
                  <div className="specialties-header">
                    <SafeIcon icon={FiTool} />
                    <span>Specialties</span>
                  </div>
                  <div className="specialties-list">
                    {member.specialties.map((specialty) => (
                      <span key={specialty} className="specialty-tag">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="member-performance">
                  <div className="performance-item">
                    <div className="performance-label">Rating</div>
                    <div className="performance-value rating">
                      <SafeIcon icon={FiStar} />
                      {member.rating}
                    </div>
                  </div>
                  <div className="performance-item">
                    <div className="performance-label">Jobs</div>
                    <div className="performance-value">{member.completedJobs}</div>
                  </div>
                  <div className="performance-item">
                    <div className="performance-label">Rate</div>
                    <div className="performance-value">${member.hourlyRate}/hr</div>
                  </div>
                </div>

                <div className="member-certifications">
                  <div className="cert-header">
                    <SafeIcon icon={FiAward} />
                    <span>Certifications</span>
                  </div>
                  <div className="cert-list">
                    {member.certifications.map((cert) => (
                      <span key={cert} className="cert-badge">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="member-footer">
                  <div 
                    className="status-badge"
                    style={{ 
                      backgroundColor: `${getStatusColor(member.status)}15`, 
                      color: getStatusColor(member.status) 
                    }}
                  >
                    {getStatusLabel(member.status)}
                  </div>
                  
                  {member.currentProject && (
                    <div className="current-project">
                      <span>On: {member.currentProject}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="schedule-container">
            <div className="schedule-controls">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="fluent-input date-picker"
              />
              <button className="fluent-button">
                <SafeIcon icon={FiPlus} />
                Schedule Job
              </button>
            </div>

            <div className="schedule-grid">
              {schedule.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="schedule-card fluent-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -2 }}
                >
                  <div className="schedule-header">
                    <div className="schedule-time">
                      <SafeIcon icon={FiClock} />
                      <span>{item.startTime} - {item.endTime}</span>
                    </div>
                    <div 
                      className="schedule-status"
                      style={{ 
                        backgroundColor: `${getStatusColor(item.status)}15`, 
                        color: getStatusColor(item.status) 
                      }}
                    >
                      {getStatusLabel(item.status)}
                    </div>
                  </div>

                  <div className="schedule-info">
                    <h3 className="schedule-project">{item.projectName}</h3>
                    <div className="schedule-employee">
                      <SafeIcon icon={FiUser} />
                      <span>{item.employeeName}</span>
                    </div>
                    <div className="schedule-location">
                      <SafeIcon icon={FiMapPin} />
                      <span>{item.location}</span>
                    </div>
                  </div>

                  <div className="schedule-actions">
                    <button className="schedule-action-btn">
                      View Details
                    </button>
                    <button className="schedule-action-btn secondary">
                      Reschedule
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default WorkforceManagement;