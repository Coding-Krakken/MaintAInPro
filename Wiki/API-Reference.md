# 🔗 API Reference

Complete API documentation for MaintAInPro CMMS. This guide covers all
endpoints, request/response formats, authentication, and integration examples.

## 📋 Table of Contents

- [**Authentication**](#-authentication)
- [**Work Orders**](#-work-orders)
- [**Equipment Management**](#-equipment-management)
- [**Parts & Inventory**](#-parts--inventory)
- [**Users & Organizations**](#-users--organizations)
- [**Analytics & Reporting**](#-analytics--reporting)
- [**File Management**](#-file-management)
- [**Error Handling**](#-error-handling)
- [**Rate Limiting**](#-rate-limiting)
- [**Examples & SDKs**](#-examples--sdks)

## 🌐 Base URL

```
Production:  https://maintainpro.vercel.app/api
Development: http://localhost:5000/api
```

## 🔐 Authentication

### Overview

MaintAInPro uses JWT-based authentication with Bearer tokens. All API requests
(except auth endpoints) require a valid JWT token.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Organization-ID: <organization_uuid>
```

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "technician",
      "organizationId": "org-uuid"
    },
    "expiresIn": 86400
  }
}
```

### POST /api/auth/register

Register a new user account.

**Request:**

```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "organizationId": "org-uuid"
}
```

### POST /api/auth/refresh

Refresh an expired JWT token.

**Request:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

### POST /api/auth/logout

Invalidate the current JWT token.

## 🔧 Work Orders

### GET /api/work-orders

Retrieve work orders with filtering and pagination.

**Query Parameters:**

- `status` - Filter by status (open, in_progress, completed, cancelled)
- `priority` - Filter by priority (low, medium, high, critical)
- `assignedTo` - Filter by assigned user ID
- `equipmentId` - Filter by equipment ID
- `limit` - Number of results (default: 50, max: 100)
- `cursor` - Pagination cursor
- `search` - Search in title and description

**Example Request:**

```bash
GET /api/work-orders?status=open&priority=high&limit=25
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "wo-uuid",
      "foNumber": "WO-2025-001",
      "title": "Fix hydraulic pump",
      "description": "Pump is leaking hydraulic fluid",
      "status": "open",
      "priority": "high",
      "type": "corrective",
      "equipmentId": "eq-uuid",
      "equipment": {
        "id": "eq-uuid",
        "assetTag": "PUMP-001",
        "description": "Main hydraulic pump"
      },
      "assignedTo": ["user-uuid"],
      "assignees": [
        {
          "id": "user-uuid",
          "firstName": "John",
          "lastName": "Doe"
        }
      ],
      "requestedBy": "manager-uuid",
      "createdAt": "2025-01-20T10:00:00Z",
      "dueDate": "2025-01-25T00:00:00Z",
      "organizationId": "org-uuid"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 25,
    "cursor": "next_cursor_token"
  }
}
```

### POST /api/work-orders

Create a new work order.

**Request:**

```json
{
  "title": "Replace worn bearing",
  "description": "Bearing shows signs of wear and needs replacement",
  "type": "preventive",
  "priority": "medium",
  "equipmentId": "eq-uuid",
  "assignedTo": ["user-uuid"],
  "dueDate": "2025-01-30T00:00:00Z",
  "checklistItems": [
    {
      "component": "Bearing",
      "action": "Replace with new bearing",
      "required": true
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new-wo-uuid",
    "foNumber": "WO-2025-002",
    "title": "Replace worn bearing",
    "status": "open",
    "createdAt": "2025-01-20T15:30:00Z"
  }
}
```

### GET /api/work-orders/:id

Get detailed work order information.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "wo-uuid",
    "foNumber": "WO-2025-001",
    "title": "Fix hydraulic pump",
    "description": "Pump is leaking hydraulic fluid",
    "status": "in_progress",
    "priority": "high",
    "type": "corrective",
    "equipment": {
      "id": "eq-uuid",
      "assetTag": "PUMP-001",
      "description": "Main hydraulic pump",
      "area": "Production Floor A"
    },
    "assignees": [
      {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "role": "technician"
      }
    ],
    "checklistItems": [
      {
        "id": "item-uuid",
        "component": "Hydraulic seals",
        "action": "Inspect and replace if damaged",
        "status": "completed",
        "completedBy": "user-uuid",
        "completedAt": "2025-01-20T14:00:00Z",
        "notes": "Seals were damaged, replaced with part #HS-001"
      }
    ],
    "timeLogs": [
      {
        "id": "log-uuid",
        "userId": "user-uuid",
        "startTime": "2025-01-20T13:00:00Z",
        "endTime": "2025-01-20T14:30:00Z",
        "description": "Diagnosed issue and replaced seals",
        "duration": 90
      }
    ],
    "attachments": [
      {
        "id": "att-uuid",
        "fileName": "pump_before.jpg",
        "fileType": "image/jpeg",
        "fileSize": 2048576,
        "uploadedBy": "user-uuid",
        "uploadedAt": "2025-01-20T13:15:00Z",
        "url": "/api/files/pump_before.jpg"
      }
    ],
    "createdAt": "2025-01-20T10:00:00Z",
    "updatedAt": "2025-01-20T14:30:00Z"
  }
}
```

### PATCH /api/work-orders/:id

Update work order fields.

**Request:**

```json
{
  "status": "completed",
  "completedAt": "2025-01-20T16:00:00Z",
  "notes": "Successfully replaced hydraulic seals. Pump is operational."
}
```

### DELETE /api/work-orders/:id

Delete a work order (soft delete).

## ⚙️ Equipment Management

### GET /api/equipment

Retrieve equipment with hierarchy and filtering.

**Query Parameters:**

- `area` - Filter by area/location
- `status` - Filter by status (active, maintenance, decommissioned)
- `criticality` - Filter by criticality (low, medium, high, critical)
- `parentId` - Filter by parent equipment (for hierarchy)
- `search` - Search in asset tag, model, description

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "eq-uuid",
      "assetTag": "PUMP-001",
      "foNumber": "EQ-001",
      "model": "CAT 3306",
      "manufacturer": "Caterpillar",
      "serialNumber": "SN123456",
      "description": "Main hydraulic pump",
      "area": "Production Floor A",
      "status": "active",
      "criticality": "high",
      "installationDate": "2020-01-15",
      "warrantyExpiry": "2025-01-15",
      "parentEquipmentId": null,
      "hierarchyLevel": 0,
      "qrCodeUrl": "/api/qr/equipment/eq-uuid",
      "children": [
        {
          "id": "child-eq-uuid",
          "assetTag": "PUMP-001-MOTOR",
          "description": "Pump motor",
          "hierarchyLevel": 1
        }
      ],
      "createdAt": "2020-01-15T00:00:00Z",
      "updatedAt": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### POST /api/equipment

Create new equipment.

**Request:**

```json
{
  "assetTag": "COMP-001",
  "model": "Atlas Copco GA30",
  "manufacturer": "Atlas Copco",
  "serialNumber": "AC789012",
  "description": "Main air compressor",
  "area": "Utility Room",
  "status": "active",
  "criticality": "high",
  "installationDate": "2025-01-20",
  "warrantyExpiry": "2028-01-20",
  "parentEquipmentId": null
}
```

### GET /api/equipment/:id/qr

Generate QR code for equipment.

**Response:**

```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "url": "https://maintainpro.app/equipment/eq-uuid"
  }
}
```

### GET /api/equipment/:id/history

Get maintenance history for equipment.

**Response:**

```json
{
  "success": true,
  "data": {
    "workOrders": [
      {
        "id": "wo-uuid",
        "foNumber": "WO-2025-001",
        "title": "Routine maintenance",
        "status": "completed",
        "completedAt": "2025-01-15T00:00:00Z",
        "totalHours": 3.5
      }
    ],
    "totalWorkOrders": 24,
    "totalHours": 84.5,
    "lastMaintenance": "2025-01-15T00:00:00Z",
    "nextScheduled": "2025-04-15T00:00:00Z"
  }
}
```

## 📦 Parts & Inventory

### GET /api/parts

Retrieve parts inventory.

**Query Parameters:**

- `category` - Filter by part category
- `supplier` - Filter by supplier
- `lowStock` - Show only low stock items (boolean)
- `search` - Search in part number, description

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "part-uuid",
      "partNumber": "HS-001",
      "description": "Hydraulic seal kit",
      "category": "Seals & Gaskets",
      "supplier": "Parker Hannifin",
      "unitPrice": 45.99,
      "currency": "USD",
      "stockQuantity": 12,
      "minStockLevel": 5,
      "maxStockLevel": 50,
      "reorderPoint": 8,
      "location": "A-12-C",
      "lastOrderDate": "2025-01-10T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/parts

Add new part to inventory.

**Request:**

```json
{
  "partNumber": "BRG-003",
  "description": "Ball bearing 6205-2RS",
  "category": "Bearings",
  "supplier": "SKF",
  "unitPrice": 28.5,
  "stockQuantity": 20,
  "minStockLevel": 3,
  "maxStockLevel": 30,
  "reorderPoint": 5,
  "location": "B-05-A"
}
```

### POST /api/parts/:id/consume

Record parts consumption from work order.

**Request:**

```json
{
  "quantity": 2,
  "workOrderId": "wo-uuid",
  "notes": "Used for pump repair"
}
```

## 👥 Users & Organizations

### GET /api/users

Retrieve users within organization.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "technician",
      "phone": "+1-555-0123",
      "active": true,
      "lastLogin": "2025-01-20T08:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/organizations/:id

Get organization details.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "org-uuid",
    "name": "Acme Manufacturing",
    "address": "123 Industrial Blvd",
    "city": "Detroit",
    "state": "MI",
    "zipCode": "48201",
    "country": "USA",
    "phone": "+1-555-0100",
    "email": "contact@acme.com",
    "settings": {
      "timezone": "America/Detroit",
      "currency": "USD",
      "workOrderPrefix": "WO-",
      "equipmentPrefix": "EQ-"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## 📊 Analytics & Reporting

### GET /api/analytics/dashboard

Get dashboard metrics and KPIs.

**Response:**

```json
{
  "success": true,
  "data": {
    "workOrders": {
      "total": 1247,
      "open": 23,
      "inProgress": 8,
      "completed": 1198,
      "overdue": 5
    },
    "equipment": {
      "total": 156,
      "active": 149,
      "maintenance": 7,
      "critical": 12
    },
    "maintenance": {
      "completionRate": 94.2,
      "averageResolutionTime": 18.5,
      "scheduledCompliance": 87.3
    },
    "costs": {
      "totalThisMonth": 18750.5,
      "laborCosts": 12500.0,
      "partsCosts": 6250.5,
      "previousMonth": 16200.25
    }
  }
}
```

### GET /api/analytics/work-orders

Get work order analytics with time-based filtering.

**Query Parameters:**

- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `groupBy` - Group by period (day, week, month)

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCompleted": 125,
      "averageCompletionTime": 4.2,
      "onTimeCompletion": 89.6
    },
    "trends": [
      {
        "date": "2025-01-01",
        "completed": 5,
        "created": 7,
        "overdue": 1
      }
    ],
    "byPriority": {
      "critical": 3,
      "high": 12,
      "medium": 45,
      "low": 65
    },
    "byStatus": {
      "completed": 98,
      "cancelled": 4,
      "overdue": 8
    }
  }
}
```

## 📁 File Management

### POST /api/files/upload

Upload files (images, documents, etc.).

**Request:** (multipart/form-data)

```
file: [binary data]
workOrderId: wo-uuid (optional)
equipmentId: eq-uuid (optional)
description: "Before repair photo" (optional)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "fileName": "pump_repair.jpg",
    "originalName": "IMG_20250120_140532.jpg",
    "fileType": "image/jpeg",
    "fileSize": 2048576,
    "url": "/api/files/pump_repair.jpg",
    "thumbnailUrl": "/api/files/thumbnails/pump_repair_thumb.jpg",
    "uploadedAt": "2025-01-20T14:05:32Z"
  }
}
```

### GET /api/files/:id

Download or view file.

### DELETE /api/files/:id

Delete uploaded file.

## ❌ Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Email is required"
    },
    "timestamp": "2025-01-20T15:30:00Z",
    "requestId": "req-uuid"
  }
}
```

### Common Error Codes

| Code               | Status | Description              |
| ------------------ | ------ | ------------------------ |
| `VALIDATION_ERROR` | 400    | Invalid request data     |
| `UNAUTHORIZED`     | 401    | Authentication required  |
| `FORBIDDEN`        | 403    | Insufficient permissions |
| `NOT_FOUND`        | 404    | Resource not found       |
| `CONFLICT`         | 409    | Resource already exists  |
| `RATE_LIMITED`     | 429    | Too many requests        |
| `INTERNAL_ERROR`   | 500    | Server error             |

## 🚦 Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 1000 requests per hour
- **File upload endpoints**: 10 requests per minute
- **Analytics endpoints**: 100 requests per hour

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1642694400
```

## 🔧 Examples & SDKs

### JavaScript/TypeScript Example

```typescript
// Client configuration
const client = new MaintAInProClient({
  baseURL: 'https://maintainpro.vercel.app/api',
  token: 'your-jwt-token',
  organizationId: 'your-org-id',
});

// Create a work order
const workOrder = await client.workOrders.create({
  title: 'Fix conveyor belt',
  description: 'Belt is slipping, needs adjustment',
  priority: 'high',
  equipmentId: 'conveyor-001',
  assignedTo: ['technician-uuid'],
});

// Get work orders with filtering
const openWorkOrders = await client.workOrders.list({
  status: 'open',
  priority: 'high',
  limit: 25,
});

// Update work order status
await client.workOrders.update(workOrder.id, {
  status: 'completed',
  completedAt: new Date().toISOString(),
});
```

### Python Example

```python
import requests

class MaintAInProAPI:
    def __init__(self, base_url, token, org_id):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'X-Organization-ID': org_id
        }

    def create_work_order(self, data):
        response = requests.post(
            f'{self.base_url}/work-orders',
            json=data,
            headers=self.headers
        )
        return response.json()

    def get_equipment(self, equipment_id):
        response = requests.get(
            f'{self.base_url}/equipment/{equipment_id}',
            headers=self.headers
        )
        return response.json()

# Usage
api = MaintAInProAPI(
    'https://maintainpro.vercel.app/api',
    'your-jwt-token',
    'your-org-id'
)

work_order = api.create_work_order({
    'title': 'Lubricate bearings',
    'priority': 'medium',
    'equipmentId': 'motor-001'
})
```

### cURL Examples

**Create work order:**

```bash
curl -X POST https://maintainpro.vercel.app/api/work-orders \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -H "X-Organization-ID: your-org-id" \
  -d '{
    "title": "Replace air filter",
    "priority": "medium",
    "equipmentId": "compressor-001"
  }'
```

**Get dashboard analytics:**

```bash
curl -X GET https://maintainpro.vercel.app/api/analytics/dashboard \
  -H "Authorization: Bearer your-token" \
  -H "X-Organization-ID: your-org-id"
```

## 🔍 Advanced Features

### Webhook Integration

Subscribe to real-time events:

```json
POST /api/webhooks
{
  "url": "https://your-app.com/webhooks/maintainpro",
  "events": ["work_order.created", "work_order.completed"],
  "secret": "your-webhook-secret"
}
```

### Bulk Operations

Batch create work orders:

```json
POST /api/work-orders/bulk
{
  "workOrders": [
    {"title": "WO 1", "equipmentId": "eq-1"},
    {"title": "WO 2", "equipmentId": "eq-2"}
  ]
}
```

### Real-time Updates

WebSocket connection for live updates:

```javascript
const ws = new WebSocket('wss://maintainpro.vercel.app/ws');
ws.send(
  JSON.stringify({
    type: 'subscribe',
    channel: 'work-orders',
    token: 'your-jwt-token',
  })
);
```

---

## 📞 Support

### Documentation

- **[[Developer Guide]]** - Complete development documentation
- **[[Getting Started]]** - Quick start guide
- **[[Troubleshooting]]** - Common issues and solutions

### Community

- **[GitHub Issues](https://github.com/Coding-Krakken/MaintAInPro/issues)** -
  Bug reports and feature requests
- **[GitHub Discussions](https://github.com/Coding-Krakken/MaintAInPro/discussions)** -
  Questions and community help

### Professional Support

- Email: api-support@maintainpro.com
- Response time: 24 hours for technical issues

---

_API Reference last updated: January 2025_  
_API Version: v1.0.0_
