import { test, expect } from '@playwright/test';

test('minimal test - page loads', async ({ page }) => {
  test.setTimeout(15000);
  console.log('Starting minimal test...');
  
  await page.goto('http://localhost:5000/', { 
    waitUntil: 'domcontentloaded',
    timeout: 10000 
  });
  
  console.log('Page loaded, checking body visibility...');
  await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
  
  console.log('Body is visible, test completed successfully');
});

test('minimal login form test', async ({ page }) => {
  test.setTimeout(15000);
  console.log('Starting login form test...');
  
  await page.goto('http://localhost:5000/login', { 
    waitUntil: 'domcontentloaded',
    timeout: 10000 
  });
  
  console.log('Login page loaded, checking form elements...');
  
  // Look for any form inputs (be flexible with selectors)
  const inputs = page.locator('input').first();
  await expect(inputs).toBeVisible({ timeout: 5000 });
  
  console.log('Form inputs found, test completed successfully');
});