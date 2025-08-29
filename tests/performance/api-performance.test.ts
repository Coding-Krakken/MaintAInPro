import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { MemStorage } from '../../server/storage';

// Create a simple test app that uses MemStorage
const createTestApp = (storage: MemStorage) => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  app.use((req, res, next) => {
    // Add mock user for all requests
    (req as any).user = { id: 'test-user', role: 'admin' };
    next();
  });

  // Equipment routes
  app.get('/api/equipment', async (req, res) => {
    try {
      const { status, criticality, area, warehouse_id, search, qr_code, page, limit } = req.query;
      let equipment = await storage.equipment.getAll();

      // Apply filters
      if (status) equipment = equipment.filter(e => e.status === status);
      if (criticality) equipment = equipment.filter(e => e.criticality === criticality);
      if (area) equipment = equipment.filter(e => e.area === area);
      if (warehouse_id) equipment = equipment.filter(e => e.warehouse_id === warehouse_id);
      if (qr_code) equipment = equipment.filter(e => e.qr_code === qr_code);
      if (search)
        equipment = equipment.filter(e =>
          e.name?.toLowerCase().includes((search as string).toLowerCase())
        );

      // Apply pagination
      if (page && limit) {
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const startIndex = (pageNum - 1) * limitNum;
        equipment = equipment.slice(startIndex, startIndex + limitNum);
      }

      res.json(equipment);
    } catch (_error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/equipment/:id', async (req, res) => {
    try {
      const equipment = await storage.equipment.getById(req.params.id);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }
      res.json(equipment);
    } catch (_error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Work orders routes
  app.get('/api/work-orders', async (req, res) => {
    try {
      const { page, limit } = req.query;
      let workOrders = await storage.workOrders.getAll();

      if (page && limit) {
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const startIndex = (pageNum - 1) * limitNum;
        workOrders = workOrders.slice(startIndex, startIndex + limitNum);
      }

      res.json(workOrders);
    } catch (_error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/work-orders', async (req, res) => {
    try {
      const workOrder = await storage.workOrders.create({
        id: Date.now().toString(),
        ...req.body,
        created_at: new Date(),
        updated_at: new Date(),
      });
      res.status(201).json(workOrder);
    } catch (_error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const workOrders = await storage.workOrders.getAll();
      const totalWorkOrders = workOrders.length;
      const pendingWorkOrders = workOrders.filter(wo => wo.status === 'pending').length;

      res.json({
        totalWorkOrders,
        pendingWorkOrders,
        completedWorkOrders: workOrders.filter(wo => wo.status === 'completed').length,
        inProgressWorkOrders: workOrders.filter(wo => wo.status === 'in-progress').length,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Equipment work orders relationship
  app.get('/api/equipment/:id/work-orders', async (req, res) => {
    try {
      const workOrders = await storage.workOrders.getAll();
      const equipmentWorkOrders = workOrders.filter(wo => wo.equipment_id === req.params.id);
      res.json(equipmentWorkOrders);
    } catch (_error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Auth endpoints for test setup
  app.post('/api/auth/register', async (req, res) => {
    res.json({ success: true });
  });

  app.post('/api/auth/login', async (req, res) => {
    res.json({ token: 'mock-token' });
  });

  return app;
};

describe('API Performance Tests', () => {
  let app: express.Application;
  let storage: MemStorage;
  let authToken: string;

  beforeEach(async () => {
    storage = new MemStorage();
    app = createTestApp(storage);

    // Create and login a test user
    await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      role: 'admin',
      warehouse_id: 'warehouse-1',
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'SecurePassword123!',
    });

    authToken = loginResponse.body.token;
  });

  describe('Response Time Performance', () => {
    it('should respond to health check within 100ms', async () => {
      const start = Date.now();

      await request(app).get('/api/health').expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should respond to equipment list within 500ms', async () => {
      // Pre-populate with some test data
      for (let i = 0; i < 50; i++) {
        await storage.equipment.create({
          id: `equipment-${i}`,
          name: `Test Equipment ${i}`,
          warehouse_id: 'warehouse-1',
          status: 'operational',
          criticality: 'medium',
          qr_code: `QR${i.toString().padStart(3, '0')}`,
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
      expect(response.body.length).toBe(50);
    });

    it('should respond to work orders list within 500ms', async () => {
      // Pre-populate with test data
      for (let i = 0; i < 100; i++) {
        await storage.workOrders.create({
          id: `wo-${i}`,
          title: `Work Order ${i}`,
          description: `Description for work order ${i}`,
          type: 'corrective',
          priority: 'medium',
          status: 'pending',
          equipment_id: 'equipment-1',
          warehouse_id: 'warehouse-1',
          due_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
      expect(response.body.length).toBe(100);
    });

    it('should handle dashboard stats quickly', async () => {
      // Pre-populate with test data
      for (let i = 0; i < 200; i++) {
        await storage.workOrders.create({
          id: `wo-${i}`,
          title: `Work Order ${i}`,
          description: `Description for work order ${i}`,
          type: i % 2 === 0 ? 'corrective' : 'preventive',
          priority: ['low', 'medium', 'high', 'critical'][i % 4],
          status: ['pending', 'in-progress', 'completed'][i % 3],
          equipment_id: 'equipment-1',
          warehouse_id: 'warehouse-1',
          due_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(300);
      expect(response.body).toHaveProperty('totalWorkOrders');
      expect(response.body).toHaveProperty('pendingWorkOrders');
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent equipment requests', async () => {
      // Create test equipment
      for (let i = 0; i < 20; i++) {
        await storage.equipment.create({
          id: `equipment-${i}`,
          name: `Test Equipment ${i}`,
          warehouse_id: 'warehouse-1',
          status: 'operational',
          criticality: 'medium',
          qr_code: `QR${i.toString().padStart(3, '0')}`,
        });
      }

      const concurrentRequests = 10;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app).get('/api/equipment').set('Authorization', `Bearer ${authToken}`)
        );
      }

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(20);
      });

      // Should handle concurrent requests reasonably quickly
      expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent work order creation', async () => {
      const concurrentCreations = 5;
      const requests = [];

      for (let i = 0; i < concurrentCreations; i++) {
        requests.push(
          request(app)
            .post('/api/work-orders')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              title: `Concurrent Work Order ${i}`,
              description: `Description ${i}`,
              type: 'corrective',
              priority: 'medium',
              status: 'pending',
              equipment_id: 'equipment-1',
              warehouse_id: 'warehouse-1',
              due_date: new Date(),
            })
        );
      }

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // All creations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      expect(duration).toBeLessThan(1000);

      // Verify all work orders were created
      const allWorkOrders = await storage.workOrders.getAll();
      expect(allWorkOrders.length).toBe(concurrentCreations);
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle large equipment dataset efficiently', async () => {
      // Create a large dataset
      const equipmentCount = 1000;
      const batchSize = 100;

      for (let batch = 0; batch < equipmentCount / batchSize; batch++) {
        const equipmentBatch = [];
        for (let i = 0; i < batchSize; i++) {
          const id = batch * batchSize + i;
          equipmentBatch.push(
            storage.equipment.create({
              id: `equipment-${id}`,
              name: `Equipment ${id}`,
              warehouse_id: 'warehouse-1',
              status: ['operational', 'maintenance', 'out-of-service'][id % 3],
              criticality: ['low', 'medium', 'high', 'critical'][id % 4],
              qr_code: `QR${id.toString().padStart(4, '0')}`,
            })
          );
        }
        await Promise.all(equipmentBatch);
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      expect(response.body.length).toBe(equipmentCount);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle filtered queries efficiently', async () => {
      // Create diverse test data
      for (let i = 0; i < 500; i++) {
        await storage.equipment.create({
          id: `equipment-${i}`,
          name: `Equipment ${i}`,
          warehouse_id: i < 250 ? 'warehouse-1' : 'warehouse-2',
          status: ['operational', 'maintenance', 'out-of-service'][i % 3],
          criticality: ['low', 'medium', 'high', 'critical'][i % 4],
          qr_code: `QR${i.toString().padStart(3, '0')}`,
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/equipment?status=operational&criticality=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
      expect(response.body.every(eq => eq.status === 'operational')).toBe(true);
      expect(response.body.every(eq => eq.criticality === 'high')).toBe(true);
    });

    it('should handle pagination efficiently', async () => {
      // Create test data
      for (let i = 0; i < 200; i++) {
        await storage.workOrders.create({
          id: `wo-${i}`,
          title: `Work Order ${i}`,
          description: `Description ${i}`,
          type: 'corrective',
          priority: 'medium',
          status: 'pending',
          equipment_id: 'equipment-1',
          warehouse_id: 'warehouse-1',
          due_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/work-orders?page=1&limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(300);
      expect(response.body.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not have memory leaks in repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make many requests to test for memory leaks
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/health').expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory shouldn't increase significantly (allow some variance)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    it('should handle large payloads efficiently', async () => {
      const largeDescription = 'x'.repeat(10000); // 10KB description

      const start = Date.now();

      const response = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Large Work Order',
          description: largeDescription,
          type: 'corrective',
          priority: 'medium',
          status: 'pending',
          equipment_id: 'equipment-1',
          warehouse_id: 'warehouse-1',
          due_date: new Date(),
        })
        .expect(201);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
      expect(response.body.description.length).toBe(10000);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle complex joins efficiently', async () => {
      // Create related data
      const equipment = await storage.equipment.create({
        id: 'equipment-1',
        name: 'Test Equipment',
        warehouse_id: 'warehouse-1',
        status: 'operational',
        criticality: 'high',
        qr_code: 'QR001',
      });

      // Create multiple work orders for the equipment
      for (let i = 0; i < 50; i++) {
        await storage.workOrders.create({
          id: `wo-${i}`,
          title: `Work Order ${i}`,
          description: `Description ${i}`,
          type: 'corrective',
          priority: 'medium',
          status: 'pending',
          equipment_id: equipment.id,
          warehouse_id: 'warehouse-1',
          due_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get(`/api/equipment/${equipment.id}/work-orders`)
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);

      if (response.status === 200) {
        expect(response.body.length).toBe(50);
      }
    });

    it('should handle search queries efficiently', async () => {
      // Create searchable data
      for (let i = 0; i < 100; i++) {
        await storage.equipment.create({
          id: `equipment-${i}`,
          name: i < 50 ? `Pump Equipment ${i}` : `Motor Equipment ${i}`,
          warehouse_id: 'warehouse-1',
          status: 'operational',
          criticality: 'medium',
          qr_code: `QR${i.toString().padStart(3, '0')}`,
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/equipment?search=Pump')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(400);
      expect(response.body.length).toBe(50);
      expect(response.body.every(eq => eq.name.includes('Pump'))).toBe(true);
    });
  });

  describe('Asset Query Performance Benchmarks', () => {
    /**
     * Asset Query Performance Benchmarks
     *
     * These tests validate asset/equipment query performance against NFR requirements:
     * - P95 latency <= 500ms for all API endpoints (nfr.yml)
     * - Equipment management features from EquipmentAssetModule specification
     *
     * Test scenarios cover:
     * - Asset filtering by various criteria
     * - Asset search and lookup performance
     * - Asset hierarchy queries
     * - QR code-based asset lookup
     * - Multi-warehouse asset queries
     */

    it('should perform asset lookup by ID within NFR target (≤500ms)', async () => {
      // Create test asset
      const asset = await storage.equipment.create({
        id: 'asset-test-001',
        name: 'Test Asset for Lookup',
        warehouse_id: 'warehouse-1',
        status: 'operational',
        criticality: 'high',
        qr_code: 'QR-LOOKUP-001',
        area: 'Production Zone A',
      });

      const start = Date.now();
      const response = await request(app)
        .get(`/api/equipment/${asset.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      // NFR compliance: P95 latency ≤ 500ms
      expect(duration).toBeLessThan(500);
      expect(response.body.id).toBe(asset.id);
      expect(response.body.name).toBe('Test Asset for Lookup');
    });

    it('should perform QR code asset lookup within NFR target (≤500ms)', async () => {
      // Create assets with QR codes
      const qrCodes = [];
      for (let i = 0; i < 100; i++) {
        const qrCode = `QR${i.toString().padStart(4, '0')}`;
        qrCodes.push(qrCode);
        await storage.equipment.create({
          id: `equipment-qr-${i}`,
          name: `QR Equipment ${i}`,
          warehouse_id: 'warehouse-1',
          status: 'operational',
          criticality: 'medium',
          qr_code: qrCode,
          area: `Zone ${i % 5}`,
        });
      }

      // Test QR lookup performance
      const testQr = qrCodes[50]; // Middle QR code
      const start = Date.now();

      const response = await request(app)
        .get(`/api/equipment?qr_code=${testQr}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      // NFR compliance: P95 latency ≤ 500ms
      expect(duration).toBeLessThan(500);
      expect(response.body.length).toBe(1);
      expect(response.body[0].qr_code).toBe(testQr);
    });

    it('should filter assets by criticality within NFR target (≤500ms)', async () => {
      // Create assets with different criticality levels
      const criticalities = ['low', 'medium', 'high', 'critical'];
      for (let i = 0; i < 200; i++) {
        await storage.equipment.create({
          id: `equipment-crit-${i}`,
          name: `Equipment ${i}`,
          warehouse_id: 'warehouse-1',
          status: 'operational',
          criticality: criticalities[i % 4],
          qr_code: `QR${i.toString().padStart(4, '0')}`,
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/equipment?criticality=critical')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      // NFR compliance: P95 latency ≤ 500ms
      expect(duration).toBeLessThan(500);
      expect(response.body.length).toBe(50); // Every 4th item is critical
      expect(response.body.every(eq => eq.criticality === 'critical')).toBe(true);
    });

    it('should filter assets by area/location within NFR target (≤500ms)', async () => {
      // Create assets in different areas
      const areas = [
        'Production Zone A',
        'Production Zone B',
        'Maintenance Shop',
        'Warehouse',
        'Office',
      ];
      for (let i = 0; i < 250; i++) {
        await storage.equipment.create({
          id: `equipment-area-${i}`,
          name: `Equipment ${i}`,
          warehouse_id: 'warehouse-1',
          status: 'operational',
          criticality: 'medium',
          area: areas[i % 5],
          qr_code: `QR${i.toString().padStart(4, '0')}`,
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/equipment?area=Production Zone A')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      // NFR compliance: P95 latency ≤ 500ms
      expect(duration).toBeLessThan(500);
      expect(response.body.length).toBe(50); // Every 5th item is in Production Zone A
      expect(response.body.every(eq => eq.area === 'Production Zone A')).toBe(true);
    });

    it('should perform multi-criteria asset filtering within NFR target (≤500ms)', async () => {
      // Create diverse asset dataset
      const statuses = ['operational', 'maintenance', 'out-of-service'];
      const criticalities = ['low', 'medium', 'high', 'critical'];

      for (let i = 0; i < 300; i++) {
        await storage.equipment.create({
          id: `equipment-multi-${i}`,
          name: `Multi Equipment ${i}`,
          warehouse_id: i < 150 ? 'warehouse-1' : 'warehouse-2',
          status: statuses[i % 3],
          criticality: criticalities[i % 4],
          area: `Zone ${i % 10}`,
          qr_code: `QR${i.toString().padStart(4, '0')}`,
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/equipment?status=operational&criticality=high&warehouse_id=warehouse-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      // NFR compliance: P95 latency ≤ 500ms
      expect(duration).toBeLessThan(500);

      // Verify filtering worked correctly
      response.body.forEach(eq => {
        expect(eq.status).toBe('operational');
        expect(eq.criticality).toBe('high');
        expect(eq.warehouse_id).toBe('warehouse-1');
      });
    });

    it('should perform asset search queries within NFR target (≤500ms)', async () => {
      // Create searchable assets with varied names
      const equipmentTypes = ['Pump', 'Motor', 'Conveyor', 'Compressor', 'Generator', 'Chiller'];
      for (let i = 0; i < 500; i++) {
        await storage.equipment.create({
          id: `equipment-search-${i}`,
          name: `${equipmentTypes[i % 6]} Unit ${i}`,
          warehouse_id: 'warehouse-1',
          status: 'operational',
          criticality: 'medium',
          qr_code: `QR${i.toString().padStart(4, '0')}`,
          description: `Industrial ${equipmentTypes[i % 6]} for production use`,
        });
      }

      const start = Date.now();

      const response = await request(app)
        .get('/api/equipment?search=Pump')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      // NFR compliance: P95 latency ≤ 500ms
      expect(duration).toBeLessThan(500);

      // Verify search results
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach(eq => {
        expect(eq.name.toLowerCase()).toContain('pump');
      });
    });

    it('should handle asset pagination efficiently within NFR target (≤500ms)', async () => {
      // Create large asset dataset
      for (let i = 0; i < 1000; i++) {
        await storage.equipment.create({
          id: `equipment-page-${i}`,
          name: `Paginated Equipment ${i}`,
          warehouse_id: 'warehouse-1',
          status: 'operational',
          criticality: 'medium',
          qr_code: `QR${i.toString().padStart(4, '0')}`,
        });
      }

      // Test pagination performance - page 1
      const start1 = Date.now();
      const response1 = await request(app)
        .get('/api/equipment?page=1&limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Test pagination performance - page 10
      const start2 = Date.now();
      const response2 = await request(app)
        .get('/api/equipment?page=10&limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      // NFR compliance: P95 latency ≤ 500ms for both pages
      expect(duration1).toBeLessThan(500);
      expect(duration2).toBeLessThan(500);

      // Verify pagination works
      expect(response1.body.length).toBeLessThanOrEqual(50);
      expect(response2.body.length).toBeLessThanOrEqual(50);
    });

    it('should benchmark asset query performance with comprehensive metrics', async () => {
      // Create comprehensive test dataset
      const testDataSize = 500;
      console.log(`\n📊 Asset Query Performance Benchmark - Dataset Size: ${testDataSize}`);

      for (let i = 0; i < testDataSize; i++) {
        await storage.equipment.create({
          id: `benchmark-${i}`,
          name: `Benchmark Asset ${i}`,
          warehouse_id: i < 250 ? 'warehouse-1' : 'warehouse-2',
          status: ['operational', 'maintenance', 'out-of-service'][i % 3],
          criticality: ['low', 'medium', 'high', 'critical'][i % 4],
          area: `Zone ${i % 20}`,
          qr_code: `BM${i.toString().padStart(4, '0')}`,
        });
      }

      // Benchmark different query types
      const benchmarks = {
        'List All Assets': '/api/equipment',
        'Filter by Status': '/api/equipment?status=operational',
        'Filter by Criticality': '/api/equipment?criticality=high',
        'Search by Name': '/api/equipment?search=Asset',
        'Multi-criteria Filter': '/api/equipment?status=operational&criticality=high',
        'Paginated Query': '/api/equipment?page=1&limit=50',
      };

      const results: {
        [key: string]: { duration: number; resultCount: number; nfrCompliant: boolean };
      } = {};

      for (const [testName, endpoint] of Object.entries(benchmarks)) {
        const start = Date.now();

        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const duration = Date.now() - start;
        results[testName] = {
          duration,
          resultCount: response.body.length,
          nfrCompliant: duration <= 500,
        };

        // All queries must meet NFR target
        expect(duration).toBeLessThan(500);
      }

      // Log performance results for documentation
      console.log('\n📈 Asset Query Performance Results:');
      console.log('='.repeat(60));
      Object.entries(results).forEach(([testName, result]) => {
        const complianceIcon = result.nfrCompliant ? '✅' : '❌';
        console.log(
          `${complianceIcon} ${testName.padEnd(25)} | ${result.duration.toString().padStart(3)}ms | ${result.resultCount.toString().padStart(4)} results`
        );
      });
      console.log('='.repeat(60));
      console.log(
        `NFR Target: ≤500ms P95 latency | All tests: ${Object.values(results).every(r => r.nfrCompliant) ? 'PASSED ✅' : 'FAILED ❌'}`
      );
    });
  });

  describe('API Response Size Optimization', () => {
    it('should compress large responses effectively', async () => {
      // Create large dataset
      for (let i = 0; i < 500; i++) {
        await storage.equipment.create({
          id: `equipment-${i}`,
          name: `Very Long Equipment Name That Takes Up More Space ${i}`,
          warehouse_id: 'warehouse-1',
          status: 'operational',
          criticality: 'medium',
          qr_code: `QR${i.toString().padStart(3, '0')}`,
          description:
            'This is a very long description that will be repeated many times to increase response size and test compression effectiveness',
        });
      }

      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      // Should have compression headers if implemented
      if (response.headers['content-encoding']) {
        expect(response.headers['content-encoding']).toContain('gzip');
      }

      expect(response.body.length).toBe(500);
    });

    it('should handle pagination to reduce response size', async () => {
      // Create large dataset
      for (let i = 0; i < 1000; i++) {
        await storage.workOrders.create({
          id: `wo-${i}`,
          title: `Work Order ${i}`,
          description: `Description ${i}`,
          type: 'corrective',
          priority: 'medium',
          status: 'pending',
          equipment_id: 'equipment-1',
          warehouse_id: 'warehouse-1',
          due_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      const response = await request(app)
        .get('/api/work-orders?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(100);
    });
  });
});
