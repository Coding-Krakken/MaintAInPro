import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page and perform login
    await page.goto('/');

    // Check if we're on the login page
    const loginButton = page.getByRole('button', { name: /sign in/i });

    if (await loginButton.isVisible()) {
      // Fill in demo credentials
      await page
        .getByRole('textbox', { name: /email/i })
        .fill('admin@maintainpro.com');
      await page
        .getByRole('textbox', { name: /password/i })
        .fill('password123');
      await loginButton.click();

      // Wait for navigation to dashboard
      await page.waitForURL('/dashboard');
    }
  });

  test('should display dashboard components', async ({ page }) => {
    // Wait for dashboard to load and check for the main heading
    await expect(
      page.getByRole('heading', { name: /dashboard/i })
    ).toBeVisible();

    // Check for key dashboard components
    await expect(page.getByText('Active Work Orders')).toBeVisible();
    await expect(page.getByText('Equipment Assets')).toBeVisible();
    await expect(page.getByText('Low Stock Items')).toBeVisible();
    await expect(page.getByText('Recent Work Orders')).toBeVisible();
  });

  test('should navigate to work orders', async ({ page }) => {
    await page.getByRole('link', { name: /work orders/i }).click();
    await expect(page).toHaveURL('/work-orders');
  });

  test('should navigate to equipment', async ({ page }) => {
    await page.getByRole('link', { name: /equipment/i }).click();
    await expect(page).toHaveURL('/equipment');
  });

  test('should navigate to inventory', async ({ page }) => {
    await page.getByRole('link', { name: /inventory/i }).click();
    await expect(page).toHaveURL('/inventory');
  });
});
