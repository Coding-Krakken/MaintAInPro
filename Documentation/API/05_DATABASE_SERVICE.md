# Database Service

## Overview

Production-grade database service providing connection management, health monitoring, performance optimization, and comprehensive data access layer for the MaintAInPro CMMS system.

## Features

- **Connection Management**: Automatic health monitoring and connection pooling
- **Multi-tenant Operations**: Organization-based data isolation
- **Performance Monitoring**: Query performance tracking and optimization
- **Audit Trails**: Complete activity logging for all operations
- **Field Mapping**: Automatic camelCase ↔ snake_case transformation
- **Transaction Support**: Safe transaction management with rollback

## Architecture

```
Application Layer
       ↓
Database Service (Singleton)
       ↓
Drizzle ORM
       ↓
PostgreSQL Database
```

## Core Service

### DatabaseService Class

Singleton service managing all database operations:

```typescript
import { databaseService } from '../services/database.service';

// Initialize service (auto-initializes in production)
await databaseService.initialize();

// Check health
const health = await databaseService.performHealthCheck();

// Execute queries with monitoring
const result = await databaseService.executeQuery(
  async () => {
    return db.select().from(workOrders).limit(10);
  },
  'fetch recent work orders',
  organizationId
);
```

## Work Order Operations

### Search Work Orders
```typescript
const searchOptions = {
  query: 'hydraulic pump',          // Search term
  status: 'in_progress',            // Filter by status
  priority: 'high',                 // Filter by priority
  organizationId: 'org-uuid',       // Required for multi-tenancy
  limit: 25,                        // Page size (default: 10)
  offset: 0,                        // Pagination offset
  sortBy: 'created_at',             // Sort field
  sortOrder: 'desc'                 // Sort direction
};

const workOrders = await databaseService.searchWorkOrders(searchOptions);
```

### Create Work Order
```typescript
const workOrderData = {
  foNumber: 'WO-001-PUMP',
  type: 'corrective',
  description: 'Repair hydraulic pump',
  priority: 'high',
  status: 'new',
  organizationId: 'org-uuid',
  requestedBy: 'user-uuid',
  equipmentId: 'equipment-uuid'
};

const newWorkOrder = await databaseService.createWorkOrder(
  workOrderData,
  userId
);
```

### Update Work Order
```typescript
const updateData = {
  status: 'in_progress',
  assignedTo: 'technician-uuid',
  actualHours: 2.5,
  notes: 'Replaced hydraulic seals'
};

const updatedWorkOrder = await databaseService.updateWorkOrder(
  workOrderId,
  updateData,
  userId,
  organizationId
);
```

### Delete Work Order (Soft Delete)
```typescript
const result = await databaseService.deleteWorkOrder(
  workOrderId,
  userId,
  organizationId
);
```

### Get Work Order by ID
```typescript
const workOrder = await databaseService.getWorkOrderById(
  workOrderId,
  organizationId
);
```

## Health Monitoring

### Health Check Results
```typescript
interface DatabaseHealthStatus {
  healthy: boolean;
  responseTime?: number;         // Query response time in ms
  activeConnections?: number;    // Active database connections
  tableCount?: number;           // Number of tables in schema
  longRunningQueries?: number;   // Queries running >30 seconds
  timestamp: Date;               // Health check timestamp
  error?: string;                // Error message if unhealthy
  metrics?: PerformanceMetrics;  // Performance statistics
}

// Example health check
const health = await databaseService.performHealthCheck();
if (health.healthy) {
  console.log(`Database healthy, response time: ${health.responseTime}ms`);
} else {
  console.error(`Database unhealthy: ${health.error}`);
}
```

### Performance Metrics
```typescript
interface PerformanceMetrics {
  connectionCount: number;       // Total connections made
  queryCount: number;            // Total queries executed
  totalQueryTime: number;        // Total time spent on queries
  errorCount: number;            // Number of query errors
  slowQueryCount: number;        // Queries taking >1 second
  connectionRetries: number;     // Connection retry attempts
  averageQueryTime: number;      // Average query execution time
}

// Get performance metrics
const metrics = databaseService.getPerformanceMetrics();
console.log(`Average query time: ${metrics.averageQueryTime}ms`);
console.log(`Slow queries: ${metrics.slowQueryCount}`);
```

## Search and Filtering

### Available Search Options
```typescript
interface SearchOptions {
  query?: string;              // Full-text search term
  status?: string;             // Work order status filter
  priority?: string;           // Priority level filter
  organizationId: string;      // Required organization context
  limit?: number;              // Results per page (default: 10, max: 100)
  offset?: number;             // Pagination offset
  sortBy?: string;             // Sort field name
  sortOrder?: 'asc' | 'desc';  // Sort direction
}
```

