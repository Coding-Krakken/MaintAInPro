import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: string;
  expectedDashboard?: string;
}

export const TEST_USERS = {
  supervisor: {
    email: 'supervisor@company.com',
    password: 'demo123',
    role: 'supervisor',
    expectedDashboard: '/dashboard',
  },
  technician: {
    email: 'technician@company.com',
    password: 'demo123',
    role: 'technician',
    expectedDashboard: '/dashboard',
  },
  admin: {
    email: 'admin@company.com',
    password: 'demo123',
    role: 'admin',
    expectedDashboard: '/dashboard',
  },
} as const;

/**
 * Performs proper login using the login form instead of hardcoded tokens
 */
export async function loginAs(page: Page, user: TestUser): Promise<void> {
  await page.goto('http://localhost:5000/login');

  // Wait for login form to be visible
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);

  // Click login button
  await page.click('[data-testid="login-button"]');

  // Wait for navigation to complete
  await page.waitForTimeout(2000);

  // Verify we're on the expected page (usually dashboard)
  const expectedUrl = user.expectedDashboard || '/dashboard';
  await expect(page).toHaveURL(expectedUrl, { timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Check if logout button/menu exists and click it
  const logoutButton = page.locator('[data-testid="logout-button"]');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Alternative: clear localStorage and reload
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('http://localhost:5000/login');
  }

  // Verify we're back to login page
  await expect(page).toHaveURL('/login', { timeout: 5000 });
}

/**
 * Check if user is authenticated (not on login page)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return !page.url().includes('/login');
}
