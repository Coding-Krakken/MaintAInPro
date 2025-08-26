import { test, expect } from '@playwright/test';

// Static auth token for testing - corresponds to supervisor@company.com
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YmI5OTE2OS0zMmY5LTRjMTEtOTIyYy01MDc2MmEzYzRlNzMiLCJlbWFpbCI6InN1cGVydmlzb3JAY29tcGFueS5jb20iLCJyb2xlIjoic3VwZXJ2aXNvciIsIndhcmVob3VzZUlkIjoiMTc3ZWNjMjQtYmI1YS00NzRkLWI3YjAtYzJmMGI0NzBhYTY4IiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NjE3NDI4OSwiZXhwIjo5OTk5OTk5OTk5LCJhdWQiOiJtYWludGFpbnByby1hcHAiLCJpc3MiOiJtYWludGFpbnByby1jbW1zIn0.test-token';

test('debug admin page access', async ({ page }) => {
  // Collect console logs
  const logs: string[] = [];
  page.on('console', (msg) => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Collect errors
  page.on('pageerror', (error) => {
    console.log('Page error:', error.message);
  });
  
  // Navigate to admin page directly
  await page.goto('http://localhost:5000/admin');
  
  // Set authentication token in localStorage
  await page.evaluate((tokenData) => {
    if (tokenData) {
      window.localStorage.setItem('authToken', tokenData);
      window.localStorage.setItem('userId', '6bb99169-32f9-4c11-922c-50762a3c4e73');
      window.localStorage.setItem('warehouseId', '177ecc24-bb5a-474d-b7b0-c2f0b470aa68');
    }
  }, authToken);
  
  // Reload to apply authentication
  await page.reload();
  await page.waitForTimeout(3000); // Give it time to load
  
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Check what's visible on the page
  const visibleText = await page.locator('body').textContent();
  console.log('Page contains System Administration:', visibleText?.includes('System Administration'));
  console.log('Page contains System Health:', visibleText?.includes('System Health'));
  console.log('Page contains login:', visibleText?.includes('Sign in to your account'));
  console.log('Page contains error:', visibleText?.includes('Something went wrong'));
  
  // List all h1, h2, h3 headings
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('All headings found:', headings);
  
  // Check if there are any error details
  const errorDetails = await page.locator('details, .error-details, pre').allTextContents();
  if (errorDetails.length > 0) {
    console.log('Error details:', errorDetails);
  }
  
  // Show recent console logs
  console.log('Console logs:', logs.slice(-5));
});