### Search Implementation
The service automatically:
- Filters by organization for multi-tenancy
- Excludes soft-deleted records
- Applies full-text search across multiple fields
- Handles pagination and sorting
- Transforms field names between camelCase and snake_case

## Multi-Tenant Security

### Organization Isolation
All operations require organizationId and automatically filter data:

```typescript
// ✅ Correct - includes organization context
const workOrders = await databaseService.searchWorkOrders({
  organizationId: 'user-org-uuid',
  query: 'pump repair'
});

// ❌ Wrong - missing organization context will throw error
const workOrders = await databaseService.searchWorkOrders({
  query: 'pump repair'  // Missing organizationId
});
```

### Audit Trail
All operations automatically include audit information:
- `created_by` / `updated_by` - User performing the action
- `created_at` / `updated_at` - Timestamp of the action
- Organization context for all operations

## Performance Optimization

### Query Monitoring
```typescript
// Queries are automatically monitored
// Slow queries (>1 second) are logged and counted
const result = await databaseService.executeQuery(
  async () => {
    // Your database operation
    return complexQuery();
  },
  'complex report generation',  // Context for logging
  organizationId
);
```

### Database Optimization
```typescript
// Run database maintenance
await databaseService.optimizePerformance();
// Executes ANALYZE and VACUUM commands
```

### Performance Monitoring
```typescript
// Reset metrics for monitoring period
databaseService.resetMetrics();

// ... application runs ...

// Check performance after period
const metrics = databaseService.getPerformanceMetrics();
if (metrics.averageQueryTime > 500) {
  console.warn('Database performance degraded');
}
```

## Field Mapping Integration

The database service automatically handles field transformations:

### API Input Processing
```typescript
// Frontend sends camelCase
const apiData = {
  foNumber: 'WO-001',
  equipmentId: 'uuid-here',
  organizationId: 'org-uuid'
};

// Database service transforms to snake_case for storage
// fo_number, equipment_id, organization_id
```

### Database Output Processing
```typescript
// Database returns snake_case
const dbResult = {
  fo_number: 'WO-001',
  equipment_id: 'uuid-here',
  created_at: '2025-08-07T12:00:00Z'
};

// Database service transforms to camelCase for API
// foNumber, equipmentId, createdAt
```

## Error Handling

### Query Errors
```typescript
try {
  const result = await databaseService.getWorkOrderById(id, orgId);
} catch (error) {
  if (error.message === 'Work order not found or access denied') {
    // Handle not found or authorization error
  }
  // Other database errors
}
```

### Connection Errors
The service automatically:
- Retries failed connections
- Logs connection issues
- Provides health status via monitoring

## Health Monitoring Setup

### Automatic Monitoring
```typescript
// Service automatically starts health monitoring
// Checks every 30 seconds in background
// Logs health issues to console
```

### Manual Health Checks
```typescript
// Get current health status
const health = await databaseService.performHealthCheck();

// Stop automatic monitoring (if needed)
databaseService.stopHealthMonitoring();
```

## Configuration

### Environment Variables
```env
# Database connection
DATABASE_URL=postgres://user:pass@host:port/database

# Performance tuning
DB_POOL_SIZE=20
DB_IDLE_TIMEOUT=30
DB_CONNECT_TIMEOUT=10

# Monitoring
DB_HEALTH_CHECK_INTERVAL=30000
DB_SLOW_QUERY_THRESHOLD=1000
```

### Service Configuration
```typescript
// Service initializes automatically in production
// Manual initialization for development:
await databaseService.initialize();

// Performance monitoring
const metrics = databaseService.getPerformanceMetrics();
databaseService.resetMetrics();

// Health monitoring
databaseService.stopHealthMonitoring();
```

## Best Practices

1. **Organization Context**: Always include organizationId for multi-tenant operations
2. **Error Handling**: Wrap database calls in try-catch blocks
3. **Performance**: Monitor slow queries and optimize as needed
4. **Health Checks**: Use health monitoring for production deployments
5. **Audit Trails**: Include userId for all write operations
6. **Pagination**: Use appropriate limits for list operations
7. **Field Mapping**: Trust the service to handle camelCase ↔ snake_case conversion

## Integration Example

```typescript
import { databaseService } from '../services/database.service';

export class WorkOrderController {
  async create(req: Request, res: Response) {
    try {
      // Service handles field mapping automatically
      const workOrder = await databaseService.createWorkOrder(
        req.validatedBody,    // camelCase input
        req.user.id,
      );
      
      // Returns camelCase output
      res.status(201).json({
        success: true,
        data: workOrder
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const results = await databaseService.searchWorkOrders({
        ...req.validatedQuery,
        organizationId: req.organizationId
      });
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
```
