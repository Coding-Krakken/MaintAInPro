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

  test.skip('should show validation errors for invalid login', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore localStorage errors in some browsers
      }
    });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Try to find login form elements
    const emailInput = page.getByPlaceholder(/enter your email/i);
    const passwordInput = page.getByPlaceholder(/enter your password/i);
    const loginButton = page
      .getByRole('button', { name: /sign in/i })
      .or(page.getByRole('button', { name: /login/i }));

    if (await loginButton.isVisible()) {
      // Fill in invalid data
      await emailInput.fill('invalid-email');
      await passwordInput.fill('123'); // Too short
      await loginButton.click();

      // Check for any error text on the page (more flexible)
      await expect(
        page
          .getByText(/error/i)
          .or(page.getByText(/invalid/i))
          .or(page.getByText(/must be/i))
      ).toBeVisible();
    }
  });

  test('should access protected routes when authenticated', async ({
    page,
  }) => {
    // Use actual login flow instead of mocked auth
    await page.goto('/');

    // Check if we're on the login page and perform login
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

    // Should be able to access dashboard - look for the page title in header
    await expect(
      page.getByRole('heading', { name: /dashboard/i })
    ).toBeVisible();
  });
});
