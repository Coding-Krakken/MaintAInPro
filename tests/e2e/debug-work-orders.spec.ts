// Simple test script to check work orders
import { test, request } from '@playwright/test';

let authToken = '';

test.beforeAll(async () => {
  const apiContext = await request.newContext();
  const response = await apiContext.post('/api/auth/login', {
    data: {
      email: 'technician@company.com',
      password: 'demo123',
    },
  });
  const body = await response.json();
  authToken = body.token;
  await apiContext.dispose();
});

test('debug work order navigation', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate((token) => {
    window.localStorage.setItem('accessToken', token);
  }, authToken);
  await page.reload();

  // Navigate to work orders
  console.log('Current URL:', page.url());

  // Try to find navigation element
  const navElement = page.locator('[data-testid="nav-work-orders"]');
  const isNavVisible = await navElement.isVisible();
  console.log('Nav work orders visible:', isNavVisible);

  if (isNavVisible) {
    await navElement.click();
    await page.waitForURL('/work-orders');
    console.log('Successfully navigated to work orders');

    // Wait for work orders to load
    await page.waitForTimeout(2000);

    // Check for work order cards
    const workOrderCards = page.locator('[data-testid="work-order-card"]');
    const count = await workOrderCards.count();
    console.log('Work order cards found:', count);

    if (count > 0) {
      console.log('Work orders are available');
    } else {
      console.log('No work orders found');
      // Check page content
      const content = await page.textContent('body');
      console.log('Page content includes:', content?.includes('No work orders'));
    }
  } else {
    console.log('Navigation element not found');
    // Check if we're on mobile
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    const isMobileMenuVisible = await mobileMenuButton.isVisible();
    console.log('Mobile menu button visible:', isMobileMenuVisible);
  }
});
