// src/components/NotificationProvider.tsx

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // ms, 0 = persistent
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (type: NotificationType, message: string, duration = 5000) => {
      const id = `${Date.now()}-${Math.random()}`;
      const notification: Notification = { id, type, message, duration };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => removeNotification(id), duration);
      }
    },
    [removeNotification]
  );

  const success = useCallback(
    (message: string, duration?: number) => addNotification('success', message, duration),
    [addNotification]
  );

  const error = useCallback(
    (message: string, duration?: number) => addNotification('error', message, duration),
    [addNotification]
  );

  const warning = useCallback(
    (message: string, duration?: number) => addNotification('warning', message, duration),
    [addNotification]
  );

  const info = useCallback(
    (message: string, duration?: number) => addNotification('info', message, duration),
    [addNotification]
  );

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  return (
    <div style={styles.container}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const backgroundColor = {
    success: '#1a3a2a',
    error: '#3a1a1a',
    warning: '#3a3a1a',
    info: '#1a2a3a',
  }[notification.type];

  const borderColor = {
    success: '#2db8a0',
    error: '#e24b4a',
    warning: '#e8a83e',
    info: '#3b8fd6',
  }[notification.type];

  const iconText = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ⓘ',
  }[notification.type];

  return (
    <div
      style={{
        ...styles.notification,
        backgroundColor,
        borderColor,
      }}
    >
      <span style={{ ...styles.icon, color: borderColor }}>{iconText}</span>
      <span style={styles.message}>{notification.message}</span>
      <button
        onClick={onClose}
        style={{ ...styles.closeBtn, borderColor }}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 999,
    maxWidth: '400px',
  },

  notification: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '6px',
    border: '0.5px solid',
    animation: 'slideIn 0.3s ease-out',
  },

  icon: {
    fontSize: '16px',
    fontWeight: 'bold',
    flexShrink: 0,
  },

  message: {
    flex: 1,
    fontSize: '13px',
    color: '#e8e8e8',
  },

  closeBtn: {
    background: 'none',
    border: '0.5px solid',
    borderRadius: '3px',
    color: '#a8a8a8',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '2px 6px',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
};

export default NotificationProvider;
