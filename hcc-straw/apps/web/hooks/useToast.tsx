"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';

export interface UseToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

function useToastState() {
  const [toasts, setToasts] = useState<UseToast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const sequence = useRef(0);

  const removeToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const addToast = useCallback((message: string, type: UseToast['type'] = 'info', duration = 3000) => {
    const id = String(++sequence.current);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration > 0) timers.current.set(id, setTimeout(() => removeToast(id), duration));
    return id;
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message: string, duration?: number) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message: string, duration?: number) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message: string, duration?: number) => addToast(message, 'info', duration), [addToast]);

  return useMemo(() => ({ toasts, addToast, removeToast, success, error, warning, info }),
    [toasts, addToast, removeToast, success, error, warning, info]);
}

const ToastContext = createContext<ReturnType<typeof useToastState> | null>(null);

// Mount once around all notification consumers. The provider owns its container.
export function ToastProvider({ children }: { children: ReactNode }) {
  const value = useToastState();
  return <ToastContext.Provider value={value}>
    {children}
    <ToastContainer toasts={value.toasts} removeToast={value.removeToast} />
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

// Fixed dark surfaces give white text >=7:1 contrast in either page theme.
const backgrounds: Record<UseToast['type'], string> = {
  success: '#14532d', error: '#7f1d1d', warning: '#713f12', info: '#1e3a8a',
};

export function ToastContainer({ toasts, removeToast }: {
  toasts: UseToast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div role="region" aria-label="Notifications" style={{
      position: 'fixed', top: 24, right: 24, zIndex: 50, display: 'grid', gap: 8,
      width: 'min(384px, calc(100vw - 48px))', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
    }}>
      {toasts.map((toast) => (
        <div key={toast.id} role={toast.type === 'error' ? 'alert' : 'status'} aria-atomic="true" style={{
          backgroundColor: backgrounds[toast.type], color: '#ffffff', padding: 16,
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ flex: 1, overflowWrap: 'anywhere' }}>{toast.message}</span>
          <button type="button" aria-label={`Dismiss ${toast.type} notification`}
            onClick={() => removeToast(toast.id)} style={{
              color: 'inherit', background: 'transparent', border: 0, borderRadius: 8,
              padding: 8, minWidth: 40, minHeight: 40, cursor: 'pointer', flexShrink: 0,
            }}>
            <svg aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
