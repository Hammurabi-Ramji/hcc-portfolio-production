import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './TeamAvailabilityCalendar.css';

const { FiCalendar, FiUser, FiClock, FiCheckCircle, FiX, FiChevronLeft, FiChevronRight, FiPlus } = FiIcons;

const TeamAvailabilityCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');

  const teamMembers = [
    { id: 'EMP-001', name: 'Mike Chen', role: 'Lead Installer', specialties: ['Hardwood', 'Laminate'], availability: 'available' },
    { id: 'EMP-002', name: 'Lisa Wang', role: 'Tile Specialist', specialties: ['Tile', 'Stone'], availability: 'busy' },
    { id: 'EMP-003', name: 'David Kim', role: 'Senior Installer', specialties: ['Vinyl', 'Carpet', 'Hardwood'], availability: 'available' },
    { id: 'EMP-004', name: 'Carlos Rodriguez', role: 'Installer', specialties: ['Laminate', 'Vinyl'], availability: 'off' }
  ];

  const weekDays = [
    { date: '2024-01-22', day: 'Mon', label: '22' },
    { date: '2024-01-23', day: 'Tue', label: '23' },
    { date: '2024-01-24', day: 'Wed', label: '24' },
    { date: '2024-01-25', day: 'Thu', label: '25' },
    { date: '2024-01-26', day: 'Fri', label: '26' },
    { date: '2024-01-27', day: 'Sat', label: '27' },
    { date: '2024-01-28', day: 'Sun', label: '28' }
  ];

  const schedules = {
    '2024-01-22': [
      { employeeId: 'EMP-002', projectName: 'TechCorp Office', startTime: '08:00', endTime: '17:00' },
      { employeeId: 'EMP-004', projectName: 'Residential Laminate', startTime: '09:00', endTime: '16:00' }
    ],
    '2024-01-23': [
      { employeeId: 'EMP-001', projectName: 'Hardwood Installation', startTime: '08:30', endTime: '17:30' },
      { employeeId: 'EMP-003', projectName: 'Vinyl Plank', startTime: '09:00', endTime: '15:00' }
    ]
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'available': return 'var(--success)';
      case 'busy': return 'var(--warning)';
      case 'off': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getScheduleForEmployee = (date, employeeId) => {
    return schedules[date]?.filter(s => s.employeeId === employeeId) || [];
  };

  return (
    <motion.div className="team-availability-calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="calendar-header">
        <div>
          <h2>Team Availability Calendar</h2>
          <p>View and manage team schedules and availability</p>
        </div>
        <div className="calendar-controls">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Week</button>
            <button className={`view-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Month</button>
          </div>
          <div className="week-navigation">
            <button className="nav-btn" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}>
              <SafeIcon icon={FiChevronLeft} />
            </button>
            <span className="current-week">
              {new Date(currentWeek).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
              {new Date(new Date(currentWeek).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button className="nav-btn" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}>
              <SafeIcon icon={FiChevronRight} />
            </button>
          </div>
          <button className="fluent-button">
            <SafeIcon icon={FiPlus} />
            Schedule Job
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="team-sidebar">
          <h3>Team Members</h3>
          <div className="team-list">
            {teamMembers.map((member) => (
              <div key={member.id} className="team-member-card">
                <div className="member-avatar">
                  <SafeIcon icon={FiUser} />
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-role">{member.role}</div>
                </div>
                <div className="availability-indicator" style={{ backgroundColor: getAvailabilityColor(member.availability) }} />
              </div>
            ))}
          </div>
          <div className="availability-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: 'var(--success)' }}></span>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: 'var(--warning)' }}></span>
              <span>Busy</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: 'var(--error)' }}></span>
              <span>Off</span>
            </div>
          </div>
        </div>

        <div className="calendar-content">
          <div className="week-days-header">
            {weekDays.map((day) => (
              <button
                key={day.date}
                className={`day-header ${selectedDate.toISOString().split('T')[0] === day.date ? 'selected' : ''}`}
                onClick={() => setSelectedDate(new Date(day.date))}
              >
                <div className="day-name">{day.day}</div>
                <div className="day-label">{day.label}</div>
              </button>
            ))}
          </div>

          <div className="schedule-grid">
            {teamMembers.map((member) => (
              <div key={member.id} className="member-schedule-row">
                {weekDays.map((day) => {
                  const memberSchedules = getScheduleForEmployee(day.date, member.id);
                  return (
                    <div key={day.date} className="schedule-cell">
                      {memberSchedules.map((schedule, index) => (
                        <div key={index} className="schedule-block">
                          <div className="schedule-time">{schedule.startTime} - {schedule.endTime}</div>
                          <div className="schedule-project">{schedule.projectName}</div>
                        </div>
                      ))}
                      {member.availability === 'available' && memberSchedules.length === 0 && (
                        <div className="available-slot">Available</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TeamAvailabilityCalendar;