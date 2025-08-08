# MaintAInPro CMMS - Complete API Reference

## Overview

Production-ready REST API for the MaintAInPro Computerized Maintenance Management System (CMMS). This API provides comprehensive functionality for work order management, equipment tracking, preventive maintenance, inventory management, and user administration.

## Base Information

- **Base URL**: `https://api.maintainpro.com` (production) / `http://localhost:3000` (development)
- **API Version**: v1
- **Content Type**: `application/json`
- **Authentication**: Bearer Token (JWT)
- **Rate Limiting**: 100 requests per minute per API key

## Authentication

### Bearer Token Authentication
Include the JWT token in the Authorization header:
```http
Authorization: Bearer <your-jwt-token>
```

### Organization Context
All API requests require organization context via header:
```http
X-Organization-ID: <organization-uuid>
```

## Work Orders API

### List Work Orders
```http
GET /api/work-orders
```

**Query Parameters:**
- `query` (string, optional) - Search term for full-text search
- `status` (string, optional) - Filter by status: `new`, `assigned`, `in_progress`, `completed`, `cancelled`
- `priority` (string, optional) - Filter by priority: `low`, `medium`, `high`, `critical`
- `limit` (number, optional) - Results per page (1-100, default: 10)
- `offset` (number, optional) - Pagination offset (default: 0)
- `sortBy` (string, optional) - Sort field name
- `sortOrder` (string, optional) - Sort direction: `asc`, `desc` (default: `desc`)

