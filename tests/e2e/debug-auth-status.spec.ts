import { test, expect } from '@playwright/test';

test('debug authentication status and environment', async ({ page }) => {
  // Check if TEST_AUTH_MODE is active by making a direct API call
  await page.goto('/login');

  const response = await page.evaluate(async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      }),
    });
    return {
      status: res.status,
      body: await res.text(),
    };
  });

  console.log('API Response Status:', response.status);
  console.log('API Response Body:', response.body);

  if (response.status === 200) {
    console.log('❌ TEST_AUTH_MODE is active - invalid credentials accepted');
  } else {
    console.log('✅ Authentication is working properly - invalid credentials rejected');
  }

  // Test with valid credentials as well
  const validResponse = await page.evaluate(async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'supervisor@maintainpro.com',
        password: 'demo123',
      }),
    });
    return {
      status: res.status,
      body: await res.text(),
    };
  });

  console.log('Valid Credentials Status:', validResponse.status);
  console.log('Valid Credentials Body:', validResponse.body);

  // This test is just for debugging, so we'll expect it to pass
  expect(true).toBe(true);
});