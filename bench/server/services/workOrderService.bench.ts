/**
 * Benchmark for WorkOrderService
 * 
 * This benchmark establishes baseline performance metrics for work order service operations
 * to guide future optimizations. Benchmarks focus on core operations that would exist
 * in a typical work order service implementation.
 * 
 * Performance Targets (based on existing performance tests):
 * - Work order creation: < 50ms per operation
 * - Work order retrieval: < 100ms for single, < 500ms for list of 100
 * - Work order updates: < 75ms per operation
 * - Work order search: < 200ms for basic text search
 * 
 * Usage:
 * npm run test -- --run bench/server/services/workOrderService.bench.ts
 */

import { bench, describe } from 'vitest';
import { MemStorage } from '../../../server/storage';
import type { InsertWorkOrder, WorkOrder } from '../../../shared/schema';

describe('WorkOrderService Performance Benchmarks', () => {
  let storage: MemStorage;
  let sampleWorkOrders: WorkOrder[] = [];
  const warehouseId = 'warehouse-test-001';
  
  // Setup sample data for benchmarks
  const setupBenchmarkData = async () => {
    storage = new MemStorage();
    sampleWorkOrders = [];
    
    // Create sample work orders for benchmarking
    for (let i = 0; i < 100; i++) {
      const workOrder: InsertWorkOrder = {
        foNumber: `WO-BENCH-${i.toString().padStart(4, '0')}`,
        type: i % 3 === 0 ? 'preventive' : i % 3 === 1 ? 'corrective' : 'emergency',
        description: `Benchmark work order ${i} - ${i % 2 === 0 ? 'Hydraulic pump maintenance' : 'Conveyor belt inspection'}`,
        area: i % 4 === 0 ? 'Production Line A' : i % 4 === 1 ? 'Production Line B' : i % 4 === 2 ? 'Warehouse' : 'Maintenance Shop',
        assetModel: i % 3 === 0 ? 'PUMP-HY-2000' : 'CONV-BELT-150',
        status: i % 5 === 0 ? 'new' : i % 5 === 1 ? 'assigned' : i % 5 === 2 ? 'in_progress' : i % 5 === 3 ? 'completed' : 'verified',
        priority: i % 4 === 0 ? 'critical' : i % 4 === 1 ? 'high' : i % 4 === 2 ? 'medium' : 'low',
        requestedBy: 'user-001',
        assignedTo: i % 2 === 0 ? 'tech-001' : 'tech-002',
        equipmentId: i % 2 === 0 ? 'equipment-001' : 'equipment-002',
        dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)), // Stagger due dates
        estimatedHours: '2.5',
        notes: `Benchmark notes for work order ${i}`,
        followUp: i % 10 === 0,
        escalated: i % 20 === 0,
        escalationLevel: i % 20 === 0 ? 1 : 0,
        organizationId: 'org-001',
        warehouseId: warehouseId,
      };
      
      const created = await storage.createWorkOrder(workOrder);
      sampleWorkOrders.push(created);
    }
  };

  // Benchmark: Work Order Creation
  bench('createWorkOrder - single operation', async () => {
    await setupBenchmarkData();
    
    const newWorkOrder: InsertWorkOrder = {
      foNumber: `WO-BENCH-CREATE-${Date.now()}`,
      type: 'corrective',
      description: 'Benchmark work order creation test',
      area: 'Production Line A',
      assetModel: 'PUMP-HY-2000',
      status: 'new',
      priority: 'high',
      requestedBy: 'user-001',
      assignedTo: 'tech-001',
      equipmentId: 'equipment-001',
      dueDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
      estimatedHours: '4.0',
      notes: 'Performance benchmark test work order',
      organizationId: 'org-001',
      warehouseId: warehouseId,
    };
    
    await storage.createWorkOrder(newWorkOrder);
  });

  // Benchmark: Work Order Retrieval (Single)
  bench('getWorkOrder - single retrieval', async () => {
    await setupBenchmarkData();
    
    // Get a random work order ID from our sample data
    const randomIndex = Math.floor(Math.random() * sampleWorkOrders.length);
    const workOrderId = sampleWorkOrders[randomIndex].id;
    
    await storage.getWorkOrder(workOrderId);
  });

  // Benchmark: Work Order List Retrieval
  bench('getWorkOrders - list retrieval (100 items)', async () => {
    await setupBenchmarkData();
    
    await storage.getWorkOrders(warehouseId);
  });

  // Benchmark: Work Order List Retrieval with Filters
  bench('getWorkOrders - filtered retrieval', async () => {
    await setupBenchmarkData();
    
    const filters = {
      status: 'in_progress',
      priority: 'high',
    };
    
    await storage.getWorkOrders(warehouseId, filters);
  });

  // Benchmark: Work Order Update
  bench('updateWorkOrder - single update', async () => {
    await setupBenchmarkData();
    
    const randomIndex = Math.floor(Math.random() * sampleWorkOrders.length);
    const workOrderId = sampleWorkOrders[randomIndex].id;
    
    const updates: Partial<InsertWorkOrder> = {
      status: 'in_progress',
      actualHours: '3.5',
      notes: 'Updated during benchmark test',
    };
    
    await storage.updateWorkOrder(workOrderId, updates);
  });

  // Benchmark: Work Order Search by Assignee
  bench('getWorkOrdersByAssignee - assignee lookup', async () => {
    await setupBenchmarkData();
    
    await storage.getWorkOrdersByAssignee('tech-001');
  });

  // Benchmark: Bulk Work Order Creation
  bench('createWorkOrder - bulk creation (10 items)', async () => {
    storage = new MemStorage();
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const workOrder: InsertWorkOrder = {
        foNumber: `WO-BULK-${i}-${Date.now()}`,
        type: 'corrective',
        description: `Bulk creation test ${i}`,
        area: 'Production Line A',
        assetModel: 'PUMP-HY-2000',
        status: 'new',
        priority: 'medium',
        requestedBy: 'user-001',
        assignedTo: 'tech-001',
        equipmentId: 'equipment-001',
        dueDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
        organizationId: 'org-001',
        warehouseId: warehouseId,
      };
      
      promises.push(storage.createWorkOrder(workOrder));
    }
    
    await Promise.all(promises);
  });

  // Benchmark: Concurrent Work Order Operations
  bench('mixed operations - concurrent read/write', async () => {
    await setupBenchmarkData();
    
    const operations = [];
    
    // Mix of different operations
    operations.push(storage.getWorkOrders(warehouseId));
    operations.push(storage.getWorkOrdersByAssignee('tech-001'));
    
    const randomWorkOrder = sampleWorkOrders[Math.floor(Math.random() * sampleWorkOrders.length)];
    operations.push(storage.getWorkOrder(randomWorkOrder.id));
    operations.push(storage.updateWorkOrder(randomWorkOrder.id, { 
      status: 'in_progress', 
      notes: 'Concurrent update test' 
    }));
    
    // Create a new work order
    const newWorkOrder: InsertWorkOrder = {
      foNumber: `WO-CONCURRENT-${Date.now()}`,
      type: 'corrective',
      description: 'Concurrent operations test',
      area: 'Production Line B',
      status: 'new',
      priority: 'medium',
      requestedBy: 'user-001',
      organizationId: 'org-001',
      warehouseId: warehouseId,
    };
    operations.push(storage.createWorkOrder(newWorkOrder));
    
    await Promise.all(operations);
  });
});

/**
 * Benchmark Results Documentation:
 * 
 * Run this benchmark with: npm run test -- --run bench/server/services/workOrderService.bench.ts
 * 
 * Expected baseline performance (using in-memory storage):
 * - createWorkOrder (single): ~1-10ms per operation
 * - getWorkOrder (single): ~0.1-1ms per operation  
 * - getWorkOrders (100 items): ~5-50ms per operation
 * - updateWorkOrder (single): ~1-5ms per operation
 * - getWorkOrdersByAssignee: ~2-10ms per operation
 * - createWorkOrder (bulk 10): ~10-50ms total
 * - mixed operations (concurrent): ~10-100ms total
 * 
 * Performance Guidelines:
 * - Individual operations should complete in <100ms for good UX
 * - List operations should complete in <500ms for acceptable UX
 * - Bulk operations should scale linearly with item count
 * - Database operations will be 10-100x slower than in-memory
 * 
 * Future Optimization Targets:
 * - Single work order creation: target <50ms with database
 * - Work order list retrieval: target <500ms for 100 items with database
 * - Search operations: target <200ms with proper indexing
 * - Concurrent operations: should not degrade significantly under load
 */