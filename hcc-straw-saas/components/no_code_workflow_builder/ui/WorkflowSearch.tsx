// src/components/WorkflowSearch.tsx

import React, { useState, useMemo } from 'react';
import type { WorkflowSummary } from '../types';

interface WorkflowSearchProps {
  workflows: WorkflowSummary[];
  onSelect: (workflow: WorkflowSummary) => void;
}

export function WorkflowSearch({ workflows, onSelect }: WorkflowSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'executions'>('date');

  const filteredAndSorted = useMemo(() => {
    let filtered = workflows;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          (w.description && w.description.toLowerCase().includes(query))
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((w) => w.status === filterStatus);
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'executions':
        sorted.sort((a, b) => (b.total_executions || 0) - (a.total_executions || 0));
        break;
      case 'date':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        break;
    }

    return sorted;
  }, [workflows, searchQuery, filterStatus, sortBy]);

  return (
    <div style={styles.container}>
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={styles.clearButton}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div style={styles.controls}>
        <div style={styles.filterGroup}>
          <label style={styles.controlLabel}>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as 'all' | 'active' | 'draft')
            }
            style={styles.select}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.controlLabel}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'name' | 'date' | 'executions')
            }
            style={styles.select}
          >
            <option value="date">Last Modified</option>
            <option value="name">Name</option>
            <option value="executions">Most Used</option>
          </select>
        </div>
      </div>

      <div style={styles.results}>
        {filteredAndSorted.length === 0 ? (
          <div style={styles.emptyState}>
            {workflows.length === 0
              ? 'No workflows created yet'
              : 'No workflows match your search'}
          </div>
        ) : (
          <div style={styles.workflowList}>
            {filteredAndSorted.map((workflow) => (
              <button
                key={workflow.id}
                onClick={() => onSelect(workflow)}
                style={styles.workflowItem}
              >
                <div style={styles.workflowItemHeader}>
                  <div style={styles.workflowItemTitle}>{workflow.name}</div>
                  <span
                    style={{
                      ...styles.statusIndicator,
                      color: workflow.status === 'active' ? '#2db8a0' : '#787878',
                    }}
                  >
                    {workflow.status === 'active' ? '●' : '○'} {workflow.status}
                  </span>
                </div>

                {workflow.description && (
                  <div style={styles.workflowItemDescription}>
                    {workflow.description}
                  </div>
                )}

                <div style={styles.workflowItemMeta}>
                  <span>{workflow.total_executions || 0} executions</span>
                  {workflow.total_executions && workflow.successful_executions && (
                    <span>
                      {' '}
                      • {(
                        (workflow.successful_executions / workflow.total_executions) *
                        100
                      ).toFixed(0)}
                      % success
                    </span>
                  )}
                  <span className="text-right">
                    {new Date(workflow.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <div style={styles.resultCount}>
          {filteredAndSorted.length} of {workflows.length} workflows
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#0f0f0f',
  },

  searchBar: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  searchInput: {
    width: '100%',
    padding: '10px 32px 10px 12px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '6px',
    color: '#e8e8e8',
    fontSize: '13px',
  },

  clearButton: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#787878',
    cursor: 'pointer',
    padding: '4px 8px',
  },

  controls: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },

  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  controlLabel: {
    fontSize: '12px',
    color: '#a8a8a8',
    fontWeight: 600,
  },

  select: {
    padding: '6px 10px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#a8a8a8',
    fontSize: '12px',
    cursor: 'pointer',
  },

  results: {
    flex: 1,
    overflow: 'auto',
    borderRadius: '6px',
    background: '#1a1a1a',
    border: '0.5px solid #333',
  },

  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#787878',
    fontSize: '13px',
  },

  workflowList: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },

  workflowItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    background: 'none',
    border: 'none',
    borderBottom: '0.5px solid #333',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s',
    color: '#e8e8e8',
  },

  workflowItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  workflowItemTitle: {
    fontSize: '13px',
    fontWeight: 600,
  },

  statusIndicator: {
    fontSize: '11px',
    fontWeight: 600,
  },

  workflowItemDescription: {
    fontSize: '11px',
    color: '#a8a8a8',
    lineHeight: '1.4',
  },

  workflowItemMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '10px',
    color: '#787878',
  },

  footer: {
    padding: '8px 12px',
    borderTop: '0.5px solid #333',
    fontSize: '11px',
    color: '#787878',
  },

  resultCount: {
    textAlign: 'center',
  },
};

export default WorkflowSearch;
