// src/hooks/useWorkflow.ts

import { invoke } from '@tauri-apps/api/tauri';
import { useState, useCallback } from 'react';
import type {
  WorkflowDefinition,
  ExecutionResult,
  WorkflowSummary,
  ExecutionSummary,
  ExecutionDetails,
  WorkflowTemplate,
  DatabaseStatistics,
} from '../types';

/**
 * Main hook for workflow operations
 */
export function useWorkflow() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Save a workflow
  const saveWorkflow = useCallback(
    async (workflow: WorkflowDefinition): Promise<string | null> => {
      setIsLoading(true);
      clearError();
      try {
        const workflowId = await invoke<string>('save_workflow', { workflow });
        console.log('Workflow saved:', workflowId);
        return workflowId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Save workflow error:', errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  // Load a workflow
  const loadWorkflow = useCallback(
    async (workflowId: string): Promise<WorkflowDefinition | null> => {
      setIsLoading(true);
      clearError();
      try {
        const workflow = await invoke<WorkflowDefinition>('load_workflow', { workflow_id: workflowId });
        return workflow;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Load workflow error:', errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  // List all workflows
  const listWorkflows = useCallback(
    async (): Promise<WorkflowSummary[]> => {
      setIsLoading(true);
      clearError();
      try {
        const workflows = await invoke<WorkflowSummary[]>('list_workflows');
        return workflows;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('List workflows error:', errorMsg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  // Execute a workflow
  const executeWorkflow = useCallback(
    async (workflowId: string, inputData: any): Promise<ExecutionResult | null> => {
      setIsLoading(true);
      clearError();
      try {
        const result = await invoke<ExecutionResult>('execute_workflow', {
          workflow_id: workflowId,
          input_data: inputData,
        });
        console.log('Workflow executed:', result);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Execute workflow error:', errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  // Get execution history
  const getExecutions = useCallback(
    async (workflowId: string, limit: number = 10): Promise<ExecutionSummary[]> => {
      setIsLoading(true);
      clearError();
      try {
        const executions = await invoke<ExecutionSummary[]>('get_executions', {
          workflow_id: workflowId,
          limit,
        });
        return executions;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Get executions error:', errorMsg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  // Get execution details
  const getExecutionDetails = useCallback(
    async (executionId: string): Promise<ExecutionDetails | null> => {
      setIsLoading(true);
      clearError();
      try {
        const details = await invoke<ExecutionDetails>('get_execution_details', {
          execution_id: executionId,
        });
        return details;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Get execution details error:', errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  // Delete a workflow
  const deleteWorkflow = useCallback(
    async (workflowId: string): Promise<boolean> => {
      setIsLoading(true);
      clearError();
      try {
        await invoke('delete_workflow', { workflow_id: workflowId });
        console.log('Workflow deleted:', workflowId);
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Delete workflow error:', errorMsg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  // Export workflow
  const exportWorkflow = useCallback(
    async (workflowId: string): Promise<string | null> => {
      setIsLoading(true);
      clearError();
      try {
        const json = await invoke<string>('export_workflow', { workflow_id: workflowId });
        return json;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Export workflow error:', errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  // Import workflow
  const importWorkflow = useCallback(
    async (jsonData: string): Promise<string | null> => {
      setIsLoading(true);
      clearError();
      try {
        const workflowId = await invoke<string>('import_workflow', { json_data: jsonData });
        console.log('Workflow imported:', workflowId);
        return workflowId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Import workflow error:', errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  return {
    isLoading,
    error,
    clearError,
    saveWorkflow,
    loadWorkflow,
    listWorkflows,
    executeWorkflow,
    getExecutions,
    getExecutionDetails,
    deleteWorkflow,
    exportWorkflow,
    importWorkflow,
  };
}

/**
 * Hook for template operations
 */
export function useTemplates() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Get all templates
  const getTemplates = useCallback(
    async (): Promise<WorkflowTemplate[]> => {
      setIsLoading(true);
      clearError();
      try {
        const templates = await invoke<WorkflowTemplate[]>('get_templates');
        return templates;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Get templates error:', errorMsg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  // Create from template
  const createFromTemplate = useCallback(
    async (templateId: string, name: string): Promise<string | null> => {
      setIsLoading(true);
      clearError();
      try {
        const workflowId = await invoke<string>('create_from_template', {
          template_id: templateId,
          name,
        });
        console.log('Created from template:', workflowId);
        return workflowId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Create from template error:', errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  return {
    isLoading,
    error,
    clearError,
    getTemplates,
    createFromTemplate,
  };
}

/**
 * Hook for database statistics
 */
export function useStatistics() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Get statistics
  const getStatistics = useCallback(
    async (): Promise<DatabaseStatistics | null> => {
      setIsLoading(true);
      clearError();
      try {
        const stats = await invoke<DatabaseStatistics>('get_statistics');
        return stats;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('Get statistics error:', errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  return {
    isLoading,
    error,
    clearError,
    getStatistics,
  };
}
