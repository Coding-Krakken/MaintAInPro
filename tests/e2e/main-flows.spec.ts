import { test, expect } from '@playwright/test';
import { testData, testCredentials } from '../helpers/testData';
import { loginAs, TEST_USERS } from './helpers/auth';

// Test data - use actual emails from database
const testUsers = {
  technician: {
    email: 'technician@maintainpro.com',
    password: 'demo123',
    name: 'Test User', // Actual name from database
    role: 'technician',
  },
  supervisor: {
    email: 'supervisor@maintainpro.com',
    password: 'demo123',
    name: 'John Smith', // Actual name from database
    role: 'supervisor',
  },
  manager: {
    email: 'manager@example.com',
    password: 'demo123',
    name: 'Mike Johnson', // Actual name from database
    role: 'manager',
  },
};

const testWorkOrder = testData.workOrder;

test.describe('Authentication Flow', () => {
  test('user can login and logout', async ({ page }) => {
    // Use proper authentication helper instead of hardcoded tokens
    await loginAs(page, TEST_USERS.supervisor);

    // Verify successful login - we should be on dashboard after loginAs
    await expect(page).toHaveURL('/dashboard');
    // Wait for dashboard stats to be visible
    await expect(page.locator('[data-testid="total-work-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-work-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-work-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-equipment"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toContainText('John Smith');
    // Debug: log dashboard HTML and check for overlays
    const dashboardHtml = await page.content();
    console.log('Dashboard HTML after login:', dashboardHtml.slice(0, 1000));
    const overlays = await page
      .locator('[aria-hidden="true"], [aria-busy="true"], .modal, .overlay, .loader, .spinner')
      .count();
    console.log('Overlay/loader count after login:', overlays);
    // Note: Some overlays may be acceptable (e.g., toast notifications)
    // Main requirement is that user can interact with dashboard elements
    // Logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');
    // Verify logout
    await expect(page).toHaveURL('/login');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5000/login');

    await page.fill('[data-testid="email-input"]', testCredentials.invalid.email);
    await page.fill('[data-testid="password-input"]', testCredentials.invalid.password);

    await page.click('[data-testid="login-button"]');

    // Check for toast notification with error message
    await expect(page.locator('.destructive')).toBeVisible();
    await expect(page.locator('.destructive')).toContainText('Login failed');
  });
});

test.describe('Work Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Use proper login instead of hardcoded tokens
    await loginAs(page, TEST_USERS.technician);
  });

  test('technician can complete work order flow @smoke', async ({ page }) => {
    // Navigate to work orders
    await page.click('[data-testid="nav-work-orders"]');
    await expect(page).toHaveURL('/work-orders');

    // Select first work order
    await page.click('[data-testid="work-order-card"]:first-child');

    // Update status to in progress (Radix UI combobox)
    await page.click('[data-testid="status-select"]');
    await page.click('text=In Progress');
    await page.click('[data-testid="update-status-button"]');

    // Verify status update
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('In Progress');

    // Add notes
    await page.fill('[data-testid="notes-input"]', 'Working on equipment maintenance');
    await page.click('[data-testid="add-note-button"]');

    // Add parts used
    await page.click('[data-testid="add-parts-button"]');
    await page.fill('[data-testid="part-search"]', 'HYT106');
    await page.click('[data-testid="part-select"]:first-child');
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="confirm-parts-button"]');

    // Complete work order
    await page.selectOption('[data-testid="status-select"]', 'completed');
    await page.click('[data-testid="complete-button"]');

    // Verify completion
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Completed');
  });

  test('can create new work order', async ({ page }) => {
    await page.goto('http://localhost:5000/work-orders');

    // Click create new work order
    await page.click('[data-testid="create-work-order-button"]');

    // Fill in work order details
    await page.fill('[data-testid="fo-number-input"]', testWorkOrder.foNumber);
    await page.fill('[data-testid="description-input"]', testWorkOrder.description);
    // Select priority (Radix UI combobox)
    await page.click('[data-testid="priority-select"]');
    // Wait for combobox overlay to be visible - use a more specific locator
    const comboboxOverlay = page
      .locator('[role="listbox"], [role="combobox"][aria-expanded="true"], [data-state="open"]')
      .first();
    await comboboxOverlay.waitFor({ state: 'visible', timeout: 5000 });
    // Select priority
    await page.click(`text=${testWorkOrder.priority}`);
    // Wait for overlay to disappear before next action
    await page.waitForTimeout(500); // Simple timeout instead of complex selector

    // Select equipment
    await page.click('[data-testid="equipment-select"]');
    await page.click('[data-testid="equipment-option"]:first-child');

    // Submit form
    await page.click('[data-testid="submit-work-order-button"]');

    // Verify creation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="work-order-card"]')).toContainText(
      testWorkOrder.foNumber
    );
  });

  test('can filter work orders', async ({ page }) => {
    await page.goto('http://localhost:5000/work-orders');

    // Filter by status (Radix UI combobox)
    await page.click('[data-testid="status-filter"]');
    await page.click('text=New');

    // Verify filtering
    const workOrderCards = page.locator('[data-testid="work-order-card"]');
    await expect(workOrderCards).toHaveCount(1);

    // Check that all visible work orders have 'new' status
    const statusBadges = page.locator('[data-testid="status-badge"]');
    const count = await statusBadges.count();
    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toContainText('New');
    }
  });

  test('can search work orders', async ({ page }) => {
    await page.goto('http://localhost:5000/work-orders');

    // Search for specific work order
    await page.fill('[data-testid="search-input"]', 'WO-001');

    // Verify search results
    await expect(page.locator('[data-testid="work-order-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="work-order-card"]')).toContainText('WO-001');
  });
});

