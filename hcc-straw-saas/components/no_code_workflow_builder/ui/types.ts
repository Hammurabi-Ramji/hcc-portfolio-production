// src/types/index.ts

/**
 * Type definitions for Workflow Builder
 * These are shared between frontend React code and backend Tauri code
 */

/**
 * Represents a value that can flow through the workflow
 */
export type WorkflowValue =
  | null
  | boolean
  | number
  | string
  | WorkflowValue[]
  | Record<string, WorkflowValue>;

/**
 * Workflow node in the graph
 */
export interface WorkflowNode {
  id: string;
  label: string;
  node_type: 'input' | 'logic' | 'output';
  description: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
  };
}

/**
 * Edge connecting two nodes
 */
export interface WorkflowEdge {
  source: string;
  target: string;
  source_port?: string;
  target_port?: string;
}

/**
 * Complete workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'active' | 'archived';
  version: number;
}

/**
 * Summary of a workflow (for list view)
 */
export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
}

/**
 * Result of executing a workflow
 */
export interface ExecutionResult {
  success: boolean;
  final_output?: WorkflowValue;
  error?: string;
  log: ExecutionLogEntry[];
  total_duration_ms: number;
}

/**
 * Log entry for a single node execution
 */
export interface ExecutionLogEntry {
  node_id: string;
  node_name: string;
  timestamp: string;
  input: Record<string, WorkflowValue>;
  output: WorkflowValue | string; // Error message if failed
  duration_ms: number;
}

/**
 * Summary of an execution (for history view)
 */
export interface ExecutionSummary {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
}

/**
 * Detailed execution information
 */
export interface ExecutionDetails {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  node_logs: NodeExecutionLog[];
}

/**
 * Node-level execution log
 */
export interface NodeExecutionLog {
  node_id: string;
  node_name: string;
  node_type: 'input' | 'logic' | 'output';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at: string;
  duration_ms: number;
  sequence: number;
}

/**
 * Workflow template
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  usage_count: number;
  rating?: number;
}

/**
 * Database statistics
 */
export interface DatabaseStatistics {
  total_workflows: number;
  active_workflows: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  avg_execution_time_ms: number;
}
