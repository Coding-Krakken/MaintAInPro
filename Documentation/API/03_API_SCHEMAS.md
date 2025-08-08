# API Schemas Reference

## Overview

Comprehensive Zod validation schemas for the MaintAInPro CMMS API endpoints. All schemas include automatic field mapping between camelCase (API) and snake_case (database) formats.

## Core Validation Schemas

### Work Order Schemas

#### CreateWorkOrderSchema
```typescript
{
  foNumber: string,          // Work order number (required)
  type: string,              // 'corrective' | 'preventive' | 'emergency'
  description: string,       // Work description (required)
  priority: string,          // 'low' | 'medium' | 'high' | 'critical'
  status: string,            // 'new' | 'assigned' | 'in_progress' | 'completed'
  organizationId: string,    // Organization UUID (required)
  requestedBy: string,       // User UUID (required)
  equipmentId: string | null,// Equipment UUID (optional)
  locationId: string | null, // Location UUID (optional)
  estimatedHours: number | null, // Estimated completion time
  scheduledDate: string | null,  // ISO date string
  notes: string | null       // Additional notes
}
```

#### UpdateWorkOrderSchema
```typescript
{
  foNumber?: string,         // Optional updates
  type?: string,
  description?: string,
  priority?: string,
  status?: string,
  assignedTo?: string | null,// Technician UUID
  actualHours?: number | null,
  completedDate?: string | null, // ISO date string
  notes?: string | null
}
```

#### WorkOrderSearchSchema
```typescript
{
  query?: string,            // Search term
  status?: string,           // Status filter
  priority?: string,         // Priority filter
  limit?: number,            // Page size (1-100, default: 10)
  offset?: number,           // Pagination offset
  sortBy?: string,           // Sort field
  sortOrder?: 'asc' | 'desc' // Sort direction
}
```

### Equipment Schemas

#### CreateEquipmentSchema
```typescript
{
  equipmentTag: string,      // Unique equipment identifier
  description: string,       // Equipment description
  manufacturer: string,      // Manufacturer name
  model: string,             // Equipment model
  serialNumber: string,      // Serial number
  organizationId: string,    // Organization UUID (required)
  locationId: string | null, // Location UUID (optional)
  criticality: string,       // 'low' | 'medium' | 'high' | 'critical'
  status: string,            // 'active' | 'inactive' | 'maintenance'
  installDate: string | null, // ISO date string
  warrantyExpiry: string | null, // ISO date string
  specifications: object | null  // JSON specifications
}
```

#### UpdateEquipmentSchema
```typescript
{
  equipmentTag?: string,     // Optional updates
  description?: string,
  manufacturer?: string,
  model?: string,
  serialNumber?: string,
  locationId?: string | null,
  criticality?: string,
  status?: string,
  installDate?: string | null,
  warrantyExpiry?: string | null,
  specifications?: object | null
}
```

### User Management Schemas

#### CreateUserSchema
```typescript
{
  email: string,             // Valid email address
  firstName: string,         // User's first name
  lastName: string,          // User's last name
  role: string,              // 'admin' | 'manager' | 'technician' | 'viewer'
  organizationId: string,    // Organization UUID (required)
  department: string | null, // Department name
  phoneNumber: string | null, // Phone number
  isActive: boolean          // Account status (default: true)
}
```

#### UpdateUserSchema
```typescript
{
  firstName?: string,        // Optional updates
  lastName?: string,
  role?: string,
  department?: string | null,
  phoneNumber?: string | null,
  isActive?: boolean
}
```

### Location Schemas

#### CreateLocationSchema
```typescript
{
  locationCode: string,      // Unique location code
  name: string,              // Location name
  description: string,       // Location description
  organizationId: string,    // Organization UUID (required)
  parentLocationId: string | null, // Parent location UUID
  locationType: string,      // 'building' | 'floor' | 'room' | 'area'
  address: string | null,    // Physical address
  coordinates: object | null // GPS coordinates
}
```

#### UpdateLocationSchema
```typescript
{
  locationCode?: string,     // Optional updates
  name?: string,
  description?: string,
  parentLocationId?: string | null,
  locationType?: string,
  address?: string | null,
  coordinates?: object | null
}
```

