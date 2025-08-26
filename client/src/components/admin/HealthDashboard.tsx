import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useHealthData } from '@/services/healthService';
import {
  Activity,
  Server,
  Clock,
  MemoryStick,
  Network,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external?: number;
  arrayBuffers?: number;
}

function StatusBadge({ status }: { status: string }) {
  const isHealthy = status === 'ok' || status === 'healthy';

  return (
    <Badge variant={isHealthy ? 'default' : 'destructive'} className='flex items-center gap-1'>
      {isHealthy ? <CheckCircle className='h-3 w-3' /> : <XCircle className='h-3 w-3' />}
      {isHealthy ? 'Healthy' : 'Unhealthy'}
    </Badge>
  );
}

function FeatureStatus({ feature, status }: { feature: string; status: string }) {
  const isEnabled = status === 'enabled';

  return (
    <div className='flex justify-between items-center py-2'>
      <span className='text-sm font-medium'>{feature}</span>
      <Badge variant={isEnabled ? 'default' : 'secondary'}>
        {isEnabled ? 'Enabled' : 'Disabled'}
      </Badge>
    </div>
  );
}

function MemoryUsageCard({ memory }: { memory: MemoryInfo }) {
  const memoryUsagePercent = Math.round((memory.heapUsed / memory.heapTotal) * 100);
  const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memory.heapTotal / 1024 / 1024);
  const rssMB = Math.round(memory.rss / 1024 / 1024);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>Memory Usage</CardTitle>
        <MemoryStick className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div>
            <div className='flex justify-between text-sm'>
              <span>
                Heap: {heapUsedMB}MB / {heapTotalMB}MB
              </span>
              <span>{memoryUsagePercent}%</span>
            </div>
            <Progress value={memoryUsagePercent} className='mt-2' />
          </div>
          <div className='text-xs text-muted-foreground'>RSS: {rssMB}MB</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HealthDashboard() {
  const { data: health, isLoading, error, refetch, isFetching } = useHealthData();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='flex items-center gap-2'>
          <RefreshCw className='h-4 w-4 animate-spin' />
          <span>Loading health data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className='border-red-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-600'>
            <AlertCircle className='h-5 w-5' />
            Failed to Load Health Data
          </CardTitle>
          <CardDescription>Unable to fetch system health information</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return null;
  }

  const uptimeFormatted = formatDistanceToNow(new Date(Date.now() - health.uptime * 1000), {
    addSuffix: false,
  });

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>System Health</h2>
          <p className='text-muted-foreground'>Monitor system status and performance metrics</p>
        </div>
        <Button onClick={() => refetch()} variant='outline' size='sm' disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>System Status</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <StatusBadge status={health.status} />
            <p className='text-xs text-muted-foreground mt-2'>{health.env} environment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Uptime</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{uptimeFormatted}</div>
            <p className='text-xs text-muted-foreground'>Since last restart</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>WebSocket</CardTitle>
            <Network className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{health.websocket?.activeConnections || 0}</div>
            <p className='text-xs text-muted-foreground'>Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Version</CardTitle>
            <Server className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{health.version}</div>
            <p className='text-xs text-muted-foreground'>Port {health.port}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Memory Usage */}
        {health.memory && <MemoryUsageCard memory={health.memory} />}

        {/* Features Status */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Database className='h-4 w-4' />
              Feature Status
            </CardTitle>
            <CardDescription>Current status of system features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-1'>
              {Object.entries(health.features || {}).map(([feature, status]) => (
                <FeatureStatus
                  key={feature}
                  feature={feature.charAt(0).toUpperCase() + feature.slice(1)}
                  status={status}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Information */}
      {(health.sha || health.buildId || health.region) && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Information</CardTitle>
            <CardDescription>Build and deployment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              {health.sha && (
                <div>
                  <span className='text-sm font-medium'>Git SHA</span>
                  <p className='text-sm text-muted-foreground font-mono'>
                    {health.sha.substring(0, 8)}
                  </p>
                </div>
              )}
              {health.buildId && (
                <div>
                  <span className='text-sm font-medium'>Build ID</span>
                  <p className='text-sm text-muted-foreground font-mono'>
                    {health.buildId.substring(0, 12)}
                  </p>
                </div>
              )}
              {health.region && (
                <div>
                  <span className='text-sm font-medium'>Region</span>
                  <p className='text-sm text-muted-foreground'>{health.region}</p>
                </div>
              )}
            </div>
            <Separator className='my-4' />
            <div className='text-xs text-muted-foreground'>
              Last updated: {new Date(health.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WebSocket Details */}
      {health.websocket &&
        Object.keys(health.websocket.connectionsByWarehouse || {}).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Active Connections by Warehouse
              </CardTitle>
              <CardDescription>Real-time connection distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {Object.entries(health.websocket.connectionsByWarehouse).map(
                  ([warehouse, count]) => (
                    <div key={warehouse} className='flex justify-between items-center'>
                      <span className='text-sm'>{warehouse}</span>
                      <Badge variant='outline'>{count} connections</Badge>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
