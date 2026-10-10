import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './ProjectManagement.css';

const { 
  FiPlus, FiSearch, FiFilter, FiCalendar, FiUser,
  FiMapPin, FiDollarSign, FiClock, FiCheckCircle,
  FiAlertCircle, FiMoreVertical, FiEye, FiEdit3
} = FiIcons;

const ProjectManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const projects = [
    {
      id: 'PRJ-001',
      name: 'Luxury Hardwood Installation',
      customer: 'Sarah Johnson',
      address: '123 Oak Street, Downtown',
      type: 'Hardwood',
      status: 'in-progress',
      progress: 75,
      startDate: '2024-01-15',
      endDate: '2024-01-25',
      budget: 12500,
      spent: 9375,
      team: ['Mike Chen', 'David Kim'],
      priority: 'high'
    },
    {
      id: 'PRJ-002',
      name: 'Commercial Tile Flooring',
      customer: 'TechCorp Inc.',
      address: '456 Business Plaza, Suite 200',
      type: 'Tile',
      status: 'planning',
      progress: 15,
      startDate: '2024-01-20',
      endDate: '2024-02-10',
      budget: 45000,
      spent: 6750,
      team: ['Lisa Wang', 'Tom Anderson', 'Jake Miller'],
      priority: 'medium'
    },
    {
      id: 'PRJ-003',
      name: 'Residential Laminate Upgrade',
      customer: 'Robert Davis',
      address: '789 Maple Avenue, Suburbs',
      type: 'Laminate',
      status: 'completed',
      progress: 100,
      startDate: '2024-01-05',
      endDate: '2024-01-12',
      budget: 8500,
      spent: 8100,
      team: ['Carlos Rodriguez'],
      priority: 'low'
    },
    {
      id: 'PRJ-004',
      name: 'Luxury Vinyl Plank Installation',
      customer: 'Emma Wilson',
      address: '321 Pine Street, Midtown',
      type: 'Vinyl',
      status: 'on-hold',
      progress: 45,
      startDate: '2024-01-08',
      endDate: '2024-01-18',
      budget: 15200,
      spent: 6840,
      team: ['Alex Thompson', 'Maria Garcia'],
      priority: 'high'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success)';
      case 'in-progress': return 'var(--accent-primary)';
      case 'planning': return 'var(--warning)';
      case 'on-hold': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'planning': return 'Planning';
      case 'on-hold': return 'On Hold';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-tertiary)';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      className="project-management"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Management</h1>
          <p className="page-subtitle">Manage and track all your flooring installation projects</p>
        </div>
        <div className="header-actions">
          <button className="fluent-button">
            <SafeIcon icon={FiPlus} />
            New Project
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <motion.div 
        className="project-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="search-section">
          <div className="search-input-container">
            <SafeIcon icon={FiSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search projects or customers..."
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
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
          
          <button className="fluent-button secondary">
            <SafeIcon icon={FiFilter} />
            Filters
          </button>
        </div>

        <div className="view-controls">
          <div className="view-mode-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </motion.div>

      {/* Project Stats */}
      <motion.div 
        className="project-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="stat-card">
          <div className="stat-icon planning">
            <SafeIcon icon={FiClock} />
          </div>
          <div className="stat-content">
            <div className="stat-value">3</div>
            <div className="stat-label">Planning</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon in-progress">
            <SafeIcon icon={FiUser} />
          </div>
          <div className="stat-content">
            <div className="stat-value">5</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed">
            <SafeIcon icon={FiCheckCircle} />
          </div>
          <div className="stat-content">
            <div className="stat-value">12</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon on-hold">
            <SafeIcon icon={FiAlertCircle} />
          </div>
          <div className="stat-content">
            <div className="stat-value">2</div>
            <div className="stat-label">On Hold</div>
          </div>
        </div>
      </motion.div>

      {/* Projects Grid */}
      <motion.div 
        className={`projects-container ${viewMode}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            className="project-card fluent-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -4 }}
          >
            <div className="project-header">
              <div className="project-id">{project.id}</div>
              <div className="project-actions">
                <button className="action-btn">
                  <SafeIcon icon={FiEye} />
                </button>
                <button className="action-btn">
                  <SafeIcon icon={FiEdit3} />
                </button>
                <button className="action-btn">
                  <SafeIcon icon={FiMoreVertical} />
                </button>
              </div>
            </div>

            <div className="project-info">
              <h3 className="project-name">{project.name}</h3>
              <div className="project-customer">
                <SafeIcon icon={FiUser} />
                <span>{project.customer}</span>
              </div>
              <div className="project-address">
                <SafeIcon icon={FiMapPin} />
                <span>{project.address}</span>
              </div>
            </div>

            <div className="project-meta">
              <div className="meta-item">
                <span className="meta-label">Type:</span>
                <span className="meta-value">{project.type}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Team:</span>
                <span className="meta-value">{project.team.length} members</span>
              </div>
            </div>

            <div className="project-progress">
              <div className="progress-header">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${project.progress}%`,
                    backgroundColor: getStatusColor(project.status)
                  }}
                />
              </div>
            </div>

            <div className="project-budget">
              <div className="budget-item">
                <SafeIcon icon={FiDollarSign} />
                <div>
                  <div className="budget-spent">${project.spent.toLocaleString()}</div>
                  <div className="budget-total">of ${project.budget.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="project-footer">
              <div 
                className="status-badge"
                style={{ backgroundColor: `${getStatusColor(project.status)}15`, color: getStatusColor(project.status) }}
              >
                {getStatusLabel(project.status)}
              </div>
              
              <div 
                className="priority-badge"
                style={{ backgroundColor: `${getPriorityColor(project.priority)}15`, color: getPriorityColor(project.priority) }}
              >
                {project.priority}
              </div>
              
              <div className="project-dates">
                <SafeIcon icon={FiCalendar} />
                <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ProjectManagement;