// src/components/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { useWorkflow, useTemplates, useStatistics } from '../hooks/useWorkflow';
import type { WorkflowSummary, WorkflowTemplate, DatabaseStatistics } from '../types';

interface DashboardProps {
  onNewWorkflow: () => void;
  onOpenWorkflow: (workflowId: string) => void;
  onCreateFromTemplate: (templateId: string, name: string) => Promise<void>;
  onNavigateToEditor: () => void;
}

export function Dashboard({
  onNewWorkflow,
  onOpenWorkflow,
  onCreateFromTemplate,
  onNavigateToEditor,
}: DashboardProps) {
  const { listWorkflows } = useWorkflow();
  const { getTemplates } = useTemplates();
  const { getStatistics } = useStatistics();

  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [stats, setStats] = useState<DatabaseStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [wf, tpl, st] = await Promise.all([
          listWorkflows(),
          getTemplates(),
          getStatistics(),
        ]);
        setWorkflows(wf);
        setTemplates(tpl);
        setStats(st);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleCreateFromTemplate = async (template: WorkflowTemplate) => {
    const name = prompt(`Create new workflow from "${template.name}"`);
    if (name) {
      try {
        await onCreateFromTemplate(template.id, name);
      } catch (err) {
        alert(`Error: ${err}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Statistics */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Active Workflows</div>
            <div style={styles.statValue}>{stats.active_workflows}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Executions</div>
            <div style={styles.statValue}>{stats.total_executions}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Success Rate</div>
            <div style={styles.statValue}>{stats.success_rate.toFixed(1)}%</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Avg Execution Time</div>
            <div style={styles.statValue}>
              {stats.avg_execution_time_ms.toFixed(0)}ms
            </div>
          </div>
        </div>
      )}

      {/* Templates Section */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>Templates</h2>
          <p style={styles.sectionMeta}>
            Start with a pre-built workflow template
          </p>
        </div>

        <div style={styles.grid}>
          {templates.map((template) => (
            <div key={template.id} style={styles.card}>
              <div style={styles.cardContent}>
                <div style={styles.cardTitle}>{template.name}</div>
                <div style={styles.cardDescription}>{template.description}</div>
                <div style={styles.cardMeta}>
                  {template.usage_count} uses
                  {template.rating && ` • ⭐ ${template.rating.toFixed(1)}`}
                </div>
              </div>
              <button
                onClick={() => handleCreateFromTemplate(template)}
                style={styles.cardButton}
              >
                Use Template
              </button>
            </div>
          ))}

          <div
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2db8a0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
            }}
          >
            <div style={styles.cardContent}>
              <div style={styles.cardTitle}>Blank Workflow</div>
              <div style={styles.cardDescription}>
                Start from scratch with a custom workflow
              </div>
            </div>
            <button onClick={onNewWorkflow} style={styles.cardButton}>
              Create New
            </button>
          </div>
        </div>
      </section>

      {/* Recent Workflows Section */}
      {workflows.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>Recent Workflows</h2>
            <p style={styles.sectionMeta}>Your last modified workflows</p>
          </div>

          <div style={styles.workflowList}>
            {workflows.slice(0, 10).map((workflow) => (
              <div key={workflow.id} style={styles.workflowRow}>
                <div style={styles.workflowInfo}>
                  <div style={styles.workflowName}>{workflow.name}</div>
                  <div style={styles.workflowMeta}>
                    {workflow.description && (
                      <span>{workflow.description}</span>
                    )}
                    {workflow.total_executions > 0 && (
                      <span>
                        • {workflow.successful_executions} ✓ /
                        {workflow.total_executions} executions
                      </span>
                    )}
                  </div>
                </div>
                <div style={styles.workflowActions}>
                  <span style={styles.statusBadge}>
                    {workflow.status === 'active' ? '● Active' : '○ ' + workflow.status}
                  </span>
                  <button
                    onClick={() => onOpenWorkflow(workflow.id)}
                    style={styles.openButton}
                  >
                    Open →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {workflows.length === 0 && (
        <section style={styles.section}>
          <div style={styles.emptyState}>
            <p>No workflows yet</p>
            <button onClick={onNewWorkflow} style={styles.emptyStateButton}>
              Create your first workflow
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflow: 'auto',
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },

  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#787878',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '40px',
  },

  statCard: {
    background: '#1a1a1a',
    border: '0.5px solid #333',
    borderRadius: '8px',
    padding: '20px',
  },

  statLabel: {
    fontSize: '12px',
    color: '#787878',
    textTransform: 'uppercase',
    marginBottom: '8px',
    fontWeight: 500,
  },

  statValue: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#2db8a0',
  },

  section: {
    marginBottom: '60px',
  },

  sectionHeader: {
    marginBottom: '20px',
    borderBottom: '1px solid #333',
    paddingBottom: '12px',
  },

  sectionMeta: {
    fontSize: '12px',
    color: '#787878',
    margin: '4px 0 0 0',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },

  card: {
    background: '#1a1a1a',
    border: '0.5px solid #333',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
  },

  cardDescription: {
    fontSize: '12px',
    color: '#a8a8a8',
    lineHeight: '1.5',
    marginBottom: '8px',
  },

  cardMeta: {
    fontSize: '11px',
    color: '#787878',
  },

  cardButton: {
    padding: '8px 12px',
    background: '#2db8a0',
    border: 'none',
    borderRadius: '4px',
    color: '#0f0f0f',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  workflowList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  workflowRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '16px',
    alignItems: 'center',
    padding: '16px',
    background: '#1a1a1a',
    border: '0.5px solid #333',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },

  workflowInfo: {
    minWidth: 0,
  },

  workflowName: {
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '4px',
  },

  workflowMeta: {
    fontSize: '11px',
    color: '#787878',
  },

  workflowActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },

  statusBadge: {
    fontSize: '11px',
    padding: '4px 8px',
    background: '#252525',
    borderRadius: '4px',
    color: '#2db8a0',
  },

  openButton: {
    padding: '6px 12px',
    background: 'transparent',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#a8a8a8',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#787878',
  },

  emptyStateButton: {
    marginTop: '20px',
    padding: '10px 20px',
    background: '#2db8a0',
    border: 'none',
    borderRadius: '4px',
    color: '#0f0f0f',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default Dashboard;
