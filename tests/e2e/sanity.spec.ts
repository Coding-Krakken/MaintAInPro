import { test, expect } from '@playwright/test';

test('sanity: homepage loads and root element is visible', async ({ page }) => {
  await page.goto('http://localhost:5000/');
  await expect(page.locator('body')).toBeVisible();
});
