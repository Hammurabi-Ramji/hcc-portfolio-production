import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/pages/Dashboard';
import ProjectManagement from './components/pages/ProjectManagement';
import InventoryMaterials from './components/pages/InventoryMaterials';
import EstimatingQuoting from './components/pages/EstimatingQuoting';
import WorkforceManagement from './components/pages/WorkforceManagement';
import FinancialManagement from './components/pages/FinancialManagement';
import CustomerRelationship from './components/pages/CustomerRelationship';
import AIAssistant from './components/ai/AIAssistant';
import Login from './components/auth/Login';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const [aiAssistantOpen, setAIAssistantOpen] = useState(false);

  useEffect(() => {
    // Check for stored authentication
    const storedAuth = localStorage.getItem('erp_auth');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setIsAuthenticated(true);
      setCurrentUser(authData.user);
    }

    // Load theme preference
    const storedTheme = localStorage.getItem('erp_theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    localStorage.setItem('erp_auth', JSON.stringify({ user: userData }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('erp_auth');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('erp_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header 
            user={currentUser}
            onLogout={handleLogout}
            onToggleTheme={toggleTheme}
            theme={theme}
            onToggleAI={() => setAIAssistantOpen(!aiAssistantOpen)}
          />
          
          <main className="content-area">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectManagement />} />
                <Route path="/inventory" element={<InventoryMaterials />} />
                <Route path="/estimating" element={<EstimatingQuoting />} />
                <Route path="/workforce" element={<WorkforceManagement />} />
                <Route path="/financial" element={<FinancialManagement />} />
                <Route path="/customers" element={<CustomerRelationship />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>

        <AIAssistant 
          isOpen={aiAssistantOpen}
          onClose={() => setAIAssistantOpen(false)}
          user={currentUser}
        />
      </div>
    </Router>
  );
}

export default App;