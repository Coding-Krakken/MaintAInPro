/**
 * Pest Control Domain Schema
 * 
 * Extends the existing CMMS infrastructure to support pest control operations.
 * This schema works alongside the existing schema without disruption.
 */

import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { organizations, profiles } from './schema';

// Pest Control Customer Properties (extends the equipment concept for pest control locations)
export const properties = pgTable('properties', {
  id: uuid('id').primaryKey(),
  propertyId: text('property_id').notNull().unique(), // Customer-facing ID like "PROP-2024-001"
  type: text('type')
    .notNull()
    .$type<'residential' | 'commercial' | 'industrial' | 'agricultural'>(),
  address: text('address').notNull(),
  addressLine2: text('address_line_2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  coordinates: jsonb('coordinates'), // { lat: number, lng: number }
  
  // Property characteristics
  squareFootage: integer('square_footage'),
  lotSize: decimal('lot_size', { precision: 10, scale: 2 }),
  constructionType: text('construction_type'), // wood, concrete, brick, etc.
  landscaping: jsonb('landscaping'), // Description of surrounding area
  accessInstructions: text('access_instructions'),
  
  // Pest-related information
  knownPestHistory: jsonb('known_pest_history'), // Previous pest issues
  sensitiveSites: jsonb('sensitive_sites'), // Children, pets, food areas
  restrictedAreas: jsonb('restricted_areas'), // Areas to avoid or require special care
  
  // Service preferences
  preferredServiceTimes: jsonb('preferred_service_times'), // Available time windows
  keyLocation: text('key_location'),
  emergencyContact: text('emergency_contact'),
  
  // Status and metadata
  status: text('status').$type<'active' | 'inactive' | 'suspended' | 'terminated'>().default('active'),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  primaryTechnician: uuid('primary_technician').references(() => profiles.id),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => profiles.id),
  updatedBy: uuid('updated_by').references(() => profiles.id),
});

// Pest Control Customers (distinct from internal users/profiles)
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey(),
  customerId: text('customer_id').notNull().unique(), // Customer-facing ID like "CUST-2024-001"
  
  // Contact information
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phoneNumber: text('phone_number').notNull(),
  alternatePhone: text('alternate_phone'),
  
  // Business information (for commercial customers)
  companyName: text('company_name'),
  businessType: text('business_type'),
  
  // Account details
  status: text('status').$type<'active' | 'inactive' | 'suspended' | 'terminated'>().default('active'),
  accountBalance: decimal('account_balance', { precision: 10, scale: 2 }).default('0.00'),
  creditLimit: decimal('credit_limit', { precision: 10, scale: 2 }).default('500.00'),
  
  // Service preferences
  communicationPreferences: jsonb('communication_preferences'), // email, sms, phone, etc.
  billingPreferences: jsonb('billing_preferences'), // payment method, schedule, etc.
  serviceNotes: text('service_notes'),
  
  // Relationship management
  leadSource: text('lead_source'), // How they found us
  referredBy: uuid('referred_by').references(() => customers.id),
  loyaltyTier: text('loyalty_tier').$type<'bronze' | 'silver' | 'gold' | 'platinum'>().default('bronze'),
  
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => profiles.id),
  updatedBy: uuid('updated_by').references(() => profiles.id),
});

// Pest Control Services (templates for what can be provided)
export const services = pgTable('services', {
  id: uuid('id').primaryKey(),
  serviceId: text('service_id').notNull().unique(), // Service SKU like "SERV-ANT-001"
  
  // Service details
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull().$type<
    'general_pest' | 'rodent' | 'termite' | 'ant' | 'wasp' | 'bed_bug' | 
    'wildlife' | 'lawn_care' | 'mosquito' | 'flea_tick' | 'inspection'
  >(),
  
  // Pricing
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  frequency: text('frequency').$type<'one_time' | 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'annual'>(),
  duration: integer('duration'), // Expected duration in minutes
  
  // Service characteristics
  requiredChemicals: jsonb('required_chemicals'), // List of chemical IDs typically used
  requiredEquipment: jsonb('required_equipment'), // List of equipment needed
  skillRequirements: jsonb('skill_requirements'), // Required certifications/skills
  
  // Compliance and safety
  epaRegistration: text('epa_registration'),
  safetyDataSheet: text('safety_data_sheet'), // Link to SDS
  ppeRequirements: jsonb('ppe_requirements'), // Required personal protective equipment
  
  // Service specifications
  treatmentAreas: jsonb('treatment_areas'), // Interior, exterior, basement, etc.
  methodOfApplication: text('method_of_application'), // spray, bait, trap, etc.
  weatherRestrictions: jsonb('weather_restrictions'), // Conditions that prevent service
  
  status: text('status').$type<'active' | 'inactive' | 'seasonal'>().default('active'),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => profiles.id),
  updatedBy: uuid('updated_by').references(() => profiles.id),
});

