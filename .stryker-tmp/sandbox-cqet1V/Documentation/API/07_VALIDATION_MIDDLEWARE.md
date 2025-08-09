# Production Validation Middleware

## Overview

The validation middleware provides comprehensive request/response validation,
security, and field transformation for the MaintAInPro CMMS API.

## Features

- **Schema Validation**: Zod-based validation with detailed error reporting
- **Field Mapping**: Automatic camelCase ↔ snake_case transformation
- **Security**: Rate limiting, XSS protection, input sanitization
- **Multi-tenant**: Organization-based access control
- **Performance**: Request logging, error handling, pagination

## Usage

### Basic Validation

```typescript
import {
  ValidationMiddleware,
  apiSchemas,
} from '../middleware/validation.middleware';

// Validate request body
app.post(
  '/api/work-orders',
  ValidationMiddleware.validateBody(apiSchemas.createWorkOrder),
  workOrderController.create
);

// Validate query parameters
app.get(
  '/api/work-orders',
  ValidationMiddleware.validateQuery(apiSchemas.workOrderQuery),
  workOrderController.list
);

// Validate URL parameters
app.get(
  '/api/work-orders/:id',
  ValidationMiddleware.validateParams(apiSchemas.uuidParam),
  workOrderController.getById
);
```

### Organization Access Control

```typescript
// Ensure user has access to organization
app.use(
  '/api/work-orders',
  ValidationMiddleware.validateOrganizationAccess(),
  workOrderRouter
);
```

### Response Transformation

```typescript
// Transform responses to camelCase
app.use(ValidationMiddleware.transformResponse());
```

## Available Schemas

### Work Orders

- `apiSchemas.createWorkOrder` - Create work order validation
- `apiSchemas.updateWorkOrder` - Update work order validation
- `apiSchemas.workOrderQuery` - Query parameter validation

### Equipment

- `apiSchemas.createEquipment` - Create equipment validation
- `apiSchemas.updateEquipment` - Update equipment validation
- `apiSchemas.equipmentQuery` - Query parameter validation

### Common

- `apiSchemas.uuidParam` - UUID parameter validation
- `apiSchemas.paginationQuery` - Pagination validation
- `apiSchemas.searchQuery` - Search query validation

## Security Features

### Rate Limiting

- 100 requests per 15 minutes per IP
- Configurable limits per endpoint

### Input Sanitization

- XSS prevention
- Script tag removal
- SQL injection protection

### Headers

- Comprehensive security headers via Helmet.js
- CORS configuration
- Content Security Policy

## Error Handling

### Validation Errors

```json
{
  "type": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": [
    {
      "field": "foNumber",
      "message": "FO Number must follow format: WO-XXX-XXX",
      "code": "invalid_string"
    }
  ],
  "statusCode": 400,
  "timestamp": "2025-08-07T12:00:00.000Z",
  "requestId": "req_1691409600000_abc123"
}
```

### Rate Limit Errors

```json
{
  "type": "RATE_LIMIT_ERROR",
  "message": "Too many requests from this IP, please try again later",
  "statusCode": 429,
  "timestamp": "2025-08-07T12:00:00.000Z"
}
```

## Request/Response Flow

### Request Processing

1. **Security**: Rate limiting, headers, sanitization
2. **Validation**: Schema validation with field mapping
3. **Organization**: Multi-tenant access control
4. **Logging**: Request tracking and performance monitoring

### Response Processing

1. **Transformation**: snake_case → camelCase conversion
2. **Metadata**: Request ID, timestamp, organization ID
3. **Error Handling**: Consistent error format
4. **Logging**: Response tracking and performance metrics

## Field Mapping

The middleware automatically handles field name transformations:

### API Request (camelCase)

```json
{
  "foNumber": "WO-001",
  "equipmentId": "uuid-here",
  "organizationId": "org-uuid"
}
```

### Database Storage (snake_case)

```json
{
  "fo_number": "WO-001",
  "equipment_id": "uuid-here",
  "organization_id": "org-uuid"
}
```

### API Response (camelCase)

```json
{
  "foNumber": "WO-001",
  "equipmentId": "uuid-here",
  "organizationId": "org-uuid",
  "_metadata": {
    "timestamp": "2025-08-07T12:00:00.000Z",
    "requestId": "req_123",
    "statusCode": 200
  }
}
```

## Type Extensions

The middleware extends Express Request types:

```typescript
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any; // Validated request body
      originalBody?: any; // Original request body
      validatedQuery?: any; // Validated query parameters
      validatedParams?: any; // Validated URL parameters
      user?: {
        // Authenticated user
        id: string;
        email: string;
        role: string;
        organizationId: string;
      };
      organizationId?: string; // Current organization context
    }
  }
}
```

## Best Practices

1. **Always validate input**: Use appropriate schemas for all endpoints
2. **Organization isolation**: Include organization validation for multi-tenant
   data
3. **Error handling**: Provide meaningful error messages
4. **Performance**: Use pagination for list endpoints
5. **Security**: Apply rate limiting to public endpoints
6. **Logging**: Include request IDs for troubleshooting

## Configuration

Environment variables for security configuration:

```env
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Security headers
CSP_DEFAULT_SRC="'self'"
CSP_SCRIPT_SRC="'self'"

# Request processing
MAX_REQUEST_SIZE=1mb
REQUEST_TIMEOUT=30s
```
