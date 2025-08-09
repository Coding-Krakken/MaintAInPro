import { db } from '../db';
import { logger } from './enhanced-logging.service';

/**
 * Enhanced Database Performance and Optimization Service
 *
 * Provides:
 * - Index optimization and monitoring
 * - Query performance analysis
 * - Connection pool management
 * - Cache optimization
 * - Database health monitoring
 * - Automatic tuning recommendations
 */

export interface IndexOptimization {
  tableName: string;
  indexName: string;
  columns: string[];
  indexType: 'btree' | 'gin' | 'gist' | 'hash' | 'composite';
  purpose: string;
  sql: string;
  estimated_improvement: string;
}

export interface QueryPerformanceStats {
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  rows: number;
  hit_percent: number;
}

export interface DatabaseHealthMetrics {
  connection_count: number;
  active_connections: number;
  idle_connections: number;
  database_size: string;
  cache_hit_ratio: number;
  index_hit_ratio: number;
  slow_queries_count: number;
  lock_waits: number;
  deadlocks: number;
}

class DatabasePerformanceService {
  private readonly serviceName = 'DatabasePerformanceService';

  /**
   * Apply comprehensive database optimizations
   */
  async applyOptimizations(): Promise<{ applied: number; errors: string[] }> {
    logger.info('Starting database optimizations', { service: this.serviceName });

    const optimizations = this.getOptimizationStrategies();
    let applied = 0;
    const errors: string[] = [];

    for (const optimization of optimizations) {
      try {
        logger.debug(`Applying optimization: ${optimization.indexName}`, {
          service: this.serviceName,
          table: optimization.tableName,
        });

        await db.execute(optimization.sql);
        applied++;

        logger.info(`Successfully applied optimization: ${optimization.indexName}`, {
          service: this.serviceName,
          table: optimization.tableName,
          purpose: optimization.purpose,
        });
      } catch (error: any) {
        // Index might already exist, that's okay
        if (error.message?.includes('already exists')) {
          logger.debug(`Optimization already exists: ${optimization.indexName}`, {
            service: this.serviceName,
          });
          applied++;
        } else {
          const errorMsg = `Failed to apply ${optimization.indexName}: ${error.message}`;
          errors.push(errorMsg);
          logger.warn('Optimization failed', {
            service: this.serviceName,
            error: errorMsg,
            indexName: optimization.indexName,
          });
        }
      }
    }

    logger.info('Database optimizations completed', {
      service: this.serviceName,
      applied,
      errors: errors.length,
    });

    return { applied, errors };
  }

  /**
   * Get comprehensive optimization strategies
   */
  private getOptimizationStrategies(): IndexOptimization[] {
    return [
      // Work Orders optimizations
      {
        tableName: 'work_orders',
        indexName: 'idx_work_orders_warehouse_status',
        columns: ['warehouse_id', 'status'],
        indexType: 'composite',
        purpose: 'Optimize work order filtering by warehouse and status',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_warehouse_status ON work_orders (warehouse_id, status);',
        estimated_improvement: '40-60% faster status-based queries',
      },
      {
        tableName: 'work_orders',
        indexName: 'idx_work_orders_priority_due_date',
        columns: ['priority', 'due_date'],
        indexType: 'composite',
        purpose: 'Optimize priority-based scheduling queries',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_priority_due_date ON work_orders (priority, due_date);',
        estimated_improvement: '50-70% faster scheduling queries',
      },
      {
        tableName: 'work_orders',
        indexName: 'idx_work_orders_assigned_to_status',
        columns: ['assigned_to', 'status'],
        indexType: 'composite',
        purpose: 'Optimize user workload queries',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_assigned_to_status ON work_orders (assigned_to, status);',
        estimated_improvement: '60-80% faster user workload queries',
      },
      {
        tableName: 'work_orders',
        indexName: 'idx_work_orders_equipment_created_at',
        columns: ['equipment_id', 'created_at'],
        indexType: 'composite',
        purpose: 'Optimize equipment maintenance history',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_equipment_created_at ON work_orders (equipment_id, created_at DESC);',
        estimated_improvement: '70-90% faster maintenance history queries',
      },

      // Equipment optimizations
      {
        tableName: 'equipment',
        indexName: 'idx_equipment_warehouse_status_criticality',
        columns: ['warehouse_id', 'status', 'criticality'],
        indexType: 'composite',
        purpose: 'Optimize equipment dashboard queries',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_warehouse_status_criticality ON equipment (warehouse_id, status, criticality);',
        estimated_improvement: '50-70% faster dashboard loading',
      },
      {
        tableName: 'equipment',
        indexName: 'idx_equipment_asset_tag_gin',
        columns: ['asset_tag'],
        indexType: 'gin',
        purpose: 'Fast text search on asset tags',
        sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_asset_tag_gin ON equipment USING gin (to_tsvector('english', asset_tag));",
        estimated_improvement: '80-95% faster asset tag searches',
      },

      // Parts optimizations
      {
        tableName: 'parts',
        indexName: 'idx_parts_warehouse_category_active',
        columns: ['warehouse_id', 'category', 'active'],
        indexType: 'composite',
        purpose: 'Optimize parts inventory filtering',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_warehouse_category_active ON parts (warehouse_id, category, active);',
        estimated_improvement: '40-60% faster inventory queries',
      },
      {
        tableName: 'parts',
        indexName: 'idx_parts_stock_reorder',
        columns: ['stock_level', 'reorder_point'],
        indexType: 'composite',
        purpose: 'Optimize low stock alerts',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_stock_reorder ON parts (stock_level, reorder_point) WHERE stock_level <= reorder_point;',
        estimated_improvement: '90% faster low stock detection',
      },

      // User and profile optimizations
      {
        tableName: 'profiles',
        indexName: 'idx_profiles_warehouse_role_active',
        columns: ['warehouse_id', 'role', 'active'],
        indexType: 'composite',
        purpose: 'Optimize user management queries',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_warehouse_role_active ON profiles (warehouse_id, role, active);',
        estimated_improvement: '50-70% faster user lookups',
      },

      // Notification optimizations
      {
        tableName: 'notifications',
        indexName: 'idx_notifications_user_read_created',
        columns: ['user_id', 'read', 'created_at'],
        indexType: 'composite',
        purpose: 'Optimize notification delivery and marking as read',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read_created ON notifications (user_id, read, created_at DESC);',
        estimated_improvement: '70-90% faster notification queries',
      },

      // System logs optimizations
      {
        tableName: 'system_logs',
        indexName: 'idx_system_logs_created_user_action',
        columns: ['created_at', 'user_id', 'action'],
        indexType: 'composite',
        purpose: 'Optimize audit log queries',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_created_user_action ON system_logs (created_at DESC, user_id, action);',
        estimated_improvement: '60-80% faster audit queries',
      },

      // Session and security optimizations
      {
        tableName: 'user_sessions',
        indexName: 'idx_user_sessions_user_active_expires',
        columns: ['user_id', 'is_active', 'expires_at'],
        indexType: 'composite',
        purpose: 'Optimize session validation',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_active_expires ON user_sessions (user_id, is_active, expires_at);',
        estimated_improvement: '80-95% faster session validation',
      },
    ];
  }