// Chemical Inventory (extends parts concept for pest control chemicals)
export const chemicals = pgTable('chemicals', {
  id: uuid('id').primaryKey(),
  chemicalId: text('chemical_id').notNull().unique(), // Chemical SKU like "CHEM-2024-001"
  
  // Basic information
  productName: text('product_name').notNull(),
  activeIngredient: text('active_ingredient').notNull(),
  manufacturer: text('manufacturer').notNull(),
  
  // Regulatory information
  epaRegistrationNumber: text('epa_registration_number').notNull(),
  signalWord: text('signal_word').$type<'danger' | 'warning' | 'caution'>(),
  restrictedUseClass: text('restricted_use_class'),
  
  // Physical properties
  formulation: text('formulation').$type<'liquid' | 'granular' | 'dust' | 'bait' | 'aerosol' | 'foam'>(),
  concentration: text('concentration'), // e.g., "2.5%", "25% WP"
  containerSize: text('container_size'), // e.g., "1 gallon", "50 lb bag"
  
  // Inventory management
  currentStock: integer('current_stock').default(0),
  minimumStock: integer('minimum_stock').default(0),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  
  // Usage tracking
  applicationRate: text('application_rate'), // per gallon, per 1000 sq ft, etc.
  mixRatio: text('mix_ratio'), // dilution instructions
  
  // Safety and compliance
  safetyDataSheet: text('safety_data_sheet_url'),
  productLabel: text('product_label_url'),
  storageRequirements: text('storage_requirements'),
  disposalInstructions: text('disposal_instructions'),
  
  // Lot tracking for compliance
  lotNumber: text('lot_number'),
  expirationDate: timestamp('expiration_date'),
  dateReceived: timestamp('date_received'),
  
  status: text('status').$type<'active' | 'restricted' | 'recalled' | 'expired'>().default('active'),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => profiles.id),
  updatedBy: uuid('updated_by').references(() => profiles.id),
});

// Service Appointments (extends work orders for pest control)
export const serviceAppointments = pgTable('service_appointments', {
  id: uuid('id').primaryKey(),
  appointmentNumber: text('appointment_number').notNull().unique(), // Customer-facing ID
  
  // Appointment details
  type: text('type').$type<'initial' | 'regular' | 'follow_up' | 'emergency' | 'inspection'>(),
  status: text('status').$type<
    'scheduled' | 'confirmed' | 'en_route' | 'in_progress' | 'completed' | 
    'cancelled' | 'rescheduled' | 'no_show'
  >().default('scheduled'),
  
  // Relationships
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  propertyId: uuid('property_id').references(() => properties.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  assignedTechnician: uuid('assigned_technician').references(() => profiles.id),
  
  // Scheduling
  scheduledDate: timestamp('scheduled_date').notNull(),
  timeWindow: text('time_window'), // "8:00-10:00", "AM", "PM"
  estimatedDuration: integer('estimated_duration'), // minutes
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  
  // Service details
  serviceNotes: text('service_notes'),
  customerRequests: text('customer_requests'),
  pestIssuesFound: jsonb('pest_issues_found'), // What pests were identified
  
  // Treatment information
  treatmentPerformed: jsonb('treatment_performed'), // Areas treated, methods used
  chemicalsUsed: jsonb('chemicals_used'), // List of chemical applications with amounts
  equipmentUsed: jsonb('equipment_used'), // Tools/equipment used
  
  // Results and follow-up
  treatmentEffectiveness: text('treatment_effectiveness').$type<'excellent' | 'good' | 'fair' | 'poor'>(),
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: timestamp('follow_up_date'),
  nextServiceDate: timestamp('next_service_date'),
  
  // Compliance
  weatherConditions: jsonb('weather_conditions'), // Temperature, wind, precipitation
  applicationLog: jsonb('application_log'), // Detailed EPA-compliant application records
  
  // Customer interaction
  customerPresent: boolean('customer_present').default(false),
  customerSignature: text('customer_signature'), // Digital signature or URL
  customerFeedback: text('customer_feedback'),
  customerRating: integer('customer_rating'), // 1-5 stars
  
  // Financial
  serviceFee: decimal('service_fee', { precision: 10, scale: 2 }),
  additionalCharges: jsonb('additional_charges'), // Extra services, materials, etc.
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
  paymentMethod: text('payment_method').$type<'cash' | 'check' | 'card' | 'autopay' | 'invoice'>(),
  paymentStatus: text('payment_status').$type<'pending' | 'paid' | 'failed' | 'refunded'>().default('pending'),
  
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => profiles.id),
  updatedBy: uuid('updated_by').references(() => profiles.id),
});

