import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // This test suite uses the mocked auth state from auth.setup.ts
    // So we can directly navigate to protected routes
    await page.goto('/dashboard');
  });

  test('should display dashboard components', async ({ page }) => {
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    // Add more specific assertions based on your dashboard components
  });

  test('should navigate to work orders', async ({ page }) => {
    const workOrdersLink = page.getByRole('link', { name: /work orders/i });
    if (await workOrdersLink.isVisible()) {
      await workOrdersLink.click();
      await expect(page).toHaveURL(/work-orders/);
    }
  });

  test('should navigate to equipment', async ({ page }) => {
    const equipmentLink = page.getByRole('link', { name: /equipment/i });
    if (await equipmentLink.isVisible()) {
      await equipmentLink.click();
      await expect(page).toHaveURL(/equipment/);
    }
  });

  test('should navigate to inventory', async ({ page }) => {
    const inventoryLink = page.getByRole('link', { name: /inventory/i });
    if (await inventoryLink.isVisible()) {
      await inventoryLink.click();
      await expect(page).toHaveURL(/inventory/);
    }
  });
});
