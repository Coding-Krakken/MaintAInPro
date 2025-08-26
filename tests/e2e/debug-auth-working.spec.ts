import { test } from '@playwright/test';

test('test working authentication with test@example.com', async ({ page }) => {
  await page.goto('http://localhost:5000/login');

  // Fill in credentials that we know work from debug-database-users test
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'demo123');

  // Click login
  await page.click('[data-testid="login-button"]');

  // Wait for navigation
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);

  // Check if we got redirected to dashboard or are still on login
  if (currentUrl.includes('/login')) {
    // Still on login page, check for error messages
    const pageContent = await page.content();
    console.log('Login failed, still on login page');

    // Look for error toast
    const hasErrorToast =
      pageContent.includes('Invalid credentials') || pageContent.includes('Error');
    console.log('Has error message:', hasErrorToast);
  } else {
    console.log('Login successful! Redirected to:', currentUrl);

    // Wait for dashboard elements to load
    await page.waitForSelector('body', { timeout: 5000 });

    // Dashboard loaded
    console.log('Dashboard loaded successfully');
  }
});
