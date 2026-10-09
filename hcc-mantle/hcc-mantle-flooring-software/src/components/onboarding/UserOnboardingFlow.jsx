import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './UserOnboardingFlow.css';

const { FiArrowRight, FiCheckCircle, FiUser, FiSettings, FiPackage, FiUsers, FiDollarSign, FiSkipForward } = FiIcons;

const UserOnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userPreferences, setUserPreferences] = useState({
    businessName: '',
    teamSize: '',
    primaryService: '',
    notificationEmail: '',
    aiAssistant: true
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to FloorPro ERP',
      description: 'Let\'s set up your flooring business management system',
      icon: FiUser
    },
    {
      id: 'business',
      title: 'Business Information',
      description: 'Tell us about your flooring company',
      icon: FiSettings
    },
    {
      id: 'services',
      title: 'Services & Specialties',
      description: 'What flooring services do you offer?',
      icon: FiPackage
    },
    {
      id: 'team',
      title: 'Team Setup',
      description: 'Configure your workforce management',
      icon: FiUsers
    },
    {
      id: 'billing',
      title: 'Billing & Payments',
      description: 'Set up payment processing with Stripe',
      icon: FiDollarSign
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(userPreferences);
    }
  };

  const handleSkip = () => {
    onComplete(userPreferences);
  };

  const updatePreference = (key, value) => {
    setUserPreferences({ ...userPreferences, [key]: value });
  };

  return (
    <motion.div 
      className="onboarding-flow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="onboarding-header">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <div className="step-indicator">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          className="onboarding-step"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          <div className="step-icon">
            <SafeIcon icon={steps[currentStep].icon} />
          </div>
          <h2>{steps[currentStep].title}</h2>
          <p>{steps[currentStep].description}</p>

          {currentStep === 0 && (
            <div className="step-content welcome">
              <div className="feature-showcase">
                <div className="feature-item">
                  <SafeIcon icon={FiCheckCircle} />
                  <div>
                    <h4>Project Management</h4>
                    <p>Track installations from quote to completion</p>
                  </div>
                </div>
                <div className="feature-item">
                  <SafeIcon icon={FiPackage} />
                  <div>
                    <h4>Inventory Control</h4>
                    <p>AI-powered stock monitoring and alerts</p>
                  </div>
                </div>
                <div className="feature-item">
                  <SafeIcon icon={FiUsers} />
                  <div>
                    <h4>Team Coordination</h4>
                    <p>Schedule and manage your workforce</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="step-content">
              <input
                type="text"
                placeholder="Business Name"
                value={userPreferences.businessName}
                onChange={(e) => updatePreference('businessName', e.target.value)}
                className="fluent-input"
              />
              <select
                value={userPreferences.teamSize}
                onChange={(e) => updatePreference('teamSize', e.target.value)}
                className="fluent-input"
              >
                <option value="">Select Team Size</option>
                <option value="1-5">1-5 employees</option>
                <option value="6-15">6-15 employees</option>
                <option value="16-50">16-50 employees</option>
                <option value="50+">50+ employees</option>
              </select>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content">
              <div className="service-options">
                {['Hardwood', 'Tile', 'Laminate', 'Vinyl', 'Carpet'].map(service => (
                  <label key={service} className="service-option">
                    <input
                      type="checkbox"
                      checked={userPreferences.primaryService === service}
                      onChange={() => updatePreference('primaryService', service)}
                    />
                    <span>{service} Installation</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content">
              <label className="preference-toggle">
                <span>Enable AI Assistant</span>
                <input
                  type="checkbox"
                  checked={userPreferences.aiAssistant}
                  onChange={(e) => updatePreference('aiAssistant', e.target.checked)}
                />
                <div className="toggle-slider"></div>
              </label>
              <input
                type="email"
                placeholder="Notification Email"
                value={userPreferences.notificationEmail}
                onChange={(e) => updatePreference('notificationEmail', e.target.value)}
                className="fluent-input"
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-content">
              <div className="payment-setup">
                <SafeIcon icon={FiCheckCircle} />
                <h3>Connect Stripe for Payments</h3>
                <p>Accept credit cards, ACH transfers, and more</p>
                <button className="connect-stripe-btn">
                  Connect Stripe Account
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="onboarding-actions">
        <button className="skip-btn" onClick={handleSkip}>
          <SafeIcon icon={FiSkipForward} /> Skip Setup
        </button>
        <button className="next-btn" onClick={handleNext}>
          {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
          <SafeIcon icon={FiArrowRight} />
        </button>
      </div>
    </motion.div>
  );
};

export default UserOnboardingFlow;