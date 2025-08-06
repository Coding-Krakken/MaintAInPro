import { z } from 'zod';

// Test the schema directly
const testSchema = z.object({
  assetTag: z.string().min(1, 'Asset tag is required'),
  model: z.string().min(1, 'Model is required'),
  description: z.string().optional(),
  area: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired']),
  criticality: z.enum(['low', 'medium', 'high', 'critical']),
  warehouseId: z.string().uuid(),
});

const testData = {
  assetTag: 'ASSET-001',
  model: 'Test Machine',
  warehouseId: 'warehouse-1',
  status: 'active',
  criticality: 'high',
  description: 'Test equipment description'
};

const result = testSchema.safeParse(testData);
console.log('Success:', result.success);
if (!result.success) {
  console.log('Errors:', JSON.stringify(result.error.issues, null, 2));
}
