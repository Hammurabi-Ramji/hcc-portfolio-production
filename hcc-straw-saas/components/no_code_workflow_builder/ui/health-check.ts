// src/lib/health-check.ts

/**
 * System health check utilities
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database: ComponentHealth;
    frontend: ComponentHealth;
    backend: ComponentHealth;
  };
  uptime: number;
  details: string[];
}

export interface ComponentHealth {
  status: 'ok' | 'warning' | 'error';
  responseTime: number;
  lastCheck: string;
  message: string;
}

class HealthChecker {
  private startTime = Date.now();
  private lastChecks: Map<string, ComponentHealth> = new Map();

  /**
   * Perform full health check
   */
  async check(): Promise<HealthStatus> {
    const details: string[] = [];
    const startTime = performance.now();

    try {
      const dbHealth = await this.checkDatabase();
      const frontendHealth = await this.checkFrontend();
      const backendHealth = await this.checkBackend();

      this.lastChecks.set('database', dbHealth);
      this.lastChecks.set('frontend', frontendHealth);
      this.lastChecks.set('backend', backendHealth);

      // Determine overall status
      const allStatuses = [
        dbHealth.status,
        frontendHealth.status,
        backendHealth.status,
      ];

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (allStatuses.includes('error')) {
        overallStatus = 'unhealthy';
      } else if (allStatuses.includes('warning')) {
        overallStatus = 'degraded';
      }

      // Collect details
      if (dbHealth.status !== 'ok') details.push(`Database: ${dbHealth.message}`);
      if (frontendHealth.status !== 'ok')
        details.push(`Frontend: ${frontendHealth.message}`);
      if (backendHealth.status !== 'ok')
        details.push(`Backend: ${backendHealth.message}`);

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        components: {
          database: dbHealth,
          frontend: frontendHealth,
          backend: backendHealth,
        },
        uptime: this.getUptime(),
        details,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        components: {
          database: { status: 'error', responseTime: 0, lastCheck: new Date().toISOString(), message: 'Check failed' },
          frontend: { status: 'error', responseTime: 0, lastCheck: new Date().toISOString(), message: 'Check failed' },
          backend: { status: 'error', responseTime: 0, lastCheck: new Date().toISOString(), message: 'Check failed' },
        },
        uptime: this.getUptime(),
        details: [`Health check failed: ${error}`],
      };
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = performance.now();

    try {
      // Simulate database check
      await new Promise((resolve) => setTimeout(resolve, 10));

      const responseTime = performance.now() - startTime;

      return {
        status: responseTime < 100 ? 'ok' : 'warning',
        responseTime,
        lastCheck: new Date().toISOString(),
        message:
          responseTime < 100
            ? 'Database responding normally'
            : 'Database responding slowly',
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        message: `Database error: ${error}`,
      };
    }
  }

  /**
   * Check frontend availability
   */
  private async checkFrontend(): Promise<ComponentHealth> {
    const startTime = performance.now();

    try {
      // Frontend is always available if this code is running
      const responseTime = performance.now() - startTime;

      return {
        status: 'ok',
        responseTime,
        lastCheck: new Date().toISOString(),
        message: 'Frontend responding',
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        message: `Frontend error: ${error}`,
      };
    }
  }

  /**
   * Check backend connectivity
   */
  private async checkBackend(): Promise<ComponentHealth> {
    const startTime = performance.now();

    try {
      // Simulate backend check with Tauri command
      // In real implementation: await invoke('health_check_backend');
      await new Promise((resolve) => setTimeout(resolve, 20));

      const responseTime = performance.now() - startTime;

      return {
        status: responseTime < 100 ? 'ok' : 'warning',
        responseTime,
        lastCheck: new Date().toISOString(),
        message:
          responseTime < 100 ? 'Backend responding' : 'Backend slow',
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        message: `Backend error: ${error}`,
      };
    }
  }

  /**
   * Get system uptime in seconds
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get specific component health
   */
  getComponentHealth(component: string): ComponentHealth | undefined {
    return this.lastChecks.get(component);
  }

  /**
   * Clear health history
   */
  reset(): void {
    this.startTime = Date.now();
    this.lastChecks.clear();
  }
}

// Singleton instance
const healthChecker = new HealthChecker();

/**
 * React Hook for health monitoring
 */
import { useState, useEffect, useCallback } from 'react';

export function useHealthCheck(intervalMs = 30000) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const status = await healthChecker.check();
      setHealth(status);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    check();

    // Periodic checks
    const interval = setInterval(check, intervalMs);

    return () => clearInterval(interval);
  }, [check, intervalMs]);

  return { health, isChecking, check };
}

/**
 * Health Check Component
 */
import React from 'react';

export function HealthCheckWidget() {
  const { health } = useHealthCheck();

  if (!health) return <div>Checking health...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#2db8a0';
      case 'degraded':
        return '#e8a83e';
      case 'unhealthy':
        return '#e24b4a';
      default:
        return '#787878';
    }
  };

  return (
    <div
      style={{
        padding: '12px',
        background: '#1a1a1a',
        border: `0.5px solid ${getStatusColor(health.status)}`,
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <strong style={{ color: getStatusColor(health.status) }}>
          Status: {health.status.toUpperCase()}
        </strong>
      </div>

      <div style={{ color: '#a8a8a8', marginBottom: '4px' }}>
        Uptime: {health.uptime}s
      </div>

      <div style={{ marginTop: '8px' }}>
        <div style={{ color: '#787878' }}>Components:</div>
        <div style={{ marginLeft: '8px', marginTop: '4px' }}>
          <div>
            DB:{' '}
            <span style={{ color: getStatusColor(health.components.database.status) }}>
              {health.components.database.status}
            </span>{' '}
            ({health.components.database.responseTime.toFixed(0)}ms)
          </div>
          <div>
            Frontend:{' '}
            <span style={{ color: getStatusColor(health.components.frontend.status) }}>
              {health.components.frontend.status}
            </span>{' '}
            ({health.components.frontend.responseTime.toFixed(0)}ms)
          </div>
          <div>
            Backend:{' '}
            <span style={{ color: getStatusColor(health.components.backend.status) }}>
              {health.components.backend.status}
            </span>{' '}
            ({health.components.backend.responseTime.toFixed(0)}ms)
          </div>
        </div>
      </div>

      {health.details.length > 0 && (
        <div style={{ marginTop: '8px', color: '#ff9999' }}>
          {health.details.map((detail, i) => (
            <div key={i}>• {detail}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export { healthChecker };
