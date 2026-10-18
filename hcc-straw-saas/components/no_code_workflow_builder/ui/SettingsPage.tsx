// src/components/SettingsPage.tsx

import React, { useState } from 'react';
import { useNotification } from './NotificationProvider';

interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  autoSave: boolean;
  autoSaveInterval: number;
  executionTimeout: number;
  maxHistorySize: number;
  enableAnimations: boolean;
  confirmBeforeDelete: boolean;
}

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { success } = useNotification();
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    autoSave: true,
    autoSaveInterval: 30,
    executionTimeout: 60,
    maxHistorySize: 50,
    enableAnimations: true,
    confirmBeforeDelete: true,
  });

  const handleChange = (key: keyof AppSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    success('Settings saved successfully');
  };

  const handleReset = () => {
    const defaults: AppSettings = {
      theme: 'dark',
      autoSave: true,
      autoSaveInterval: 30,
      executionTimeout: 60,
      maxHistorySize: 50,
      enableAnimations: true,
      confirmBeforeDelete: true,
    };
    setSettings(defaults);
    success('Settings reset to defaults');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Settings</h1>
      </div>

      <div style={styles.content}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Appearance</h2>

          <div style={styles.setting}>
            <label style={styles.label}>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) =>
                handleChange('theme', e.target.value as 'dark' | 'light' | 'auto')
              }
              style={styles.select}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div style={styles.setting}>
            <label style={styles.label}>Enable Animations</label>
            <input
              type="checkbox"
              checked={settings.enableAnimations}
              onChange={(e) => handleChange('enableAnimations', e.target.checked)}
              style={styles.checkbox}
            />
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Workflow Execution</h2>

          <div style={styles.setting}>
            <label style={styles.label}>Execution Timeout (seconds)</label>
            <input
              type="number"
              value={settings.executionTimeout}
              onChange={(e) =>
                handleChange('executionTimeout', parseInt(e.target.value))
              }
              style={styles.input}
              min="10"
              max="600"
            />
            <p style={styles.help}>Maximum time allowed for a workflow to execute</p>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Editor Behavior</h2>

          <div style={styles.setting}>
            <label style={styles.label}>Auto-Save</label>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => handleChange('autoSave', e.target.checked)}
              style={styles.checkbox}
            />
          </div>

          {settings.autoSave && (
            <div style={styles.setting}>
              <label style={styles.label}>Auto-Save Interval (seconds)</label>
              <input
                type="number"
                value={settings.autoSaveInterval}
                onChange={(e) =>
                  handleChange('autoSaveInterval', parseInt(e.target.value))
                }
                style={styles.input}
                min="10"
                max="300"
              />
            </div>
          )}

          <div style={styles.setting}>
            <label style={styles.label}>Undo/Redo History Size</label>
            <input
              type="number"
              value={settings.maxHistorySize}
              onChange={(e) =>
                handleChange('maxHistorySize', parseInt(e.target.value))
              }
              style={styles.input}
              min="10"
              max="500"
            />
            <p style={styles.help}>Number of undo/redo steps to keep</p>
          </div>

          <div style={styles.setting}>
            <label style={styles.label}>Confirm Before Delete</label>
            <input
              type="checkbox"
              checked={settings.confirmBeforeDelete}
              onChange={(e) =>
                handleChange('confirmBeforeDelete', e.target.checked)
              }
              style={styles.checkbox}
            />
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>About</h2>
          <p style={styles.aboutText}>
            <strong>Workflow Builder</strong> v0.1.0
          </p>
          <p style={styles.aboutText}>
            A visual automation platform built with Tauri, React, and Rust.
          </p>
          <p style={styles.aboutText}>
            No cloud dependencies • All data stays on your machine • $0/month
          </p>
        </section>
      </div>

      <div style={styles.footer}>
        <button onClick={handleReset} style={styles.buttonSecondary}>
          Reset to Defaults
        </button>
        <button onClick={handleSave} style={styles.buttonPrimary}>
          Save Settings
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#0f0f0f',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
  },

  backButton: {
    background: 'none',
    border: 'none',
    color: '#a8a8a8',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px 8px',
  },

  title: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },

  content: {
    flex: 1,
    overflow: 'auto',
    padding: '40px',
    maxWidth: '700px',
  },

  section: {
    marginBottom: '40px',
  },

  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2db8a0',
    textTransform: 'uppercase',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },

  setting: {
    marginBottom: '20px',
  },

  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '8px',
    color: '#e8e8e8',
  },

  input: {
    width: '100%',
    maxWidth: '200px',
    padding: '8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#e8e8e8',
    fontSize: '12px',
  },

  select: {
    padding: '8px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#e8e8e8',
    fontSize: '12px',
    cursor: 'pointer',
  },

  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },

  help: {
    fontSize: '11px',
    color: '#787878',
    margin: '4px 0 0 0',
  },

  aboutText: {
    fontSize: '12px',
    color: '#a8a8a8',
    margin: '8px 0',
  },

  footer: {
    display: 'flex',
    gap: '12px',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #333',
    justifyContent: 'flex-end',
  },

  buttonPrimary: {
    padding: '8px 16px',
    background: '#2db8a0',
    border: 'none',
    borderRadius: '4px',
    color: '#0f0f0f',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  buttonSecondary: {
    padding: '8px 16px',
    background: '#252525',
    border: '0.5px solid #333',
    borderRadius: '4px',
    color: '#a8a8a8',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

export default SettingsPage;
