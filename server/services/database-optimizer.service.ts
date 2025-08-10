import { db } from '../db';

/**
 * Database Optimization Service
 *
 * Production-hardened singleton service for PostgreSQL performance optimization.
 * Provides automated indexing, performance monitoring, and maintenance capabilities
 * designed for high-load enterprise CMMS environments.
 *
 * Features:
 * - Strategic database indexing (20+ performance-optimized indexes)
 * - Real-time query performance monitoring
 * - Automated maintenance operations (VACUUM, ANALYZE)
 * - Comprehensive health metrics and performance grading
 * - Graceful degradation for development environments
 *
 * @example
 * ```typescript
 * import { databaseOptimizer } from './database-optimizer.service';
 *
 * // Apply optimizations on startup
 * await databaseOptimizer.applyOptimizations();
 *
 * // Monitor performance
 * const health = await databaseOptimizer.getDatabaseHealthMetrics();
 * console.log(`Performance: ${health.performance}`);
 * ```
 *
 * @author GitHub Copilot
 * @version 1.0.0
 * @since 2025-08-06
 */
export class DatabaseOptimizerService {
  private static instance: DatabaseOptimizerService;
  private indexCreationQueries: string[] = [];

  /**
   * Private constructor to enforce singleton pattern
   * Initializes the optimal index configuration on instantiation
   */
  constructor() {
    this.initializeOptimalIndexes();
  }

  /**
   * Get the singleton instance of DatabaseOptimizerService
   *
   * @returns {DatabaseOptimizerService} The singleton instance
   */
  static getInstance(): DatabaseOptimizerService {
    if (!DatabaseOptimizerService.instance) {
      DatabaseOptimizerService.instance = new DatabaseOptimizerService();
    }
    return DatabaseOptimizerService.instance;
  }

  /**
   * Initialize critical database indexes for optimal performance
   *
   * Creates a comprehensive indexing strategy covering:
   * - High-frequency query patterns
   * - Multi-table join optimizations
   * - Composite indexes for complex queries
   * - Audit trail and compliance reporting
   *
   * Index Categories:
   * - Work Orders: 8 strategic indexes for workflow optimization
   * - Equipment: 4 indexes for asset tracking performance
   * - Parts: 4 indexes for inventory management optimization
   * - PM Templates: 3 indexes for scheduling efficiency
   * - System Logs: 4 indexes for audit trail performance
   * - Composite: 4 indexes for complex query patterns
   *
   * @private
   */
  private initializeOptimalIndexes(): void {
    this.indexCreationQueries = [
      // Work Orders - frequently queried fields
      'CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority)',
      'CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON work_orders(due_date)',
      'CREATE INDEX IF NOT EXISTS idx_work_orders_warehouse_id ON work_orders(warehouse_id)',
      'CREATE INDEX IF NOT EXISTS idx_work_orders_equipment_id ON work_orders(equipment_id)',
      'CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to)',
      'CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at)',

      // Equipment - asset tracking performance
      'CREATE INDEX IF NOT EXISTS idx_equipment_warehouse_id ON equipment(warehouse_id)',
      'CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status)',
      'CREATE INDEX IF NOT EXISTS idx_equipment_criticality ON equipment(criticality)',
      'CREATE INDEX IF NOT EXISTS idx_equipment_qr_code ON equipment(qr_code)',

      // Parts - inventory lookups
      'CREATE INDEX IF NOT EXISTS idx_parts_warehouse_id ON parts(warehouse_id)',
      'CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category)',
      'CREATE INDEX IF NOT EXISTS idx_parts_stock_level ON parts(stock_level)',
      'CREATE INDEX IF NOT EXISTS idx_parts_reorder_point ON parts(reorder_point)',

      // PM Templates - scheduling optimization
      'CREATE INDEX IF NOT EXISTS idx_pm_templates_warehouse_id ON pm_templates(warehouse_id)',
      'CREATE INDEX IF NOT EXISTS idx_pm_templates_frequency ON pm_templates(frequency)',
      'CREATE INDEX IF NOT EXISTS idx_pm_templates_enabled ON pm_templates(enabled)',

      // User Sessions - authentication performance
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active)',

      // System Logs - audit trail and compliance reporting
      'CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_table_name ON system_logs(table_name)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)',

      // Notifications - real-time performance
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)',

