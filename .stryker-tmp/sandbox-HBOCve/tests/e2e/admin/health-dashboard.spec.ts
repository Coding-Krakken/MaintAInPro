// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Health Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the health API endpoint to return consistent data
    await page.route('/api/health', async route => {
      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: 'test',
        port: 5000,
        version: '1.0.0',
        uptime: 3600,
        memory: {
          rss: 104857600,
          heapTotal: 67108864,
          heapUsed: 33554432,
          external: 8388608,
          arrayBuffers: 1048576,
        },
        websocket: {
          totalConnections: 10,
          activeConnections: 8,
          connectionsByWarehouse: {
            'warehouse-1': 5,
            'warehouse-2': 3,
          },
        },
        features: {
          auth: 'enabled',
          database: 'enabled',
          redis: 'disabled',
          email: 'enabled',
        },
        sha: 'abcd1234567890',
        buildId: 'build-12345',
        region: 'us-east-1',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(healthData),
      });
    });

    // Navigate to the admin page
    await page.goto('/admin');
  });

  test('should display health dashboard correctly', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the System Health heading is visible
    await expect(page.locator('h2').filter({ hasText: 'System Health' })).toBeVisible();

    // Check if the description is visible
    await expect(page.locator('text=Monitor system status and performance metrics')).toBeVisible();

    // Check status cards
    await expect(page.locator('text=Healthy')).toBeVisible();
    await expect(page.locator('text=test environment')).toBeVisible();
    await expect(page.locator('text=8').first()).toBeVisible(); // Active connections
    await expect(page.locator('text=1.0.0').first()).toBeVisible(); // Version
    await expect(page.locator('text=Port 5000')).toBeVisible();
  });

  test('should display memory usage information', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check memory usage card
    await expect(page.locator('text=Memory Usage')).toBeVisible();
    await expect(page.locator('text=Heap: 32MB / 64MB')).toBeVisible();
    await expect(page.locator('text=50%')).toBeVisible();
    await expect(page.locator('text=RSS: 100MB')).toBeVisible();
  });

  test('should display feature status', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check feature status card
    await expect(page.locator('text=Feature Status')).toBeVisible();
    await expect(page.locator('text=Auth')).toBeVisible();
    await expect(page.locator('text=Database')).toBeVisible();
    await expect(page.locator('text=Redis')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();

    // Check for enabled/disabled badges
    const enabledBadges = page.locator('text=Enabled');
    await expect(enabledBadges).toHaveCount(3); // auth, database, email

    const disabledBadges = page.locator('text=Disabled');
    await expect(disabledBadges).toHaveCount(1); // redis
  });

  test('should display deployment information', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check deployment information card
    await expect(page.locator('text=Deployment Information')).toBeVisible();
    await expect(page.locator('text=abcd1234')).toBeVisible(); // SHA (first 8 chars)
    await expect(page.locator('text=build-12345')).toBeVisible(); // Build ID (first 12 chars)
    await expect(page.locator('text=us-east-1')).toBeVisible(); // Region
  });

  test('should display websocket connections', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check websocket connections card
    await expect(page.locator('text=Active Connections by Warehouse')).toBeVisible();
    await expect(page.locator('text=warehouse-1')).toBeVisible();
    await expect(page.locator('text=warehouse-2')).toBeVisible();
    await expect(page.locator('text=5 connections')).toBeVisible();
    await expect(page.locator('text=3 connections')).toBeVisible();
  });

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Track API calls
    let apiCallCount = 0;
    page.on('request', request => {
      if (request.url().includes('/api/health')) {
        apiCallCount++;
      }
    });

    // Click the refresh button
    const refreshButton = page.locator('button').filter({ hasText: 'Refresh' });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Wait a bit for the API call
    await page.waitForTimeout(500);

    // Verify that an additional API call was made
    expect(apiCallCount).toBeGreaterThan(1);
  });

  test('should handle error state correctly', async ({ page }) => {
    // Mock API to return an error
    await page.route('/api/health', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check error state
    await expect(page.locator('text=Failed to Load Health Data')).toBeVisible();
    await expect(page.locator('text=Unable to fetch system health information')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Retry' })).toBeVisible();
  });

  test('should handle unhealthy status', async ({ page }) => {
    // Mock API to return unhealthy status
    await page.route('/api/health', async route => {
      const unhealthyData = {
        status: 'error',
        timestamp: new Date().toISOString(),
        env: 'test',
        port: 5000,
        version: '1.0.0',
        uptime: 60,
        memory: {
          rss: 104857600,
          heapTotal: 67108864,
          heapUsed: 67108864, // 100% heap usage
          external: 8388608,
          arrayBuffers: 1048576,
        },
        websocket: {
          totalConnections: 0,
          activeConnections: 0,
          connectionsByWarehouse: {},
        },
        features: {
          auth: 'disabled',
          database: 'error',
          redis: 'disabled',
          email: 'disabled',
        },
      };

      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify(unhealthyData),
      });
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should show error state due to 503 status
    await expect(page.locator('text=Failed to Load Health Data')).toBeVisible();
  });

  test('should auto-refresh every 30 seconds', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Track API calls
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/health')) {
        apiCalls.push(new Date().toISOString());
      }
    });

    // Wait for at least 30 seconds to verify auto-refresh
    // Note: In a real test, you might want to mock timers for faster execution
    await page.waitForTimeout(32000);

    // Should have made at least one additional API call due to auto-refresh
    expect(apiCalls.length).toBeGreaterThan(1);
  });

  test('should display loading state during refresh', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Mock slow API response
    await page.route('/api/health', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          env: 'test',
          port: 5000,
          version: '1.0.0',
          uptime: 3600,
          memory: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
          websocket: { totalConnections: 0, activeConnections: 0, connectionsByWarehouse: {} },
          features: {},
        }),
      });
    });

    // Click refresh button
    const refreshButton = page.locator('button').filter({ hasText: 'Refresh' });
    await refreshButton.click();

    // Check that button becomes disabled during loading
    await expect(refreshButton).toBeDisabled();
  });

  test('should be accessible', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for proper heading hierarchy
    await expect(page.locator('h1').filter({ hasText: 'System Administration' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'System Health' })).toBeVisible();

    // Check for button accessibility
    const refreshButton = page.locator('button').filter({ hasText: 'Refresh' });
    await expect(refreshButton).toBeVisible();
    await expect(refreshButton).toBeEnabled();

    // Check that cards have proper structure
    const cards = page.locator('[role="region"], .card, [data-testid="card"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should navigate between admin tabs', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check that Health tab is active by default
    const healthTab = page.locator('button').filter({ hasText: 'System Health' });
    await expect(healthTab).toHaveAttribute('aria-selected', 'true');

    // Click Performance tab
    const performanceTab = page.locator('button').filter({ hasText: 'Performance' });
    await performanceTab.click();

    // Check that Performance tab is now active
    await expect(performanceTab).toHaveAttribute('aria-selected', 'true');
    await expect(healthTab).toHaveAttribute('aria-selected', 'false');

    // Navigate back to Health tab
    await healthTab.click();
    await expect(healthTab).toHaveAttribute('aria-selected', 'true');

    // Health dashboard should be visible again
    await expect(page.locator('text=System Health')).toBeVisible();
  });
});
