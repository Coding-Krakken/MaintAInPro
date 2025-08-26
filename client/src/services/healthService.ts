import { useQuery } from '@tanstack/react-query';

export interface HealthData {
  status: string;
  timestamp: string;
  env: string;
  port: number;
  version: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  websocket: {
    totalConnections: number;
    activeConnections: number;
    connectionsByWarehouse: Record<string, number>;
  };
  features: {
    auth: string;
    database: string;
    redis: string;
    email: string;
  };
  sha?: string;
  buildId?: string;
  region?: string;
  url?: string;
}

// New interfaces as per issue requirements
export interface HealthMetrics {
  systemStatus: 'healthy' | 'degraded' | 'down';
  databaseConnections: number;
  activeUsers: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastCheck: Date;
}

export interface HealthService {
  getSystemHealth(): Promise<HealthMetrics>;
  refreshHealthMetrics(): Promise<void>;
}

export function useHealthData(enabled = true) {
  return useQuery<HealthData>({
    queryKey: ['/api/health'],
    queryFn: async () => {
      const response = await fetch('/api/health', {
        headers: {
          Authorization: 'Bearer demo-token',
          'x-user-id': localStorage.getItem('userId') || '00000000-1111-2222-3333-444444444444',
          'x-warehouse-id':
            localStorage.getItem('warehouseId') || '11111111-2222-3333-4444-555555555555',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch health data');
      return response.json();
    },
    enabled,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 5000,
  });
}

// Enhanced health service with both existing and new functionality
class HealthServiceImpl implements HealthService {
  private lastHealthMetrics: HealthMetrics | null = null;
  private lastHealthData: HealthData | null = null;

  // Original method for backward compatibility
  async getHealth(): Promise<HealthData> {
    const _startTime = Date.now();

    const response = await fetch('/api/health', {
      headers: {
        Authorization: 'Bearer demo-token',
        'x-user-id': localStorage.getItem('userId') || '00000000-1111-2222-3333-444444444444',
        'x-warehouse-id':
          localStorage.getItem('warehouseId') || '11111111-2222-3333-4444-555555555555',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch health data');

    const healthData = await response.json();
    this.lastHealthData = healthData;

    return healthData;
  }

  // New method as per interface requirements
  async getSystemHealth(): Promise<HealthMetrics> {
    const startTime = Date.now();

    try {
      const healthData = await this.getHealth();
      const responseTime = Date.now() - startTime;

      // Transform HealthData to HealthMetrics
      const metrics: HealthMetrics = {
        systemStatus: this.mapStatusToSystemStatus(healthData.status),
        databaseConnections: this.extractDatabaseConnections(healthData),
        activeUsers: healthData.websocket?.activeConnections || 0,
        responseTime,
        errorRate: this.calculateErrorRate(healthData),
        uptime: healthData.uptime,
        lastCheck: new Date(),
      };

      this.lastHealthMetrics = metrics;
      return metrics;
    } catch (error) {
      // Return degraded state on error
      const metrics: HealthMetrics = {
        systemStatus: 'down',
        databaseConnections: 0,
        activeUsers: 0,
        responseTime: Date.now() - startTime,
        errorRate: 100,
        uptime: 0,
        lastCheck: new Date(),
      };

      this.lastHealthMetrics = metrics;
      throw error;
    }
  }

  // New method as per interface requirements
  async refreshHealthMetrics(): Promise<void> {
    await this.getSystemHealth();
  }

  // Helper method to map status strings to system status
  private mapStatusToSystemStatus(status: string): 'healthy' | 'degraded' | 'down' {
    switch (status) {
      case 'ok':
      case 'healthy':
        return 'healthy';
      case 'degraded':
      case 'warning':
        return 'degraded';
      case 'error':
      case 'down':
      case 'unhealthy':
        return 'down';
      default:
        return status === 'ok' ? 'healthy' : 'degraded';
    }
  }

  // Helper method to extract database connections from health data
  private extractDatabaseConnections(healthData: HealthData): number {
    // Check if database feature is enabled and estimate connections
    if (healthData.features?.database === 'enabled') {
      // For now, return a reasonable estimate based on active users
      // In a real implementation, this would come from the server
      return Math.max(1, Math.ceil((healthData.websocket?.activeConnections || 0) / 10));
    }
    return 0;
  }

  // Helper method to calculate error rate based on health data
  private calculateErrorRate(healthData: HealthData): number {
    // Basic error rate calculation based on system health
    const systemStatus = this.mapStatusToSystemStatus(healthData.status);

    switch (systemStatus) {
      case 'healthy':
        return 0;
      case 'degraded':
        return 5; // 5% error rate for degraded systems
      case 'down':
        return 100; // 100% error rate for down systems
      default:
        return 0;
    }
  }

  // Getter for last cached metrics (useful for debugging)
  getLastHealthMetrics(): HealthMetrics | null {
    return this.lastHealthMetrics;
  }

  // Getter for last cached health data (useful for debugging)
  getLastHealthData(): HealthData | null {
    return this.lastHealthData;
  }
}

// Export singleton instance
export const healthService = new HealthServiceImpl();
