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

export function useHealthData(enabled = true) {
  return useQuery<HealthData>({
    queryKey: ['/api/health'],
    queryFn: async () => {
      const response = await fetch('/api/health', {
        headers: {
          'Authorization': 'Bearer demo-token',
          'x-user-id': localStorage.getItem('userId') || 'default-user-id',
          'x-warehouse-id': localStorage.getItem('warehouseId') || 'default-warehouse-id',
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

export const healthService = {
  getHealth: async (): Promise<HealthData> => {
    const response = await fetch('/api/health', {
      headers: {
        'Authorization': 'Bearer demo-token',
        'x-user-id': localStorage.getItem('userId') || 'default-user-id',
        'x-warehouse-id': localStorage.getItem('warehouseId') || 'default-warehouse-id',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch health data');
    return response.json();
  },
};