### Preventive Maintenance Schemas

#### CreatePreventiveMaintenanceSchema
```typescript
{
  title: string,             // PM title
  description: string,       // PM description
  organizationId: string,    // Organization UUID (required)
  equipmentId: string,       // Equipment UUID (required)
  frequency: string,         // 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  frequencyValue: number,    // Frequency interval
  estimatedHours: number,    // Estimated completion time
  instructions: string,      // Maintenance instructions
  isActive: boolean,         // Schedule status (default: true)
  nextDueDate: string        // ISO date string
}
```

#### UpdatePreventiveMaintenanceSchema
```typescript
{
  title?: string,            // Optional updates
  description?: string,
  frequency?: string,
  frequencyValue?: number,
  estimatedHours?: number,
  instructions?: string,
  isActive?: boolean,
  nextDueDate?: string
}
```

### Parts Inventory Schemas

#### CreatePartSchema
```typescript
{
  partNumber: string,        // Unique part number
  description: string,       // Part description
  manufacturer: string,      // Part manufacturer
  organizationId: string,    // Organization UUID (required)
  category: string,          // Part category
  unitOfMeasure: string,     // 'each' | 'meter' | 'liter' | etc.
  unitCost: number,          // Cost per unit
  minStockLevel: number,     // Minimum stock threshold
  maxStockLevel: number,     // Maximum stock threshold
  currentStock: number,      // Current inventory level
  location: string | null,   // Storage location
  supplierInfo: object | null // Supplier information
}
```

#### UpdatePartSchema
```typescript
{
  partNumber?: string,       // Optional updates
  description?: string,
  manufacturer?: string,
  category?: string,
  unitOfMeasure?: string,
  unitCost?: number,
  minStockLevel?: number,
  maxStockLevel?: number,
  currentStock?: number,
  location?: string | null,
  supplierInfo?: object | null
}
```

## Common Field Patterns

### UUID Fields
All ID fields are validated as UUIDs:
```typescript
id: z.string().uuid()
organizationId: z.string().uuid()
equipmentId: z.string().uuid().nullable()
```

### Date Fields
Date fields accept ISO date strings:
```typescript
scheduledDate: z.string().datetime().nullable()
createdAt: z.string().datetime()
updatedAt: z.string().datetime()
```

### Enum Fields
Status and type fields use predefined values:
```typescript
status: z.enum(['new', 'assigned', 'in_progress', 'completed', 'cancelled'])
priority: z.enum(['low', 'medium', 'high', 'critical'])
type: z.enum(['corrective', 'preventive', 'emergency', 'project'])
```

### Pagination Fields
Search schemas include pagination:
```typescript
limit: z.number().int().min(1).max(100).default(10)
offset: z.number().int().min(0).default(0)
sortBy: z.string().optional()
sortOrder: z.enum(['asc', 'desc']).default('desc')
```

## Field Mapping

### Automatic Transformations

The validation middleware automatically maps between API and database field formats:

#### API → Database (snake_case)
```javascript
// Input (camelCase)
{
  foNumber: "WO-001",
  organizationId: "uuid-here",
  equipmentId: "uuid-here",
  createdAt: "2025-01-08T12:00:00Z"
}

// Database (snake_case)
{
  fo_number: "WO-001",
  organization_id: "uuid-here",
  equipment_id: "uuid-here",
  created_at: "2025-01-08T12:00:00Z"
}
```

#### Database → API (camelCase)
```javascript
// Database output (snake_case)
{
  fo_number: "WO-001",
  organization_id: "uuid-here",
  equipment_id: "uuid-here",
  created_at: "2025-01-08T12:00:00Z"
}

// API response (camelCase)
{
  foNumber: "WO-001",
  organizationId: "uuid-here",
  equipmentId: "uuid-here",
  createdAt: "2025-01-08T12:00:00Z"
}
```

### Custom Field Mappings

