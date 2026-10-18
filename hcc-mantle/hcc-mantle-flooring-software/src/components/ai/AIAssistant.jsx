import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './AIAssistant.css';

const { 
  FiX, FiSend, FiMic, FiMicOff, FiBrain, FiUser,
  FiMessageSquare, FiZap, FiShield, FiMinimize2
} = FiIcons;

const AIAssistant = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your Venice.AI assistant. I can help you with project management, inventory insights, cost estimates, and more. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const quickActions = [
    'Show project status',
    'Check inventory levels',
    'Generate cost estimate',
    'Schedule team meeting',
    'Customer follow-ups',
    'Financial summary'
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai',
        content: generateAIResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const generateAIResponse = (input) => {
    const responses = {
      'project': 'I found 23 active projects. 3 are behind schedule and need attention. Would you like me to show the details?',
      'inventory': 'Current inventory shows 2 items below minimum threshold: Oak Hardwood Planks (45 sq ft) and Multi-Surface Adhesive (12 gallons). Shall I create reorder recommendations?',
      'estimate': 'I can help create accurate estimates using AI-powered calculations. Please provide the room dimensions and flooring type.',
      'schedule': 'Your team has 5 available installers today. Mike Chen and David Kim are free for new assignments. Would you like to schedule a job?',
      'customer': 'You have 3 pending follow-ups: Sarah Johnson (satisfaction survey), Emma Wilson (estimate scheduling), and TechCorp Inc. (project update). Which would you like to prioritize?',
      'financial': 'This month\'s performance: Revenue $847,230 (+12.5%), Expenses $634,580, Net Profit $212,650 (25.1% margin). All metrics are trending positive.'
    };

    const key = Object.keys(responses).find(k => input.toLowerCase().includes(k));
    return key ? responses[key] : 'I understand you\'re asking about ' + input + '. Let me analyze that for you... Based on current data, I recommend reviewing your project dashboard for the most up-to-date information. Is there a specific aspect you\'d like me to focus on?';
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
    handleSendMessage();
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // Voice recognition would be implemented here
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="ai-assistant-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`ai-assistant-container ${isMinimized ? 'minimized' : ''}`}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="ai-header">
            <div className="ai-title">
              <div className="ai-avatar">
                <SafeIcon icon={FiBrain} />
                <div className="ai-pulse"></div>
              </div>
              <div className="ai-info">
                <h3>Venice.AI Assistant</h3>
                <span className="ai-status">
                  <SafeIcon icon={FiShield} />
                  Privacy Protected
                </span>
              </div>
            </div>
            <div className="ai-controls">
              <button 
                className="control-btn"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <SafeIcon icon={FiMinimize2} />
              </button>
              <button className="control-btn" onClick={onClose}>
                <SafeIcon icon={FiX} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="ai-messages">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`message ${message.type}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="message-avatar">
                      <SafeIcon icon={message.type === 'ai' ? FiBrain : FiUser} />
                    </div>
                    <div className="message-content">
                      <div className="message-text">{message.content}</div>
                      <div className="message-time">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <div className="quick-actions-header">
                  <SafeIcon icon={FiZap} />
                  <span>Quick Actions</span>
                </div>
                <div className="quick-actions-grid">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="quick-action"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="ai-input-container">
                <div className="ai-input-wrapper">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your flooring business..."
                    className="ai-input"
                  />
                  <button 
                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleListening}
                  >
                    <SafeIcon icon={isListening ? FiMicOff : FiMic} />
                  </button>
                  <button className="send-btn" onClick={handleSendMessage}>
                    <SafeIcon icon={FiSend} />
                  </button>
                </div>
                <div className="ai-features">
                  <span className="feature">
                    <SafeIcon icon={FiShield} />
                    Local Processing
                  </span>
                  <span className="feature">
                    <SafeIcon icon={FiZap} />
                    Real-time Insights
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAssistant;