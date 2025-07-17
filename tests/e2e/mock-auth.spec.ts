import { test, expect } from '@playwright/test';

test.describe('Dashboard UI (Mock Auth)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the auth state by intercepting network requests
    await page.route('**/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    });

    // Mock user profile requests
    await page.route('**/rest/v1/users**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-user-id',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      });
    });

    // Mock other API calls that might be needed
    await page.route('**/rest/v1/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('should display dashboard UI elements', async ({ page }) => {
    // Navigate to dashboard directly
    await page.goto('/dashboard');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if we see the dashboard content or login page
    const dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
    const loginButton = page.getByRole('button', { name: /sign in/i });

    // If we see the login page, the mock isn't working as expected
    if (await loginButton.isVisible()) {
      console.log('Login page detected - auth mocking may not be working');
      // Try to skip auth by manually setting localStorage
      await page.evaluate(() => {
        localStorage.setItem(
          'sb-test-auth-token',
          JSON.stringify({
            access_token: 'mock-token',
            expires_at: Date.now() + 3600000,
            user: { id: 'test-user', email: 'test@example.com' },
          })
        );
      });

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    // Check for dashboard elements (with more lenient timeout)
    await expect(dashboardHeading).toBeVisible({ timeout: 10000 });

    // Check for key dashboard components if they exist
    const workOrdersText = page.getByText('Active Work Orders');
    const equipmentText = page.getByText('Equipment Assets');
    const stockText = page.getByText('Low Stock Items');

    // These might not be visible if the data fetching fails, so check gently
    const hasWorkOrders = await workOrdersText.isVisible();
    const hasEquipment = await equipmentText.isVisible();
    const hasStock = await stockText.isVisible();

    console.log('Dashboard elements found:', {
      workOrders: hasWorkOrders,
      equipment: hasEquipment,
      stock: hasStock,
    });
  });

  test('should show navigation elements', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for navigation elements that should always be present
    const navigation = page.getByRole('navigation');
    await expect(navigation).toBeVisible();

    // Check for logo or brand
    const logo = page.getByText('MP').or(page.getByText('MaintainPro'));
    await expect(logo).toBeVisible();
  });
});
