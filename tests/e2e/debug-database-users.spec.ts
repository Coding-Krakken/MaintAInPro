import { test, expect } from '@playwright/test';

test('debug: check database users and authentication flow', async ({ page }) => {
  // Navigate to the app first
  await page.goto('http://localhost:5000/login');
  
  // Test database connectivity and users
  const dbResponse = await page.evaluate(async () => {
    const res = await fetch('http://localhost:5000/api/health');
    const data = await res.json();
    return data.checks.find((check: any) => check.name === 'storage_layer');
  });

  console.log('Database Status:', JSON.stringify(dbResponse, null, 2));

  // Test authentication with each user from seeded data
  const testUsers = [
    { email: 'supervisor@maintainpro.com', role: 'supervisor' },
    { email: 'technician@maintainpro.com', role: 'technician' },
    { email: 'test@example.com', role: 'technician' },
    { email: 'manager@example.com', role: 'manager' }
  ];

  for (const user of testUsers) {
    console.log(`\n--- Testing user: ${user.email} ---`);
    
    const loginResponse = await page.evaluate(async (userData) => {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: 'demo123',
        }),
      });
      return {
        status: res.status,
        body: await res.text(),
        headers: Object.fromEntries(res.headers.entries()),
      };
    }, user);

    console.log(`Status: ${loginResponse.status}`);
    console.log(`Body: ${loginResponse.body}`);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      break; // Found working credentials
    } else {
      console.log('❌ Login failed');
    }
  }

  // This test is just for debugging, so we'll expect it to pass
  expect(true).toBe(true);
});