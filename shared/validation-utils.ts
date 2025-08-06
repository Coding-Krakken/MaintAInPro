// Field mapping utilities for handling camelCase ↔ snake_case conversions
import { z } from 'zod';

/**
 * Utility to transform camelCase keys to snake_case
 */
export function camelToSnake(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    if (Array.isArray(value)) {
      result[snakeKey] = value.map(item => 
        typeof item === 'object' && item !== null ? camelToSnake(item) : item
      );
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      result[snakeKey] = camelToSnake(value);
    } else {
      result[snakeKey] = value;
    }
  }
  
  return result;
}

/**
 * Utility to transform snake_case keys to camelCase
 */
export function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => 
        typeof item === 'object' && item !== null ? snakeToCamel(item) : item
      );
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      result[camelKey] = snakeToCamel(value);
    } else {
      result[camelKey] = value;
    }
  }
  
  return result;
}

/**
 * Flexible field mapping for API compatibility
 */
export const createFlexibleSchema = <T extends z.ZodRawShape>(shape: T) => {
  const schema = z.object(shape);
  
  return schema.transform((data) => {
    // Handle both camelCase and snake_case inputs
    const normalizedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Convert snake_case to camelCase for internal processing
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      normalizedData[camelKey] = value;
      
      // Also keep original key for backward compatibility
      if (key !== camelKey) {
        normalizedData[key] = value;
      }
    }
    
    return normalizedData;
  });
};

/**
 * Enhanced UUID validation with better error messages
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Enhanced email validation
 */
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email too long');

/**
 * Enhanced password validation
 */
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase, one uppercase, and one number');

/**
 * Date validation that handles multiple formats
 */
export const flexibleDateSchema = z.union([
  z.string().datetime(),
  z.string().date(),
  z.date()
]).transform((val) => {
  if (val instanceof Date) return val;
  return new Date(val);
});

/**
 * Enum validation with case-insensitive matching
 */
export const createEnumSchema = <T extends readonly [string, ...string[]]>(values: T) => {
  return z.string().refine((val) => {
    const lowerValues = values.map(v => v.toLowerCase());
    return lowerValues.includes(val.toLowerCase());
  }, {
    message: `Must be one of: ${values.join(', ')}`
  }).transform((val) => {
    // Return the correctly cased version
    const index = values.findIndex(v => v.toLowerCase() === val.toLowerCase());
    return values[index];
  });
};

/**
 * Validation middleware for request transformation
 */
export const validateAndTransform = <T extends z.ZodSchema>(schema: T) => {
  return (data: unknown) => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errorDetails = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      throw new Error(JSON.stringify({
        type: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        errors: errorDetails
      }));
    }
    
    return result.data;
  };
};

/**
 * Comprehensive field validation utilities
 */
export const fieldValidators = {
  // String validations
  nonEmptyString: (fieldName: string) => 
    z.string().min(1, `${fieldName} is required`),
    
  limitedString: (fieldName: string, maxLength: number) =>
    z.string()
      .min(1, `${fieldName} is required`)
      .max(maxLength, `${fieldName} must be ${maxLength} characters or less`),
      
  // Numeric validations
  positiveNumber: (fieldName: string) =>
    z.number().positive(`${fieldName} must be positive`),
    
  nonNegativeNumber: (fieldName: string) =>
    z.number().min(0, `${fieldName} cannot be negative`),
    
  // ID validations
  requiredUuid: (fieldName: string) =>
    uuidSchema.describe(`${fieldName} (UUID)`),
    
  optionalUuid: (fieldName: string) =>
    uuidSchema.optional().describe(`${fieldName} (UUID, optional)`),
    
  // Enum validations
  status: createEnumSchema(['active', 'inactive', 'maintenance', 'retired']),
  priority: createEnumSchema(['low', 'medium', 'high', 'critical']),
  workOrderStatus: createEnumSchema(['new', 'assigned', 'in_progress', 'completed', 'verified', 'closed']),
  workOrderType: createEnumSchema(['corrective', 'preventive', 'emergency']),
  userRole: createEnumSchema(['technician', 'supervisor', 'manager', 'admin', 'inventory_clerk', 'contractor', 'requester'])
};
