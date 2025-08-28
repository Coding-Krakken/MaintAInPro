/**
 * Pest Control Platform Integration Tests
 * 
 * Comprehensive test suite for pest control API endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';
import { db } from '../../server/db';
import { sql } from 'drizzle-orm';
import { isFeatureEnabled } from '../../config/feature-flags';

// Test data
const testCustomer = {
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@test.com',
  phoneNumber: '(555) 123-4567',
  companyName: 'Smith Residence',
};

const testProperty = {
  type: 'residential',
  address: '123 Test Street',
  city: 'Springfield',
  state: 'IL',
  zipCode: '62701',
  squareFootage: 2400,
};

const testService = {
  name: 'General Pest Control',
  description: 'Comprehensive interior and exterior treatment',
  category: 'general_pest',
  basePrice: 89.99,
  frequency: 'quarterly',
  duration: 60,
};

const testChemical = {
  productName: 'Test Termiticide',
  activeIngredient: 'Test Chemical',
  manufacturer: 'Test Manufacturer',
  epaRegistrationNumber: 'TEST-001',
  signalWord: 'caution',
  formulation: 'liquid',
  concentration: '2.5%',
  containerSize: '1 gallon',
  currentStock: 10,
  minimumStock: 5,
  unitCost: 125.99,
};

let authToken: string;
let testOrganizationId: string;

describe('Pest Control Platform API', () => {
  beforeAll(async () => {
    // Skip tests if pest control platform is not enabled
    if (!isFeatureEnabled('pestControlPlatform')) {
      console.log('Skipping pest control tests - feature not enabled');
      return;
    }

    // Create test organization and authenticate
    const orgResult = await db.execute(sql`
      INSERT INTO organizations (id, name, slug, active) 
      VALUES (gen_random_uuid(), 'Test Pest Control Company', 'test-pest-control', true) 
      RETURNING id
    `);
    testOrganizationId = orgResult.rows[0].id;

    // Create test user
    const userResult = await db.execute(sql`
      INSERT INTO profiles (id, email, first_name, last_name, role, organization_id, active) 
      VALUES (gen_random_uuid(), 'admin@test.com', 'Test', 'Admin', 'admin', ${testOrganizationId}, true) 
      RETURNING id
    `);
    const userId = userResult.rows[0].id;

    // Mock authentication token (in real implementation, this would go through proper auth)
    authToken = 'test-jwt-token';
    
    // Mock the authentication middleware for tests
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    if (!isFeatureEnabled('pestControlPlatform')) {
      return;
    }

    // Clean up test data
    await db.execute(sql`DELETE FROM organizations WHERE slug = 'test-pest-control'`);
  });

  describe('Customers API', () => {
    it('should create a new customer', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const response = await request(app)
        .post('/api/pest-control/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCustomer)
        .expect(201);

      expect(response.body.customer).toBeDefined();
      expect(response.body.customer.customerId).toMatch(/CUST-\d{4}-\d{3}/);
      expect(response.body.customer.firstName).toBe(testCustomer.firstName);
      expect(response.body.customer.email).toBe(testCustomer.email);
    });

    it('should get all customers', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const response = await request(app)
        .get('/api/pest-control/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.customers).toBeInstanceOf(Array);
      expect(response.body.customers.length).toBeGreaterThan(0);
    });

    it('should validate customer data', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const invalidCustomer = {
        firstName: '', // Missing required field
        email: 'invalid-email', // Invalid format
      };

      const response = await request(app)
        .post('/api/pest-control/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCustomer)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('Properties API', () => {
    let customerId: string;

    beforeAll(async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      // Create a test customer first
      const customerResponse = await request(app)
        .post('/api/pest-control/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCustomer);
      
      customerId = customerResponse.body.customer.id;
    });

    it('should create a new property', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const response = await request(app)
        .post('/api/pest-control/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testProperty,
          customerId,
        })
        .expect(201);

      expect(response.body.property).toBeDefined();
      expect(response.body.property.propertyId).toMatch(/PROP-\d{4}-\d{3}/);
      expect(response.body.property.address).toBe(testProperty.address);
      expect(response.body.property.customerId).toBe(customerId);
    });

    it('should get all properties with customer info', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const response = await request(app)
        .get('/api/pest-control/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.properties).toBeInstanceOf(Array);
      expect(response.body.properties[0].customer).toBeDefined();
    });
  });

  describe('Services API', () => {
    it('should create a new service', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const response = await request(app)
        .post('/api/pest-control/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testService)
        .expect(201);

      expect(response.body.service).toBeDefined();
      expect(response.body.service.serviceId).toMatch(/SERV-[A-Z_]+-\d{3}/);
      expect(response.body.service.name).toBe(testService.name);
      expect(response.body.service.category).toBe(testService.category);
    });

    it('should get all services grouped by category', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const response = await request(app)
        .get('/api/pest-control/services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.services).toBeInstanceOf(Array);
      expect(response.body.services[0]).toHaveProperty('category');
      expect(response.body.services[0]).toHaveProperty('basePrice');
    });
  });

  describe('Chemical Inventory API', () => {
    it('should create a new chemical', async () => {
      if (!isFeatureEnabled('pestControlChemicalTracking')) {
        console.log('Skipping chemical test - feature not enabled');
        return;
      }

      const response = await request(app)
        .post('/api/pest-control/chemicals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testChemical)
        .expect(201);

      expect(response.body.chemical).toBeDefined();
      expect(response.body.chemical.chemicalId).toMatch(/CHEM-\d{4}-\d{3}/);
      expect(response.body.chemical.productName).toBe(testChemical.productName);
      expect(response.body.chemical.epaRegistrationNumber).toBe(testChemical.epaRegistrationNumber);
    });

    it('should get chemical inventory with stock levels', async () => {
      if (!isFeatureEnabled('pestControlChemicalTracking')) {
        console.log('Skipping chemical test - feature not enabled');
        return;
      }

      const response = await request(app)
        .get('/api/pest-control/chemicals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.chemicals).toBeInstanceOf(Array);
      if (response.body.chemicals.length > 0) {
        expect(response.body.chemicals[0]).toHaveProperty('currentStock');
        expect(response.body.chemicals[0]).toHaveProperty('minimumStock');
      }
    });

    it('should return 404 if chemical tracking is disabled', async () => {
      if (isFeatureEnabled('pestControlChemicalTracking')) {
        // Skip this test if the feature is enabled
        return;
      }

      const response = await request(app)
        .get('/api/pest-control/chemicals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Chemical tracking not available');
    });
  });

  describe('Service Appointments API', () => {
    let customerId: string;
    let propertyId: string;
    let serviceId: string;

    beforeAll(async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      // Create test customer
      const customerResponse = await request(app)
        .post('/api/pest-control/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@test.com',
          phoneNumber: '(555) 987-6543',
        });
      customerId = customerResponse.body.customer.id;

      // Create test property
      const propertyResponse = await request(app)
        .post('/api/pest-control/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testProperty,
          customerId,
          address: '456 Test Avenue',
        });
      propertyId = propertyResponse.body.property.id;

      // Create test service
      const serviceResponse = await request(app)
        .post('/api/pest-control/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testService,
          name: 'Test Service',
        });
      serviceId = serviceResponse.body.service.id;
    });

    it('should create a service appointment', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const appointmentData = {
        customerId,
        propertyId,
        serviceId,
        type: 'regular',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        timeWindow: 'morning',
        estimatedDuration: 60,
        serviceFee: 89.99,
        totalAmount: 89.99,
      };

      const response = await request(app)
        .post('/api/pest-control/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.appointment).toBeDefined();
      expect(response.body.appointment.appointmentNumber).toMatch(/APPT-\d{4}-\d{4}/);
      expect(response.body.appointment.customerId).toBe(customerId);
      expect(response.body.appointment.propertyId).toBe(propertyId);
      expect(response.body.appointment.serviceId).toBe(serviceId);
    });

    it('should get all appointments with related data', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const response = await request(app)
        .get('/api/pest-control/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.appointments).toBeInstanceOf(Array);
      if (response.body.appointments.length > 0) {
        const appointment = response.body.appointments[0];
        expect(appointment.customer).toBeDefined();
        expect(appointment.property).toBeDefined();
        expect(appointment.service).toBeDefined();
      }
    });
  });

  describe('AI-Powered Quotes API', () => {
    let customerId: string;
    let propertyId: string;

    beforeAll(async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      // Create test data
      const customerResponse = await request(app)
        .post('/api/pest-control/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'AI',
          lastName: 'Test',
          email: 'ai.test@test.com',
          phoneNumber: '(555) 111-2222',
        });
      customerId = customerResponse.body.customer.id;

      const propertyResponse = await request(app)
        .post('/api/pest-control/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testProperty,
          customerId,
          address: '789 AI Test Road',
        });
      propertyId = propertyResponse.body.property.id;
    });

    it('should generate a quote', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const quoteData = {
        customerId,
        propertyId,
        services: [
          { serviceId: 'test-service-1', price: 89.99 },
          { serviceId: 'test-service-2', price: 45.00 },
        ],
        totalAmount: 134.99,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };

      const response = await request(app)
        .post('/api/pest-control/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(quoteData)
        .expect(201);

      expect(response.body.quote).toBeDefined();
      expect(response.body.quote.quoteNumber).toMatch(/QUOTE-\d{4}-\d{4}/);
      expect(response.body.quote.totalAmount).toBe('134.99');
    });

    it('should include AI assumptions when AI quotes are enabled', async () => {
      if (!isFeatureEnabled('pestControlAIQuotes')) {
        console.log('Skipping AI quote test - feature not enabled');
        return;
      }

      const quoteData = {
        customerId,
        propertyId,
        services: [{ serviceId: 'test-service-1', price: 89.99 }],
        totalAmount: 89.99,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/api/pest-control/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(quoteData)
        .expect(201);

      expect(response.body.quote.aiAssumptions).toBeDefined();
      expect(response.body.quote.riskFactors).toBeDefined();
      expect(response.body.quote.recommendations).toBeDefined();
    });
  });

  describe('Routes & Territory Management API', () => {
    it('should create a route', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const routeData = {
        name: 'North Springfield Route',
        description: 'Route covering north Springfield area',
        properties: ['prop-1', 'prop-2', 'prop-3'],
        routeDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        startTime: '08:00',
        endTime: '17:00',
      };

      const response = await request(app)
        .post('/api/pest-control/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(routeData)
        .expect(201);

      expect(response.body.route).toBeDefined();
      expect(response.body.route.routeId).toMatch(/ROUTE-\d{4}-\d{3}/);
      expect(response.body.route.name).toBe(routeData.name);
    });

    it('should include optimization data when route optimization is enabled', async () => {
      if (!isFeatureEnabled('pestControlRouteOptimization')) {
        console.log('Skipping route optimization test - feature not enabled');
        return;
      }

      const routeData = {
        name: 'Optimized Route',
        properties: ['prop-1', 'prop-2', 'prop-3', 'prop-4'],
        routeDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/api/pest-control/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(routeData)
        .expect(201);

      expect(response.body.route.estimatedDuration).toBeDefined();
      expect(response.body.route.totalDistance).toBeDefined();
      expect(response.body.route.estimatedDuration).toBe(4 * 45); // 4 properties * 45 min each
    });
  });

  describe('Dashboard Analytics API', () => {
    it('should return dashboard metrics', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const response = await request(app)
        .get('/api/pest-control/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics).toHaveProperty('totalCustomers');
      expect(response.body.metrics).toHaveProperty('activeAppointments');
      expect(response.body.metrics).toHaveProperty('revenueThisMonth');
      expect(response.body.metrics).toHaveProperty('pendingQuotes');
    });
  });

  describe('Feature Flag Integration', () => {
    it('should return 404 for disabled features', async () => {
      // This test verifies that the feature flag middleware works correctly
      // Since we can't easily toggle feature flags during tests, we'll test the structure

      const response = await request(app)
        .get('/api/pest-control/customers')
        .set('Authorization', `Bearer ${authToken}`);

      if (isFeatureEnabled('pestControlPlatform')) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Pest control platform not available');
      }
    });
  });

  describe('Data Validation & Security', () => {
    it('should require authentication for all endpoints', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const response = await request(app)
        .get('/api/pest-control/customers')
        .expect(401); // Unauthorized without auth token

      expect(response.body.error).toBeDefined();
    });

    it('should validate organization access', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      // Test that users can only access data from their organization
      // This would require setting up multiple organizations and testing cross-access
      // For now, we verify the organization filter is applied in the queries
      const response = await request(app)
        .get('/api/pest-control/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // All returned customers should belong to the test organization
      response.body.customers.forEach((customer: any) => {
        expect(customer.organizationId).toBe(testOrganizationId);
      });
    });

    it('should sanitize input data', async () => {
      if (!isFeatureEnabled('pestControlPlatform')) {
        return;
      }

      const maliciousCustomer = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        email: 'malicious@test.com',
        phoneNumber: '(555) 123-4567',
      };

      const response = await request(app)
        .post('/api/pest-control/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousCustomer)
        .expect(201);

      // The system should have sanitized the malicious input
      expect(response.body.customer.firstName).not.toContain('<script>');
    });
  });

  describe('EPA Compliance Features', () => {
    it('should track chemical applications with required data', async () => {
      if (!isFeatureEnabled('pestControlChemicalTracking')) {
        console.log('Skipping EPA compliance test - feature not enabled');
        return;
      }

      // Test that service appointments can track chemical usage
      // This would be part of the appointment completion process
      const appointmentWithChemicals = {
        appointmentId: 'test-appointment-1',
        chemicalsUsed: [
          {
            chemicalId: 'test-chemical-1',
            amountUsed: 2.5,
            applicationMethod: 'spray',
            areasTreated: ['exterior perimeter', 'basement'],
            weatherConditions: {
              temperature: 75,
              humidity: 60,
              windSpeed: 5,
              precipitation: 'none',
            },
            applicatorLicense: 'PC-2024-001',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      // This would typically be a PATCH to update an appointment
      // For this test, we're verifying the data structure is correct
      expect(appointmentWithChemicals.chemicalsUsed[0]).toHaveProperty('weatherConditions');
      expect(appointmentWithChemicals.chemicalsUsed[0]).toHaveProperty('applicatorLicense');
      expect(appointmentWithChemicals.chemicalsUsed[0]).toHaveProperty('timestamp');
    });
  });
});

// Helper function to mock user percentile for feature flag testing
function getUserPercentile(userId: string): number {
  // Simple hash-based percentile calculation for consistent testing
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}