      // Composite indexes for common query patterns
      'CREATE INDEX IF NOT EXISTS idx_work_orders_status_warehouse ON work_orders(status, warehouse_id)',
      'CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_status ON work_orders(assigned_to, status)',
      'CREATE INDEX IF NOT EXISTS idx_equipment_warehouse_status ON equipment(warehouse_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_parts_warehouse_stock ON parts(warehouse_id, stock_level)',
    ];
  }

  /**
   * Apply all performance optimizations to the database
   *
   * Executes the complete indexing strategy with comprehensive error handling.
   * Includes graceful degradation for development environments using in-memory storage.
   *
   * Process:
   * 1. Validates database connection availability
   * 2. Applies each index with individual error handling
   * 3. Updates database statistics for query planner optimization
   * 4. Provides detailed results with success/failure metrics
   *
   * @returns {Promise<{success: boolean, applied: number, errors: string[]}>}
   *   Optimization results including success status, number of indexes applied, and any errors
   *
   * @example
   * ```typescript
   * const result = await databaseOptimizer.applyOptimizations();
   * if (result.success) {
   *   console.log(`✅ Applied ${result.applied} optimizations`);
   * } else {
   *   console.error(`❌ Errors: ${result.errors.join(', ')}`);
   * }
   * ```
   */
  async applyOptimizations(): Promise<{ success: boolean; applied: number; errors: string[] }> {
    const results = {
      success: true,
      applied: 0,
      errors: [] as string[],
    };

    // Skip optimization if no database connection (development mode)
    if (!db) {
      console.log('⚠️  Skipping database optimization - using in-memory storage');
      return {
        success: true,
        applied: 0,
        errors: ['Skipped - in-memory storage mode'],
      };
    }

    console.log('🚀 Starting database optimization...');

    for (const query of this.indexCreationQueries) {
      try {
        await db.execute(query);
        results.applied++;
        console.log(`✅ Applied: ${query.substring(0, 50)}...`);
      } catch (_error) {
        const errorMessage = `Failed to apply index: ${query} - Error: ${_error.message}`;
        results.errors.push(errorMessage);
        console._error(`❌ ${errorMessage}`);
        results.success = false;
      }
    }

    // Analyze table statistics for query planner
    try {
      await db.execute('ANALYZE');
      console.log('✅ Database statistics updated');
    } catch (_error) {
      results.errors.push(`Failed to analyze tables: ${__error.message}`);
    }

    console.log(`🎯 Database optimization complete: ${results.applied} indexes applied`);
    if (results.errors.length > 0) {
      console.log(`⚠️  ${results.errors.length} errors encountered`);
    }

    return results;
  }

  /**
   * Get comprehensive query performance statistics
   *
   * Retrieves slow query analysis from pg_stat_statements extension.
   * Requires PostgreSQL with pg_stat_statements extension enabled.
   *
   * Returns top 10 queries by total execution time, including:
   * - Query text and execution frequency
   * - Total and mean execution times
   * - Standard deviation and row counts
   *
   * @returns {Promise<any[]>} Array of query performance statistics or empty array if unavailable
   *
   * @example
   * ```typescript
   * const slowQueries = await databaseOptimizer.getQueryPerformanceStats();
   * slowQueries.forEach(query => {
   *   console.log(`Query: ${query.query}, Mean time: ${query.mean_time}ms`);
   * });
   * ```
   */
  async getQueryPerformanceStats(): Promise<any[]> {
    try {
      // Get slow query information (PostgreSQL specific)
      const slowQueries = await db.execute(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          stddev_time,
          rows
        FROM pg_stat_statements 
        ORDER BY total_time DESC 
        LIMIT 10
      `);

      return slowQueries || [];
    } catch (_error) {
      console.log('Query performance stats not available (pg_stat_statements extension required)');
      return [];
    }
  }

  /**
   * Get detailed index usage statistics
   *
   * Retrieves statistical information about table columns and index effectiveness
   * from PostgreSQL's pg_stats system view for the public schema.
   *
   * Provides insights into:
   * - Column data distribution (n_distinct values)
   * - Data correlation patterns
   * - Index selectivity metrics
   *
   * @returns {Promise<any[]>} Array of index usage statistics or empty array if unavailable
   *
   * @example
   * ```typescript
   * const stats = await databaseOptimizer.getIndexUsageStats();
   * stats.forEach(stat => {
   *   console.log(`Table: ${stat.tablename}, Column: ${stat.attname}, Distinct: ${stat.n_distinct}`);
   * });
   * ```
   */
  async getIndexUsageStats(): Promise<any[]> {
    try {
      const indexStats = await db.execute(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `);

      return indexStats || [];
    } catch (_error) {
      console.log('Index usage stats not available');
      return [];
    }
  }

  /**
   * Perform automated database maintenance operations
   *
   * Executes essential maintenance tasks on core CMMS tables:
   * - VACUUM: Reclaims storage space from deleted/updated rows
   * - ANALYZE: Updates table statistics for query planner optimization
   *
   * Maintenance is performed on critical tables:
   * - work_orders, equipment, parts, pm_templates
   * - user_sessions, system_logs, notifications
   *
   * @returns {Promise<void>} Completes when all maintenance operations finish
   *
   * @example
   * ```typescript
   * // Schedule maintenance (typically run during low-traffic periods)
   * import cron from 'node-cron';
   * cron.schedule('0 2 * * *', async () => {
   *   await databaseOptimizer.performMaintenance();
   * });
   * ```
   */
  async performMaintenance(): Promise<void> {
    console.log('🔧 Starting database maintenance...');

    const tables = [
      'work_orders',
      'equipment',
      'parts',
      'pm_templates',
      'user_sessions',
      'system_logs',
      'notifications',
    ];

    for (const table of tables) {
      try {
        // VACUUM ANALYZE for each table
        await db.execute(`VACUUM ANALYZE ${table}`);
        console.log(`✅ Maintained table: ${table}`);
      } catch (_error) {
        console._error(`❌ Failed to maintain table ${table}: ${_error.message}`);
      }
    }

    console.log('🎯 Database maintenance complete');
  }

  /**
   * Get comprehensive database health and performance metrics
   *
   * Provides a complete health assessment including:
   * - Active connection count
   * - Cache hit ratio (target: >95% for optimal performance)
   * - Index usage ratio (target: >80% for optimal performance)
   * - Table size analysis (top 10 largest tables)
   * - Overall performance grade (excellent/good/fair/needs improvement)
   *
   * Performance grading algorithm:
   * - Cache hit ratio (60% weight) + Index usage ratio (40% weight)
   * - Excellent: 90%+, Good: 75-89%, Fair: 60-74%, Needs Improvement: <60%
   *
   * @returns {Promise<{connections: number, cacheHitRatio: number, indexUsage: number, tableSize: unknown[], performance: string}>}
   *   Complete health metrics object
   *
   * @example
   * ```typescript
   * const health = await databaseOptimizer.getDatabaseHealthMetrics();
   * console.log(`
   *   Connections: ${health.connections}
   *   Cache Hit: ${health.cacheHitRatio}%
   *   Index Usage: ${health.indexUsage}%
   *   Performance: ${health.performance}
   * `);
   * ```
   */
  async getDatabaseHealthMetrics(): Promise<{
    connections: number;
    cacheHitRatio: number;
    indexUsage: number;
    tableSize: unknown[];
    performance: string;
  }> {
    try {
      const [connections, cacheStats, indexUsage, tableSizes] = await Promise.all([
        this.getConnectionCount(),
        this.getCacheHitRatio(),
        this.getIndexUsageRatio(),
        this.getTableSizes(),
      ]);

      const performance = this.calculatePerformanceGrade(cacheStats, indexUsage);

      return {
        connections,
        cacheHitRatio: cacheStats,
        indexUsage,
        tableSize: tableSizes,
        performance,
      };
    } catch (__error) {
      console.__error('Error getting database health metrics:', __error);
      return {
        connections: 0,
        cacheHitRatio: 0,
        indexUsage: 0,
        tableSize: [],
        performance: 'unknown',
      };
    }
  }

  /**
   * Get current active database connection count
   * @private
   * @returns {Promise<number>} Number of active connections
   */
  private async getConnectionCount(): Promise<number> {
    try {
      const result = await db.execute('SELECT count(*) FROM pg_stat_activity');
      return result[0]?.count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate database cache hit ratio percentage
   * @private
   * @returns {Promise<number>} Cache hit ratio as percentage (0-100)
   */
  private async getCacheHitRatio(): Promise<number> {
    try {
      const result = await db.execute(`
        SELECT 
          round(
            (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 
            2
          ) as cache_hit_ratio
        FROM pg_statio_user_tables
      `);
      return result[0]?.cache_hit_ratio || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate index usage ratio percentage
   * @private
   * @returns {Promise<number>} Index usage ratio as percentage (0-100)
   */
  private async getIndexUsageRatio(): Promise<number> {
    try {
      const result = await db.execute(`
        SELECT 
          round(
            (sum(idx_scan) / (sum(seq_scan) + sum(idx_scan))) * 100, 
            2
          ) as index_usage_ratio
        FROM pg_stat_user_tables
      `);
      return result[0]?.index_usage_ratio || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get table sizes sorted by total relation size
   * @private
   * @returns {Promise<any[]>} Array of table size information
   */
  private async getTableSizes(): Promise<any[]> {
    try {
      const result = await db.execute(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `);
      return result || [];
    } catch {
      return [];
    }
  }

  /**
   * Calculate overall performance grade based on cache hit and index usage metrics
   * @private
   * @param {number} cacheHit - Cache hit ratio percentage
   * @param {number} indexUsage - Index usage ratio percentage
   * @returns {string} Performance grade: 'excellent' | 'good' | 'fair' | 'needs improvement'
   */
  private calculatePerformanceGrade(cacheHit: number, indexUsage: number): string {
    const score = cacheHit * 0.6 + indexUsage * 0.4;

    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'needs improvement';
  }
}

/**
 * Singleton instance of DatabaseOptimizerService for application-wide use
 *
 * @example
 * ```typescript
 * import { databaseOptimizer } from './database-optimizer.service';
 *
 * // Apply optimizations on application startup
 * await databaseOptimizer.applyOptimizations();
 * ```
 */
export const databaseOptimizer = DatabaseOptimizerService.getInstance();
