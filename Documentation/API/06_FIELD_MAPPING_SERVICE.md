# Field Mapping Service

## Overview

The Field Mapping Service provides production-ready field transformation between frontend camelCase and database snake_case formats with performance optimization and comprehensive error handling.

## Features

- **Bidirectional Transformation**: camelCase ↔ snake_case conversion
- **Performance Caching**: Intelligent caching for frequently used transformations
- **Type Safety**: Full TypeScript support with enhanced schemas
- **Error Handling**: Comprehensive validation error reporting
- **Schema Factory**: Flexible schema creation with field mapping support

## Architecture

```
Frontend (camelCase) → API (camelCase) → Field Mapping → Database (snake_case)
                                     ↑                        ↓
                   Response Transform ←                        ↓
                                     ←  Field Mapping  ←  Query Results
```

## Core Classes

### FieldMappingService

Singleton service for field transformations:

```typescript
import { fieldMappingService } from '../services/field-mapping.service';

// Transform API input to database format
const dbData = fieldMappingService.transformApiToDb({
  foNumber: 'WO-001',
  equipmentId: 'uuid-here'
});
// Result: { fo_number: 'WO-001', equipment_id: 'uuid-here' }

// Transform database output to API format
const apiData = fieldMappingService.transformDbToApi({
  fo_number: 'WO-001',
  equipment_id: 'uuid-here'
});
// Result: { foNumber: 'WO-001', equipmentId: 'uuid-here' }

// Batch transformations for performance
const apiResults = fieldMappingService.batchTransformDbToApi(dbRecords);
```

### SchemaFactory

Enhanced schema creation with validation:

```typescript
import { SchemaFactory } from '../services/field-mapping.service';

// Create organization schema
const orgSchema = SchemaFactory.createOrganizationSchema();

// Create work order schema  
const woSchema = SchemaFactory.createWorkOrderSchema();

// Validate and transform data
const validatedData = SchemaFactory.validateAndTransform(
  woSchema, 
  inputData, 
  'work order creation'
);
```

## Available Schemas

### Organization Schema
```typescript
{
  name: string;                    // Required organization name
  slug: string;                    // URL-friendly identifier
  settings: Record<string, any>;   // Organization settings
  branding: Record<string, any>;   // Branding configuration
  subscriptionTier: 'basic' | 'professional' | 'enterprise';
  maxUsers: number;                // User limit (default: 10)
  maxAssets: number;               // Asset limit (default: 100)
  active: boolean;                 // Active status (default: true)
}
```

### Work Order Schema
```typescript
{
  foNumber: string;                // Format: WO-XXX-XXX
  type: 'corrective' | 'preventive' | 'emergency';
  description: string;             // Min 10 characters
  area?: string;                   // Optional location
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'verified' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requestedBy: string;             // UUID
  assignedTo?: string;             // Optional UUID
  equipmentId?: string;            // Optional UUID
  organizationId: string;          // Required UUID
  warehouseId?: string;            // Optional UUID (legacy)
  dueDate?: Date;                  // Optional due date
  estimatedHours?: number;         // Optional estimate
  actualHours?: number;            // Optional actual time
  notes?: string;                  // Optional notes
  followUp: boolean;               // Default: false
  escalated: boolean;              // Default: false
  escalationLevel: number;         // 0-10, default: 0
}
```

### Equipment Schema
```typescript
{
  assetTag: string;                // Unique identifier
  model: string;                   // Equipment model
  description?: string;            // Optional description
  area?: string;                   // Optional location
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  installDate?: Date;              // Optional install date
  warrantyExpiry?: Date;           // Optional warranty end
  manufacturer?: string;           // Optional manufacturer
  serialNumber?: string;           // Optional serial number
  specifications?: Record<string, any>; // Optional specs
  organizationId?: string;         // Optional UUID
  warehouseId?: string;            // Optional UUID
  qrCode?: string;                 // Optional QR code
}
```

### Part Schema
```typescript
{
  partNumber: string;              // Unique part identifier
  name: string;                    // Part name
  description?: string;            // Optional description
  category?: string;               // Optional category
  unitCost: number;                // Cost per unit (≥0)
  quantityOnHand: number;          // Current stock (≥0)
  minimumStock: number;            // Reorder threshold (≥0)
  vendor?: string;                 // Optional vendor
  location?: string;               // Optional storage location
  organizationId: string;          // Required UUID
  warehouseId?: string;            // Optional UUID
}
```

