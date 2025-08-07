import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { 
  camelToSnake, 
  snakeToCamel, 
  validateAndTransform,
  fieldValidators,
  createFlexibleSchema,
  flexibleDateSchema,
  emailSchema,
  passwordSchema
} from '../../shared/validation-utils';

describe('Enhanced Validation System', () => {
  describe('Field Mapping Utilities', () => {
    it('should convert camelCase to snake_case correctly', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        warehouseId: '123',
        createdAt: new Date(),
        metaData: {
          userRole: 'admin',
          lastLoginDate: '2024-01-01'
        }
      };

      const expected = {
        first_name: 'John',
        last_name: 'Doe',
        warehouse_id: '123',
        created_at: input.createdAt,
        meta_data: {
          user_role: 'admin',
          last_login_date: '2024-01-01'
        }
      };

      expect(camelToSnake(input)).toEqual(expected);
    });

    it('should convert snake_case to camelCase correctly', () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        warehouse_id: '123',
        created_at: new Date(),
        meta_data: {
          user_role: 'admin',
          last_login_date: '2024-01-01'
        }
      };

      const expected = {
        firstName: 'John',
        lastName: 'Doe',
        warehouseId: '123',
        createdAt: input.created_at,
        metaData: {
          userRole: 'admin',
          lastLoginDate: '2024-01-01'
        }
      };

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle nested arrays correctly', () => {
      const input = {
        userList: [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' }
        ]
      };

      const result = camelToSnake(input);
      expect(result.user_list[0]).toEqual({ first_name: 'John', last_name: 'Doe' });
      expect(result.user_list[1]).toEqual({ first_name: 'Jane', last_name: 'Smith' });
    });
  });

  describe('Enhanced Field Validators', () => {
    it('should validate non-empty strings with trimming', () => {
      const validator = fieldValidators.nonEmptyString('Name');
      
      expect(validator.parse('John')).toBe('John');
      expect(validator.parse('  John  ')).toBe('John');
      
      expect(() => validator.parse('')).toThrow();
      expect(() => validator.parse('   ')).toThrow();
    });

    it('should validate positive numbers with coercion', () => {
      const validator = fieldValidators.positiveNumber('Amount');
      
      expect(validator.parse(10)).toBe(10);
      expect(validator.parse('10')).toBe(10);
      expect(validator.parse('10.5')).toBe(10.5);
      
      expect(() => validator.parse(-1)).toThrow();
      expect(() => validator.parse('0')).toThrow();
      expect(() => validator.parse('abc')).toThrow();
    });

    it('should validate UUIDs correctly', () => {
      const validUuid = '00000000-0000-0000-0000-000000000001';
      const invalidUuid = 'not-a-uuid';
      
      expect(fieldValidators.requiredUuid('ID').parse(validUuid)).toBe(validUuid);
      expect(fieldValidators.optionalUuid('ID').parse(undefined)).toBeUndefined();
      
      expect(() => fieldValidators.requiredUuid('ID').parse(invalidUuid)).toThrow();
    });

    it('should validate enums with case-insensitive matching', () => {
      expect(fieldValidators.status.parse('active')).toBe('active');
      expect(fieldValidators.status.parse('ACTIVE')).toBe('active');
      expect(fieldValidators.status.parse('Active')).toBe('active');
      
      expect(() => fieldValidators.status.parse('invalid')).toThrow();
    });

    it('should validate email addresses correctly', () => {
      expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
      expect(emailSchema.parse('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      
      expect(() => emailSchema.parse('invalid-email')).toThrow();
      expect(() => emailSchema.parse('')).toThrow();
    });

    it('should validate passwords with complexity requirements', () => {
      const validPassword = 'StrongPass123!';
      const weakPassword = 'weak';
      
      expect(passwordSchema.parse(validPassword)).toBe(validPassword);
      
      expect(() => passwordSchema.parse(weakPassword)).toThrow();
      expect(() => passwordSchema.parse('NoSpecialChar123')).toThrow();
      expect(() => passwordSchema.parse('nostrongpass123!')).toThrow();
    });
  });

  describe('Flexible Date Schema', () => {
    it('should parse various date formats', () => {
      const dateString = '2024-01-01';
      const dateTimeString = '2024-01-01T12:00:00Z';
      const dateObj = new Date('2024-01-01');
      
      expect(flexibleDateSchema.parse(dateString)).toBeInstanceOf(Date);
      expect(flexibleDateSchema.parse(dateTimeString)).toBeInstanceOf(Date);
      expect(flexibleDateSchema.parse(dateObj)).toBeInstanceOf(Date);
    });

    it('should throw on invalid date formats', () => {
      expect(() => flexibleDateSchema.parse('invalid-date')).toThrow();
      expect(() => flexibleDateSchema.parse('2024-13-01')).toThrow();
    });
  });

  describe('Flexible Schema Creation', () => {
    it('should create schema that accepts both camelCase and snake_case', () => {
      const schema = createFlexibleSchema({
        firstName: fieldValidators.nonEmptyString('First Name'),
        lastName: fieldValidators.nonEmptyString('Last Name'),
        warehouseId: fieldValidators.optionalUuid('Warehouse ID')
      });

      // Test camelCase input
      const camelCaseInput = {
        firstName: 'John',
        lastName: 'Doe',
        warehouseId: '00000000-0000-0000-0000-000000000001'
      };

      // Test snake_case input
      const snakeCaseInput = {
        first_name: 'John',
        last_name: 'Doe',
        warehouse_id: '00000000-0000-0000-0000-000000000001'
      };

      const result1 = schema.parse(camelCaseInput);
      const result2 = schema.parse(snakeCaseInput);

      // Both should produce the same normalized result
      expect(result1.firstName).toBe('John');
      expect(result1.lastName).toBe('Doe');
      expect(result2.firstName).toBe('John');
      expect(result2.lastName).toBe('Doe');
    });

    it('should handle mixed case inputs gracefully', () => {
      const schema = createFlexibleSchema({
        firstName: fieldValidators.nonEmptyString('First Name'),
        lastName: fieldValidators.nonEmptyString('Last Name')
      });

      const mixedInput = {
        firstName: 'John',    // camelCase
        last_name: 'Doe'      // snake_case
      };

      const result = schema.parse(mixedInput);
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });
  });

  describe('Validation Error Handling', () => {
    it('should provide detailed error information', () => {
      const schema = z.object({
        email: emailSchema,
        age: fieldValidators.positiveNumber('Age'),
        status: fieldValidators.status
      });

      const invalidInput = {
        email: 'invalid-email',
        age: -5,
        status: 'invalid-status'
      };

      expect(() => validateAndTransform(schema)(invalidInput)).toThrow();
      
      try {
        validateAndTransform(schema)(invalidInput);
      } catch (error: any) {
        const errorData = JSON.parse(error.message);
        expect(errorData.type).toBe('VALIDATION_ERROR');
        expect(errorData.errors).toHaveLength(3);
        expect(errorData.errors[0].field).toBe('email');
        expect(errorData.errors[1].field).toBe('age');
        expect(errorData.errors[2].field).toBe('status');
      }
    });
  });

  describe('Work Order Schema Validation', () => {
    it('should validate work order data with field mapping', () => {
      // Test with our flexible schema approach
      const workOrderSchema = createFlexibleSchema({
        foNumber: fieldValidators.nonEmptyString('FO Number'),
        type: fieldValidators.workOrderType,
        description: fieldValidators.nonEmptyString('Description'),
        priority: fieldValidators.priority,
        requestedBy: fieldValidators.requiredUuid('Requested By'),
        warehouseId: fieldValidators.requiredUuid('Warehouse ID')
      });
      
      const workOrderData = {
        fo_number: 'WO-2024-001',  // snake_case
        type: 'preventive',
        description: 'Regular maintenance',
        priority: 'medium',
        requestedBy: '00000000-0000-0000-0000-000000000001',  // camelCase
        warehouse_id: '00000000-0000-0000-0000-000000000002'  // snake_case
      };

      expect(() => workOrderSchema.parse(workOrderData)).not.toThrow();
      const result = workOrderSchema.parse(workOrderData);
      expect(result.foNumber).toBe('WO-2024-001');
    });

    it('should validate equipment data with comprehensive field validation', () => {
      const equipmentSchema = createFlexibleSchema({
        assetTag: fieldValidators.nonEmptyString('Asset Tag'),
        model: fieldValidators.nonEmptyString('Model'),
        description: fieldValidators.nonEmptyString('Description'),
        status: fieldValidators.status,
        warehouseId: fieldValidators.requiredUuid('Warehouse ID')
      });
      
      const equipmentData = {
        assetTag: 'EQ-001',
        model: 'Industrial Pump X1',
        description: 'Main water pump for facility',
        status: 'ACTIVE',  // Should be normalized to lowercase
        warehouseId: '00000000-0000-0000-0000-000000000001'
      };

      const result = equipmentSchema.parse(equipmentData);
      expect(result.status).toBe('active'); // Normalized
      expect(result.assetTag).toBe('EQ-001');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large objects efficiently', () => {
      const largeObject: any = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`field${i}`] = `value${i}`;
      }

      const start = Date.now();
      const result = camelToSnake(largeObject);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
      expect(Object.keys(result)).toHaveLength(1000);
    });

    it('should handle null and undefined values gracefully', () => {
      expect(camelToSnake(null)).toBeNull();
      expect(camelToSnake(undefined)).toBeUndefined();
      expect(snakeToCamel(null)).toBeNull();
      expect(snakeToCamel(undefined)).toBeUndefined();
    });

    it('should handle primitive values without transformation', () => {
      expect(camelToSnake('string')).toBe('string');
      expect(camelToSnake(123)).toBe(123);
      expect(camelToSnake(true)).toBe(true);
    });

    it('should preserve Date objects without transformation', () => {
      const date = new Date();
      const input = { createdAt: date };
      const result = camelToSnake(input);
      
      expect(result.created_at).toBe(date);
      expect(result.created_at).toBeInstanceOf(Date);
    });
  });
});

