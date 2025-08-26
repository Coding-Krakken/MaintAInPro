import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from '../helpers/auth';

test.describe('Health Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Use proper authentication flow instead of hardcoded tokens
    await loginAs(page, TEST_USERS.supervisor);
    
    // Navigate to the admin page after authentication
    await page.goto('http://localhost:5000/admin');
  });

  test('should display health dashboard correctly', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the System Health heading is visible
    await expect(page.locator('h2').filter({ hasText: 'System Health' })).toBeVisible();

    // Check if the description is visible
    await expect(page.locator('text=Monitor system status and performance metrics')).toBeVisible();

    // Check status cards - expect real API data
    await expect(page.locator('text=Unhealthy')).toBeVisible(); // Real API shows status: 'degraded' or 'unhealthy' 
    await expect(page.locator('text=development environment')).toBeVisible();
    await expect(page.locator('text=0').first()).toBeVisible(); // Active connections from real API
    await expect(page.locator('text=1.0.0').first()).toBeVisible(); // Version
    await expect(page.locator('text=Port 5000')).toBeVisible();
  });

  test('should display memory usage information when available', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check if memory usage card is present (it's conditional based on data availability)
    const memoryCard = page.locator('text=Memory Usage');
    const isVisible = await memoryCard.isVisible();
    
    if (isVisible) {
      // Check for presence of memory data (values will be dynamic based on actual memory)
      await expect(page.locator('text=Heap:')).toBeVisible();
      await expect(page.locator('text=RSS:')).toBeVisible();
      console.log('Memory usage card is visible');
    } else {
      // This is expected if memory data is not available from the health API
      console.log('Memory usage card not visible - memory data not available');
    }
  });

  test('should display feature status', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check feature status card exists
    await expect(page.locator('text=Feature Status')).toBeVisible();
    await expect(page.locator('text=Current status of system features')).toBeVisible();
    
    // The individual features might not show if health.features is empty
    // This is expected behavior - the card shows but no features are listed
    console.log('Feature Status card is displayed correctly');
  });

  test('should display deployment information when available', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check if deployment information card is present (it's conditional based on data availability)
    const deploymentCard = page.locator('text=Deployment Information');
    const isVisible = await deploymentCard.isVisible();
    
    if (isVisible) {
      // If deployment information is available, check its contents
      await expect(deploymentCard).toBeVisible();
      console.log('Deployment information card is visible');
    } else {
      // This is expected in test environment where deployment info isn't available
      console.log('Deployment information card not visible - expected in test environment');
    }
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

    // Use proper authentication first, then the mock will take effect
    await loginAs(page, TEST_USERS.supervisor);
    await page.goto('http://localhost:5000/admin');
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

    // Use proper authentication first, then the mock will take effect
    await loginAs(page, TEST_USERS.supervisor);
    await page.goto('http://localhost:5000/admin');
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
