import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
  NodeChange,
  EdgeChange,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WorkflowNode extends Node {
  data: {
    label: string;
    type: 'input' | 'logic' | 'output';
    description: string;
    config?: Record<string, any>;
    ports?: {
      in?: string[];
      out?: string[];
    };
  };
}

export interface WorkflowEdge extends Edge {
  data?: {
    condition?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CUSTOM NODE COMPONENT
// ============================================================================

const WorkflowNodeComponent: React.FC<{ data: WorkflowNode['data'] }> = ({ data }) => {
  const getColor = (type: string) => {
    switch (type) {
      case 'input': return '#3b8fd6';
      case 'logic': return '#e8a83e';
      case 'output': return '#2db8a0';
      default: return '#666';
    }
  };

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: `2px solid ${getColor(data.type)}`,
        borderRadius: '6px',
        padding: '12px',
        minWidth: '160px',
        fontFamily: '"Anthropic Sans", sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#e8e8e8',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getColor(data.type),
          }}
        />
        {data.label}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#a8a8a8',
          lineHeight: '1.4',
        }}
      >
        {data.description}
      </div>
    </div>
  );
};

// ============================================================================
// PROPERTIES INSPECTOR COMPONENT
// ============================================================================

interface InspectorProps {
  node: WorkflowNode | null;
  onUpdate: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  onDelete: (nodeId: string) => void;
}

