import { test, expect } from '@playwright/test';

test.describe('Basic E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:5000/');

    // Check that the page loads
    await expect(page).toHaveTitle(/MaintainPro|Maintenance/);

    // Check for basic content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should verify test framework', async ({ page }) => {
    // Basic test to verify Playwright is working
    await page.goto('data:text/html,<html><body><h1>Test</h1></body></html>');
    await expect(page.locator('h1')).toHaveText('Test');
  });
});
