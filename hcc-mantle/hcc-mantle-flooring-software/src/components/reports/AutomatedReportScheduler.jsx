import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './AutomatedReportScheduler.css';

const { FiCalendar, FiClock, FiMail, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiSave, FiFileText } = FiIcons;

const AutomatedReportScheduler = () => {
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    reportType: 'financial',
    frequency: 'weekly',
    day: 'monday',
    time: '09:00',
    recipients: [],
    active: true
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Load existing schedules
    const mockSchedules = [
      {
        id: 'SCH-001',
        name: 'Weekly Financial Summary',
        reportType: 'financial',
        frequency: 'weekly',
        day: 'monday',
        time: '09:00',
        recipients: ['admin@floorpro.com', 'finance@floorpro.com'],
        active: true,
        lastRun: '2024-01-15'
      },
      {
        id: 'SCH-002',
        name: 'Monthly Team Performance',
        reportType: 'team',
        frequency: 'monthly',
        day: '1',
        time: '08:00',
        recipients: ['manager@floorpro.com'],
        active: true,
        lastRun: '2024-01-01'
      }
    ];
    setSchedules(mockSchedules);
  }, []);

  const createSchedule = () => {
    const schedule = {
      ...newSchedule,
      id: `SCH-${Date.now()}`,
      lastRun: null
    };
    setSchedules([...schedules, schedule]);
    setShowForm(false);
    setNewSchedule({
      name: '',
      reportType: 'financial',
      frequency: 'weekly',
      day: 'monday',
      time: '09:00',
      recipients: [],
      active: true
    });
  };

  const deleteSchedule = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const toggleSchedule = (id) => {
    setSchedules(schedules.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly'
    };
    return labels[frequency] || frequency;
  };

  return (
    <motion.div 
      className="report-scheduler"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="scheduler-header">
        <div>
          <h2>Automated Report Scheduling</h2>
          <p>Schedule reports to be automatically generated and delivered</p>
        </div>
        <button className="fluent-button" onClick={() => setShowForm(!showForm)}>
          <SafeIcon icon={FiPlus} /> New Schedule
        </button>
      </div>

      {showForm && (
        <motion.div 
          className="schedule-form"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="form-row">
            <input
              type="text"
              placeholder="Schedule Name"
              value={newSchedule.name}
              onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
              className="fluent-input"
            />
            <select
              value={newSchedule.reportType}
              onChange={(e) => setNewSchedule({...newSchedule, reportType: e.target.value})}
              className="fluent-input"
            >
              <option value="financial">Financial Summary</option>
              <option value="projects">Project Status</option>
              <option value="inventory">Inventory Analysis</option>
              <option value="team">Team Performance</option>
              <option value="customers">Customer Report</option>
            </select>
          </div>
          <div className="form-row">
            <select
              value={newSchedule.frequency}
              onChange={(e) => setNewSchedule({...newSchedule, frequency: e.target.value})}
              className="fluent-input"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            <input
              type="time"
              value={newSchedule.time}
              onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
              className="fluent-input"
            />
          </div>
          <div className="form-actions">
            <button className="fluent-button secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className="fluent-button" onClick={createSchedule}>
              <SafeIcon icon={FiSave} /> Create Schedule
            </button>
          </div>
        </motion.div>
      )}

      <div className="schedules-list">
        {schedules.map((schedule, index) => (
          <motion.div 
            key={schedule.id} 
            className="schedule-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="schedule-info">
              <h4>{schedule.name}</h4>
              <div className="schedule-details">
                <span className="detail-item">
                  <SafeIcon icon={FiFileText} />
                  {getFrequencyLabel(schedule.frequency)}
                </span>
                <span className="detail-item">
                  <SafeIcon icon={FiClock} />
                  {schedule.time}
                </span>
                <span className="detail-item">
                  <SafeIcon icon={FiMail} />
                  {schedule.recipients.length} recipients
                </span>
              </div>
            </div>
            <div className="schedule-actions">
              <button 
                className="toggle-btn"
                onClick={() => toggleSchedule(schedule.id)}
              >
                <SafeIcon icon={schedule.active ? FiToggleRight : FiToggleLeft} />
              </button>
              <button 
                className="delete-btn"
                onClick={() => deleteSchedule(schedule.id)}
              >
                <SafeIcon icon={FiTrash2} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AutomatedReportScheduler;