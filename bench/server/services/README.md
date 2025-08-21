# WorkOrderService Benchmark

## Overview

This benchmark establishes baseline performance metrics for work order service
operations to guide future optimizations. It focuses on core operations that
would exist in a typical work order service implementation.

## Performance Targets

Based on existing performance tests and UX requirements:

- **Work order creation**: < 50ms per operation
- **Work order retrieval**: < 100ms for single, < 500ms for list of 100
- **Work order updates**: < 75ms per operation
- **Work order search**: < 200ms for basic text search

## Benchmarks Included

1. **createWorkOrder - single operation**: Creates a single work order
2. **getWorkOrder - single retrieval**: Retrieves a single work order by ID
3. **getWorkOrders - list retrieval (100 items)**: Retrieves list of 100 work
   orders
4. **getWorkOrders - filtered retrieval**: Retrieves work orders with
   status/priority filters
5. **updateWorkOrder - single update**: Updates a single work order
6. **getWorkOrdersByAssignee - assignee lookup**: Finds work orders by assignee
7. **createWorkOrder - bulk creation (10 items)**: Creates 10 work orders
   concurrently
8. **mixed operations - concurrent read/write**: Mixed concurrent operations

## Usage

### Running the Benchmark

```bash
# Run the full benchmark suite
npm run bench:workorder

# Or run directly with vitest
npx vitest bench bench/server/services/workOrderService.bench.ts
```

### Interpreting Results

The benchmark provides several metrics for each operation:

- **hz**: Operations per second (higher is better)
- **mean**: Average time per operation in milliseconds
- **min/max**: Fastest and slowest operation times
- **p75/p99**: 75th and 99th percentile response times
- **rme**: Relative margin of error (lower is better)

## Baseline Results (In-Memory Storage)

Based on initial benchmarking runs:

| Operation        | Operations/sec | Mean Time (ms) | P99 Time (ms) |
| ---------------- | -------------- | -------------- | ------------- |
| Single Create    | ~4,900         | ~0.20          | ~0.45         |
| Single Retrieve  | ~5,000         | ~0.20          | ~0.46         |
| List (100 items) | ~4,600         | ~0.22          | ~0.46         |
| Filtered List    | ~4,900         | ~0.20          | ~0.39         |
| Single Update    | ~4,900         | ~0.20          | ~0.44         |
| Assignee Lookup  | ~4,700         | ~0.21          | ~0.48         |
| Bulk Create (10) | ~35,800        | ~0.03          | ~0.04         |
| Concurrent Mixed | ~4,200         | ~0.24          | ~0.52         |

## Performance Guidelines

### Current Performance (In-Memory)

- Individual operations: < 1ms (excellent)
- List operations: < 1ms for 100 items (excellent)
- Bulk operations: ~0.03ms per item (excellent)

### Expected Database Performance

Database operations will be 10-100x slower:

- Individual operations: 1-50ms (good to acceptable)
- List operations: 10-500ms for 100 items (acceptable)
- Bulk operations: 0.5-5ms per item (good)

### Optimization Targets

When implementing with database storage:

- **Single work order creation**: target < 50ms
- **Work order list retrieval**: target < 500ms for 100 items
- **Search operations**: target < 200ms with proper indexing
- **Concurrent operations**: should not degrade significantly under load

## Future Enhancements

1. **Database Integration**: Benchmark against PostgreSQL when WorkOrderService
   uses database
2. **Caching Layer**: Add benchmarks for Redis-cached operations
3. **Full-Text Search**: Benchmark search performance with different query types
4. **Scale Testing**: Test performance with 1K, 10K, 100K work orders
5. **Memory Profiling**: Add memory usage benchmarks
6. **Network Simulation**: Add network latency simulation for realistic API
   benchmarks

## Integration with Performance Testing

This benchmark complements the existing performance tests:

- **API Performance Tests**: Test full HTTP request/response cycle (includes
  network, parsing, etc.)
- **WorkOrderService Benchmark**: Test pure service logic performance (excludes
  HTTP overhead)

Both are needed to identify bottlenecks at different layers of the system.

## Monitoring and Alerts

Consider setting up alerts when performance degrades beyond:

- Single operations > 100ms (database)
- List operations > 1000ms (database)
- Error rates > 1%
- P99 latency increases > 50% week-over-week

## Contributing

When modifying WorkOrderService:

1. Run benchmarks before changes to establish baseline
2. Run benchmarks after changes to measure impact
3. Update benchmark documentation if adding new operations
4. Ensure performance doesn't degrade more than 20% without justification
