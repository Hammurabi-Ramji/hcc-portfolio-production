// src/lib/validation.ts

import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '../types';

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  nodeId?: string;
}

export class WorkflowValidator {
  /**
   * Validate entire workflow
   */
  static validate(workflow: WorkflowDefinition): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check basic properties
    if (!workflow.name || workflow.name.trim().length === 0) {
      errors.push({
        type: 'error',
        message: 'Workflow name is required',
      });
    }

    if (workflow.nodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'Workflow must have at least one node',
      });
    }

    // Validate nodes
    for (const node of workflow.nodes) {
      errors.push(...this.validateNode(node));
    }

    // Validate edges
    for (const edge of workflow.edges) {
      errors.push(...this.validateEdge(edge, workflow.nodes));
    }

    // Validate graph structure
    errors.push(...this.validateGraphStructure(workflow));

    return errors;
  }

  /**
   * Validate single node
   */
  static validateNode(node: WorkflowNode): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!node.id || node.id.trim().length === 0) {
      errors.push({
        type: 'error',
        message: 'Node ID is required',
        nodeId: node.id,
      });
    }

    if (!node.label || node.label.trim().length === 0) {
      errors.push({
        type: 'error',
        message: 'Node label is required',
        nodeId: node.id,
      });
    }

    if (!['input', 'logic', 'output'].includes(node.node_type)) {
      errors.push({
        type: 'error',
        message: `Invalid node type: ${node.node_type}`,
        nodeId: node.id,
      });
    }

    // Validate position
    if (
      typeof node.position.x !== 'number' ||
      typeof node.position.y !== 'number'
    ) {
      errors.push({
        type: 'warning',
        message: 'Node position is invalid',
        nodeId: node.id,
      });
    }

    // Validate config
    if (typeof node.config !== 'object' || node.config === null) {
      errors.push({
        type: 'warning',
        message: 'Node config is invalid',
        nodeId: node.id,
      });
    }

    return errors;
  }

  /**
   * Validate edge
   */
  static validateEdge(edge: WorkflowEdge, nodes: WorkflowNode[]): ValidationError[] {
    const errors: ValidationError[] = [];

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode) {
      errors.push({
        type: 'error',
        message: `Source node not found: ${edge.source}`,
      });
    }

    if (!targetNode) {
      errors.push({
        type: 'error',
        message: `Target node not found: ${edge.target}`,
      });
    }

    // Check for self-loops (usually not desired)
    if (edge.source === edge.target) {
      errors.push({
        type: 'warning',
        message: 'Self-referential edge detected',
      });
    }

    return errors;
  }

  /**
   * Validate graph structure (no cycles, proper start/end)
   */
  static validateGraphStructure(workflow: WorkflowDefinition): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for cycles
    if (this.hasCycle(workflow)) {
      errors.push({
        type: 'error',
        message: 'Workflow contains a cycle (infinite loop)',
      });
    }

    // Check for unreachable nodes
    const reachableNodeIds = this.getReachableNodes(workflow);
    for (const node of workflow.nodes) {
      if (
        node.node_type !== 'input' &&
        node.node_type !== 'output' &&
        !reachableNodeIds.has(node.id)
      ) {
        errors.push({
          type: 'warning',
          message: `Node is unreachable: ${node.label}`,
          nodeId: node.id,
        });
      }
    }

    // Check if there's at least one input node
    const hasInputNode = workflow.nodes.some((n) => n.node_type === 'input');
    if (!hasInputNode) {
      errors.push({
        type: 'error',
        message: 'Workflow must have at least one input node',
      });
    }

    // Check if there's at least one output node
    const hasOutputNode = workflow.nodes.some((n) => n.node_type === 'output');
    if (!hasOutputNode) {
      errors.push({
        type: 'warning',
        message: 'Workflow should have at least one output node',
      });
    }

    return errors;
  }

  /**
   * Check if workflow has cycles using DFS
   */
  private static hasCycle(workflow: WorkflowDefinition): boolean {
    const adjacencyList: Map<string, string[]> = new Map();

    for (const node of workflow.nodes) {
      adjacencyList.set(node.id, []);
    }

    for (const edge of workflow.edges) {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of workflow.nodes) {
      if (this.hasCycleDFS(node.id, adjacencyList, visited, recursionStack)) {
        return true;
      }
    }

    return false;
  }

  /**
   * DFS helper for cycle detection
   */
  private static hasCycleDFS(
    node: string,
    adjacencyList: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (
          this.hasCycleDFS(neighbor, adjacencyList, visited, recursionStack)
        ) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  /**
   * Get all reachable nodes from start nodes using BFS
   */
  private static getReachableNodes(workflow: WorkflowDefinition): Set<string> {
    const adjacencyList: Map<string, string[]> = new Map();

    for (const node of workflow.nodes) {
      adjacencyList.set(node.id, []);
    }

    for (const edge of workflow.edges) {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    }

    const startNodes = workflow.nodes
      .filter((n) => n.node_type === 'input')
      .map((n) => n.id);

    const reachable = new Set<string>();
    const queue: string[] = [...startNodes];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!reachable.has(current)) {
        reachable.add(current);
        const neighbors = adjacencyList.get(current) || [];
        queue.push(...neighbors);
      }
    }

    return reachable;
  }
}

/**
 * Validation hooks
 */
import { useCallback } from 'react';

export function useWorkflowValidation() {
  const validate = useCallback((workflow: WorkflowDefinition) => {
    return WorkflowValidator.validate(workflow);
  }, []);

  const getErrorCount = useCallback((errors: ValidationError[]) => {
    return errors.filter((e) => e.type === 'error').length;
  }, []);

  const getWarningCount = useCallback((errors: ValidationError[]) => {
    return errors.filter((e) => e.type === 'warning').length;
  }, []);

  const isValid = useCallback((workflow: WorkflowDefinition) => {
    const errors = validate(workflow);
    return getErrorCount(errors) === 0;
  }, [validate, getErrorCount]);

  return {
    validate,
    isValid,
    getErrorCount,
    getWarningCount,
  };
}