## Performance Features

### Caching
- **Transformation Cache**: Frequently used transformations cached in memory
- **Schema Cache**: Compiled schemas cached for reuse
- **Batch Processing**: Optimized for multiple record transformations

### Monitoring
```typescript
// Get cache statistics
const stats = fieldMappingService.getCacheStats();
console.log(`Cache size: ${stats.size}, Cache hits: ${stats.hits}`);

// Clear cache when needed
fieldMappingService.clearCache();
```

## Error Handling

### ValidationError Class
```typescript
import { ValidationError } from '../services/field-mapping.service';

try {
  const data = SchemaFactory.validateAndTransform(schema, input);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.errors);
    console.log('Field errors:', error.getFieldErrors());
    console.log('Status code:', error.statusCode);
  }
}
```

### Error Response Format
```typescript
{
  field: string;           // Field path (e.g., "equipment.assetTag")
  message: string;         // Human-readable error message
  code: string;            // Error code (e.g., "invalid_string")
  path: (string|number)[]; // Full path to the field
}
```

## Performance Monitoring

### ValidationPerformanceMonitor
```typescript
import { ValidationPerformanceMonitor } from '../services/field-mapping.service';

// Start validation timing
const endTimer = ValidationPerformanceMonitor.startValidation();

// ... perform validation ...

// End timing
endTimer();

// Record events
ValidationPerformanceMonitor.recordError();
ValidationPerformanceMonitor.recordCacheHit();

// Get metrics
const metrics = ValidationPerformanceMonitor.getMetrics();
console.log('Average validation time:', metrics.averageValidationTime);
```

## Field Mapping Examples

### Work Order Example
```typescript
// Input from frontend
const frontendData = {
  foNumber: 'WO-001-PUMP',
  equipmentId: '123e4567-e89b-12d3-a456-426614174000',
  organizationId: '987fcdeb-51a2-43d1-9f12-123456789abc',
  estimatedHours: 4.5
};

// Transform to database format
const dbData = fieldMappingService.transformApiToDb(frontendData);
// Result:
{
  fo_number: 'WO-001-PUMP',
  equipment_id: '123e4567-e89b-12d3-a456-426614174000',
  organization_id: '987fcdeb-51a2-43d1-9f12-123456789abc',
  estimated_hours: 4.5
}

// Database query result
const dbResult = {
  id: '456e7890-e89b-12d3-a456-426614174000',
  fo_number: 'WO-001-PUMP',
  equipment_id: '123e4567-e89b-12d3-a456-426614174000',
  created_at: '2025-08-07T12:00:00Z',
  updated_at: '2025-08-07T12:00:00Z'
};

// Transform to API format
const apiResponse = fieldMappingService.transformDbToApi(dbResult);
// Result:
{
  id: '456e7890-e89b-12d3-a456-426614174000',
  foNumber: 'WO-001-PUMP',
  equipmentId: '123e4567-e89b-12d3-a456-426614174000',
  createdAt: '2025-08-07T12:00:00Z',
  updatedAt: '2025-08-07T12:00:00Z'
}
```

## Integration with Database Service

```typescript
import { databaseService } from '../services/database.service';
import { fieldMappingService } from '../services/field-mapping.service';

// Create work order with automatic field mapping
const workOrder = await databaseService.createWorkOrder(
  frontendData,  // camelCase input
  userId
);
// Returns camelCase output

// Search with field mapping
const results = await databaseService.searchWorkOrders({
  query: 'hydraulic pump',
  organizationId: 'org-uuid',
  limit: 10
});
// Returns camelCase results
```

## Best Practices

1. **Use Batch Operations**: For multiple records, use batch transform methods
2. **Cache Management**: Clear cache periodically in long-running processes
3. **Error Handling**: Always catch ValidationError for user-friendly messages
4. **Performance Monitoring**: Monitor validation performance in production
5. **Schema Reuse**: Cache schemas at application level for better performance

## Configuration

```typescript
// Service configuration
const fieldMappingService = FieldMappingService.getInstance();

// Performance tuning
ValidationPerformanceMonitor.resetMetrics(); // Reset counters
fieldMappingService.clearCache();            // Clear transformation cache
```

## Type Exports

```typescript
import type {
  EnhancedOrganization,
  EnhancedProfile,
  EnhancedWorkOrder,
  EnhancedEquipment,
  EnhancedPart,
  ValidationErrorDetail
} from '../services/field-mapping.service';
```
