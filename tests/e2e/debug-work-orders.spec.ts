import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test('debug work orders page', async ({ page }) => {
  // Use proper authentication helper
  await loginAs(page, TEST_USERS.technician);

  // Navigate to work orders via dashboard navigation
  console.log('Navigating to work orders...');
  await page.click('[data-testid="nav-work-orders"]');
  await page.waitForLoadState('networkidle');

  // Check what's on the page
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);

  const url = page.url();
  console.log('Current URL:', url);

  // Check for work order cards
  const workOrderCards = await page.locator('[data-testid="work-order-card"]').count();
  console.log('Work order cards found:', workOrderCards);

  // Check for any cards or list items
  const cards = await page.locator('.border').count();
  console.log('Total card elements:', cards);

  // Check for navigation elements
  const navWorkOrders = await page.locator('[data-testid="nav-work-orders"]').count();
  console.log('Nav work orders elements:', navWorkOrders);

  // Take a screenshot
  await page.screenshot({ path: '/tmp/work-orders-debug.png', fullPage: true });

  // Get page content
  const content = await page.textContent('body');
  console.log('Page content sample:', content?.substring(0, 500));

  // Check for error messages
  const errors = await page.locator('text=error').count();
  console.log('Error messages:', errors);

  // Check for loading states
  const loaders = await page.locator('[aria-busy="true"], .loading, .spinner').count();
  console.log('Loading states:', loaders);
});