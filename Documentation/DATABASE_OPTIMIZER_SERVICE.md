# Database Optimization Service Documentation

## Overview
The `DatabaseOptimizerService` is a production-hardened singleton service designed for high-performance PostgreSQL database optimization in enterprise CMMS environments. It provides automated indexing, performance monitoring, and maintenance capabilities for scalable operations.

## Architecture

### Singleton Pattern Implementation
```typescript
class DatabaseOptimizerService {
  private static instance: DatabaseOptimizerService;
  
  static getInstance(): DatabaseOptimizerService {
    if (!DatabaseOptimizerService.instance) {
      DatabaseOptimizerService.instance = new DatabaseOptimizerService();
    }
    return DatabaseOptimizerService.instance;
  }
}
```

### Core Features
- **Strategic Index Management**: 20+ performance-optimized indexes
- **Query Performance Monitoring**: Real-time statistics tracking
- **Automated Maintenance**: VACUUM, ANALYZE, and REINDEX operations
- **Health Metrics**: Comprehensive database performance assessment

## Index Strategy

### Primary Entity Indexes
```sql
-- Work Orders (High-frequency queries)
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_warehouse_id ON work_orders(warehouse_id);
CREATE INDEX idx_work_orders_due_date ON work_orders(due_date);

-- Equipment (Asset tracking)
CREATE INDEX idx_equipment_warehouse_id ON equipment(warehouse_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_criticality ON equipment(criticality);

-- Parts (Inventory optimization)
CREATE INDEX idx_parts_warehouse_id ON parts(warehouse_id);
CREATE INDEX idx_parts_stock_level ON parts(stock_level);
CREATE INDEX idx_parts_reorder_point ON parts(reorder_point);
```

### Composite Indexes for Query Patterns
```sql
-- Multi-column optimization
CREATE INDEX idx_work_orders_status_warehouse ON work_orders(status, warehouse_id);
CREATE INDEX idx_work_orders_assigned_status ON work_orders(assigned_to, status);
CREATE INDEX idx_equipment_warehouse_status ON equipment(warehouse_id, status);
```

## API Reference

### Core Methods

#### `applyOptimizations()`
Applies all performance indexes to the database.

**Returns**: `Promise<{ success: boolean; applied: number; errors: string[] }>`

```typescript
const result = await databaseOptimizer.applyOptimizations();
console.log(`Applied ${result.applied} indexes`);
```

#### `getDatabaseHealthMetrics()`
Retrieves comprehensive database performance metrics.

**Returns**: `Promise<{ connections: number; cacheHitRatio: number; indexUsage: number; tableSize: any[]; performance: string }>`

```typescript
const health = await databaseOptimizer.getDatabaseHealthMetrics();
console.log(`Performance grade: ${health.performance}`);
```

#### `performMaintenance()`
Executes database maintenance operations (VACUUM ANALYZE).

**Returns**: `Promise<void>`

```typescript
await databaseOptimizer.performMaintenance();
```

#### `getQueryPerformanceStats()`
Retrieves slow query analysis (requires pg_stat_statements extension).

**Returns**: `Promise<any[]>`

```typescript
const slowQueries = await databaseOptimizer.getQueryPerformanceStats();
```

## Performance Metrics

### Cache Hit Ratio Calculation
```sql
SELECT round(
  (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 2
) as cache_hit_ratio
FROM pg_statio_user_tables
```

### Index Usage Ratio
```sql
SELECT round(
  (sum(idx_scan) / (sum(seq_scan) + sum(idx_scan))) * 100, 2
) as index_usage_ratio
FROM pg_stat_user_tables
```

### Performance Grading
- **Excellent**: 90%+ overall score
- **Good**: 75-89% overall score  
- **Fair**: 60-74% overall score
- **Needs Improvement**: <60% overall score

## Production Deployment

### Environment Compatibility
- **Development**: In-memory storage mode (graceful fallback)
- **Production**: Full PostgreSQL optimization
- **Testing**: Mock-compatible for unit tests

### Error Handling
```typescript
// Graceful degradation for missing database
if (!db) {
  console.log('⚠️  Skipping database optimization - using in-memory storage');
  return { success: true, applied: 0, errors: ['Skipped - in-memory storage mode'] };
}
```

### Logging Strategy
- **✅ Success**: Applied index confirmations
- **❌ Errors**: Detailed error messages with context
- **⚠️ Warnings**: Non-critical issues and fallbacks
- **🎯 Summary**: Operation completion status

## Integration Points

### Service Registration
```typescript
import { databaseOptimizer } from '../services/database-optimizer.service';

// Apply optimizations on startup
await databaseOptimizer.applyOptimizations();
```

### Health Check Integration
```typescript
// Add to health check endpoint
app.get('/health/database', async (req, res) => {
  const metrics = await databaseOptimizer.getDatabaseHealthMetrics();
  res.json(metrics);
});
```

### Scheduled Maintenance
```typescript
// Cron job integration
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  await databaseOptimizer.performMaintenance();
});
```

## Monitoring & Alerts

### Key Metrics to Track
- **Cache Hit Ratio**: Should be >95% in production
- **Index Usage**: Should be >80% for optimal performance
- **Connection Count**: Monitor for connection pool health
- **Table Sizes**: Track growth patterns for capacity planning

### Alert Thresholds
```typescript
const alerts = {
  cacheHitRatio: { warning: 90, critical: 85 },
  indexUsage: { warning: 70, critical: 60 },
  connections: { warning: 80, critical: 95 },
  performance: { warning: 'fair', critical: 'needs improvement' }
};
```

## Security Considerations

### SQL Injection Prevention
- All queries use parameterized statements
- No dynamic SQL construction from user input
- Predefined index creation templates

### Access Control
- Requires database admin privileges for index creation
- Operates with service account credentials
- Audit trail through system_logs table

## Testing Strategy

### Unit Tests
```typescript
describe('DatabaseOptimizerService', () => {
  it('should handle missing database gracefully', async () => {
    const result = await optimizer.applyOptimizations();
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests
- Database connection validation
- Index creation verification
- Performance metric accuracy

## Troubleshooting

### Common Issues

#### Index Creation Failures
```typescript
// Check for conflicting indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'work_orders';
```

#### Performance Degradation
```typescript
// Analyze query performance
SELECT query, calls, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

#### Connection Issues
```typescript
// Check active connections
SELECT count(*) FROM pg_stat_activity;
```

---

**Author**: GitHub Copilot  
**Version**: 1.0.0  
**Last Updated**: August 6, 2025  
**Status**: Production Ready
