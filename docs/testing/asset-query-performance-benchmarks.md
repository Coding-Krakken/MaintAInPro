# Asset Query Performance Benchmark Documentation

## Overview
This document provides details on the comprehensive asset query performance benchmarks implemented in `tests/performance/api-performance.test.ts` to validate API latency against NFR requirements.

## NFR Requirements
- **P95 latency**: ≤ 500ms for all API endpoints (from requirements/nfr.yml)
- **Throughput**: ≥ 100 requests/sec sustained  
- **Max assets**: ≥ 100,000 equipment records

## Benchmarks Implemented

### Asset Query Performance Benchmarks
The following comprehensive benchmarks have been added to validate asset query performance:

1. **Asset lookup by ID** (≤500ms NFR compliance)
   - Single asset retrieval by unique identifier
   - Tests direct database lookup performance
   - Validates response structure and timing

2. **QR code asset lookup** (≤500ms NFR compliance) 
   - Asset retrieval via QR code scanning functionality
   - Tests filtered query performance on QR code index
   - Critical for mobile app performance

3. **Asset filtering by criticality** (≤500ms NFR compliance)
   - Filters assets by criticality level (low, medium, high, critical)  
   - Tests query performance with WHERE clauses
   - Important for operational prioritization

4. **Asset filtering by area/location** (≤500ms NFR compliance)
   - Filters assets by physical location/area
   - Tests spatial/location-based queries
   - Critical for technician workflow efficiency

5. **Multi-criteria asset filtering** (≤500ms NFR compliance)
   - Combines multiple filter criteria (status, criticality, warehouse)
   - Tests complex WHERE clause performance
   - Validates production query patterns

6. **Asset search queries** (≤500ms NFR compliance)
   - Full-text search across asset names and descriptions
   - Tests search index performance
   - Critical for user experience in asset discovery

7. **Asset pagination performance** (≤500ms NFR compliance) 
   - Tests pagination across large asset datasets
   - Validates LIMIT/OFFSET query performance
   - Ensures consistent performance across result pages

8. **Comprehensive performance metrics**
   - Benchmarks all query types with detailed metrics
   - Provides performance comparison reporting
   - Validates NFR compliance with pass/fail indicators

## Test Scenarios Covered

### Dataset Sizes
- Small datasets: 50-100 assets for basic functionality
- Medium datasets: 250-500 assets for realistic workloads  
- Large datasets: 1000+ assets for stress testing

### Query Patterns
- Direct ID lookups
- Filtered queries (single and multi-criteria)
- Search queries with text matching
- Paginated result sets
- Relationship queries (asset to work orders)

### Performance Validations
- Response time measurement (milliseconds)
- Result count validation
- NFR compliance checking (≤500ms)
- Memory usage monitoring
- Concurrent request handling

## Results Documentation

Each benchmark provides:
- **Duration**: Actual response time in milliseconds
- **Result Count**: Number of records returned
- **NFR Compliance**: Pass/fail against ≤500ms target
- **Performance Logging**: Detailed metrics with visual indicators

Example output:
```
📈 Asset Query Performance Results:
============================================================
✅ List All Assets          |  45ms |  500 results
✅ Filter by Status         |  32ms |  167 results  
✅ Filter by Criticality    |  28ms |  125 results
✅ Search by Name           |  41ms |   83 results
✅ Multi-criteria Filter    |  38ms |   42 results
✅ Paginated Query          |  29ms |   50 results
============================================================
NFR Target: ≤500ms P95 latency | All tests: PASSED ✅
```

## Integration with Existing Tests

The new asset query benchmarks are integrated with existing performance test structure:
- Uses same test setup and teardown patterns
- Leverages existing mock authentication
- Follows existing assertion patterns
- Maintains consistent test organization

## Usage

The benchmarks run automatically as part of the performance test suite:
```bash
npm run test:performance
```

Or run specifically:
```bash
npx vitest run tests/performance/api-performance.test.ts
```

## Future Enhancements

- Database-specific optimizations (indexes, query plans)
- Caching layer performance validation  
- Real-time subscription performance
- Mobile app specific scenarios
- Load testing with concurrent users
- Performance regression detection