// src/components/WorkflowEditor.tsx

import React, { useState } from 'react';
import WorkflowCanvas from './WorkflowCanvas';
import type { WorkflowDefinition, ExecutionResult } from '../types';

interface WorkflowEditorProps {
  workflow: WorkflowDefinition;
  onSave: (workflow: WorkflowDefinition) => Promise<void>;
  onExecute: (workflow: WorkflowDefinition, input: any) => Promise<ExecutionResult | null>;
  onBack: () => void;
}

export function WorkflowEditor({
  workflow,
  onSave,
  onExecute,
  onBack,
}: WorkflowEditorProps) {
  const [currentWorkflow, setCurrentWorkflow] = useState(workflow);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testInput, setTestInput] = useState('{}');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = {
        ...currentWorkflow,
        updated_at: new Date().toISOString(),
      };
      await onSave(updated);
      alert('Workflow saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeploy = async () => {
    setIsExecuting(true);
    setError(null);
    try {
      let input = {};
      try {
        input = JSON.parse(testInput);
      } catch {
        setError('Invalid JSON in test input');
        return;
      }

      const result = await onExecute(currentWorkflow, input);
      if (result) {
        setExecutionResult(result);
        if (result.success) {
          alert('Workflow executed successfully!');
        } else {
          setError(`Execution failed: ${result.error}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentWorkflow({
      ...currentWorkflow,
      name: e.target.value,
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentWorkflow({
      ...currentWorkflow,
      description: e.target.value,
    });
  };

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.workflowInfo}>
          <input
            type="text"
            value={currentWorkflow.name}
            onChange={handleNameChange}
            style={styles.nameInput}
            placeholder="Workflow name"
          />
          <textarea
            value={currentWorkflow.description}
            onChange={handleDescriptionChange}
            style={styles.descriptionInput}
            placeholder="Workflow description"
          />
        </div>

        <div style={styles.toolbarActions}>
          <button onClick={onBack} style={styles.button}>
            ← Back
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={styles.button}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            style={styles.button}
          >
            Test
          </button>
          <button
            onClick={handleDeploy}
            disabled={isExecuting}
            style={{ ...styles.button, ...styles.buttonPrimary }}
          >
            {isExecuting ? 'Executing...' : 'Deploy'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.editorContent}>
        <WorkflowCanvas
          initialWorkflow={currentWorkflow}
          onSave={(workflow) => setCurrentWorkflow(workflow)}
        />

        {/* Test Panel */}
        {showTestPanel && (
          <div style={styles.testPanel}>
            <div style={styles.testPanelHeader}>
              <h3>Test Execution</h3>
              <button
                onClick={() => setShowTestPanel(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.testPanelContent}>
              <label style={styles.label}>Input Data (JSON):</label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                style={styles.testInput}
                placeholder='{"key": "value"}'
              />

              {error && (
                <div style={styles.errorBox}>
                  <strong>Error:</strong> {error}
                </div>
              )}

              {executionResult && (
                <div style={styles.resultBox}>
                  <h4 style={styles.resultHeader}>
                    {executionResult.success ? '✓ Success' : '✗ Failed'}
                  </h4>

                  <div style={styles.resultSection}>
                    <strong>Duration:</strong> {executionResult.total_duration_ms}ms
                  </div>

                  {executionResult.final_output && (
                    <div style={styles.resultSection}>
                      <strong>Output:</strong>
                      <pre style={styles.preformatted}>
                        {JSON.stringify(executionResult.final_output, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div style={styles.resultSection}>
                    <strong>Execution Log ({executionResult.log.length} steps):</strong>
                    {executionResult.log.map((entry, idx) => (
                      <div key={idx} style={styles.logEntry}>
                        <div style={styles.logHeader}>
                          {idx + 1}. {entry.node_name}
                          <span style={styles.logDuration}>
                            {entry.duration_ms}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#0f0f0f',
  },

  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
  },

  workflowInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  nameInput: {
    fontSize: '18px',
    fontWeight: 600,
    padding: '8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#e8e8e8',
  },

  descriptionInput: {
    fontSize: '12px',
    padding: '8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#a8a8a8',
    minHeight: '40px',
    resize: 'none',
  },

  toolbarActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },

  button: {
    padding: '8px 16px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#a8a8a8',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  buttonPrimary: {
    background: '#2db8a0',
    borderColor: '#2db8a0',
    color: '#0f0f0f',
  },

  editorContent: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
  },

  testPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '400px',
    backgroundColor: '#1a1a1a',
    borderLeft: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
  },

  testPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #333',
  },

  closeButton: {
    background: 'none',
    border: 'none',
    color: '#a8a8a8',
    fontSize: '18px',
    cursor: 'pointer',
  },

  testPanelContent: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  label: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#787878',
  },

  testInput: {
    flex: 1,
    padding: '8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#e8e8e8',
    fontFamily: 'monospace',
    fontSize: '12px',
    resize: 'none',
    minHeight: '100px',
  },

  errorBox: {
    padding: '12px',
    background: 'rgba(226, 75, 74, 0.1)',
    border: '0.5px solid #e24b4a',
    borderRadius: '4px',
    color: '#ff9999',
    fontSize: '12px',
  },

  resultBox: {
    padding: '12px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    fontSize: '12px',
  },

  resultHeader: {
    margin: '0 0 12px 0',
    color: '#2db8a0',
    fontSize: '13px',
  },

  resultSection: {
    marginBottom: '12px',
  },

  preformatted: {
    background: '#0f0f0f',
    padding: '8px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '11px',
    margin: '4px 0 0 0',
  },

  logEntry: {
    marginTop: '8px',
    padding: '8px',
    background: '#0f0f0f',
    borderRadius: '4px',
    fontSize: '11px',
  },

  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#a8a8a8',
  },

  logDuration: {
    color: '#2db8a0',
    fontWeight: 600,
  },
};

export default WorkflowEditor;