**Example Request:**
```http
GET /api/work-orders?status=in_progress&priority=high&limit=25&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "wo-uuid-here",
      "foNumber": "WO-2025-001",
      "type": "corrective",
      "description": "Repair hydraulic pump",
      "priority": "high",
      "status": "in_progress",
      "organizationId": "org-uuid-here",
      "requestedBy": "user-uuid-here",
      "assignedTo": "tech-uuid-here",
      "equipmentId": "eq-uuid-here",
      "locationId": "loc-uuid-here",
      "estimatedHours": 4.0,
      "actualHours": 2.5,
      "scheduledDate": "2025-01-15T10:00:00Z",
      "completedDate": null,
      "notes": "Replacement parts ordered",
      "createdAt": "2025-01-08T12:00:00Z",
      "updatedAt": "2025-01-08T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 25,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Work Order by ID
```http
GET /api/work-orders/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wo-uuid-here",
    "foNumber": "WO-2025-001",
    "type": "corrective",
    "description": "Repair hydraulic pump",
    "priority": "high",
    "status": "in_progress",
    "organizationId": "org-uuid-here",
    "requestedBy": "user-uuid-here",
    "assignedTo": "tech-uuid-here",
    "equipmentId": "eq-uuid-here",
    "locationId": "loc-uuid-here",
    "estimatedHours": 4.0,
    "actualHours": 2.5,
    "scheduledDate": "2025-01-15T10:00:00Z",
    "completedDate": null,
    "notes": "Replacement parts ordered",
    "createdAt": "2025-01-08T12:00:00Z",
    "updatedAt": "2025-01-08T14:30:00Z"
  }
}
```

### Create Work Order
```http
POST /api/work-orders
```

**Request Body:**
```json
{
  "foNumber": "WO-2025-002",
  "type": "preventive",
  "description": "Monthly pump inspection",
  "priority": "medium",
  "status": "new",
  "organizationId": "org-uuid-here",
  "requestedBy": "user-uuid-here",
  "equipmentId": "eq-uuid-here",
  "locationId": "loc-uuid-here",
  "estimatedHours": 2.0,
  "scheduledDate": "2025-01-20T09:00:00Z",
  "notes": "Follow PM checklist"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-wo-uuid-here",
    "foNumber": "WO-2025-002",
    "type": "preventive",
    "description": "Monthly pump inspection",
    "priority": "medium",
    "status": "new",
    "organizationId": "org-uuid-here",
    "requestedBy": "user-uuid-here",
    "equipmentId": "eq-uuid-here",
    "locationId": "loc-uuid-here",
    "estimatedHours": 2.0,
    "actualHours": null,
    "scheduledDate": "2025-01-20T09:00:00Z",
    "completedDate": null,
    "notes": "Follow PM checklist",
    "createdAt": "2025-01-08T15:00:00Z",
    "updatedAt": "2025-01-08T15:00:00Z"
  }
}
```

### Update Work Order
```http
PUT /api/work-orders/{id}
```

**Request Body:**
```json
{
  "status": "completed",
  "actualHours": 3.5,
  "completedDate": "2025-01-08T16:00:00Z",
  "notes": "Pump repaired successfully. Replaced seals and gaskets."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wo-uuid-here",
    "foNumber": "WO-2025-001",
    "type": "corrective",
    "description": "Repair hydraulic pump",
    "priority": "high",
    "status": "completed",
    "organizationId": "org-uuid-here",
    "requestedBy": "user-uuid-here",
    "assignedTo": "tech-uuid-here",
    "equipmentId": "eq-uuid-here",
    "locationId": "loc-uuid-here",
    "estimatedHours": 4.0,
    "actualHours": 3.5,
    "scheduledDate": "2025-01-15T10:00:00Z",
    "completedDate": "2025-01-08T16:00:00Z",
    "notes": "Pump repaired successfully. Replaced seals and gaskets.",
    "createdAt": "2025-01-08T12:00:00Z",
    "updatedAt": "2025-01-08T16:00:00Z"
  }
}
```

### Delete Work Order
```http
DELETE /api/work-orders/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Work order deleted successfully"
}
```

## Equipment API

### List Equipment
```http
GET /api/equipment
```

**Query Parameters:**
- `query` (string, optional) - Search term
- `status` (string, optional) - Filter by status: `active`, `inactive`, `maintenance`
- `criticality` (string, optional) - Filter by criticality: `low`, `medium`, `high`, `critical`
- `locationId` (string, optional) - Filter by location UUID
- `limit` (number, optional) - Results per page (default: 10)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "eq-uuid-here",
      "equipmentTag": "PUMP-001",
      "description": "Hydraulic Pump #1",
      "manufacturer": "Rexroth",
      "model": "A10V071",
      "serialNumber": "SN123456789",
      "organizationId": "org-uuid-here",
      "locationId": "loc-uuid-here",
      "criticality": "high",
      "status": "active",
      "installDate": "2023-06-15T00:00:00Z",
      "warrantyExpiry": "2026-06-15T00:00:00Z",
      "specifications": {
        "voltage": 480,
        "amperage": 25,
        "flow_rate": "150 GPM"
      },
      "createdAt": "2023-06-15T10:00:00Z",
      "updatedAt": "2025-01-08T12:00:00Z"
    }
  ]
}
```

### Create Equipment
```http
POST /api/equipment
```

**Request Body:**
```json
{
  "equipmentTag": "PUMP-002",
  "description": "Backup Hydraulic Pump",
  "manufacturer": "Rexroth",
  "model": "A10V071",
  "serialNumber": "SN987654321",
  "organizationId": "org-uuid-here",
  "locationId": "loc-uuid-here",
  "criticality": "medium",
  "status": "active",
  "installDate": "2025-01-08T00:00:00Z",
  "warrantyExpiry": "2028-01-08T00:00:00Z",
  "specifications": {
    "voltage": 480,
    "amperage": 25,
    "flow_rate": "150 GPM"
  }
}
```

## Users API

### List Users
```http
GET /api/users
```