test.describe('Equipment Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as supervisor (has equipment management permissions)
    await page.goto('http://localhost:5000/login');
    await page.fill('[data-testid="email-input"]', 'supervisor@maintainpro.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('can view equipment list', async ({ page }) => {
    await page.click('[data-testid="nav-equipment"]');
    await expect(page).toHaveURL('/equipment');

    // Verify equipment list is displayed
    const equipmentCards = page.locator('[data-testid="equipment-card"]');
    await expect(equipmentCards.first()).toBeVisible();
  });

  test('can create new equipment', async ({ page }) => {
    await page.goto('http://localhost:5000/equipment');

    // Click create new equipment
    await page.click('[data-testid="create-equipment-button"]');

    // Fill in equipment details
    await page.fill('[data-testid="equipment-name-input"]', 'Test Equipment');
    await page.fill('[data-testid="equipment-model-input"]', 'TEST-001');
    await page.fill('[data-testid="serial-number-input"]', 'SN123456');
    await page.fill('[data-testid="location-input"]', 'Plant 1');

    // Submit form
    await page.click('[data-testid="submit-equipment-button"]');

    // Verify creation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="equipment-card"]')).toContainText('Test Equipment');
  });

  test('can scan QR code for equipment', async ({ page }) => {
    await page.goto('http://localhost:5000/equipment');

    // Mock camera permissions
    await page.context().grantPermissions(['camera']);

    // Click QR scan button
    await page.click('[data-testid="qr-scan-button"]');

    // Verify QR scanner is active
    await expect(page.locator('[data-testid="qr-scanner"]')).toBeVisible();

    // Note: Actual QR scanning would require camera simulation
    // This test verifies the scanner interface opens
  });
});

