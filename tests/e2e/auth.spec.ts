import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page for unauthenticated users', async ({
    page,
  }) => {
    // Clear any existing auth state after navigating to a page
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore localStorage errors in some browsers
      }
    });

    await expect(page).toHaveTitle(/MaintainPro CMMS/i);

    // Should redirect to login or show login form
    await expect(
      page
        .getByRole('heading', { name: /sign in/i })
        .or(page.getByText(/login/i))
    ).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore localStorage errors in some browsers
      }
    });

    // Try to find login form elements
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);
    const loginButton = page
      .getByRole('button', { name: /sign in/i })
      .or(page.getByRole('button', { name: /login/i }));

    if (await loginButton.isVisible()) {
      // Fill in invalid data
      await emailInput.fill('invalid-email');
      await passwordInput.fill('123'); // Too short
      await loginButton.click();

      // Check for validation errors
      await expect(
        page
          .getByText(/please enter a valid email/i)
          .or(page.getByText(/password must be at least 6 characters/i))
      ).toBeVisible();
    }
  });

  test('should access protected routes when authenticated', async ({
    page,
  }) => {
    // This test uses the mocked auth state from auth.setup.ts
    await page.goto('/dashboard');

    // Should be able to access dashboard
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });
});
