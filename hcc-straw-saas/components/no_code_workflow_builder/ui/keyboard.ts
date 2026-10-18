// src/lib/keyboard.ts

export type KeyboardModifier = 'ctrl' | 'shift' | 'alt' | 'cmd';

export interface KeyboardShortcut {
  key: string;
  modifiers?: KeyboardModifier[];
  description: string;
  action: () => void;
}

/**
 * Keyboard shortcut manager
 */
export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();

  /**
   * Register a keyboard shortcut
   */
  register(
    key: string,
    action: () => void,
    description: string = '',
    modifiers: KeyboardModifier[] = []
  ): void {
    const shortcutKey = this.getShortcutKey(key, modifiers);
    this.shortcuts.set(shortcutKey, {
      key,
      modifiers,
      description,
      action,
    });
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string, modifiers: KeyboardModifier[] = []): void {
    const shortcutKey = this.getShortcutKey(key, modifiers);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Handle keyboard event
   */
  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const modifiers: KeyboardModifier[] = [];

    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.shiftKey) modifiers.push('shift');
    if (event.altKey) modifiers.push('alt');

    const shortcutKey = this.getShortcutKey(key, modifiers);
    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }

  /**
   * Get all registered shortcuts
   */
  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Generate shortcut key string
   */
  private getShortcutKey(key: string, modifiers: KeyboardModifier[]): string {
    const parts = [...modifiers.sort(), key.toLowerCase()];
    return parts.join('+');
  }

  /**
   * Format shortcut for display
   */
  static formatShortcut(shortcut: KeyboardShortcut): string {
    const modifierText = shortcut.modifiers
      ?.map((m) => {
        switch (m) {
          case 'ctrl':
            return 'Ctrl';
          case 'shift':
            return 'Shift';
          case 'alt':
            return 'Alt';
          case 'cmd':
            return 'Cmd';
        }
      })
      .join('+');

    const keyText = shortcut.key.length === 1
      ? shortcut.key.toUpperCase()
      : shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1);

    return modifierText ? `${modifierText}+${keyText}` : keyText;
  }
}

/**
 * React hook for keyboard shortcuts
 */
import { useEffect, useRef } from 'react';

export function useKeyboardShortcuts(
  shortcuts: Array<{
    key: string;
    modifiers?: KeyboardModifier[];
    action: () => void;
  }>
) {
  const managerRef = useRef(new KeyboardShortcutManager());

  useEffect(() => {
    const manager = managerRef.current;

    // Register all shortcuts
    shortcuts.forEach(({ key, modifiers = [], action }) => {
      manager.register(key, action, '', modifiers);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      manager.handleKeyDown(e);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      shortcuts.forEach(({ key, modifiers = [] }) => {
        manager.unregister(key, modifiers);
      });
    };
  }, [shortcuts]);
}

/**
 * Common application shortcuts
 */
export const CommonShortcuts = {
  SAVE: { key: 's', modifiers: ['ctrl'] },
  UNDO: { key: 'z', modifiers: ['ctrl'] },
  REDO: { key: 'z', modifiers: ['ctrl', 'shift'] },
  DELETE: { key: 'Delete' },
  ESCAPE: { key: 'Escape' },
  ENTER: { key: 'Enter' },
  SPACE: { key: ' ' },
  TAB: { key: 'Tab' },
  ARROW_UP: { key: 'ArrowUp' },
  ARROW_DOWN: { key: 'ArrowDown' },
  ARROW_LEFT: { key: 'ArrowLeft' },
  ARROW_RIGHT: { key: 'ArrowRight' },
  SEARCH: { key: 'f', modifiers: ['ctrl'] },
  COPY: { key: 'c', modifiers: ['ctrl'] },
  PASTE: { key: 'v', modifiers: ['ctrl'] },
  CUT: { key: 'x', modifiers: ['ctrl'] },
};

/**
 * Check if event matches shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: { key: string; modifiers?: KeyboardModifier[] }
): boolean {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  const modifiers = shortcut.modifiers || [];
  const hasCtrl = event.ctrlKey || event.metaKey;
  const hasShift = event.shiftKey;
  const hasAlt = event.altKey;

  const expectedCtrl = modifiers.includes('ctrl');
  const expectedShift = modifiers.includes('shift');
  const expectedAlt = modifiers.includes('alt');

  return hasCtrl === expectedCtrl && hasShift === expectedShift && hasAlt === expectedAlt;
}
