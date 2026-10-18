// src/components/ErrorBoundary.tsx

import React, { ReactNode, ReactElement } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  public render(): ReactElement {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {__DEV__ && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.pre}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div style={styles.actions}>
              <button
                onClick={() => window.location.reload()}
                style={styles.button}
              >
                Reload App
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as ReactElement;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
    padding: '20px',
  },

  card: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '500px',
    textAlign: 'center',
  },

  icon: {
    fontSize: '48px',
    marginBottom: '20px',
  },

  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#e8e8e8',
    margin: '0 0 12px 0',
  },

  message: {
    fontSize: '14px',
    color: '#a8a8a8',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
  },

  details: {
    marginBottom: '24px',
    textAlign: 'left',
  },

  summary: {
    cursor: 'pointer',
    color: '#2db8a0',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '12px',
  },

  pre: {
    background: '#0f0f0f',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#ff9999',
    overflow: 'auto',
    maxHeight: '200px',
  },

  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },

  button: {
    padding: '10px 20px',
    background: '#2db8a0',
    border: 'none',
    borderRadius: '4px',
    color: '#0f0f0f',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  buttonSecondary: {
    background: '#252525',
    color: '#a8a8a8',
    border: '0.5px solid #333',
  },
};

export default ErrorBoundary;
