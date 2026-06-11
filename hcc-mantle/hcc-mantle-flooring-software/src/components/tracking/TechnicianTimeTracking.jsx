import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './TechnicianTimeTracking.css';

const { FiClock, FiPlay, FiPause, FiStop, FiCalendar, FiUser, FiDollarSign, FiCheckCircle, FiEdit3 } = FiIcons;

const TechnicianTimeTracking = () => {
  const [activeTimer, setActiveTimer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState([
    { id: 'TIME-001', employeeId: 'EMP-001', employeeName: 'Mike Chen', projectId: 'PRJ-001', projectName: 'Hardwood Installation', date: '2024-01-20', clockIn: '08:00', clockOut: '17:00', totalHours: 9.0, billableHours: 8.5, breakTime: 0.5, status: 'approved' },
    { id: 'TIME-002', employeeId: 'EMP-002', employeeName: 'Lisa Wang', projectId: 'PRJ-002', projectName: 'Tile Flooring', date: '2024-01-20', clockIn: '08:30', clockOut: '16:30', totalHours: 8.0, billableHours: 7.5, breakTime: 0.5, status: 'pending' },
    { id: 'TIME-003', employeeId: 'EMP-003', employeeName: 'David Kim', projectId: 'PRJ-001', projectName: 'Hardwood Installation', date: '2024-01-20', clockIn: '09:00', clockOut: '17:30', totalHours: 8.5, billableHours: 8.0, breakTime: 0.5, status: 'approved' }
  ]);

  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setActiveTimer({ projectId: 'PRJ-001', projectName: 'Hardwood Installation', startTime: new Date() });
    setCurrentTime(0);
  };

  const pauseTimer = () => {
    setActiveTimer(null);
  };

  const stopTimer = () => {
    setActiveTimer(null);
    setCurrentTime(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      case 'rejected': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  return (
    <motion.div className="technician-time-tracking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="tracking-header">
        <div>
          <h2>Technician Time Tracking</h2>
          <p>Track work hours and billable time for all technicians</p>
        </div>
        <button className="fluent-button">
          <SafeIcon icon={FiCalendar} />
          Export Timesheet
        </button>
      </div>

      <div className="timer-section">
        <div className="timer-card">
          <div className="timer-display">
            <div className="timer-value">{formatTime(currentTime)}</div>
            <div className="timer-label">Current Session</div>
          </div>
          {activeTimer ? (
            <div className="timer-controls">
              <button className="timer-btn pause" onClick={pauseTimer}>
                <SafeIcon icon={FiPause} />
                Pause
              </button>
              <button className="timer-btn stop" onClick={stopTimer}>
                <SafeIcon icon={FiStop} />
                Stop
              </button>
            </div>
          ) : (
            <button className="timer-btn start" onClick={startTimer}>
              <SafeIcon icon={FiPlay} />
              Start Timer
            </button>
          )}
          {activeTimer && (
            <div className="active-project">
              <SafeIcon icon={FiCalendar} />
              <span>{activeTimer.projectName}</span>
            </div>
          )}
        </div>

        <div className="timer-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <SafeIcon icon={FiClock} />
            </div>
            <div className="stat-content">
              <div className="stat-value">8.5</div>
              <div className="stat-label">Avg Hours/Day</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <SafeIcon icon={FiDollarSign} />
            </div>
            <div className="stat-content">
              <div className="stat-value">$2,450</div>
              <div className="stat-label">Billable This Week</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <SafeIcon icon={FiCheckCircle} />
            </div>
            <div className="stat-content">
              <div className="stat-value">94%</div>
              <div className="stat-label">On-Time Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="time-entries-section">
        <div className="entries-header">
          <h3>Recent Time Entries</h3>
          <div className="entries-filters">
            <select className="fluent-input">
              <option>All Employees</option>
              <option>Mike Chen</option>
              <option>Lisa Wang</option>
              <option>David Kim</option>
            </select>
            <select className="fluent-input">
              <option>All Status</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        <div className="entries-table">
          <div className="table-header">
            <div className="table-cell">Employee</div>
            <div className="table-cell">Project</div>
            <div className="table-cell">Date</div>
            <div className="table-cell">Clock In</div>
            <div className="table-cell">Clock Out</div>
            <div className="table-cell">Total Hours</div>
            <div className="table-cell">Billable</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Actions</div>
          </div>
          <div className="table-body">
            {timeEntries.map((entry, index) => (
              <motion.div key={entry.id} className="table-row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                <div className="table-cell">
                  <div className="employee-info">
                    <SafeIcon icon={FiUser} />
                    <span>{entry.employeeName}</span>
                  </div>
                </div>
                <div className="table-cell">{entry.projectName}</div>
                <div className="table-cell">{new Date(entry.date).toLocaleDateString()}</div>
                <div className="table-cell">{entry.clockIn}</div>
                <div className="table-cell">{entry.clockOut}</div>
                <div className="table-cell">{entry.totalHours}h</div>
                <div className="table-cell">{entry.billableHours}h</div>
                <div className="table-cell">
                  <span className="status-badge" style={{ backgroundColor: `${getStatusColor(entry.status)}15`, color: getStatusColor(entry.status) }}>
                    {entry.status}
                  </span>
                </div>
                <div className="table-cell actions">
                  <button className="action-btn">
                    <SafeIcon icon={FiEdit3} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TechnicianTimeTracking;