**Query Parameters:**
- `role` (string, optional) - Filter by role: `admin`, `manager`, `technician`, `viewer`
- `isActive` (boolean, optional) - Filter by active status
- `department` (string, optional) - Filter by department
- `limit` (number, optional) - Results per page (default: 10)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid-here",
      "email": "john.doe@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "technician",
      "organizationId": "org-uuid-here",
      "department": "Maintenance",
      "phoneNumber": "+1-555-123-4567",
      "isActive": true,
      "createdAt": "2023-01-15T10:00:00Z",
      "updatedAt": "2025-01-08T12:00:00Z"
    }
  ]
}
```

### Create User
```http
POST /api/users
```

**Request Body:**
```json
{
  "email": "jane.smith@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "manager",
  "organizationId": "org-uuid-here",
  "department": "Operations",
  "phoneNumber": "+1-555-987-6543",
  "isActive": true
}
```

## Preventive Maintenance API

### List PM Schedules
```http
GET /api/preventive-maintenance
```

**Query Parameters:**
- `equipmentId` (string, optional) - Filter by equipment UUID
- `isActive` (boolean, optional) - Filter by active status
- `frequency` (string, optional) - Filter by frequency: `daily`, `weekly`, `monthly`, `quarterly`, `annually`
- `limit` (number, optional) - Results per page (default: 10)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pm-uuid-here",
      "title": "Monthly Pump Inspection",
      "description": "Complete inspection of hydraulic pump system",
      "organizationId": "org-uuid-here",
      "equipmentId": "eq-uuid-here",
      "frequency": "monthly",
      "frequencyValue": 1,
      "estimatedHours": 2.0,
      "instructions": "Follow checklist PM-001 for complete inspection",
      "isActive": true,
      "nextDueDate": "2025-02-01T09:00:00Z",
      "createdAt": "2023-06-15T10:00:00Z",
      "updatedAt": "2025-01-08T12:00:00Z"
    }
  ]
}
```

### Create PM Schedule
```http
POST /api/preventive-maintenance
```

**Request Body:**
```json
{
  "title": "Weekly Lubrication",
  "description": "Lubricate all grease points on conveyor system",
  "organizationId": "org-uuid-here",
  "equipmentId": "eq-uuid-here",
  "frequency": "weekly",
  "frequencyValue": 1,
  "estimatedHours": 0.5,
  "instructions": "Apply grease to points marked in red on equipment diagram",
  "isActive": true,
  "nextDueDate": "2025-01-15T08:00:00Z"
}
```

## Parts Inventory API

### List Parts
```http
GET /api/parts
```

**Query Parameters:**
- `query` (string, optional) - Search term
- `category` (string, optional) - Filter by category
- `lowStock` (boolean, optional) - Filter parts below minimum stock level
- `limit` (number, optional) - Results per page (default: 10)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "part-uuid-here",
      "partNumber": "SEAL-HYD-001",
      "description": "Hydraulic Seal Kit",
      "manufacturer": "Parker",
      "organizationId": "org-uuid-here",
      "category": "Seals & Gaskets",
      "unitOfMeasure": "each",
      "unitCost": 45.50,
      "minStockLevel": 5,
      "maxStockLevel": 25,
      "currentStock": 12,
      "location": "Shelf A-15",
      "supplierInfo": {
        "name": "Industrial Supply Co",
        "partNumber": "PS-HYD-001",
        "leadTime": 7
      },
      "createdAt": "2023-06-15T10:00:00Z",
      "updatedAt": "2025-01-08T12:00:00Z"
    }
  ]
}
```

### Create Part
```http
POST /api/parts
```

**Request Body:**
```json
{
  "partNumber": "BELT-CNV-001",
  "description": "Conveyor Belt 24 inch",
  "manufacturer": "Gates",
  "organizationId": "org-uuid-here",
  "category": "Belts",
  "unitOfMeasure": "each",
  "unitCost": 125.00,
  "minStockLevel": 2,
  "maxStockLevel": 10,
  "currentStock": 5,
  "location": "Warehouse B-3",
  "supplierInfo": {
    "name": "Belt Supply Corp",
    "partNumber": "GTS-CNV-24",
    "leadTime": 14
  }
}
```

## Locations API

### List Locations
```http
GET /api/locations
```

**Query Parameters:**
- `locationType` (string, optional) - Filter by type: `building`, `floor`, `room`, `area`
- `parentLocationId` (string, optional) - Filter by parent location UUID
- `limit` (number, optional) - Results per page (default: 10)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "loc-uuid-here",
      "locationCode": "BLDG-A",
      "name": "Manufacturing Building A",
      "description": "Main production facility",
      "organizationId": "org-uuid-here",
      "parentLocationId": null,
      "locationType": "building",
      "address": "123 Industrial Way, Manufacturing City, MC 12345",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "createdAt": "2023-01-15T10:00:00Z",
      "updatedAt": "2025-01-08T12:00:00Z"
    }
  ]
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Validation Error Example
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "foNumber",
      "message": "FO Number is required",
      "code": "invalid_type"
    },
    {
      "field": "priority",
      "message": "Invalid enum value. Expected 'low' | 'medium' | 'high' | 'critical'",
      "code": "invalid_enum_value"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Default Rate**: 100 requests per minute per API key
- **Burst Allowance**: Up to 10 requests per second
- **Headers Included**:
  - `X-RateLimit-Limit` - Request limit per window
  - `X-RateLimit-Remaining` - Requests remaining in current window
  - `X-RateLimit-Reset` - Time when rate limit resets (Unix timestamp)

When rate limit is exceeded:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "resetTime": 1704726000
  }
}
```

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `limit` - Number of results per page (1-100, default: 10)
- `offset` - Number of results to skip (default: 0)

