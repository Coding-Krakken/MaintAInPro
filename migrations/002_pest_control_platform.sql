-- Migration: Add Pest Control Platform Tables
-- This migration adds comprehensive pest control capabilities to the existing CMMS

-- Pest Control Customers (distinct from internal users/profiles)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL UNIQUE,
  
  -- Contact information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  alternate_phone TEXT,
  
  -- Business information (for commercial customers)
  company_name TEXT,
  business_type TEXT,
  
  -- Account details
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
  account_balance DECIMAL(10,2) DEFAULT 0.00,
  credit_limit DECIMAL(10,2) DEFAULT 500.00,
  
  -- Service preferences
  communication_preferences JSONB,
  billing_preferences JSONB,
  service_notes TEXT,
  
  -- Relationship management
  lead_source TEXT,
  referred_by UUID REFERENCES customers(id),
  loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Pest Control Customer Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('residential', 'commercial', 'industrial', 'agricultural')),
  address TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  coordinates JSONB, -- { lat: number, lng: number }
  
  -- Property characteristics
  square_footage INTEGER,
  lot_size DECIMAL(10,2),
  construction_type TEXT,
  landscaping JSONB,
  access_instructions TEXT,
  
  -- Pest-related information
  known_pest_history JSONB,
  sensitive_sites JSONB,
  restricted_areas JSONB,
  
  -- Service preferences
  preferred_service_times JSONB,
  key_location TEXT,
  emergency_contact TEXT,
  
  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  primary_technician UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Pest Control Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL UNIQUE,
  
  -- Service details
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'general_pest', 'rodent', 'termite', 'ant', 'wasp', 'bed_bug', 
    'wildlife', 'lawn_care', 'mosquito', 'flea_tick', 'inspection'
  )),
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  frequency TEXT CHECK (frequency IN ('one_time', 'weekly', 'bi_weekly', 'monthly', 'quarterly', 'annual')),
  duration INTEGER, -- Expected duration in minutes
  
  -- Service characteristics
  required_chemicals JSONB,
  required_equipment JSONB,
  skill_requirements JSONB,
  
  -- Compliance and safety
  epa_registration TEXT,
  safety_data_sheet TEXT,
  ppe_requirements JSONB,
  
  -- Service specifications
  treatment_areas JSONB,
  method_of_application TEXT,
  weather_restrictions JSONB,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'seasonal')),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Chemical Inventory (EPA-compliant chemical tracking)
CREATE TABLE chemicals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chemical_id TEXT NOT NULL UNIQUE,
  
  -- Basic information
  product_name TEXT NOT NULL,
  active_ingredient TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  
  -- Regulatory information
  epa_registration_number TEXT NOT NULL,
  signal_word TEXT CHECK (signal_word IN ('danger', 'warning', 'caution')),
  restricted_use_class TEXT,
  
  -- Physical properties
  formulation TEXT CHECK (formulation IN ('liquid', 'granular', 'dust', 'bait', 'aerosol', 'foam')),
  concentration TEXT,
  container_size TEXT,
  
  -- Inventory management
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  
  -- Usage tracking
  application_rate TEXT,
  mix_ratio TEXT,
  
  -- Safety and compliance
  safety_data_sheet_url TEXT,
  product_label_url TEXT,
  storage_requirements TEXT,
  disposal_instructions TEXT,
  
  -- Lot tracking for compliance
  lot_number TEXT,
  expiration_date TIMESTAMP,
  date_received TIMESTAMP,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'restricted', 'recalled', 'expired')),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Service Appointments (extends work orders for pest control)
CREATE TABLE service_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number TEXT NOT NULL UNIQUE,
  
  -- Appointment details
  type TEXT CHECK (type IN ('initial', 'regular', 'follow_up', 'emergency', 'inspection')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'en_route', 'in_progress', 'completed', 
    'cancelled', 'rescheduled', 'no_show'
  )),
  
  -- Relationships
  customer_id UUID NOT NULL REFERENCES customers(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  service_id UUID NOT NULL REFERENCES services(id),
  assigned_technician UUID REFERENCES profiles(id),
  
  -- Scheduling
  scheduled_date TIMESTAMP NOT NULL,
  time_window TEXT,
  estimated_duration INTEGER,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  
  -- Service details
  service_notes TEXT,
  customer_requests TEXT,
  pest_issues_found JSONB,
  
  -- Treatment information
  treatment_performed JSONB,
  chemicals_used JSONB,
  equipment_used JSONB,
  
  -- Results and follow-up
  treatment_effectiveness TEXT CHECK (treatment_effectiveness IN ('excellent', 'good', 'fair', 'poor')),
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP,
  next_service_date TIMESTAMP,
  
  -- Compliance
  weather_conditions JSONB,
  application_log JSONB, -- Detailed EPA-compliant application records
  
  -- Customer interaction
  customer_present BOOLEAN DEFAULT FALSE,
  customer_signature TEXT,
  customer_feedback TEXT,
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  
  -- Financial
  service_fee DECIMAL(10,2),
  additional_charges JSONB,
  total_amount DECIMAL(10,2),
  payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'card', 'autopay', 'invoice')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Pest Control Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE,
  
  -- Quote details
  customer_id UUID NOT NULL REFERENCES customers(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  
  -- Quote content
  services JSONB NOT NULL, -- Array of service IDs with pricing
  total_amount DECIMAL(10,2) NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  
  -- AI-generated content
  ai_assumptions JSONB,
  risk_factors JSONB,
  recommendations JSONB,
  
  -- Terms and conditions
  terms_and_conditions TEXT,
  payment_terms TEXT,
  service_warranty TEXT,
  
  -- Customer interaction
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP,
  decline_reason TEXT,
  
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Routes and Territory Management
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id TEXT NOT NULL UNIQUE,
  
  -- Route details
  name TEXT NOT NULL,
  description TEXT,
  assigned_technician UUID REFERENCES profiles(id),
  
  -- Route optimization
  properties JSONB NOT NULL, -- Array of property IDs in optimized order
  estimated_duration INTEGER, -- Total route time in minutes
  total_distance DECIMAL(10,2), -- Miles
  
  -- Schedule
  route_date TIMESTAMP NOT NULL,
  start_time TEXT, -- e.g., "08:00"
  end_time TEXT, -- e.g., "17:00"
  
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Create indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_organization ON customers(organization_id);
CREATE INDEX idx_properties_customer ON properties(customer_id);
CREATE INDEX idx_properties_organization ON properties(organization_id);
CREATE INDEX idx_service_appointments_customer ON service_appointments(customer_id);
CREATE INDEX idx_service_appointments_property ON service_appointments(property_id);
CREATE INDEX idx_service_appointments_technician ON service_appointments(assigned_technician);
CREATE INDEX idx_service_appointments_date ON service_appointments(scheduled_date);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_routes_technician ON routes(assigned_technician);
CREATE INDEX idx_routes_date ON routes(route_date);
CREATE INDEX idx_chemicals_organization ON chemicals(organization_id);
CREATE INDEX idx_services_organization ON services(organization_id);

-- Add full-text search support
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('english', 
  COALESCE(first_name, '') || ' ' || 
  COALESCE(last_name, '') || ' ' || 
  COALESCE(email, '') || ' ' || 
  COALESCE(company_name, '')
));

CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('english', 
  COALESCE(address, '') || ' ' || 
  COALESCE(city, '') || ' ' || 
  COALESCE(state, '')
));