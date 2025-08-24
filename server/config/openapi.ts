import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

/**
 * OpenAPI 3.0 configuration for MaintAInPro CMMS API
 */
const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MaintAInPro CMMS API',
      version: '1.0.0',
      description: 'Enterprise Maintenance Management System REST API',
      contact: {
        name: 'MaintAInPro Support',
        url: 'https://maintainpro.vercel.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://maintainpro.vercel.app/api',
        description: 'Production server',
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication',
        },
        organizationHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Organization-ID',
          description: 'Organization ID for multi-tenant access',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
            },
            code: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
          required: ['error'],
        },
        WorkOrder: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique work order identifier',
            },
            title: {
              type: 'string',
              description: 'Work order title',
              maxLength: 255,
            },
            description: {
              type: 'string',
              description: 'Detailed description of the work',
            },
            status: {
              type: 'string',
              enum: ['new', 'assigned', 'in_progress', 'completed', 'verified', 'closed'],
              description: 'Current status of the work order',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Priority level',
            },
            type: {
              type: 'string',
              enum: ['corrective', 'preventive', 'emergency'],
              description: 'Type of work order',
            },
            equipmentId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated equipment ID',
            },
            assignedTo: {
              type: 'string',
              format: 'uuid',
              description: 'Assigned technician user ID',
            },
            estimatedHours: {
              type: 'number',
              description: 'Estimated completion time in hours',
            },
            actualHours: {
              type: 'number',
              description: 'Actual completion time in hours',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Due date for completion',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'title', 'status', 'priority', 'type'],
        },
        Equipment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique equipment identifier',
            },
            name: {
              type: 'string',
              description: 'Equipment name',
            },
            assetTag: {
              type: 'string',
              description: 'Asset tag number',
            },
            manufacturer: {
              type: 'string',
              description: 'Equipment manufacturer',
            },
            model: {
              type: 'string',
              description: 'Equipment model',
            },
            serialNumber: {
              type: 'string',
              description: 'Serial number',
            },
            location: {
              type: 'string',
              description: 'Physical location',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance', 'retired'],
              description: 'Equipment status',
            },
            installDate: {
              type: 'string',
              format: 'date',
              description: 'Installation date',
            },
            warrantyExpiry: {
              type: 'string',
              format: 'date',
              description: 'Warranty expiration date',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
          required: ['id', 'name', 'assetTag', 'status'],
        },
        Part: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique part identifier',
            },
            partNumber: {
              type: 'string',
              description: 'Part number',
            },
            description: {
              type: 'string',
              description: 'Part description',
            },
            manufacturer: {
              type: 'string',
              description: 'Part manufacturer',
            },
            category: {
              type: 'string',
              description: 'Part category',
            },
            unitPrice: {
              type: 'number',
              description: 'Unit price',
            },
            stockQuantity: {
              type: 'integer',
              description: 'Current stock quantity',
            },
            minStockLevel: {
              type: 'integer',
              description: 'Minimum stock level for reordering',
            },
            location: {
              type: 'string',
              description: 'Storage location',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
          required: ['id', 'partNumber', 'description', 'stockQuantity'],
        },
        Profile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'First name',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
            },
            phone: {
              type: 'string',
              description: 'Phone number',
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'technician', 'user'],
              description: 'User role',
            },
            active: {
              type: 'boolean',
              description: 'Account status',
            },
            warehouseId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated warehouse/organization ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
          required: ['id', 'email', 'firstName', 'lastName', 'role'],
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Unauthorized',
                message: 'Access token is missing or invalid',
                code: 401,
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Forbidden',
                message: 'Insufficient permissions for this operation',
                code: 403,
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Not Found',
                message: 'The requested resource could not be found',
                code: 404,
              },
            },
          },
        },
        ValidationError: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Validation Error',
                message: 'The provided data is invalid',
                code: 400,
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './server/routes.ts',
    './server/routes/*.ts',
  ],
};

export const specs = swaggerJsdoc(options);
export default options;