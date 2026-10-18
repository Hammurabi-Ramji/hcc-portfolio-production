/**
 * Phase 5: UI/UX Improvements
 * Dashboard redesign, accessibility, modern dark theme
 */

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
}

export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    error: string;
    success: string;
    warning: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
}

export interface AccessibilityConfig {
  highContrast: boolean;
  fontSize: number;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
}

/**
 * Dashboard Manager with customizable widgets
 */
export class DashboardManager {
  private widgets: Map<string, DashboardWidget> = new Map();
  private layout: string = 'grid';
  private autoSave: boolean = true;

  /**
   * Add widget to dashboard
   */
  public addWidget(widget: DashboardWidget): void {
    this.widgets.set(widget.id, widget);
    if (this.autoSave) {
      this.saveDashboardState();
    }
  }

  /**
   * Remove widget from dashboard
   */
  public removeWidget(widgetId: string): void {
    this.widgets.delete(widgetId);
    if (this.autoSave) {
      this.saveDashboardState();
    }
  }

  /**
   * Update widget position
   */
  public updateWidgetPosition(widgetId: string, position: { x: number; y: number }): void {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      widget.position = position;
      if (this.autoSave) {
        this.saveDashboardState();
      }
    }
  }

  /**
   * Update widget size
   */
  public updateWidgetSize(widgetId: string, size: { width: number; height: number }): void {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      widget.size = size;
      if (this.autoSave) {
        this.saveDashboardState();
      }
    }
  }

  /**
   * Get all widgets
   */
  public getWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Save dashboard state
   */
  private saveDashboardState(): void {
    const state = {
      widgets: Array.from(this.widgets.values()),
      layout: this.layout,
      timestamp: Date.now(),
    };
    localStorage.setItem('sue_dashboard_state', JSON.stringify(state));
  }

  /**
   * Load dashboard state
   */
  public loadDashboardState(): void {
    const stored = localStorage.getItem('sue_dashboard_state');
    if (stored) {
      try {
        const state = JSON.parse(stored);
        this.widgets.clear();
        for (const widget of state.widgets) {
          this.widgets.set(widget.id, widget);
        }
        this.layout = state.layout;
      } catch (error) {
        console.error('Failed to load dashboard state:', error);
      }
    }
  }

  /**
   * Reset dashboard to default
   */
  public resetToDefault(): void {
    this.widgets.clear();
    localStorage.removeItem('sue_dashboard_state');
  }
}

/**
 * Theme Manager
 */
export class ThemeManager {
  private currentTheme: ThemeConfig;
  private themes: Map<string, ThemeConfig> = new Map();
  private prefersDarkMode: boolean = window.matchMedia('(prefers-color-scheme: dark)').matches;

  constructor() {
    this.currentTheme = this.createDarkTheme();
    this.registerDefaultThemes();
    this.applyTheme();
  }

  /**
   * Create dark theme
   */
  private createDarkTheme(): ThemeConfig {
    return {
      name: 'dark',
      colors: {
        primary: '#1f2937',
        secondary: '#374151',
        accent: '#f59e0b',
        background: '#111827',
        surface: '#1f2937',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        lineHeight: 1.5,
      },
    };
  }

  /**
   * Create light theme
   */
  private createLightTheme(): ThemeConfig {
    return {
      name: 'light',
      colors: {
        primary: '#f3f4f6',
        secondary: '#e5e7eb',
        accent: '#f59e0b',
        background: '#ffffff',
        surface: '#f9fafb',
        error: '#dc2626',
        success: '#059669',
        warning: '#d97706',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 16,
        lineHeight: 1.5,
      },
    };
  }

  /**
   * Register default themes
   */
  private registerDefaultThemes(): void {
    this.themes.set('dark', this.createDarkTheme());
    this.themes.set('light', this.createLightTheme());
  }

  /**
   * Set theme
   */
  public setTheme(themeName: string): void {
    const theme = this.themes.get(themeName);
    if (theme) {
      this.currentTheme = theme;
      this.applyTheme();
      localStorage.setItem('sue_theme', themeName);
    }
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(): void {
    const root = document.documentElement;
    const colors = this.currentTheme.colors;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);

    const typography = this.currentTheme.typography;
    root.style.setProperty('--font-family', typography.fontFamily);
    root.style.setProperty('--font-size', `${typography.fontSize}px`);
    root.style.setProperty('--line-height', `${typography.lineHeight}`);
  }

