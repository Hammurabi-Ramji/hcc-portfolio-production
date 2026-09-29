// src/components/ExecutionDetailsPage.tsx

import React, { useEffect, useState } from 'react';
import { useWorkflow } from '../hooks/useWorkflow';
import type { ExecutionResult, ExecutionLogEntry } from '../types';

interface ExecutionDetailsPageProps {
  executionId: string;
  workflowId: string;
  onBack: () => void;
}

export function ExecutionDetailsPage({
  executionId,
  workflowId,
  onBack,
}: ExecutionDetailsPageProps) {
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const { getExecutionDetails } = useWorkflow();

  useEffect(() => {
    const loadExecution = async () => {
      setIsLoading(true);
      try {
        // In a real app, call getExecutionDetails(executionId)
        // For now, we'll use mock data
        const result = {
          success: true,
          final_output: { status: 'completed', message: 'Workflow executed successfully' },
          total_duration_ms: 1250,
          log: [
            { node_name: 'Input Node', duration_ms: 10, output: 'success' },
            { node_name: 'Transform Node', duration_ms: 45, output: 'success' },
            { node_name: 'If/Then Node', duration_ms: 15, output: 'success' },
            { node_name: 'Save Node', duration_ms: 1180, output: 'success' },
          ],
        };
        setExecution(result as ExecutionResult);
      } finally {
        setIsLoading(false);
      }
    };

    loadExecution();
  }, [executionId]);

  const toggleNodeExpanded = (index: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedNodes(newExpanded);
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading execution details...</div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>Failed to load execution details</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Execution Details</h1>
      </div>

      <div style={styles.content}>
        {/* Summary Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryRow}>
            <span style={styles.label}>Status</span>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: execution.success ? '#1a3a2a' : '#3a1a1a',
                color: execution.success ? '#2db8a0' : '#ff9999',
              }}
            >
              {execution.success ? '✓ Success' : '✗ Failed'}
            </span>
          </div>

          <div style={styles.summaryRow}>
            <span style={styles.label}>Duration</span>
            <span style={styles.value}>{execution.total_duration_ms}ms</span>
          </div>

          {execution.error && (
            <div style={styles.summaryRow}>
              <span style={styles.label}>Error</span>
              <span style={styles.errorText}>{execution.error}</span>
            </div>
          )}
        </div>

        {/* Final Output */}
        {execution.final_output && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Final Output</h2>
            <pre style={styles.jsonBlock}>
              {JSON.stringify(execution.final_output, null, 2)}
            </pre>
          </section>
        )}

        {/* Execution Timeline */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Execution Timeline ({execution.log.length} steps)</h2>

          <div style={styles.timeline}>
            {execution.log.map((entry, index) => (
              <div key={index} style={styles.timelineItem}>
                <button
                  onClick={() => toggleNodeExpanded(index)}
                  style={styles.timelineItemHeader}
                >
                  <span style={styles.timelineItemNumber}>{index + 1}</span>
                  <span style={styles.timelineItemName}>{entry.node_name}</span>
                  <span style={styles.timelineItemDuration}>{entry.duration_ms}ms</span>
                  <span style={styles.expandIcon}>
                    {expandedNodes.has(index) ? '▼' : '▶'}
                  </span>
                </button>

                {expandedNodes.has(index) && (
                  <div style={styles.timelineItemDetails}>
                    <div style={styles.detailRow}>
                      <strong>Output:</strong>
                      <pre style={styles.detailValue}>
                        {JSON.stringify(entry.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Timeline Connector */}
                {index < execution.log.length - 1 && (
                  <div style={styles.timelineConnector} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Performance Analysis */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Performance Analysis</h2>

          <div style={styles.performanceGrid}>
            <div style={styles.performanceCard}>
              <div style={styles.performanceLabel}>Fastest Step</div>
              <div style={styles.performanceValue}>
                {Math.min(...execution.log.map((e) => e.duration_ms))}ms
              </div>
            </div>

            <div style={styles.performanceCard}>
              <div style={styles.performanceLabel}>Slowest Step</div>
              <div style={styles.performanceValue}>
                {Math.max(...execution.log.map((e) => e.duration_ms))}ms
              </div>
            </div>

            <div style={styles.performanceCard}>
              <div style={styles.performanceLabel}>Average Step</div>
              <div style={styles.performanceValue}>
                {(
                  execution.log.reduce((sum, e) => sum + e.duration_ms, 0) /
                  execution.log.length
                ).toFixed(0)}
                ms
              </div>
            </div>

            <div style={styles.performanceCard}>
              <div style={styles.performanceLabel}>Total Duration</div>
              <div style={styles.performanceValue}>{execution.total_duration_ms}ms</div>
            </div>
          </div>
        </section>
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

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
  },

  backButton: {
    background: 'none',
    border: 'none',
    color: '#a8a8a8',
    cursor: 'pointer',
    fontSize: '14px',
  },

  title: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },

  content: {
    flex: 1,
    overflow: 'auto',
    padding: '40px',
  },

  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#787878',
  },

  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#ff9999',
  },

  summaryCard: {
    background: '#1a1a1a',
    border: '0.5px solid #333',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
  },

  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
  },

  label: {
    fontSize: '12px',
    color: '#a8a8a8',
    fontWeight: 600,
    textTransform: 'uppercase',
  },

  value: {
    fontSize: '13px',
    color: '#e8e8e8',
    fontWeight: 500,
  },

  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },

  errorText: {
    fontSize: '12px',
    color: '#ff9999',
  },

  section: {
    marginBottom: '30px',
  },

  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2db8a0',
    textTransform: 'uppercase',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },

  jsonBlock: {
    background: '#0f0f0f',
    border: '0.5px solid #333',
    borderRadius: '4px',
    padding: '12px',
    color: '#2db8a0',
    fontSize: '11px',
    fontFamily: 'monospace',
    overflow: 'auto',
    maxHeight: '200px',
  },

  timeline: {
    position: 'relative',
    paddingLeft: '20px',
  },

  timelineItem: {
    marginBottom: '20px',
    position: 'relative',
  },

  timelineItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px',
    background: '#1a1a1a',
    border: '0.5px solid #333',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#e8e8e8',
    fontSize: '12px',
    transition: 'all 0.2s',
  },

  timelineItemNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    background: '#2db8a0',
    color: '#0f0f0f',
    borderRadius: '50%',
    fontSize: '11px',
    fontWeight: 600,
    flexShrink: 0,
  },

  timelineItemName: {
    flex: 1,
    fontWeight: 500,
  },

  timelineItemDuration: {
    color: '#2db8a0',
    fontWeight: 600,
    fontSize: '11px',
  },

  expandIcon: {
    color: '#787878',
    fontSize: '10px',
  },

  timelineItemDetails: {
    padding: '12px',
    marginTop: '8px',
    background: '#252525',
    borderRadius: '4px',
  },

  detailRow: {
    marginBottom: '8px',
  },

  detailValue: {
    background: '#0f0f0f',
    padding: '8px',
    borderRadius: '4px',
    color: '#2db8a0',
    fontSize: '10px',
    margin: '4px 0 0 0',
    maxHeight: '150px',
    overflow: 'auto',
  },

  timelineConnector: {
    position: 'absolute',
    left: '-8px',
    top: '40px',
    bottom: '-20px',
    width: '0.5px',
    background: '#333',
  },

  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },

  performanceCard: {
    background: '#1a1a1a',
    border: '0.5px solid #333',
    borderRadius: '6px',
    padding: '16px',
    textAlign: 'center',
  },

  performanceLabel: {
    fontSize: '11px',
    color: '#787878',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },

  performanceValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#2db8a0',
  },
};

export default ExecutionDetailsPage;
