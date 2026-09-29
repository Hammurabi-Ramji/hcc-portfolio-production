// src/App.tsx

import React, { useState, useEffect } from 'react';
import { useWorkflow, useTemplates, useStatistics } from './hooks/useWorkflow';
import WorkflowCanvas from './components/WorkflowCanvas';
import Dashboard from './components/Dashboard';
import WorkflowEditor from './components/WorkflowEditor';
import type { WorkflowDefinition } from './types';

type PageType = 'dashboard' | 'editor' | 'executions';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowDefinition | null>(null);

  const { loadWorkflow, saveWorkflow, executeWorkflow, listWorkflows } = useWorkflow();
  const { getTemplates, createFromTemplate } = useTemplates();
  const { getStatistics } = useStatistics();

  // Handle navigation
  const handleNewWorkflow = () => {
    setSelectedWorkflowId(null);
    setCurrentWorkflow(null);
    setCurrentPage('editor');
  };

  const handleOpenWorkflow = async (workflowId: string) => {
    const workflow = await loadWorkflow(workflowId);
    if (workflow) {
      setSelectedWorkflowId(workflowId);
      setCurrentWorkflow(workflow);
      setCurrentPage('editor');
    }
  };

  const handleCreateFromTemplate = async (templateId: string, name: string) => {
    const workflowId = await createFromTemplate(templateId, name);
    if (workflowId) {
      const workflow = await loadWorkflow(workflowId);
      if (workflow) {
        setSelectedWorkflowId(workflowId);
        setCurrentWorkflow(workflow);
        setCurrentPage('editor');
      }
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>⚙️ Workflow Builder</h1>
          <nav style={styles.nav}>
            <button
              onClick={() => setCurrentPage('dashboard')}
              style={{
                ...styles.navButton,
                ...(currentPage === 'dashboard' ? styles.navButtonActive : {}),
              }}
            >
              Dashboard
            </button>
            {currentWorkflow && (
              <button
                onClick={() => setCurrentPage('editor')}
                style={{
                  ...styles.navButton,
                  ...(currentPage === 'editor' ? styles.navButtonActive : {}),
                }}
              >
                Editor
              </button>
            )}
            <button
              onClick={handleNewWorkflow}
              style={{ ...styles.navButton, ...styles.navButtonPrimary }}
            >
              + New Workflow
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {currentPage === 'dashboard' && (
          <Dashboard
            onNewWorkflow={handleNewWorkflow}
            onOpenWorkflow={handleOpenWorkflow}
            onCreateFromTemplate={handleCreateFromTemplate}
            onNavigateToEditor={() => setCurrentPage('editor')}
          />
        )}

        {currentPage === 'editor' && currentWorkflow && (
          <WorkflowEditor
            workflow={currentWorkflow}
            onSave={async (updated) => {
              const result = await saveWorkflow(updated);
              if (result) {
                setCurrentWorkflow(updated);
                setSelectedWorkflowId(updated.id);
              }
            }}
            onExecute={async (workflow, input) => {
              const result = await executeWorkflow(workflow.id, input);
              return result;
            }}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'editor' && !currentWorkflow && (
          <div style={styles.emptyState}>
            <p>Loading workflow...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Workflow Builder v0.1.0 • Built with Tauri + React + Rust</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0f0f0f',
    color: '#e8e8e8',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  header: {
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
    padding: '16px 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },

  headerContent: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '0 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logo: {
    fontSize: '20px',
    fontWeight: 500,
    margin: 0,
  },

  nav: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },

  navButton: {
    padding: '8px 16px',
    background: 'transparent',
    border: 'none',
    color: '#a8a8a8',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },

  navButtonActive: {
    color: '#2db8a0',
    background: 'rgba(45, 184, 160, 0.1)',
  },

  navButtonPrimary: {
    background: '#2db8a0',
    color: '#0f0f0f',
    marginLeft: '12px',
  },

  main: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },

  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#787878',
    fontSize: '14px',
  },

  footer: {
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #333',
    padding: '16px 40px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#787878',
    margin: 0,
  },
};

export default App;
