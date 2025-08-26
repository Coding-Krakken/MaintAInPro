import { Page, expect } from '@playwright/test';

/**
 * Test data management for e2e tests
 * Provides deterministic seeding and cleanup utilities
 */

export interface TestWorkOrder {
  foNumber: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  equipmentId?: string;
}

export interface TestEquipment {
  name: string;
  model: string;
  serialNumber: string;
  location: string;
}

/**
 * Deterministic test data that works across test runs
 */
export const TEST_DATA = {
  workOrders: [
    {
      foNumber: 'WO-TEST-001',
      description: 'Test work order for e2e automation',
      priority: 'medium' as const,
    },
    {
      foNumber: 'WO-TEST-002', 
      description: 'High priority test work order',
      priority: 'high' as const,
    },
  ],
  equipment: [
    {
      name: 'Test Equipment Alpha',
      model: 'TEST-ALPHA-001',
      serialNumber: 'SN-TEST-001',
      location: 'Test Area 1',
    },
    {
      name: 'Test Equipment Beta',
      model: 'TEST-BETA-002',
      serialNumber: 'SN-TEST-002',
      location: 'Test Area 2',
    },
  ],
} as const;

/**
 * Check if test data exists and create it if needed
 */
export async function ensureTestData(page: Page): Promise<void> {
  // Check if work orders exist, create if needed
  await page.goto('http://localhost:5000/work-orders');
  await page.waitForLoadState('networkidle');
  
  const workOrderCards = await page.locator('[data-testid="work-order-card"]').count();
  
  if (workOrderCards === 0) {
    console.log('No work orders found, creating test data...');
    
    // Create test work orders
    for (const workOrder of TEST_DATA.workOrders) {
      await createTestWorkOrder(page, workOrder);
    }
  } else {
    console.log(`Found ${workOrderCards} existing work orders`);
  }
}

/**
 * Create a test work order
 */
export async function createTestWorkOrder(page: Page, workOrder: TestWorkOrder): Promise<void> {
  await page.goto('http://localhost:5000/work-orders');
  await page.waitForLoadState('networkidle');
  
  // Click create new work order
  const createButton = page.locator('[data-testid="create-work-order-button"], text="New Work Order"').first();
  await expect(createButton).toBeVisible();
  await createButton.click();
  
  // Wait for form to load
  await expect(page.locator('h2', { hasText: 'Create Work Order' })).toBeVisible();
  
  // Fill form
  await page.fill('[data-testid="fo-number-input"]', workOrder.foNumber);
  await page.fill('[data-testid="description-input"]', workOrder.description);
  
  // Select priority
  const prioritySelect = page.locator('[data-testid="priority-select"]');
  if (await prioritySelect.isVisible()) {
    await prioritySelect.click();
    await page.click(`text=${workOrder.priority}`);
  }
  
  // Select equipment if available
  const equipmentSelect = page.locator('[data-testid="equipment-select"]');
  if (await equipmentSelect.isVisible()) {
    await equipmentSelect.click();
    const firstOption = page.locator('[data-testid="equipment-option"]').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
    }
  }
  
  // Submit
  const submitButton = page.locator('[data-testid="submit-work-order-button"]');
  await expect(submitButton).toBeVisible();
  await submitButton.click();
  
  // Wait for success
  await expect(page.locator('[data-testid="success-message"], .success')).toBeVisible({ timeout: 5000 });
}

/**
 * Clean up test data - use with caution
 */
export async function cleanupTestData(page: Page): Promise<void> {
  // This should only clean up test-specific data, not all data
  console.log('Test data cleanup - only removing test-specific entries');
  
  // Navigate to work orders and remove test entries
  await page.goto('http://localhost:5000/work-orders');
  await page.waitForLoadState('networkidle');
  
  // Look for test work orders (those with WO-TEST prefix)
  for (const testWO of TEST_DATA.workOrders) {
    const testCard = page.locator(`[data-testid="work-order-card"]:has-text("${testWO.foNumber}")`);
    if (await testCard.isVisible()) {
      // Delete this test work order
      await testCard.click();
      
      const deleteButton = page.locator('[data-testid="delete-work-order-button"]');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion
        const confirmButton = page.locator('[data-testid="confirm-delete-button"]');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
  }
}

/**
 * Wait for empty state to be properly rendered
 */
export async function waitForEmptyState(page: Page, section: string): Promise<void> {
  const emptyStateSelectors = [
    'text=No work orders found',
    'text=No equipment found', 
    'text=No items found',
    '[data-testid="empty-state"]',
    '.empty-state',
  ];
  
  let found = false;
  for (const selector of emptyStateSelectors) {
    if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
      found = true;
      break;
    }
  }
  
  if (!found) {
    console.log(`Empty state not found for ${section}, but continuing test`);
  }
}

/**
 * Check if data exists and handle accordingly
 */
export async function handleDataState(page: Page, dataType: 'work-orders' | 'equipment'): Promise<'empty' | 'populated'> {
  await page.waitForLoadState('networkidle');
  
  const dataSelectors = {
    'work-orders': '[data-testid="work-order-card"]',
    'equipment': '[data-testid="equipment-card"]',
  };
  
  const count = await page.locator(dataSelectors[dataType]).count();
  
  if (count === 0) {
    await waitForEmptyState(page, dataType);
    return 'empty';
  } else {
    console.log(`Found ${count} ${dataType} items`);
    return 'populated';
  }
}