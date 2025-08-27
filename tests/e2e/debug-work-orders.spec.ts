// Simple test script to check work orders
import { test } from '@playwright/test';

test('debug work order navigation', async ({ page }) => {
  // Login first
  console.log('Navigating to /login');
  await page.goto('/login');
  console.log('Current URL after goto:', page.url());
  console.log('Page title:', await page.title());
  
  // Check if elements exist
  const emailInput = page.locator('[data-testid="email-input"]');
  const passwordInput = page.locator('[data-testid="password-input"]');
  const loginButton = page.locator('[data-testid="login-button"]');
  
  console.log('Email input exists:', await emailInput.isVisible());
  console.log('Password input exists:', await passwordInput.isVisible());
  console.log('Login button exists:', await loginButton.isVisible());
  
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password');
  
  console.log('Submitting login form');
  await page.click('[data-testid="login-button"]');
  
  // Wait a bit for the request to process
  await page.waitForTimeout(2000);
  
  console.log('Current URL after submit:', page.url());
  
  // Check for error message
  const errorMessage = page.locator('[data-testid="error-message"]');
  if (await errorMessage.isVisible()) {
    console.log('Error message:', await errorMessage.textContent());
  } else {
    console.log('No error message visible');
  }

  // Wait for redirect
  await page.waitForURL('/dashboard');

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
      console.log('Page content includes:', content?.includes('No work orders') || false);
    }
  } else {
    console.log('Navigation element not found');
    // Check if we're on mobile
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    const isMobileMenuVisible = await mobileMenuButton.isVisible();
    console.log('Mobile menu button visible:', isMobileMenuVisible);
  }
});