  /**
   * Get database health metrics
   */
  async getDatabaseHealthMetrics(): Promise<DatabaseHealthMetrics> {
    try {
      logger.debug('Fetching database health metrics', { service: this.serviceName });

      const [
        connectionResult,
        cacheHitResult,
        indexHitResult,
        databaseSizeResult,
        slowQueriesResult,
        lockStatsResult,
      ] = await Promise.allSettled([
        this.getConnectionStats(),
        this.getCacheHitRatio(),
        this.getIndexHitRatio(),
        this.getDatabaseSize(),
        this.getSlowQueriesCount(),
        this.getLockStats(),
      ]);

      const connectionStats =
        connectionResult.status === 'fulfilled' ? connectionResult.value : null;
      const cacheHitRatio = cacheHitResult.status === 'fulfilled' ? cacheHitResult.value : 0;
      const indexHitRatio = indexHitResult.status === 'fulfilled' ? indexHitResult.value : 0;
      const databaseSize =
        databaseSizeResult.status === 'fulfilled' ? databaseSizeResult.value : 'Unknown';
      const slowQueriesCount =
        slowQueriesResult.status === 'fulfilled' ? slowQueriesResult.value : 0;
      const lockStats = lockStatsResult.status === 'fulfilled' ? lockStatsResult.value : null;

      const metrics: DatabaseHealthMetrics = {
        connection_count: connectionStats?.total || 0,
        active_connections: connectionStats?.active || 0,
        idle_connections: connectionStats?.idle || 0,
        database_size: databaseSize,
        cache_hit_ratio: cacheHitRatio,
        index_hit_ratio: indexHitRatio,
        slow_queries_count: slowQueriesCount,
        lock_waits: lockStats?.lock_waits || 0,
        deadlocks: lockStats?.deadlocks || 0,
      };

      logger.debug('Database health metrics retrieved', {
        service: this.serviceName,
        metrics,
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to get database health metrics', error, { service: this.serviceName });
      throw error;
    }
  }

  /**
   * Get query performance statistics
   */
  async getQueryPerformanceStats(): Promise<QueryPerformanceStats[]> {
    try {
      logger.debug('Fetching query performance stats', { service: this.serviceName });

      const result = await db.execute(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) as hit_percent
        FROM pg_stat_statements 
        WHERE calls > 5
        ORDER BY total_time DESC 
        LIMIT 20;
      `);

      const stats = result.rows as QueryPerformanceStats[];

      logger.debug('Query performance stats retrieved', {
        service: this.serviceName,
        count: stats.length,
      });

      return stats;
    } catch (error) {
      logger.warn('pg_stat_statements not available, using fallback', {
        service: this.serviceName,
      });
      return [];
    }
  }

  /**
   * Get connection statistics
   */
  private async getConnectionStats(): Promise<{ total: number; active: number; idle: number }> {
    const result = await db.execute(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `);

    return result.rows[0] as any;
  }

  /**
   * Get cache hit ratio
   */
  private async getCacheHitRatio(): Promise<number> {
    const result = await db.execute(`
      SELECT 
        round(
          100 * sum(blks_hit) / nullif(sum(blks_hit + blks_read), 0), 2
        ) as cache_hit_ratio
      FROM pg_stat_database 
      WHERE datname = current_database();
    `);

    return result.rows[0]?.cache_hit_ratio || 0;
  }

  /**
   * Get index hit ratio
   */
  private async getIndexHitRatio(): Promise<number> {
    const result = await db.execute(`
      SELECT 
        round(
          100 * sum(idx_blks_hit) / nullif(sum(idx_blks_hit + idx_blks_read), 0), 2
        ) as index_hit_ratio
      FROM pg_statio_user_indexes;
    `);

    return result.rows[0]?.index_hit_ratio || 0;
  }

  /**
   * Get database size
   */
  private async getDatabaseSize(): Promise<string> {
    const result = await db.execute(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
    `);

    return result.rows[0]?.database_size || 'Unknown';
  }

  /**
   * Get slow queries count
   */
  private async getSlowQueriesCount(): Promise<number> {
    try {
      const result = await db.execute(`
        SELECT count(*) as slow_queries
        FROM pg_stat_statements 
        WHERE mean_time > 1000;
      `);

      return result.rows[0]?.slow_queries || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get lock statistics
   */
  private async getLockStats(): Promise<{ lock_waits: number; deadlocks: number }> {
    const result = await db.execute(`
      SELECT 
        COALESCE(sum(blk_read_time + blk_write_time), 0) as lock_waits,
        COALESCE(sum(deadlocks), 0) as deadlocks
      FROM pg_stat_database 
      WHERE datname = current_database();
    `);

    return (result.rows[0] as any) || { lock_waits: 0, deadlocks: 0 };
  }

  /**
   * Analyze and recommend optimizations
   */
  async analyzePerformance(): Promise<{
    health: DatabaseHealthMetrics;
    recommendations: string[];
    criticalIssues: string[];
  }> {
    logger.info('Starting performance analysis', { service: this.serviceName });

    const health = await this.getDatabaseHealthMetrics();
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];

    // Analyze cache hit ratio
    if (health.cache_hit_ratio < 95) {
      if (health.cache_hit_ratio < 85) {
        criticalIssues.push(
          `Critical: Cache hit ratio is ${health.cache_hit_ratio}% (should be >95%)`
        );
      } else {
        recommendations.push(
          `Consider increasing shared_buffers. Cache hit ratio: ${health.cache_hit_ratio}%`
        );
      }
    }

    // Analyze index hit ratio
    if (health.index_hit_ratio < 99) {
      recommendations.push(`Review index usage. Index hit ratio: ${health.index_hit_ratio}%`);
    }

    // Analyze connections
    if (health.active_connections > 80) {
      criticalIssues.push(`High connection count: ${health.active_connections} active connections`);
    } else if (health.active_connections > 50) {
      recommendations.push(
        `Monitor connection pool usage: ${health.active_connections} active connections`
      );
    }

    // Analyze slow queries
    if (health.slow_queries_count > 10) {
      criticalIssues.push(
        `${health.slow_queries_count} slow queries detected (>1s execution time)`
      );
    } else if (health.slow_queries_count > 5) {
      recommendations.push(`${health.slow_queries_count} slow queries need optimization`);
    }

    // Analyze locks and deadlocks
    if (health.lock_waits > 1000) {
      criticalIssues.push(`High lock wait time detected: ${health.lock_waits}ms`);
    }

    if (health.deadlocks > 0) {
      criticalIssues.push(`${health.deadlocks} deadlocks detected - review transaction patterns`);
    }

    logger.info('Performance analysis completed', {
      service: this.serviceName,
      recommendations: recommendations.length,
      criticalIssues: criticalIssues.length,
    });

    return { health, recommendations, criticalIssues };
  }

  /**
   * Vacuum and analyze critical tables
   */
  async maintenanceCleanup(): Promise<{ completed: string[]; errors: string[] }> {
    logger.info('Starting database maintenance cleanup', { service: this.serviceName });

    const tables = [
      'work_orders',
      'equipment',
      'parts',
      'profiles',
      'notifications',
      'system_logs',
    ];
    const completed: string[] = [];
    const errors: string[] = [];

    for (const table of tables) {
      try {
        logger.debug(`Running VACUUM ANALYZE on table: ${table}`, { service: this.serviceName });

        await db.execute(`VACUUM ANALYZE ${table};`);
        completed.push(table);

        logger.debug(`Completed VACUUM ANALYZE on table: ${table}`, { service: this.serviceName });
      } catch (error: any) {
        const errorMsg = `Failed to vacuum table ${table}: ${error.message}`;
        errors.push(errorMsg);
        logger.warn('Table vacuum failed', {
          service: this.serviceName,
          table,
          error: errorMsg,
        });
      }
    }

    logger.info('Database maintenance cleanup completed', {
      service: this.serviceName,
      completed: completed.length,
      errors: errors.length,
    });

    return { completed, errors };
  }
}

// Create singleton instance
export const databaseOptimizer = new DatabasePerformanceService();

export default databaseOptimizer;
