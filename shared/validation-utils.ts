// Field mapping utilities for handling camelCase ↔ snake_case conversions
import { z } from 'zod';

/**
 * Utility to transform camelCase keys to snake_case
 */
export function camelToSnake(obj: any): any {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnake(item));
  }
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = camelToSnake(value);
  }
  
  return result;
}

/**
 * Utility to transform snake_case keys to camelCase
 */
export function snakeToCamel(obj: any): any {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = snakeToCamel(value);
  }
  
  return result;
}

/**
 * Flexible field mapping for API compatibility
 */
export const createFlexibleSchema = <T extends z.ZodRawShape>(shape: T) => {
  const schema = z.object(shape);
  
  return z.preprocess((data: any) => {
    if (!data || typeof data !== 'object') return data;
    
    // Handle both camelCase and snake_case inputs
    const normalizedData: Record<string, any> = {};
    const shapeKeys = Object.keys(shape);
    
    for (const [key, value] of Object.entries(data)) {
      // Convert snake_case to camelCase for internal processing
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Check if the camelCase version exists in schema
      if (shapeKeys.includes(camelKey)) {
        normalizedData[camelKey] = value;
      }
      // Check if the original key exists in schema
      else if (shapeKeys.includes(key)) {
        normalizedData[key] = value;
      }
      // Convert camelCase to snake_case and check if that exists
      else {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (shapeKeys.includes(snakeKey)) {
          normalizedData[snakeKey] = value;
        } else {
          // Keep original key as fallback
          normalizedData[key] = value;
        }
      }
    }
    
    return normalizedData;
  }, schema);
};

/**
 * Enhanced UUID validation with better error messages and nullable support
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const nullableUuidSchema = z.string().uuid('Invalid UUID format').nullable();
export const optionalUuidSchema = z.string().uuid('Invalid UUID format').optional();

/**
 * Enhanced email validation with comprehensive rules
 */
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .max(255, 'Email too long')
  .transform(val => val.toLowerCase().trim())
  .pipe(z.string().email('Invalid email format'));

/**
 * Enhanced password validation with complexity requirements
 */
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase, one uppercase, and one number')
  .regex(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, 
    'Password must contain at least one special character');

/**
 * Enhanced text validation for various field types
 */
export const nonEmptyTextSchema = z.string().min(1, 'Field cannot be empty').trim();
export const limitedTextSchema = (maxLength: number, fieldName: string) => 
  z.string()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
    .trim();

/**
 * Date validation that handles multiple formats with enhanced error handling
 */
export const flexibleDateSchema = z.union([
  z.string().datetime('Invalid datetime format'),
  z.string().date('Invalid date format'),
  z.date(),
  z.coerce.date()
]).transform((val) => {
  if (val instanceof Date) return val;
  const parsed = new Date(val);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date value');
  }
  return parsed;
});

/**
 * Numeric validation with enhanced type coercion
 */
export const numericSchema = z.union([
  z.number(),
  z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number')
]).transform(val => typeof val === 'string' ? parseFloat(val) : val);

export const positiveNumericSchema = numericSchema.refine(val => val > 0, 'Must be positive');
export const nonNegativeNumericSchema = numericSchema.refine(val => val >= 0, 'Cannot be negative');

/**
 * Enum validation with case-insensitive matching and comprehensive error messages
 */
export const createEnumSchema = <T extends readonly [string, ...string[]]>(values: T, fieldName?: string) => {
  return z.string()
    .refine((val) => {
      const lowerValues = values.map(v => v.toLowerCase());
      return lowerValues.includes(val.toLowerCase());
    }, {
      message: `${fieldName ? `${fieldName} ` : ''}must be one of: ${values.join(', ')}`
    })
    .transform((val) => {
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
 * Comprehensive field validation utilities with enhanced type safety
 */
export const fieldValidators = {
  // String validations with proper trimming and case handling
  nonEmptyString: (fieldName: string) => 
    z.string()
      .min(1, `${fieldName} is required`)
      .trim()
      .refine(val => val.length > 0, `${fieldName} cannot be empty after trimming`),
    
  limitedString: (fieldName: string, maxLength: number) =>
    z.string()
      .min(1, `${fieldName} is required`)
      .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
      .trim(),
      
  // Numeric validations with proper coercion
  positiveNumber: (fieldName: string) =>
    positiveNumericSchema.describe(`${fieldName} (positive number)`),
    
  nonNegativeNumber: (fieldName: string) =>
    nonNegativeNumericSchema.describe(`${fieldName} (non-negative number)`),
    
  // ID validations with enhanced error messages
  requiredUuid: (fieldName: string) =>
    uuidSchema.describe(`${fieldName} (UUID required)`),
    
  optionalUuid: (fieldName: string) =>
    optionalUuidSchema.describe(`${fieldName} (UUID, optional)`),
    
  nullableUuid: (fieldName: string) =>
    nullableUuidSchema.describe(`${fieldName} (UUID, nullable)`),
    
  // Enhanced enum validations with field-specific names
  status: createEnumSchema(['active', 'inactive', 'maintenance', 'retired'], 'Status'),
  priority: createEnumSchema(['low', 'medium', 'high', 'critical'], 'Priority'),
  workOrderStatus: createEnumSchema(['new', 'assigned', 'in_progress', 'completed', 'verified', 'closed'], 'Work Order Status'),
  workOrderType: createEnumSchema(['corrective', 'preventive', 'emergency'], 'Work Order Type'),
  userRole: createEnumSchema(['technician', 'supervisor', 'manager', 'admin', 'inventory_clerk', 'contractor', 'requester'], 'User Role'),
  
  // Date validations
  flexibleDate: flexibleDateSchema,
  optionalDate: flexibleDateSchema.optional(),
  nullableDate: flexibleDateSchema.nullable(),
  
  // Specialized validations
  email: emailSchema,
  password: passwordSchema,
  phoneNumber: z.string()
    .regex(/^\+?[\d\s\-\(\)\.]+$/, 'Invalid phone number format')
    .optional(),
    
  // Array validations
  stringArray: z.array(z.string()).default([]),
  uuidArray: z.array(uuidSchema).default([]),
  
  // JSON validations
  jsonObject: z.record(z.any()).default({}),
  optionalJsonObject: z.record(z.any()).optional(),
};