  /**
   * Get current theme
   */
  public getCurrentTheme(): ThemeConfig {
    return this.currentTheme;
  }

  /**
   * Register custom theme
   */
  public registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.name, theme);
  }
}

/**
 * Accessibility Manager
 */
export class AccessibilityManager {
  private config: AccessibilityConfig = {
    highContrast: false,
    fontSize: 16,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    screenReaderOptimized: false,
  };

  constructor() {
    this.loadAccessibilityConfig();
    this.applyAccessibilityConfig();
  }

  /**
   * Set high contrast mode
   */
  public setHighContrast(enabled: boolean): void {
    this.config.highContrast = enabled;
    this.applyAccessibilityConfig();
    this.saveAccessibilityConfig();
  }

  /**
   * Set font size
   */
  public setFontSize(size: number): void {
    this.config.fontSize = Math.max(12, Math.min(24, size));
    this.applyAccessibilityConfig();
    this.saveAccessibilityConfig();
  }

  /**
   * Set reduce motion
   */
  public setReduceMotion(enabled: boolean): void {
    this.config.reduceMotion = enabled;
    this.applyAccessibilityConfig();
    this.saveAccessibilityConfig();
  }

  /**
   * Set screen reader optimization
   */
  public setScreenReaderOptimized(enabled: boolean): void {
    this.config.screenReaderOptimized = enabled;
    this.applyAccessibilityConfig();
    this.saveAccessibilityConfig();
  }

  /**
   * Apply accessibility configuration
   */
  private applyAccessibilityConfig(): void {
    const root = document.documentElement;

    if (this.config.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    root.style.fontSize = `${this.config.fontSize}px`;

    if (this.config.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (this.config.screenReaderOptimized) {
      root.setAttribute('role', 'application');
    }
  }

  /**
   * Load accessibility configuration
   */
  private loadAccessibilityConfig(): void {
    const stored = localStorage.getItem('sue_accessibility_config');
    if (stored) {
      try {
        const config = JSON.parse(stored);
        this.config = { ...this.config, ...config };
      } catch (error) {
        console.error('Failed to load accessibility config:', error);
      }
    }
  }

  /**
   * Save accessibility configuration
   */
  private saveAccessibilityConfig(): void {
    localStorage.setItem('sue_accessibility_config', JSON.stringify(this.config));
  }

  /**
   * Get accessibility configuration
   */
  public getConfig(): AccessibilityConfig {
    return { ...this.config };
  }
}

/**
 * Keyboard Shortcuts Manager
 */
export class KeyboardShortcutsManager {
  private shortcuts: Map<string, () => void> = new Map();
  private isListening: boolean = false;

  /**
   * Register keyboard shortcut
   */
  public registerShortcut(keys: string[], callback: () => void, description: string = ''): void {
    const shortcutKey = keys.join('+').toLowerCase();
    this.shortcuts.set(shortcutKey, callback);
  }

  /**
   * Start listening for shortcuts
   */
  public startListening(): void {
    if (this.isListening) {
      return;
    }

    this.isListening = true;

    document.addEventListener('keydown', (event) => {
      const keys: string[] = [];

      if (event.ctrlKey || event.metaKey) keys.push('ctrl');
      if (event.shiftKey) keys.push('shift');
      if (event.altKey) keys.push('alt');

      keys.push(event.key.toLowerCase());

      const shortcutKey = keys.join('+');
      const callback = this.shortcuts.get(shortcutKey);

      if (callback) {
        event.preventDefault();
        callback();
      }
    });
  }

  /**
   * Stop listening for shortcuts
   */
  public stopListening(): void {
    this.isListening = false;
  }

  /**
   * Get all shortcuts
   */
  public getShortcuts(): Map<string, () => void> {
    return new Map(this.shortcuts);
  }
}

// Export singletons
export const dashboardManager = new DashboardManager();
export const themeManager = new ThemeManager();
export const accessibilityManager = new AccessibilityManager();
export const keyboardShortcutsManager = new KeyboardShortcutsManager();
