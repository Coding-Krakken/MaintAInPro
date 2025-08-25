import { test, expect } from '@playwright/test';

test('debug valid credentials login', async ({ page }) => {
  await page.goto('/login');

  // Fill in valid credentials
  await page.fill('[data-testid="email-input"]', 'supervisor@maintainpro.com');
  await page.fill('[data-testid="password-input"]', 'demo123');

  // Listen for network requests to see what happens
  const loginRequests: any[] = [];
  page.on('request', request => {
    if (request.url().includes('/api/auth/login')) {
      loginRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
  });

  const loginResponses: any[] = [];
  page.on('response', async response => {
    if (response.url().includes('/api/auth/login')) {
      const text = await response.text();
      loginResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        body: text
      });
    }
  });

  // Submit login
  await page.click('[data-testid="login-button"]');

  // Wait a moment for the request to complete
  await page.waitForTimeout(3000);

  // Log what happened
  console.log('Login Requests:', JSON.stringify(loginRequests, null, 2));
  console.log('Login Responses:', JSON.stringify(loginResponses, null, 2));

  // Check current URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Check for any error messages on page
  const errorElements = await page.locator('[data-testid="error-message"]').all();
  if (errorElements.length > 0) {
    for (const el of errorElements) {
      const text = await el.textContent();
      console.log('Error element text:', text);
    }
  }

  // Check for toast notifications
  const toastElements = await page.locator('.destructive').all();
  if (toastElements.length > 0) {
    for (const el of toastElements) {
      const text = await el.textContent();
      console.log('Toast error text:', text);
    }
  }

  expect(true).toBe(true); // This test is just for debugging
});