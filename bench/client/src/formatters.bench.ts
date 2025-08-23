/**
 * Benchmark for Client-Side Formatter Functions
 *
 * This benchmark establishes baseline performance metrics for formatting utility functions
 * that are frequently used throughout the client application. These functions are critical
 * for UI performance as they process data for display in work orders, equipment lists,
 * and dashboard components.
 *
 * Performance Targets (based on UI responsiveness requirements):
 * - Date formatting: < 1ms per operation
 * - Currency formatting: < 0.5ms per operation
 * - Number formatting: < 0.5ms per operation
 * - File size formatting: < 0.5ms per operation
 * - Duration formatting: < 0.5ms per operation
 *
 * Usage:
 * npm run bench:client:formatters
 * or: npx vitest bench bench/client/src/formatters.bench.ts
 */

import { bench, describe } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatTimeAgo,
  formatCurrency,
  formatNumber,
  formatFileSize,
  formatDuration,
  formatPercentage,
  formatWorkOrderNumber,
  truncateText,
  formatInventoryLevel,
} from '../../../client/src/utils/formatters';

describe('Client Formatter Performance Benchmarks', () => {
  // Setup test data for consistent benchmarking
  const testDates = [
    new Date('2024-01-15T10:30:00Z'),
    new Date('2024-06-20T14:45:30Z'),
    new Date('2023-12-01T08:15:45Z'),
    '2024-01-15T10:30:00Z',
    '2024-06-20T14:45:30.123Z',
    'invalid-date',
  ];

  const testNumbers = [123.456, 0, -45.67, 1000000, 0.001, NaN];
  const testCurrencies = [1299.99, 0, 150000, 0.99, -500.5];
  const testFileSizes = [0, 1024, 1048576, 1073741824, 500000];
  const testDurations = [0, 30, 120, 1440, 2880]; // minutes
  const testTexts = [
    'Short text',
    'This is a medium length text that might need truncation in some cases',
    'This is a very long text that definitely needs to be truncated when displayed in table cells or compact UI components where space is limited and we need to preserve readability',
  ];

  // Benchmark: Date formatting functions
  bench('formatDate - mixed date inputs', () => {
    testDates.forEach(date => {
      formatDate(date);
    });
  });

  bench('formatDate - string dates with custom format', () => {
    testDates.forEach(date => {
      formatDate(date, 'dd/MM/yyyy');
    });
  });

  bench('formatDateTime - mixed date inputs', () => {
    testDates.forEach(date => {
      formatDateTime(date);
    });
  });

  bench('formatTimeAgo - relative time formatting', () => {
    testDates.forEach(date => {
      formatTimeAgo(date);
    });
  });

  // Benchmark: Number and currency formatting
  bench('formatCurrency - USD formatting', () => {
    testCurrencies.forEach(amount => {
      formatCurrency(amount);
    });
  });

  bench('formatCurrency - EUR formatting', () => {
    testCurrencies.forEach(amount => {
      formatCurrency(amount, 'EUR');
    });
  });

  bench('formatNumber - default formatting', () => {
    testNumbers.forEach(num => {
      formatNumber(num);
    });
  });

  bench('formatNumber - with decimals', () => {
    testNumbers.forEach(num => {
      formatNumber(num, 2);
    });
  });

  bench('formatPercentage - percentage formatting', () => {
    [0.15, 0.856, 1.0, 0.001, 0.999].forEach(value => {
      formatPercentage(value);
    });
  });

  // Benchmark: File and duration formatting
  bench('formatFileSize - various file sizes', () => {
    testFileSizes.forEach(size => {
      formatFileSize(size);
    });
  });

  bench('formatDuration - time duration formatting', () => {
    testDurations.forEach(duration => {
      formatDuration(duration);
    });
  });

  // Benchmark: Text and business-specific formatting
  bench('formatWorkOrderNumber - work order formatting', () => {
    ['001', '123', 'WO-456', '1000'].forEach(number => {
      formatWorkOrderNumber(number);
    });
  });

  bench('truncateText - text truncation', () => {
    testTexts.forEach(text => {
      truncateText(text, 50);
    });
  });

  bench('truncateText - various lengths', () => {
    testTexts.forEach(text => {
      [20, 50, 100].forEach(length => {
        truncateText(text, length);
      });
    });
  });

  // Benchmark: Complex formatting functions
  bench('formatInventoryLevel - inventory status calculation', () => {
    const testInventory = [
      { current: 0, reorder: 10, max: 100 },
      { current: 5, reorder: 10, max: 100 },
      { current: 50, reorder: 10, max: 100 },
      { current: 95, reorder: 10, max: 100 },
    ];

    testInventory.forEach(({ current, reorder, max }) => {
      formatInventoryLevel(current, reorder, max);
    });
  });

  // Benchmark: Bulk operations (simulating real-world usage)
  bench('bulk date formatting - 100 work orders', () => {
    const workOrders = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30), // Random dates in last 30 days
      updatedAt: new Date(Date.now() - Math.random() * 86400000 * 7), // Random dates in last 7 days
      cost: Math.random() * 10000,
    }));

    workOrders.forEach(wo => {
      formatDate(wo.createdAt);
      formatTimeAgo(wo.updatedAt);
      formatCurrency(wo.cost);
    });
  });

  bench('bulk number formatting - dashboard stats', () => {
    const stats = {
      totalWorkOrders: 1245,
      completionRate: 0.847,
      avgResponseTime: 2.5,
      totalCost: 156789.99,
      efficiency: 0.923,
    };

    // Simulate formatting dashboard statistics
    formatNumber(stats.totalWorkOrders);
    formatPercentage(stats.completionRate);
    formatNumber(stats.avgResponseTime, 1);
    formatCurrency(stats.totalCost);
    formatPercentage(stats.efficiency);
  });

  bench('mixed formatting operations - equipment list', () => {
    const equipment = Array.from({ length: 50 }, (_, i) => ({
      id: `EQ-${i.toString().padStart(3, '0')}`,
      name: `Equipment ${i}`,
      lastMaintenance: new Date(Date.now() - Math.random() * 86400000 * 90),
      efficiency: Math.random(),
      manualSize: Math.random() * 50000000, // Manual file size
      description: `This is equipment ${i} with various specifications and maintenance requirements`,
    }));

    equipment.forEach(eq => {
      formatWorkOrderNumber(eq.id.replace('EQ-', ''));
      formatTimeAgo(eq.lastMaintenance);
      formatPercentage(eq.efficiency);
      formatFileSize(eq.manualSize);
      truncateText(eq.description, 60);
    });
  });
});

/**
 * Benchmark Results Documentation:
 *
 * Run this benchmark with: npx vitest bench bench/client/src/formatters.bench.ts
 *
 * Expected baseline performance (client-side JavaScript execution):
 * - formatDate: ~0.1-1ms per operation (depending on input complexity)
 * - formatCurrency: ~0.05-0.3ms per operation
 * - formatNumber: ~0.05-0.2ms per operation
 * - formatFileSize: ~0.01-0.05ms per operation
 * - formatTimeAgo: ~0.1-0.5ms per operation (uses date-fns calculations)
 * - truncateText: ~0.01-0.05ms per operation
 * - Bulk operations: should scale linearly with item count
 *
 * Performance Guidelines:
 * - Individual formatting operations should complete in <1ms for smooth UI
 * - Bulk formatting (100 items) should complete in <100ms for acceptable UX
 * - Complex date operations may be slower due to date-fns library overhead
 * - Consider memoization for expensive operations called repeatedly with same inputs
 *
 * Critical Performance Factors:
 * - Date parsing and validation (date-fns operations)
 * - Intl.NumberFormat instantiation (consider caching)
 * - String manipulation and regex operations
 * - Input validation and error handling overhead
 */
