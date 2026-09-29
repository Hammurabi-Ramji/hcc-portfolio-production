// src/components/Modal.tsx

import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div style={styles.content}>{children}</div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelButton}>
            {cancelText}
          </button>
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              style={{
                ...styles.confirmButton,
                ...(isDanger ? styles.confirmButtonDanger : {}),
              }}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmText={confirmText}
      cancelText={cancelText}
      isDanger={isDanger}
    >
      <p style={styles.message}>{message}</p>
    </Modal>
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

  modal: {
    background: '#1a1a1a',
    border: '0.5px solid #333',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
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
    color: '#e8e8e8',
    margin: 0,
  },

  closeButton: {
    background: 'none',
    border: 'none',
    color: '#a8a8a8',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'color 0.2s',
  },

  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    color: '#a8a8a8',
    fontSize: '13px',
    lineHeight: '1.6',
  },

  message: {
    margin: 0,
    color: '#a8a8a8',
  },

  footer: {
    display: 'flex',
    gap: '12px',
    padding: '20px',
    borderTop: '0.5px solid #333',
    justifyContent: 'flex-end',
  },

  cancelButton: {
    padding: '8px 16px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#a8a8a8',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  confirmButton: {
    padding: '8px 16px',
    background: '#2db8a0',
    border: 'none',
    borderRadius: '4px',
    color: '#0f0f0f',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  confirmButtonDanger: {
    background: '#e24b4a',
    color: '#e8e8e8',
  },
};

export default Modal;
