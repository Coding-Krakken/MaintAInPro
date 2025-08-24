import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

describe.skip('Vendor API Integration Tests - Quarantined due to authentication setup issues', () => {
  let server: any;

  beforeAll(async () => {
    // Import and initialize the server
    const { initializeApp } = await import('../../server/index');
    server = await initializeApp();
  });

  afterAll(async () => {
    // Clean up if needed
    if (server && server.close) {
      server.close();
    }
  });

  // Helper function to make authenticated requests
  const authRequest = (method: string, url: string) => {
    return request(server)[method](url).set('Authorization', 'Bearer mock-token');
  };

  describe('POST /api/vendors', () => {
    it('should create a vendor successfully with valid data', async () => {
      const vendorData = {
        name: 'Test Vendor',
        type: 'supplier',
        email: 'test@vendor.com',
        phone: '555-1234',
        address: '123 Test St',
        contactPerson: 'John Doe',
      };

      const response = await authRequest('post', '/api/vendors').send(vendorData).expect(201);

      expect(response.body).toMatchObject({
        name: vendorData.name,
        type: vendorData.type,
        email: vendorData.email,
        phone: vendorData.phone,
        address: vendorData.address,
        contactPerson: vendorData.contactPerson,
        active: true,
      });
      expect(response.body.id).toBeDefined();
    });

    it('should create a vendor with minimal data', async () => {
      const vendorData = {
        name: 'Minimal Vendor',
        type: 'contractor',
      };

      const response = await authRequest('post', '/api/vendors').send(vendorData).expect(201);

      expect(response.body).toMatchObject({
        name: vendorData.name,
        type: vendorData.type,
        active: true,
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const vendorData = {
        email: 'test@vendor.com',
        // Missing required 'name' field
      };

      const response = await authRequest('post', '/api/vendors').send(vendorData).expect(400);

      expect(response.body.message).toContain('Invalid vendor data');
    });

    it('should return 400 for invalid email format', async () => {
      const vendorData = {
        name: 'Test Vendor',
        type: 'supplier',
        email: 'invalid-email',
      };

      const response = await authRequest('post', '/api/vendors').send(vendorData).expect(400);

      expect(response.body.message).toContain('Invalid vendor data');
    });

    it('should return 400 for invalid vendor type', async () => {
      const vendorData = {
        name: 'Test Vendor',
        type: 'invalid-type',
      };

      const response = await authRequest('post', '/api/vendors').send(vendorData).expect(400);

      expect(response.body.message).toContain('Invalid vendor data');
    });

    it('should handle empty email string correctly', async () => {
      const vendorData = {
        name: 'Test Vendor',
        type: 'supplier',
        email: '',
      };

      const response = await authRequest('post', '/api/vendors').send(vendorData).expect(201);

      expect(response.body.name).toBe(vendorData.name);
    });
  });

  describe('GET /api/vendors', () => {
    it('should return empty array when no vendors exist', async () => {
      const response = await authRequest('get', '/api/vendors').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return created vendors', async () => {
      // Create a vendor first
      const vendorData = {
        name: 'Test Vendor for Get',
        type: 'supplier',
      };

      await authRequest('post', '/api/vendors').send(vendorData).expect(201);

      const response = await authRequest('get', '/api/vendors').expect(200);

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
        type: 'supplier',
      };

      const createResponse = await authRequest('post', '/api/vendors').send(vendorData).expect(201);

      const vendorId = createResponse.body.id;

      // Update the vendor
      const updateData = {
        name: 'Updated Vendor',
        email: 'updated@vendor.com',
      };

      const updateResponse = await authRequest('patch', `/api/vendors/${vendorId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateData.name);
      expect(updateResponse.body.email).toBe(updateData.email);
      expect(updateResponse.body.type).toBe(vendorData.type); // Should retain original type
    });

    it('should return 404 for non-existent vendor', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        name: 'Updated Vendor',
      };

      await authRequest('patch', `/api/vendors/${fakeId}`).send(updateData).expect(404);
    });
  });

  describe('DELETE /api/vendors/:id', () => {
    it('should delete a vendor successfully', async () => {
      // Create a vendor first
      const vendorData = {
        name: 'Vendor to Delete',
        type: 'contractor',
      };

      const createResponse = await authRequest('post', '/api/vendors').send(vendorData).expect(201);

      const vendorId = createResponse.body.id;

      // Delete the vendor
      await authRequest('delete', `/api/vendors/${vendorId}`).expect(204);

      // Verify it's deleted
      await authRequest('get', `/api/vendors/${vendorId}`).expect(404);
    });

    it('should return 404 for non-existent vendor', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await authRequest('delete', `/api/vendors/${fakeId}`).expect(404);
    });
  });
});
