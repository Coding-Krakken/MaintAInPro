import { test, expect } from '@playwright/test';

// Static auth token for testing - corresponds to supervisor@company.com
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YmI5OTE2OS0zMmY5LTRjMTEtOTIyYy01MDc2MmEzYzRlNzMiLCJlbWFpbCI6InN1cGVydmlzb3JAY29tcGFueS5jb20iLCJyb2xlIjoic3VwZXJ2aXNvciIsIndhcmVob3VzZUlkIjoiMTc3ZWNjMjQtYmI1YS00NzRkLWI3YjAtYzJmMGI0NzBhYTY4IiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NjE3NDI4OSwiZXhwIjo5OTk5OTk5OTk5LCJhdWQiOiJtYWludGFpbnByby1hcHAiLCJpc3MiOiJtYWludGFpbnByby1jbW1zIn0.test-token';

test('debug admin page access', async ({ page }) => {
  // Collect console logs
  const logs: string[] = [];
  page.on('console', (msg) => {
    logs.push(`${msg.type()}: ${msg.text()}`);
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
  
  // Get all visible text for debugging
  const visibleText = await page.locator('body').textContent();
  console.log('Full page text:', visibleText?.slice(0, 1000));
  
  // Check if specific cards are present
  const memoryCard = await page.locator('text=Memory Usage').isVisible();
  const featureCard = await page.locator('text=Feature Status').isVisible();
  
  console.log('Memory Usage card visible:', memoryCard);
  console.log('Feature Status card visible:', featureCard);
  
  // Check for all card titles
  const cardTitles = await page.locator('h3, .card-title, [class*="card"] h2, [class*="card"] h3, [class*="card"] h4').allTextContents();
  console.log('All card titles found:', cardTitles);
  
  // Check if there are error messages
  const errorText = await page.locator('text=Failed to').count();
  console.log('Number of "Failed to" messages:', errorText);
});