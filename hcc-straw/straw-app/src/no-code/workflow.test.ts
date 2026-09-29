// tests/workflow.test.ts

import { describe, it, expect } from 'vitest';
import { WorkflowValidator } from '../src/lib/validation';
import type { WorkflowDefinition } from '../src/types';

describe('Workflow Validation', () => {
  const validWorkflow: WorkflowDefinition = {
    id: 'test-workflow',
    name: 'Test Workflow',
    description: 'A test workflow',
    status: 'draft',
    version: 1,
    nodes: [
      {
        id: 'node-1',
        label: 'Input',
        node_type: 'input',
        description: 'Test input',
        config: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'node-2',
        label: 'Output',
        node_type: 'output',
        description: 'Test output',
        config: {},
        position: { x: 100, y: 100 },
      },
    ],
    edges: [
      {
        source: 'node-1',
        target: 'node-2',
      },
    ],
  };

  it('should validate a correct workflow', () => {
    const errors = WorkflowValidator.validate(validWorkflow);
    expect(errors).toHaveLength(0);
  });

  it('should fail when workflow has no name', () => {
    const workflow = { ...validWorkflow, name: '' };
    const errors = WorkflowValidator.validate(workflow);
    expect(errors.some((e) => e.type === 'error')).toBe(true);
  });

  it('should fail when workflow has no nodes', () => {
    const workflow = { ...validWorkflow, nodes: [] };
    const errors = WorkflowValidator.validate(workflow);
    expect(errors.some((e) => e.type === 'error')).toBe(true);
  });

  it('should detect cycles', () => {
    const workflow: WorkflowDefinition = {
      ...validWorkflow,
      nodes: [
        ...validWorkflow.nodes,
        {
          id: 'node-3',
          label: 'Logic',
          node_type: 'logic',
          description: 'Test logic',
          config: {},
          position: { x: 50, y: 50 },
        },
      ],
      edges: [
        { source: 'node-1', target: 'node-3' },
        { source: 'node-3', target: 'node-2' },
        { source: 'node-2', target: 'node-1' }, // Creates a cycle
      ],
    };

    const errors = WorkflowValidator.validate(workflow);
    expect(errors.some((e) => e.message.includes('cycle'))).toBe(true);
  });

  it('should warn about unreachable nodes', () => {
    const workflow: WorkflowDefinition = {
      ...validWorkflow,
      nodes: [
        ...validWorkflow.nodes,
        {
          id: 'node-3',
          label: 'Unreachable',
          node_type: 'logic',
          description: 'Unreachable node',
          config: {},
          position: { x: 200, y: 200 },
        },
      ],
    };

    const errors = WorkflowValidator.validate(workflow);
    expect(errors.some((e) => e.message.includes('unreachable'))).toBe(true);
  });

  it('should warn when no output node exists', () => {
    const workflow: WorkflowDefinition = {
      ...validWorkflow,
      nodes: validWorkflow.nodes.filter((n) => n.node_type !== 'output'),
    };

    const errors = WorkflowValidator.validate(workflow);
    expect(errors.some((e) => e.message.includes('output'))).toBe(true);
  });
});

describe('Keyboard Shortcuts', () => {
  it('should match shortcut correctly', () => {
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });

    const shortcut = { key: 's', modifiers: ['ctrl'] };
    
    expect(event.key.toLowerCase()).toBe(shortcut.key);
    expect(event.ctrlKey).toBe(true);
  });
});

describe('Undo/Redo', () => {
  it('should track history correctly', () => {
    const manager = new (require('../src/lib/undo-redo').UndoRedoManager)('state1');
    
    manager.push('state2');
    manager.push('state3');
    
    expect(manager.getPresent()).toBe('state3');
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);
  });

  it('should undo correctly', () => {
    const manager = new (require('../src/lib/undo-redo').UndoRedoManager)('state1');
    
    manager.push('state2');
    manager.push('state3');
    manager.undo();
    
    expect(manager.getPresent()).toBe('state2');
    expect(manager.canRedo()).toBe(true);
  });

  it('should redo correctly', () => {
    const manager = new (require('../src/lib/undo-redo').UndoRedoManager)('state1');
    
    manager.push('state2');
    manager.push('state3');
    manager.undo();
    manager.redo();
    
    expect(manager.getPresent()).toBe('state3');
  });
});
