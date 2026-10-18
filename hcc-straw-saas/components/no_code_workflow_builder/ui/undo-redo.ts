// src/lib/undo-redo.ts

/**
 * Undo/Redo system for workflow editor state management
 */

export interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export class UndoRedoManager<T> {
  private state: UndoRedoState<T>;
  private maxHistory: number;

  constructor(initialState: T, maxHistory: number = 50) {
    this.state = {
      past: [],
      present: initialState,
      future: [],
    };
    this.maxHistory = maxHistory;
  }

  /**
   * Push new state and clear redo history
   */
  public push(newState: T): void {
    // Add current state to past
    this.state.past.push(this.state.present);

    // Limit history size
    if (this.state.past.length > this.maxHistory) {
      this.state.past.shift();
    }

    // Set new present and clear future
    this.state.present = newState;
    this.state.future = [];
  }

  /**
   * Undo to previous state
   */
  public undo(): T | null {
    if (this.state.past.length === 0) {
      return null;
    }

    const previous = this.state.past.pop()!;
    this.state.future.unshift(this.state.present);
    this.state.present = previous;

    return this.state.present;
  }

  /**
   * Redo to next state
   */
  public redo(): T | null {
    if (this.state.future.length === 0) {
      return null;
    }

    const next = this.state.future.shift()!;
    this.state.past.push(this.state.present);
    this.state.present = next;

    return this.state.present;
  }

  /**
   * Get current state
   */
  public getPresent(): T {
    return this.state.present;
  }

  /**
   * Check if undo is available
   */
  public canUndo(): boolean {
    return this.state.past.length > 0;
  }

  /**
   * Check if redo is available
   */
  public canRedo(): boolean {
    return this.state.future.length > 0;
  }

  /**
   * Get history size
   */
  public getHistorySize(): { past: number; future: number } {
    return {
      past: this.state.past.length,
      future: this.state.future.length,
    };
  }

  /**
   * Clear all history
   */
  public clear(): void {
    this.state.past = [];
    this.state.future = [];
  }

  /**
   * Reset to initial state
   */
  public reset(initialState: T): void {
    this.state = {
      past: [],
      present: initialState,
      future: [],
    };
  }
}

/**
 * React Hook for Undo/Redo
 */
import { useState, useCallback } from 'react';

export function useUndoRedo<T>(initialState: T, maxHistory?: number) {
  const [manager] = useState(() => new UndoRedoManager(initialState, maxHistory));
  const [state, setState] = useState<T>(initialState);

  const push = useCallback(
    (newState: T) => {
      manager.push(newState);
      setState(newState);
    },
    [manager]
  );

  const undo = useCallback(() => {
    const previous = manager.undo();
    if (previous !== null) {
      setState(previous);
    }
  }, [manager]);

  const redo = useCallback(() => {
    const next = manager.redo();
    if (next !== null) {
      setState(next);
    }
  }, [manager]);

  const canUndo = useCallback(() => manager.canUndo(), [manager]);
  const canRedo = useCallback(() => manager.canRedo(), [manager]);

  return {
    state,
    push,
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}
