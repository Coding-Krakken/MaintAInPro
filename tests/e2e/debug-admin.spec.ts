import { test } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test('debug admin page access', async ({ page }) => {
  // Collect console logs
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  // Use proper authentication helper
  await loginAs(page, TEST_USERS.supervisor);

  // Navigate to admin page after authentication
  await page.goto('http://localhost:5000/admin');
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
  const cardTitles = await page
    .locator('h3, .card-title, [class*="card"] h2, [class*="card"] h3, [class*="card"] h4')
    .allTextContents();
  console.log('All card titles found:', cardTitles);

  // Check if there are error messages
  const errorText = await page.locator('text=Failed to').count();
  console.log('Number of "Failed to" messages:', errorText);
});