const Inspector: React.FC<InspectorProps> = ({ node, onUpdate, onDelete }) => {
  const [localState, setLocalState] = useState(node?.data || {});

  useEffect(() => {
    setLocalState(node?.data || {});
  }, [node]);

  if (!node) {
    return (
      <div style={styles.inspectorPanel}>
        <div style={styles.inspectorHeader}>Properties</div>
        <div style={styles.inspectorContent}>
          <p style={{ color: '#787878', fontSize: '13px', lineHeight: '1.6' }}>
            Select a node to edit its properties.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    const updated = { ...localState, [key]: value };
    setLocalState(updated);
    onUpdate(node.id, updated);
  };

  return (
    <div style={styles.inspectorPanel}>
      <div style={styles.inspectorHeader}>Node Properties</div>
      <div style={styles.inspectorContent}>
        <div style={styles.propertyGroup}>
          <label style={styles.propertyLabel}>Type</label>
          <input
            type="text"
            disabled
            value={(localState as any).type || 'unknown'}
            style={{ ...styles.propertyInput, opacity: 0.6 }}
          />
        </div>

        <div style={styles.propertyGroup}>
          <label style={styles.propertyLabel}>Name</label>
          <input
            type="text"
            value={(localState as any).label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            style={styles.propertyInput}
          />
        </div>

        <div style={styles.propertyGroup}>
          <label style={styles.propertyLabel}>Description</label>
          <textarea
            value={(localState as any).description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            style={{ ...styles.propertyInput, resize: 'vertical', minHeight: '60px' }}
          />
        </div>

        {(localState as any).type === 'logic' && (
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Condition</label>
            <input
              type="text"
              placeholder="e.g., amount > 500"
              value={(localState as any).config?.condition || ''}
              onChange={(e) =>
                handleChange('config', {
                  ...((localState as any).config || {}),
                  condition: e.target.value,
                })
              }
              style={styles.propertyInput}
            />
          </div>
        )}

        {(localState as any).type === 'output' && (
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Output Format</label>
            <select
              value={(localState as any).config?.format || 'json'}
              onChange={(e) =>
                handleChange('config', {
                  ...((localState as any).config || {}),
                  format: e.target.value,
                })
              }
              style={styles.propertyInput}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="email">Email</option>
              <option value="database">Database</option>
            </select>
          </div>
        )}

        <div style={styles.propertyGroup}>
          <label style={styles.propertyLabel}>Error Handling</label>
          <select
            value={(localState as any).config?.errorStrategy || 'stop'}
            onChange={(e) =>
              handleChange('config', {
                ...((localState as any).config || {}),
                errorStrategy: e.target.value,
              })
            }
            style={styles.propertyInput}
          >
            <option value="stop">Stop workflow</option>
            <option value="skip">Skip to next</option>
            <option value="retry">Retry 3x</option>
            <option value="fallback">Use fallback value</option>
          </select>
        </div>

        <button
          onClick={() => onDelete(node.id)}
          style={{
            ...styles.btn,
            background: '#e24b4a',
            borderColor: '#e24b4a',
            color: '#e8e8e8',
            marginTop: '16px',
            width: '100%',
          }}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// TOOLBAR COMPONENT
// ============================================================================

interface ToolbarProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onDebug: () => void;
  onDeploy: () => void;
  onClear: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  workflowName,
  onNameChange,
  onSave,
  onDebug,
  onDeploy,
  onClear,
}) => (
  <div style={styles.toolbar}>
    <input
      type="text"
      value={workflowName}
      onChange={(e) => onNameChange(e.target.value)}
      style={{
        fontSize: '14px',
        fontWeight: 500,
        background: 'transparent',
        border: 'none',
        color: '#e8e8e8',
        outline: 'none',
        minWidth: '200px',
      }}
      placeholder="Workflow name"
    />
    <div style={styles.toolbarButtons}>
      <button onClick={onClear} style={styles.btn}>
        Clear
      </button>
      <button onClick={onDebug} style={styles.btn}>
        Debug
      </button>
      <button onClick={onSave} style={styles.btn}>
        Save
      </button>
      <button onClick={onDeploy} style={{ ...styles.btn, ...styles.btnPrimary }}>
        Deploy
      </button>
    </div>
  </div>
);

// ============================================================================
// MAIN CANVAS COMPONENT
// ============================================================================

export const WorkflowCanvas: React.FC<{
  initialWorkflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
  onDeploy?: (workflow: Workflow) => void;
}> = ({ initialWorkflow, onSave, onDeploy }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(
    initialWorkflow?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>(
    initialWorkflow?.edges || []
  );
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || 'Untitled Workflow');
  const [history, setHistory] = useState<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }[]>([]);
  const nodeIdRef = useRef(0);

  // Handle node changes (drag, delete, selection)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      const selectedChange = changes.find((c) => c.type === 'select');
      if (selectedChange && 'selected' in selectedChange) {
        const node = nodes.find((n) => n.id === selectedChange.nodeId);
        setSelectedNode((node as WorkflowNode) || null);
      }
    },
    [onNodesChange, nodes]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: WorkflowEdge = {
        ...connection,
        id: `${connection.source}-${connection.target}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      } as WorkflowEdge;
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Add node to canvas
  const addNode = useCallback(
    (type: 'input' | 'logic' | 'output', label: string, description: string) => {
      const id = `node-${nodeIdRef.current++}`;
      const newNode: WorkflowNode = {
        id,
        type: 'default',
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
        data: {
          label,
          type,
          description,
          config: {},
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // Update node properties
  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Partial<WorkflowNode['data']>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
      // Update selected node display
      if (selectedNode?.id === nodeId) {
        setSelectedNode({
          ...selectedNode,
          data: { ...selectedNode.data, ...data },
        });
      }
    },
    [setNodes, selectedNode]
  );

  // Delete node
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  // Save workflow
  const handleSave = useCallback(() => {
    const workflow: Workflow = {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: '',
      nodes,
      edges,
      createdAt: initialWorkflow?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onSave?.(workflow);
    alert(`Workflow "${workflowName}" saved!`);
  }, [nodes, edges, workflowName, initialWorkflow]);

  // Deploy workflow
  const handleDeploy = useCallback(() => {
    const workflow: Workflow = {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: '',
      nodes,
      edges,
      createdAt: initialWorkflow?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onDeploy?.(workflow);
    alert(`Workflow "${workflowName}" deployed!`);
  }, [nodes, edges, workflowName, initialWorkflow]);

  // Clear all nodes
  const handleClear = useCallback(() => {
    if (window.confirm('Clear all nodes? This cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
    }
  }, [setNodes, setEdges]);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>Inputs</div>
        {[
          { label: 'Text Input', desc: 'Accept text from user' },
          { label: 'File Picker', desc: 'Upload files' },
          { label: 'Number Input', desc: 'Numeric values' },
          { label: 'Date Picker', desc: 'Select dates' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => addNode('input', item.label, item.desc)}
            style={styles.componentItem}
            title={item.desc}
          >
            <span style={{ ...styles.componentIcon, background: '#3b8fd6' }}>📝</span>
            {item.label}
          </button>
        ))}

        <div style={styles.sidebarHeader}>Logic</div>
        {[
          { label: 'If/Then', desc: 'Conditional branching' },
          { label: 'Transform', desc: 'Data transformation' },
          { label: 'Loop', desc: 'Iterate over data' },
          { label: 'Merge', desc: 'Combine data streams' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => addNode('logic', item.label, item.desc)}
            style={styles.componentItem}
            title={item.desc}
          >
            <span style={{ ...styles.componentIcon, background: '#e8a83e' }}>⚙</span>
            {item.label}
          </button>
        ))}

        <div style={styles.sidebarHeader}>Outputs</div>
        {[
          { label: 'Save to DB', desc: 'Store in database' },
          { label: 'Export CSV', desc: 'Export as CSV' },
          { label: 'Send Email', desc: 'Email notification' },
          { label: 'Webhook', desc: 'Send HTTP request' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => addNode('output', item.label, item.desc)}
            style={styles.componentItem}
            title={item.desc}
          >
            <span style={{ ...styles.componentIcon, background: '#2db8a0' }}>✓</span>
            {item.label}
          </button>
        ))}
      </div>

      <div style={styles.mainArea}>
        <Toolbar
          workflowName={workflowName}
          onNameChange={setWorkflowName}
          onSave={handleSave}
          onDebug={() => console.log('Debug:', { nodes, edges })}
          onDeploy={handleDeploy}
          onClear={handleClear}
        />

        <div style={styles.canvasWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            nodeTypes={{
              default: (nodeProps) => (
                <div onClick={() => setSelectedNode(nodeProps.data as any)}>
                  <WorkflowNodeComponent data={nodeProps.data as any} />
                </div>
              ),
            }}
          >
            <Background color="#333" gap={32} />
            <Controls />
            <MiniMap nodeColor="#1a1a1a" />
          </ReactFlow>
        </div>
      </div>

      <Inspector
        node={selectedNode}
        onUpdate={handleNodeUpdate}
        onDelete={handleNodeDelete}
      />
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    background: '#0f0f0f',
    color: '#e8e8e8',
    fontFamily: '"Anthropic Sans", sans-serif',
  },
  sidebar: {
    width: 260,
    background: '#1a1a1a',
    borderRight: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflowY: 'auto',
  },
  sidebarHeader: {
    padding: '16px 14px',
    borderBottom: '1px solid #333',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#787878',
  },
  componentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    margin: '4px 8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#a8a8a8',
    transition: 'all 0.2s',
  },
  componentIcon: {
    width: 16,
    height: 16,
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 600,
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    height: 48,
    background: '#1a1a1a',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 12,
    justifyContent: 'space-between',
  },
  toolbarButtons: {
    display: 'flex',
    gap: 8,
  },
  btn: {
    padding: '6px 12px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: 4,
    color: '#a8a8a8',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnPrimary: {
    background: '#2db8a0',
    borderColor: '#2db8a0',
    color: '#0f0f0f',
  },
  canvasWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  inspectorPanel: {
    width: 280,
    background: '#1a1a1a',
    borderLeft: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  inspectorHeader: {
    padding: '16px 14px',
    borderBottom: '1px solid #333',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#787878',
  },
  inspectorContent: {
    flex: 1,
    padding: 16,
  },
  propertyGroup: {
    marginBottom: 20,
  },
  propertyLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    color: '#787878',
    marginBottom: 8,
    display: 'block',
  },
  propertyInput: {
    width: '100%',
    padding: '8px 10px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: 4,
    color: '#e8e8e8',
    fontSize: 12,
    fontFamily: 'monospace',
    transition: 'border-color 0.15s',
  },
};

export default WorkflowCanvas;
