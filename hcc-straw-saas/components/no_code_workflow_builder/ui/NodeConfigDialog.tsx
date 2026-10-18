// src/components/NodeConfigDialog.tsx

import React, { useState } from 'react';
import type { WorkflowNode } from '../types';

interface NodeConfigDialogProps {
  node: WorkflowNode;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: WorkflowNode) => void;
}

export function NodeConfigDialog({
  node,
  isOpen,
  onClose,
  onSave,
}: NodeConfigDialogProps) {
  const [label, setLabel] = useState(node.label);
  const [description, setDescription] = useState(node.description || '');
  const [config, setConfig] = useState(JSON.stringify(node.config || {}, null, 2));

  const handleSave = () => {
    try {
      const configObj = JSON.parse(config);
      onSave({
        ...node,
        label,
        description,
        config: configObj,
      });
      onClose();
    } catch {
      alert('Invalid JSON in config');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Configure Node</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {/* Node Type */}
          <div style={styles.field}>
            <label style={styles.label}>Node Type</label>
            <div style={styles.readOnlyValue}>{node.node_type}</div>
          </div>

          {/* Label */}
          <div style={styles.field}>
            <label style={styles.label}>Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={styles.input}
              placeholder="Node label"
            />
          </div>

          {/* Description */}
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
              placeholder="Node description"
            />
          </div>

          {/* Configuration JSON */}
          <div style={styles.field}>
            <label style={styles.label}>Configuration (JSON)</label>
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              style={styles.jsonEditor}
              placeholder="{}"
              spellCheck="false"
            />
            <p style={styles.help}>
              Enter node-specific configuration as JSON
            </p>
          </div>

          {/* Node-specific fields based on type */}
          {node.node_type === 'logic' && (
            <div style={styles.nodeTypeFields}>
              <div style={styles.field}>
                <label style={styles.label}>Logic Type</label>
                <select style={styles.select}>
                  <option>If/Then</option>
                  <option>Loop</option>
                  <option>Transform</option>
                  <option>Merge</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Condition (if applicable)</label>
                <input
                  type="text"
                  placeholder="e.g., amount > 500"
                  style={styles.input}
                />
                <p style={styles.help}>
                  Format: field operator value (e.g., status == active)
                </p>
              </div>
            </div>
          )}

          {node.node_type === 'output' && (
            <div style={styles.nodeTypeFields}>
              <div style={styles.field}>
                <label style={styles.label}>Output Type</label>
                <select style={styles.select}>
                  <option>SaveDB</option>
                  <option>ExportCSV</option>
                  <option>SendEmail</option>
                  <option>Webhook</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSave} style={styles.saveBtn}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },

  dialog: {
    background: '#1a1a1a',
    border: '0.5px solid #333',
    borderRadius: '8px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '0.5px solid #333',
  },

  title: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
  },

  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#a8a8a8',
    fontSize: '18px',
    cursor: 'pointer',
  },

  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },

  field: {
    marginBottom: '20px',
  },

  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#a8a8a8',
    marginBottom: '6px',
    textTransform: 'uppercase',
  },

  input: {
    width: '100%',
    padding: '8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#e8e8e8',
    fontSize: '12px',
  },

  textarea: {
    width: '100%',
    padding: '8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#e8e8e8',
    fontSize: '12px',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'monospace',
  },

  jsonEditor: {
    width: '100%',
    padding: '8px',
    background: '#0f0f0f',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#2db8a0',
    fontSize: '11px',
    fontFamily: 'monospace',
    minHeight: '150px',
    resize: 'vertical',
  },

  help: {
    fontSize: '11px',
    color: '#787878',
    margin: '4px 0 0 0',
  },

  select: {
    width: '100%',
    padding: '8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#e8e8e8',
    fontSize: '12px',
    cursor: 'pointer',
  },

  readOnlyValue: {
    padding: '8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#2db8a0',
    fontSize: '12px',
    fontFamily: 'monospace',
  },

  nodeTypeFields: {
    padding: '16px',
    background: '#252525',
    borderRadius: '4px',
    borderLeft: '2px solid #2db8a0',
  },

  footer: {
    display: 'flex',
    gap: '12px',
    padding: '20px',
    borderTop: '0.5px solid #333',
    justifyContent: 'flex-end',
  },

  cancelBtn: {
    padding: '8px 16px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#a8a8a8',
    fontSize: '12px',
    cursor: 'pointer',
  },

  saveBtn: {
    padding: '8px 16px',
    background: '#2db8a0',
    border: 'none',
    borderRadius: '4px',
    color: '#0f0f0f',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default NodeConfigDialog;