describe('Integration with Real Schemas', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  it('should work with complete work order creation flow', async () => {
    // Create a comprehensive work order schema for testing
    const workOrderSchema = createFlexibleSchema({
      foNumber: fieldValidators.nonEmptyString('FO Number'),
      type: fieldValidators.workOrderType,
      description: fieldValidators.nonEmptyString('Description'),
      area: fieldValidators.nonEmptyString('Area'),
      status: fieldValidators.workOrderStatus,
      priority: fieldValidators.priority,
      requestedBy: fieldValidators.requiredUuid('Requested By'),
      assignedTo: fieldValidators.optionalUuid('Assigned To'),
      equipmentId: fieldValidators.optionalUuid('Equipment ID'),
      dueDate: fieldValidators.optionalDate,
      estimatedHours: fieldValidators.nonNegativeNumber('Estimated Hours'),
      notes: fieldValidators.limitedString('Notes', 1000),
      followUp: z.boolean().default(false),
      escalated: z.boolean().default(false),
      escalationLevel: z.number().default(0),
      warehouseId: fieldValidators.requiredUuid('Warehouse ID')
    });
    
    // Simulate API request with mixed field naming
    const apiRequest = {
      fo_number: 'WO-2024-TEST-001',
      type: 'corrective',
      description: 'Test work order for validation',
      area: 'Main Floor',
      status: 'NEW',
      priority: 'HIGH',
      requestedBy: '00000000-0000-0000-0000-000000000001',
      assigned_to: '00000000-0000-0000-0000-000000000002',
      equipment_id: '00000000-0000-0000-0000-000000000003',
      due_date: '2024-12-31',
      estimated_hours: 4.5,
      notes: 'Test notes for the work order',
      follow_up: false,
      escalated: false,
      escalation_level: 0,
      warehouse_id: '00000000-0000-0000-0000-000000000004'
    };

    const validatedData = workOrderSchema.parse(apiRequest);
    
    // Verify data normalization
    expect(validatedData.foNumber).toBe('WO-2024-TEST-001');
    expect(validatedData.type).toBe('corrective');
    expect(validatedData.status).toBe('new'); // Normalized from 'NEW'
    expect(validatedData.priority).toBe('high'); // Normalized from 'HIGH'
    expect(validatedData.estimatedHours).toBe(4.5);
    expect(validatedData.dueDate).toBeInstanceOf(Date); // Converted from string
  });

  it('should maintain data integrity through multiple transformations', () => {
    const originalData = {
      firstName: 'John',
      lastName: 'Doe',
      contactInfo: {
        emailAddress: 'john@example.com',
        phoneNumber: '+1-555-0123'
      },
      preferences: ['email', 'sms'],
      createdAt: new Date('2024-01-01')
    };

    // Transform to snake_case and back
    const snakeCased = camelToSnake(originalData);
    const backToCamel = snakeToCamel(snakeCased);

    expect(backToCamel.firstName).toBe(originalData.firstName);
    expect(backToCamel.lastName).toBe(originalData.lastName);
    expect(backToCamel.contactInfo.emailAddress).toBe(originalData.contactInfo.emailAddress);
    expect(backToCamel.contactInfo.phoneNumber).toBe(originalData.contactInfo.phoneNumber);
    expect(backToCamel.preferences).toEqual(originalData.preferences);
    expect(backToCamel.createdAt).toBe(originalData.createdAt);
  });
});