**Response Format:**
```json
{
  "success": true,
  "data": [ /* results */ ],
  "pagination": {
    "total": 156,
    "limit": 25,
    "offset": 50,
    "hasMore": true
  }
}
```

## Sorting and Filtering

### Sorting
Use `sortBy` and `sortOrder` parameters:
```http
GET /api/work-orders?sortBy=createdAt&sortOrder=desc
```

### Filtering
Most endpoints support filtering by relevant fields:
```http
GET /api/work-orders?status=in_progress&priority=high&assignedTo=user-uuid
```

### Search
Use the `query` parameter for full-text search:
```http
GET /api/work-orders?query=hydraulic pump repair
```

## Field Mapping

The API automatically handles field name transformations:
- **API Input/Output**: camelCase (`foNumber`, `equipmentId`)
- **Database Storage**: snake_case (`fo_number`, `equipment_id`)

This mapping is transparent to API users - always use camelCase in API requests and responses.

## Best Practices

1. **Include Organization Context**: Always include the `X-Organization-ID` header
2. **Use Appropriate Pagination**: Set reasonable limits for list operations
3. **Handle Rate Limits**: Implement exponential backoff for rate limit errors
4. **Validate Data**: Client-side validation improves user experience
5. **Use HTTPS**: Always use secure connections in production
6. **Store Tokens Securely**: Never expose JWT tokens in client-side code
7. **Monitor Usage**: Track API usage to optimize performance
8. **Handle Errors Gracefully**: Implement proper error handling for all API calls

## Example Client Implementation

```javascript
class MaintAInProAPI {
  constructor(baseUrl, token, organizationId) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.organizationId = organizationId;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'X-Organization-ID': this.organizationId,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  async getWorkOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/work-orders?${query}`);
  }

  async createWorkOrder(data) {
    return this.request('/api/work-orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateWorkOrder(id, data) {
    return this.request(`/api/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
}

// Usage
const api = new MaintAInProAPI(
  'https://api.maintainpro.com',
  'your-jwt-token',
  'your-org-uuid'
);

// Get work orders
const workOrders = await api.getWorkOrders({
  status: 'in_progress',
  limit: 25
});

// Create work order
const newWorkOrder = await api.createWorkOrder({
  foNumber: 'WO-2025-003',
  description: 'Emergency pump repair',
  priority: 'critical',
  type: 'emergency',
  organizationId: 'your-org-uuid',
  requestedBy: 'user-uuid'
});
```