Some fields have special mappings:
```typescript
// API field → Database field
foNumber → fo_number
equipmentTag → equipment_tag
partNumber → part_number
locationCode → location_code
phoneNumber → phone_number
isActive → is_active
```

## Validation Rules

### String Validation
```typescript
// Required strings
description: z.string().min(1, "Description is required")

// Optional strings
notes: z.string().nullable()

// Email validation
email: z.string().email("Invalid email format")

// Pattern validation
equipmentTag: z.string().regex(/^[A-Z0-9-]+$/, "Invalid equipment tag format")
```

### Number Validation
```typescript
// Positive numbers
estimatedHours: z.number().positive("Must be positive")

// Integer validation
limit: z.number().int().min(1).max(100)

// Currency validation
unitCost: z.number().multipleOf(0.01, "Invalid currency format")
```

### Array Validation
```typescript
// Array of UUIDs
equipmentIds: z.array(z.string().uuid())

// Array of objects
attachments: z.array(z.object({
  filename: z.string(),
  url: z.string().url()
}))
```

### Object Validation
```typescript
// JSON specifications
specifications: z.object({
  voltage: z.number().optional(),
  amperage: z.number().optional(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number()
  }).optional()
}).nullable()
```

## Error Responses

### Validation Error Format
```typescript
{
  success: false,
  error: "Validation failed",
  details: [
    {
      field: "foNumber",
      message: "FO Number is required",
      code: "invalid_type"
    },
    {
      field: "priority",
      message: "Invalid enum value. Expected 'low' | 'medium' | 'high' | 'critical'",
      code: "invalid_enum_value"
    }
  ]
}
```

### Common Error Codes
- `invalid_type` - Wrong data type
- `invalid_string` - String validation failed
- `invalid_enum_value` - Enum value not allowed
- `too_small` - Value below minimum
- `too_big` - Value above maximum
- `invalid_date` - Invalid date format

## Schema Usage Examples

### Endpoint Validation
```typescript
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { CreateWorkOrderSchema, WorkOrderSearchSchema } from '../schemas';

// Create endpoint
app.post('/api/work-orders', 
  validateBody(CreateWorkOrderSchema),
  workOrderController.create
);

// Search endpoint
app.get('/api/work-orders',
  validateQuery(WorkOrderSearchSchema),
  workOrderController.search
);
```

### Manual Validation
```typescript
import { CreateWorkOrderSchema } from '../schemas';

const result = CreateWorkOrderSchema.safeParse(requestData);
if (!result.success) {
  console.log('Validation errors:', result.error.errors);
} else {
  console.log('Valid data:', result.data);
}
```

### Custom Validation
```typescript
// Extend existing schema
const ExtendedWorkOrderSchema = CreateWorkOrderSchema.extend({
  customField: z.string().optional()
});

// Partial schema for updates
const PartialWorkOrderSchema = CreateWorkOrderSchema.partial();
```

## Best Practices

1. **Always validate input** - Use appropriate schemas for all endpoints
2. **Handle errors gracefully** - Provide clear error messages to clients
3. **Use appropriate schemas** - Create vs Update vs Search schemas
4. **Leverage field mapping** - Trust automatic camelCase ↔ snake_case conversion
5. **Validate UUIDs** - Ensure all ID fields are valid UUIDs
6. **Set reasonable limits** - Use pagination limits to prevent large responses
7. **Use nullable for optional** - Distinguish between undefined and null values

## Schema Evolution

### Adding New Fields
```typescript
// Add optional field to existing schema
const UpdatedSchema = ExistingSchema.extend({
  newField: z.string().optional()
});
```

### Deprecating Fields
```typescript
// Mark field as deprecated but keep validation
const DeprecatedSchema = ExistingSchema.extend({
  oldField: z.string().optional().describe('Deprecated: use newField instead')
});
```

### Version Compatibility
```typescript
// Support multiple versions
const v1Schema = z.object({ /* v1 fields */ });
const v2Schema = v1Schema.extend({ /* additional v2 fields */ });

// Route-specific validation
app.post('/api/v1/work-orders', validateBody(v1Schema), handler);
app.post('/api/v2/work-orders', validateBody(v2Schema), handler);
```