// Pest Control Quotes (AI-powered quote generation)
export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey(),
  quoteNumber: text('quote_number').notNull().unique(),
  
  // Quote details
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  propertyId: uuid('property_id').references(() => properties.id).notNull(),
  status: text('status').$type<'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired'>().default('draft'),
  
  // Quote content
  services: jsonb('services').notNull(), // Array of service IDs with pricing
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  validUntil: timestamp('valid_until').notNull(),
  
  // AI-generated content
  aiAssumptions: jsonb('ai_assumptions'), // What the AI assumed about the property/situation
  riskFactors: jsonb('risk_factors'), // Identified risk factors that affect pricing
  recommendations: jsonb('recommendations'), // AI recommendations for services
  
  // Terms and conditions
  termsAndConditions: text('terms_and_conditions'),
  paymentTerms: text('payment_terms'),
  serviceWarranty: text('service_warranty'),
  
  // Customer interaction
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  acceptedAt: timestamp('accepted_at'),
  declinedAt: timestamp('declined_at'),
  declineReason: text('decline_reason'),
  
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => profiles.id),
  updatedBy: uuid('updated_by').references(() => profiles.id),
});

// Routes and Territory Management
export const routes = pgTable('routes', {
  id: uuid('id').primaryKey(),
  routeId: text('route_id').notNull().unique(),
  
  // Route details
  name: text('name').notNull(),
  description: text('description'),
  assignedTechnician: uuid('assigned_technician').references(() => profiles.id),
  
  // Route optimization
  properties: jsonb('properties').notNull(), // Array of property IDs in optimized order
  estimatedDuration: integer('estimated_duration'), // Total route time in minutes
  totalDistance: decimal('total_distance', { precision: 10, scale: 2 }), // Miles
  
  // Schedule
  routeDate: timestamp('route_date').notNull(),
  startTime: text('start_time'), // e.g., "08:00"
  endTime: text('end_time'), // e.g., "17:00"
  
  status: text('status').$type<'planned' | 'active' | 'completed' | 'cancelled'>().default('planned'),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => profiles.id),
  updatedBy: uuid('updated_by').references(() => profiles.id),
});

// Create Zod schemas for validation
export const insertPropertySchema = createInsertSchema(properties);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertServiceSchema = createInsertSchema(services);
export const insertChemicalSchema = createInsertSchema(chemicals);
export const insertServiceAppointmentSchema = createInsertSchema(serviceAppointments);
export const insertQuoteSchema = createInsertSchema(quotes);
export const insertRouteSchema = createInsertSchema(routes);

// Export types
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type Chemical = typeof chemicals.$inferSelect;
export type InsertChemical = typeof chemicals.$inferInsert;
export type ServiceAppointment = typeof serviceAppointments.$inferSelect;
export type InsertServiceAppointment = typeof serviceAppointments.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;