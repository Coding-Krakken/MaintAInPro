/**
 * Pest Control Platform API Routes
 * 
 * Comprehensive API endpoints for the enterprise-grade pest control platform
 */

import express from 'express';
import { db } from '../server/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  customers,
  properties,
  services,
  chemicals,
  serviceAppointments,
  quotes,
  routes,
  insertCustomerSchema,
  insertPropertySchema,
  insertServiceSchema,
  insertChemicalSchema,
  insertServiceAppointmentSchema,
  insertQuoteSchema,
  insertRouteSchema,
} from '../shared/pest-control-schema';
import { profiles, organizations } from '../shared/schema';
import { isFeatureEnabled } from '../config/feature-flags';
import { AuthenticatedRequest } from '../shared/types/auth';
import { z } from 'zod';

const router = express.Router();

// Feature flag middleware
const pestControlGuard = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  if (!isFeatureEnabled('pestControlPlatform')) {
    return res.status(404).json({ error: 'Pest control platform not available' });
  }
  next();
};

// Apply feature guard to all routes
router.use(pestControlGuard);

// ============================================================================
// CUSTOMERS API
// ============================================================================

/**
 * @swagger
 * /api/pest-control/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Pest Control - Customers]
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get('/customers', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const customerList = await db
      .select({
        id: customers.id,
        customerId: customers.customerId,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        phoneNumber: customers.phoneNumber,
        companyName: customers.companyName,
        status: customers.status,
        loyaltyTier: customers.loyaltyTier,
        accountBalance: customers.accountBalance,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(eq(customers.organizationId, organizationId))
      .orderBy(desc(customers.createdAt));

    res.json({ customers: customerList });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * @swagger
 * /api/pest-control/customers:
 *   post:
 *     summary: Create new customer
 *     tags: [Pest Control - Customers]
 */
router.post('/customers', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const validatedData = insertCustomerSchema.parse({
      ...req.body,
      organizationId,
      createdBy: req.user?.id,
    });

    // Generate customer ID
    const customerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.organizationId, organizationId));
    
    const customerNumber = (customerCount[0]?.count || 0) + 1;
    (validatedData as any).customerId = `CUST-${new Date().getFullYear()}-${customerNumber.toString().padStart(3, '0')}`;

    const [newCustomer] = await db.insert(customers).values(validatedData).returning();
    
    res.status(201).json({ customer: newCustomer });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

/**
 * @swagger
 * /api/pest-control/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Pest Control - Customers]
 */
router.get('/customers/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.id, req.params.id),
        eq(customers.organizationId, organizationId)
      ));

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// ============================================================================
// PROPERTIES API
// ============================================================================

/**
 * @swagger
 * /api/pest-control/properties:
 *   get:
 *     summary: Get all properties
 *     tags: [Pest Control - Properties]
 */
router.get('/properties', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const propertiesList = await db
      .select({
        property: properties,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          companyName: customers.companyName,
        },
      })
      .from(properties)
      .leftJoin(customers, eq(properties.customerId, customers.id))
      .where(eq(properties.organizationId, organizationId))
      .orderBy(desc(properties.createdAt));

    res.json({ properties: propertiesList });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

/**
 * @swagger
 * /api/pest-control/properties:
 *   post:
 *     summary: Create new property
 *     tags: [Pest Control - Properties]
 */
router.post('/properties', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const validatedData = insertPropertySchema.parse({
      ...req.body,
      organizationId,
      createdBy: req.user?.id,
    });

    // Generate property ID
    const propertyCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(eq(properties.organizationId, organizationId));
    
    const propertyNumber = (propertyCount[0]?.count || 0) + 1;
    (validatedData as any).propertyId = `PROP-${new Date().getFullYear()}-${propertyNumber.toString().padStart(3, '0')}`;

    const [newProperty] = await db.insert(properties).values(validatedData).returning();
    
    res.status(201).json({ property: newProperty });
  } catch (error) {
    console.error('Error creating property:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// ============================================================================
// SERVICES API
// ============================================================================

/**
 * @swagger
 * /api/pest-control/services:
 *   get:
 *     summary: Get all pest control services
 *     tags: [Pest Control - Services]
 */
router.get('/services', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const servicesList = await db
      .select()
      .from(services)
      .where(eq(services.organizationId, organizationId))
      .orderBy(services.category, services.name);

    res.json({ services: servicesList });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

/**
 * @swagger
 * /api/pest-control/services:
 *   post:
 *     summary: Create new service
 *     tags: [Pest Control - Services]
 */
router.post('/services', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const validatedData = insertServiceSchema.parse({
      ...req.body,
      organizationId,
      createdBy: req.user?.id,
    });

    // Generate service ID
    const serviceCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(eq(services.organizationId, organizationId));
    
    const serviceNumber = (serviceCount[0]?.count || 0) + 1;
    (validatedData as any).serviceId = `SERV-${req.body.category.toUpperCase()}-${serviceNumber.toString().padStart(3, '0')}`;

    const [newService] = await db.insert(services).values(validatedData).returning();
    
    res.status(201).json({ service: newService });
  } catch (error) {
    console.error('Error creating service:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// ============================================================================
// CHEMICALS API (EPA-Compliant)
// ============================================================================

/**
 * @swagger
 * /api/pest-control/chemicals:
 *   get:
 *     summary: Get chemical inventory
 *     tags: [Pest Control - Chemicals]
 */
router.get('/chemicals', async (req: AuthenticatedRequest, res) => {
  try {
    if (!isFeatureEnabled('pestControlChemicalTracking')) {
      return res.status(404).json({ error: 'Chemical tracking not available' });
    }

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const chemicalsList = await db
      .select()
      .from(chemicals)
      .where(eq(chemicals.organizationId, organizationId))
      .orderBy(chemicals.productName);

    res.json({ chemicals: chemicalsList });
  } catch (error) {
    console.error('Error fetching chemicals:', error);
    res.status(500).json({ error: 'Failed to fetch chemicals' });
  }
});

/**
 * @swagger
 * /api/pest-control/chemicals:
 *   post:
 *     summary: Add new chemical to inventory
 *     tags: [Pest Control - Chemicals]
 */
router.post('/chemicals', async (req: AuthenticatedRequest, res) => {
  try {
    if (!isFeatureEnabled('pestControlChemicalTracking')) {
      return res.status(404).json({ error: 'Chemical tracking not available' });
    }

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const validatedData = insertChemicalSchema.parse({
      ...req.body,
      organizationId,
      createdBy: req.user?.id,
    });

    // Generate chemical ID
    const chemicalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(chemicals)
      .where(eq(chemicals.organizationId, organizationId));
    
    const chemicalNumber = (chemicalCount[0]?.count || 0) + 1;
    (validatedData as any).chemicalId = `CHEM-${new Date().getFullYear()}-${chemicalNumber.toString().padStart(3, '0')}`;

    const [newChemical] = await db.insert(chemicals).values(validatedData).returning();
    
    res.status(201).json({ chemical: newChemical });
  } catch (error) {
    console.error('Error creating chemical:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create chemical' });
  }
});

// ============================================================================
// SERVICE APPOINTMENTS API
// ============================================================================

/**
 * @swagger
 * /api/pest-control/appointments:
 *   get:
 *     summary: Get service appointments
 *     tags: [Pest Control - Appointments]
 */
router.get('/appointments', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const appointmentsList = await db
      .select({
        appointment: serviceAppointments,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          companyName: customers.companyName,
        },
        property: {
          id: properties.id,
          address: properties.address,
          city: properties.city,
          state: properties.state,
        },
        service: {
          id: services.id,
          name: services.name,
          category: services.category,
        },
        technician: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
        },
      })
      .from(serviceAppointments)
      .leftJoin(customers, eq(serviceAppointments.customerId, customers.id))
      .leftJoin(properties, eq(serviceAppointments.propertyId, properties.id))
      .leftJoin(services, eq(serviceAppointments.serviceId, services.id))
      .leftJoin(profiles, eq(serviceAppointments.assignedTechnician, profiles.id))
      .where(eq(serviceAppointments.organizationId, organizationId))
      .orderBy(serviceAppointments.scheduledDate);

    res.json({ appointments: appointmentsList });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * @swagger
 * /api/pest-control/appointments:
 *   post:
 *     summary: Create new service appointment
 *     tags: [Pest Control - Appointments]
 */
router.post('/appointments', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const validatedData = insertServiceAppointmentSchema.parse({
      ...req.body,
      organizationId,
      createdBy: req.user?.id,
    });

    // Generate appointment number
    const appointmentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceAppointments)
      .where(eq(serviceAppointments.organizationId, organizationId));
    
    const appointmentNumber = (appointmentCount[0]?.count || 0) + 1;
    (validatedData as any).appointmentNumber = `APPT-${new Date().getFullYear()}-${appointmentNumber.toString().padStart(4, '0')}`;

    const [newAppointment] = await db.insert(serviceAppointments).values(validatedData).returning();
    
    res.status(201).json({ appointment: newAppointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// ============================================================================
// QUOTES API (AI-Powered)
// ============================================================================

/**
 * @swagger
 * /api/pest-control/quotes:
 *   post:
 *     summary: Generate AI-powered quote
 *     tags: [Pest Control - Quotes]
 */
router.post('/quotes', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const validatedData = insertQuoteSchema.parse({
      ...req.body,
      organizationId,
      createdBy: req.user?.id,
    });

    // Generate quote number
    const quoteCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(eq(quotes.organizationId, organizationId));
    
    const quoteNumber = (quoteCount[0]?.count || 0) + 1;
    (validatedData as any).quoteNumber = `QUOTE-${new Date().getFullYear()}-${quoteNumber.toString().padStart(4, '0')}`;

    // AI-powered quote generation (placeholder for actual AI integration)
    if (isFeatureEnabled('pestControlAIQuotes')) {
      // TODO: Integrate with AI service for quote generation
      (validatedData as any).aiAssumptions = {
        propertySize: 'estimated from square footage',
        pestPressure: 'moderate based on location',
        accessLevel: 'standard access assumed',
      };
      
      (validatedData as any).riskFactors = [
        { factor: 'Location proximity to water', impact: 'medium' },
        { factor: 'Construction type', impact: 'low' },
      ];
      
      (validatedData as any).recommendations = [
        'Initial treatment with quarterly maintenance',
        'Focus on perimeter treatment',
        'Interior monitoring stations recommended',
      ];
    }

    const [newQuote] = await db.insert(quotes).values(validatedData).returning();
    
    res.status(201).json({ quote: newQuote });
  } catch (error) {
    console.error('Error creating quote:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// ============================================================================
// ROUTES API (Territory Management)
// ============================================================================

/**
 * @swagger
 * /api/pest-control/routes:
 *   get:
 *     summary: Get technician routes
 *     tags: [Pest Control - Routes]
 */
router.get('/routes', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const routesList = await db
      .select({
        route: routes,
        technician: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
        },
      })
      .from(routes)
      .leftJoin(profiles, eq(routes.assignedTechnician, profiles.id))
      .where(eq(routes.organizationId, organizationId))
      .orderBy(routes.routeDate);

    res.json({ routes: routesList });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

/**
 * @swagger
 * /api/pest-control/routes:
 *   post:
 *     summary: Create optimized route
 *     tags: [Pest Control - Routes]
 */
router.post('/routes', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const validatedData = insertRouteSchema.parse({
      ...req.body,
      organizationId,
      createdBy: req.user?.id,
    });

    // Generate route ID
    const routeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(routes)
      .where(eq(routes.organizationId, organizationId));
    
    const routeNumber = (routeCount[0]?.count || 0) + 1;
    (validatedData as any).routeId = `ROUTE-${new Date().getFullYear()}-${routeNumber.toString().padStart(3, '0')}`;

    // Route optimization (placeholder for actual optimization algorithm)
    if (isFeatureEnabled('pestControlRouteOptimization')) {
      // TODO: Integrate with Google Maps API or other route optimization service
      // For now, just calculate estimated duration based on property count
      const propertyCount = Array.isArray((validatedData as any).properties) ? (validatedData as any).properties.length : 0;
      (validatedData as any).estimatedDuration = propertyCount * 45; // 45 minutes per property average
      (validatedData as any).totalDistance = propertyCount * 5.2; // Average 5.2 miles between properties
    }

    const [newRoute] = await db.insert(routes).values(validatedData).returning();
    
    res.status(201).json({ route: newRoute });
  } catch (error) {
    console.error('Error creating route:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

/**
 * @swagger
 * /api/pest-control/dashboard:
 *   get:
 *     summary: Get pest control dashboard metrics
 *     tags: [Pest Control - Dashboard]
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get key metrics
    const [customerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.organizationId, organizationId));

    const [activeAppointments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceAppointments)
      .where(and(
        eq(serviceAppointments.organizationId, organizationId),
        sql`${serviceAppointments.status} IN ('scheduled', 'confirmed', 'en_route', 'in_progress')`
      ));

    const [revenueThisMonth] = await db
      .select({ total: sql<number>`COALESCE(SUM(${serviceAppointments.totalAmount}), 0)` })
      .from(serviceAppointments)
      .where(and(
        eq(serviceAppointments.organizationId, organizationId),
        eq(serviceAppointments.paymentStatus, 'paid'),
        sql`DATE_TRUNC('month', ${serviceAppointments.createdAt}) = DATE_TRUNC('month', CURRENT_DATE)`
      ));

    const [pendingQuotes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(and(
        eq(quotes.organizationId, organizationId),
        sql`${quotes.status} IN ('sent', 'viewed')`
      ));

    res.json({
      metrics: {
        totalCustomers: customerCount.count,
        activeAppointments: activeAppointments.count,
        revenueThisMonth: revenueThisMonth.total,
        pendingQuotes: pendingQuotes.count,
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

export default router;