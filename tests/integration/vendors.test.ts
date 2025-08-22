import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

describe('Vendor API Integration Tests', () => {
  let server: any;

  beforeAll(async () => {
    server = app;
  });

  afterAll(async () => {
    // Clean up if needed
  });

  describe('POST /api/vendors', () => {
    it('should create a vendor successfully with valid data', async () => {
      const vendorData = {
        name: 'Test Vendor',
        type: 'supplier',
        email: 'test@vendor.com',
        phone: '555-1234',
        address: '123 Test St',
        contactPerson: 'John Doe'
      };

      const response = await request(server)
        .post('/api/vendors')
        .send(vendorData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: vendorData.name,
        type: vendorData.type,
        email: vendorData.email,
        phone: vendorData.phone,
        address: vendorData.address,
        contactPerson: vendorData.contactPerson,
        active: true
      });
      expect(response.body.id).toBeDefined();
    });

    it('should create a vendor with minimal data', async () => {
      const vendorData = {
        name: 'Minimal Vendor',
        type: 'contractor'
      };

      const response = await request(server)
        .post('/api/vendors')
        .send(vendorData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: vendorData.name,
        type: vendorData.type,
        active: true
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const vendorData = {
        email: 'test@vendor.com'
        // Missing required 'name' field
      };

      const response = await request(server)
        .post('/api/vendors')
        .send(vendorData)
        .expect(400);

      expect(response.body.message).toContain('Invalid vendor data');
    });

    it('should return 400 for invalid email format', async () => {
      const vendorData = {
        name: 'Test Vendor',
        type: 'supplier',
        email: 'invalid-email'
      };

      const response = await request(server)
        .post('/api/vendors')
        .send(vendorData)
        .expect(400);

      expect(response.body.message).toContain('Invalid vendor data');
    });

    it('should return 400 for invalid vendor type', async () => {
      const vendorData = {
        name: 'Test Vendor',
        type: 'invalid-type'
      };

      const response = await request(server)
        .post('/api/vendors')
        .send(vendorData)
        .expect(400);

      expect(response.body.message).toContain('Invalid vendor data');
    });

    it('should handle empty email string correctly', async () => {
      const vendorData = {
        name: 'Test Vendor',
        type: 'supplier',
        email: ''
      };

      const response = await request(server)
        .post('/api/vendors')
        .send(vendorData)
        .expect(201);

      expect(response.body.name).toBe(vendorData.name);
    });
  });

  describe('GET /api/vendors', () => {
    it('should return empty array when no vendors exist', async () => {
      const response = await request(server)
        .get('/api/vendors')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return created vendors', async () => {
      // Create a vendor first
      const vendorData = {
        name: 'Test Vendor for Get',
        type: 'supplier'
      };

      await request(server)
        .post('/api/vendors')
        .send(vendorData)
        .expect(201);

      const response = await request(server)
        .get('/api/vendors')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const vendor = response.body.find((v: any) => v.name === vendorData.name);
      expect(vendor).toBeDefined();
      expect(vendor.type).toBe(vendorData.type);
    });
  });

  describe('PATCH /api/vendors/:id', () => {
    it('should update a vendor successfully', async () => {
      // Create a vendor first
      const vendorData = {
        name: 'Original Vendor',
        type: 'supplier'
      };

      const createResponse = await request(server)
        .post('/api/vendors')
        .send(vendorData)
        .expect(201);

      const vendorId = createResponse.body.id;

      // Update the vendor
      const updateData = {
        name: 'Updated Vendor',
        email: 'updated@vendor.com'
      };

      const updateResponse = await request(server)
        .patch(`/api/vendors/${vendorId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateData.name);
      expect(updateResponse.body.email).toBe(updateData.email);
      expect(updateResponse.body.type).toBe(vendorData.type); // Should retain original type
    });

    it('should return 404 for non-existent vendor', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        name: 'Updated Vendor'
      };

      await request(server)
        .patch(`/api/vendors/${fakeId}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/vendors/:id', () => {
    it('should delete a vendor successfully', async () => {
      // Create a vendor first
      const vendorData = {
        name: 'Vendor to Delete',
        type: 'contractor'
      };

      const createResponse = await request(server)
        .post('/api/vendors')
        .send(vendorData)
        .expect(201);

      const vendorId = createResponse.body.id;

      // Delete the vendor
      await request(server)
        .delete(`/api/vendors/${vendorId}`)
        .expect(204);

      // Verify it's deleted
      await request(server)
        .get(`/api/vendors/${vendorId}`)
        .expect(404);
    });

    it('should return 404 for non-existent vendor', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(server)
        .delete(`/api/vendors/${fakeId}`)
        .expect(404);
    });
  });
});