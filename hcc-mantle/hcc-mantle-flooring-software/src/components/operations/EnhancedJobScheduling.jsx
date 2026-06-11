import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './EnhancedJobScheduling.css';

const { FiCalendar, FiPlus, FiUsers, FiClock, FiMapPin, FiDollarSign, FiSettings, FiChevronLeft, FiChevronRight, FiUser } = FiIcons;

const EnhancedJobScheduling = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const scheduleData = {
    '2024-01-22': [
      { id: 'SCH-001', time: '08:00', job: 'Hardwood Installation', customer: 'Sarah Johnson', technician: 'Mike Chen', location: 'Downtown', duration: 8 },
      { id: 'SCH-002', time: '09:00', job: 'Tile Flooring', customer: 'TechCorp Inc.', technician: 'Lisa Wang', location: 'Business Plaza', duration: 6 }
    ],
    '2024-01-23': [
      { id: 'SCH-003', time: '08:30', job: 'Laminate Upgrade', customer: 'Robert Davis', technician: 'Carlos Rodriguez', location: 'Suburbs', duration: 7 }
    ],
    '2024-01-24': [
      { id: 'SCH-004', time: '09:00', job: 'Vinyl Installation', customer: 'Emma Wilson', technician: 'David Kim', location: 'Midtown', duration: 5 },
      { id: 'SCH-005', time: '14:00', job: 'Carpet Installation', customer: 'Michael Brown', technician: 'Alex Thompson', location: 'Uptown', duration: 4 }
    ]
  };

  const weekDays = [
    { date: '2024-01-22', day: 'Mon', label: '22' },
    { date: '2024-01-23', day: 'Tue', label: '23' },
    { date: '2024-01-24', day: 'Wed', label: '24' },
    { date: '2024-01-25', day: 'Thu', label: '25' },
    { date: '2024-01-26', day: 'Fri', label: '26' },
    { date: '2024-01-27', day: 'Sat', label: '27' },
    { date: '2024-01-28', day: 'Sun', label: '28' }
  ];

  return (
    <motion.div className="enhanced-job-scheduling fluent-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="schedule-header">
        <div>
          <h2>Enhanced Job Scheduling</h2>
          <p>Advanced scheduling with resource optimization</p>
        </div>
        <div className="schedule-actions">
          <button className="fluent-button secondary">
            <SafeIcon icon={FiSettings} />
            Settings
          </button>
          <button className="fluent-button">
            <SafeIcon icon={FiPlus} />
            Schedule Job
          </button>
        </div>
      </div>

      <div className="week-navigation">
        <button className="nav-btn" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}>
          <SafeIcon icon={FiChevronLeft} />
        </button>
        <div className="week-days">
          {weekDays.map((day) => (
            <button
              key={day.date}
              className={`day-card ${selectedDay === day.date ? 'selected' : ''}`}
              onClick={() => setSelectedDay(day.date)}
            >
              <span className="day-name">{day.day}</span>
              <span className="day-label">{day.label}</span>
              <span className="day-jobs">{scheduleData[day.date]?.length || 0} jobs</span>
            </button>
          ))}
        </div>
        <button className="nav-btn" onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}>
          <SafeIcon icon={FiChevronRight} />
        </button>
      </div>

      {selectedDay && scheduleData[selectedDay] && (
        <div className="schedule-content">
          <h3 className="day-title">
            {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="jobs-timeline">
            {scheduleData[selectedDay].map((job, index) => (
              <motion.div key={job.id} className="timeline-job" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                <div className="job-time">
                  <SafeIcon icon={FiClock} />
                  {job.time}
                </div>
                <div className="job-card">
                  <div className="job-header">
                    <h4>{job.job}</h4>
                    <span className="job-duration">{job.duration}h</span>
                  </div>
                  <div className="job-info">
                    <div className="info-item">
                      <SafeIcon icon={FiUser} />
                      {job.customer}
                    </div>
                    <div className="info-item">
                      <SafeIcon icon={FiUsers} />
                      {job.technician}
                    </div>
                    <div className="info-item">
                      <SafeIcon icon={FiMapPin} />
                      {job.location}
                    </div>
                  </div>
                  <div className="job-actions">
                    <button className="action-btn primary">View Details</button>
                    <button className="action-btn secondary">Reschedule</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!selectedDay && (
        <div className="no-day-selected">
          <SafeIcon icon={FiCalendar} />
          <p>Select a day to view scheduled jobs</p>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedJobScheduling;