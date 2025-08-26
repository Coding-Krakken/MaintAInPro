import { test, expect } from '@playwright/test';

test('check server environment during test', async ({ page }) => {
  // Create a debug endpoint call to see what the server environment looks like
  await page.goto('http://localhost:5000/login');

  const response = await page.evaluate(async () => {
    // Make a call to a debug endpoint that should return server env info
    const res = await fetch('http://localhost:5000/api/debug/env', {
      method: 'GET',
    });
    return {
      status: res.status,
      body: await res.text(),
    };
  });

  console.log('Debug endpoint status:', response.status);
  console.log('Debug endpoint body:', response.body);

  // Also test if we can check environment via a custom endpoint
  const authTestResponse = await page.evaluate(async () => {
    const res = await fetch('http://localhost:5000/api/debug/auth-mode', {
      method: 'GET',
    });
    return {
      status: res.status,
      body: await res.text(),
    };
  });

  console.log('Auth mode endpoint status:', authTestResponse.status);
  console.log('Auth mode endpoint body:', authTestResponse.body);

  expect(true).toBe(true);
});