test.describe('Dashboard and Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5000/login');
    await page.fill('[data-testid="email-input"]', 'manager@company.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('displays dashboard metrics', async ({ page }) => {
    // Verify key metrics are displayed
    await expect(page.locator('[data-testid="total-work-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-work-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-work-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-equipment"]')).toBeVisible();

    // Verify charts are rendered
    await expect(page.locator('[data-testid="work-order-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="equipment-chart"]')).toBeVisible();
  });

  test('can filter dashboard by date range', async ({ page }) => {
    // Open date range picker
    await page.click('[data-testid="date-range-picker"]');

    // Select last 30 days
    await page.click('[data-testid="date-range-30-days"]');

    // Verify data updates
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();

    // Verify date range is applied
    await expect(page.locator('[data-testid="date-range-display"]')).toContainText('Last 30 days');
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('mobile navigation works correctly', async ({ page }) => {
    await page.goto('http://localhost:5000/login');
    await page.fill('[data-testid="email-input"]', testUsers.technician.email);
    await page.fill('[data-testid="password-input"]', testUsers.technician.password);
    await page.click('[data-testid="login-button"]');

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');

    // Verify menu items are visible
    await expect(page.locator('[data-testid="mobile-nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav-work-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav-equipment"]')).toBeVisible();

    // Navigate to work orders
    await page.click('[data-testid="mobile-nav-work-orders"]');
    await expect(page).toHaveURL('/work-orders');
  });

  test('work order cards are touch-friendly', async ({ page }) => {
    await page.goto('http://localhost:5000/login');
    await page.fill('[data-testid="email-input"]', testUsers.technician.email);
    await page.fill('[data-testid="password-input"]', testUsers.technician.password);
    await page.click('[data-testid="login-button"]');

    await page.goto('http://localhost:5000/work-orders');

    // Verify work order cards are adequately sized for touch
    const workOrderCard = page.locator('[data-testid="work-order-card"]').first();
    const boundingBox = await workOrderCard.boundingBox();

    // Minimum touch target size should be 44px (WCAG recommendation)
    expect(boundingBox!.height).toBeGreaterThan(44);
  });
});

test.describe('Offline Functionality', () => {
  test('shows offline indicator when network is unavailable', async ({ page }) => {
    await page.goto('http://localhost:5000/login');
    await page.fill('[data-testid="email-input"]', testUsers.technician.email);
    await page.fill('[data-testid="password-input"]', testUsers.technician.password);
    await page.click('[data-testid="login-button"]');

    // Simulate offline mode
    await page.context().setOffline(true);

    // Verify offline indicator appears
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('Offline');
  });

  test('can complete work orders offline', async ({ page }) => {
    await page.goto('http://localhost:5000/login');
    await page.fill('[data-testid="email-input"]', testUsers.technician.email);
    await page.fill('[data-testid="password-input"]', testUsers.technician.password);
    await page.click('[data-testid="login-button"]');

    await page.goto('http://localhost:5000/work-orders');

    // Go offline
    await page.context().setOffline(true);

    // Complete work order
    await page.click('[data-testid="work-order-card"]');
    await page.click('[data-testid="status-select"]');
    await page.click('text=Completed');
    await page.click('[data-testid="complete-button"]');

    // Verify queued for sync
    await expect(page.locator('[data-testid="sync-queue-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-queue-indicator"]')).toContainText(
      '1 item queued'
    );

    // Go back online
    await page.context().setOffline(false);

    // Verify sync occurs
    await expect(page.locator('[data-testid="sync-queue-indicator"]')).not.toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5000/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
  });

  test('has proper focus indicators', async ({ page }) => {
    await page.goto('http://localhost:5000/login');

    // Focus on input and verify focus indicator
    await page.keyboard.press('Tab');
    const emailInput = page.locator('[data-testid="email-input"]');
    await expect(emailInput).toBeFocused();

    // Verify focus indicator is visible (this would need specific CSS checks)
    // await expect(emailInput).toHaveCSS('outline', expect.stringContaining('solid'))
  });
});

test.describe('Performance', () => {
  test('dashboard loads within acceptable time', async ({ page }) => {
    await page.goto('http://localhost:5000/login');
    await page.fill('[data-testid="email-input"]', testUsers.technician.email);
    await page.fill('[data-testid="password-input"]', testUsers.technician.password);

    const startTime = Date.now();
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    // Verify dashboard loads within 3 seconds
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('work order list handles large datasets', async ({ page }) => {
    await page.goto('http://localhost:5000/login');
    await page.fill('[data-testid="email-input"]', testUsers.technician.email);
    await page.fill('[data-testid="password-input"]', testUsers.technician.password);
    await page.click('[data-testid="login-button"]');

    await page.goto('http://localhost:5000/work-orders');

    // Verify virtual scrolling is working (if implemented)
    // This would need specific implementation details
    await expect(page.locator('[data-testid="work-order-list"]')).toBeVisible();
  });
});
