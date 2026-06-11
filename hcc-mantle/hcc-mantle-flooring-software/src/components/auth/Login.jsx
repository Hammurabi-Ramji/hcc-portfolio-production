import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './Login.css';

const { 
  FiUser, FiLock, FiEye, FiEyeOff, FiBrain, 
  FiShield, FiZap, FiCheckCircle 
} = FiIcons;

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      onLogin({
        name: 'John Smith',
        email: formData.email || 'john.smith@floorpro.com',
        role: 'Project Manager',
        id: 'USR-001'
      });
      setIsLoading(false);
    }, 1500);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const demoLogin = () => {
    setFormData({
      email: 'demo@floorpro.com',
      password: 'demo123'
    });
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-pattern"></div>
      </div>
      
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo and Branding */}
        <div className="login-header">
          <div className="brand-logo">
            <SafeIcon icon={FiBrain} />
          </div>
          <h1>FloorPro ERP</h1>
          <p>Venice.AI Powered Flooring Management System</p>
        </div>

        {/* Features */}
        <motion.div 
          className="login-features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="feature">
            <SafeIcon icon={FiShield} />
            <span>Privacy-First AI</span>
          </div>
          <div className="feature">
            <SafeIcon icon={FiZap} />
            <span>Real-time Analytics</span>
          </div>
          <div className="feature">
            <SafeIcon icon={FiCheckCircle} />
            <span>Complete ERP Solution</span>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.form 
          className="login-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <SafeIcon icon={FiUser} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <SafeIcon icon={FiLock} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <SafeIcon icon={showPassword ? FiEyeOff : FiEye} />
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              'Sign In'
            )}
          </button>

          <button 
            type="button" 
            className="demo-button"
            onClick={demoLogin}
          >
            Try Demo Account
          </button>
        </motion.form>

        {/* Footer */}
        <motion.div 
          className="login-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="security-note">
            <SafeIcon icon={FiShield} />
            <span>All data processed locally with TPM 2.0 encryption</span>
          </div>
          
          <div className="links">
            <a href="#forgot">Forgot Password?</a>
            <a href="#support">Contact Support</a>
          </div>
        </motion.div>
      </motion.div>

      {/* AI Status Indicator */}
      <motion.div 
        className="ai-status-indicator"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <div className="ai-pulse"></div>
        <SafeIcon icon={FiBrain} />
        <span>Venice.AI Ready</span>
      </motion.div>
    </div>
  );
};

export default Login;