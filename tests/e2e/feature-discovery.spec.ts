import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  href: string;
  text: string;
  status: 'implemented' | 'placeholder' | 'coming-soon' | 'error';
  hasContent: boolean;
  hasPlaceholder: boolean;
  loadTime: number;
}

interface FeatureDiscoveryReport {
  timestamp: string;
  totalRoutes: number;
  implementedRoutes: number;
  placeholderRoutes: number;
  routes: RouteInfo[];
  mobileCompatible: boolean;
  offlineCapable: boolean;
}

test.describe('Application Feature Discovery', () => {
  test('should catalog all accessible routes and pages', async ({ page }) => {
    const report: FeatureDiscoveryReport = {
      timestamp: new Date().toISOString(),
      totalRoutes: 0,
      implementedRoutes: 0,
      placeholderRoutes: 0,
      routes: [],
      mobileCompatible: false,
      offlineCapable: false,
    };

    // Navigate to home page
    await page.goto('/');

    // Collect all navigation links
    const navigationSelectors = [
      'nav a',
      '[role="navigation"] a',
      'header a',
      '.sidebar a',
      '.menu a',
      '[data-testid*="nav"] a',
      '[data-testid*="menu"] a',
    ];

    const routes: RouteInfo[] = [];
    const discoveredHrefs = new Set<string>();

    // Collect links from multiple navigation areas
    for (const selector of navigationSelectors) {
      try {
        const links = await page.locator(selector).all();

        for (const link of links) {
          const href = await link.getAttribute('href');
          const text = await link.textContent();

          if (href && !discoveredHrefs.has(href) && href.startsWith('/')) {
            discoveredHrefs.add(href);
            routes.push({
              href,
              text: text?.trim() || '',
              status: 'implemented',
              hasContent: false,
              hasPlaceholder: false,
              loadTime: 0,
            });
          }
        }
      } catch (error) {
        console.log(`No links found for selector: ${selector}`);
      }
    }

    // Add common routes that might not be in navigation
    const commonRoutes = [
      '/dashboard',
      '/work-orders',
      '/work-orders/create',
      '/equipment',
      '/equipment/register',
      '/inventory',
      '/maintenance',
      '/reports',
      '/settings',
      '/profile',
      '/help',
    ];

    for (const route of commonRoutes) {
      if (!discoveredHrefs.has(route)) {
        routes.push({
          href: route,
          text: route.replace('/', '').replace('-', ' '),
          status: 'implemented',
          hasContent: false,
          hasPlaceholder: false,
          loadTime: 0,
        });
      }
    }

    // Test each route
    for (const route of routes) {
      try {
        console.log(`Testing route: ${route.href}`);
        const startTime = Date.now();

        await page.goto(route.href, { timeout: 10000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        route.loadTime = Date.now() - startTime;

        // Check if route exists (not 404)
        const is404 =
          (await page.locator('text=/404|not found|page not found/i').count()) >
          0;
        if (is404) {
          route.status = 'error';
          continue;
        }

        // Check for placeholder content
        const placeholderSelectors = [
          '[data-testid="placeholder"]',
          '[data-testid="coming-soon"]',
          'text=/coming soon/i',
          'text=/under construction/i',
          'text=/placeholder/i',
          'text=/todo/i',
          'text=/not implemented/i',
          '.placeholder',
          '.coming-soon',
          '.under-construction',
        ];

        let hasPlaceholder = false;
        for (const selector of placeholderSelectors) {
          if ((await page.locator(selector).count()) > 0) {
            hasPlaceholder = true;
            break;
          }
        }

        route.hasPlaceholder = hasPlaceholder;
        route.status = hasPlaceholder ? 'placeholder' : 'implemented';

        // Check for meaningful content
        const contentSelectors = [
          'main',
          '[role="main"]',
          '.content',
          '.page-content',
          'article',
          'section',
        ];

        let hasContent = false;
        for (const selector of contentSelectors) {
          const element = page.locator(selector);
          if ((await element.count()) > 0) {
            const text = await element.textContent();
            if (text && text.trim().length > 50) {
              hasContent = true;
              break;
            }
          }
        }

        route.hasContent = hasContent;

        // If no meaningful content and no placeholder, mark as coming soon
        if (!hasContent && !hasPlaceholder) {
          route.status = 'coming-soon';
        }
      } catch (error) {
        console.log(`Error testing route ${route.href}:`, error);
        route.status = 'error';
      }
    }

    // Test mobile compatibility
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mobileElements = await page
      .locator('[data-testid*="mobile"], .mobile-menu, .hamburger-menu')
      .count();
    const isMobileResponsive = await page.locator('main').isVisible();
    report.mobileCompatible = mobileElements > 0 && isMobileResponsive;

    // Test offline capability
    await page.context().setOffline(true);
    try {
      await page.reload();
      const offlineIndicator = await page
        .locator('[data-testid="offline-indicator"], .offline-indicator')
        .count();
      const hasServiceWorker = await page.evaluate(
        () => 'serviceWorker' in navigator
      );
      report.offlineCapable = offlineIndicator > 0 || hasServiceWorker;
    } catch (error) {
      report.offlineCapable = false;
    }
    await page.context().setOffline(false);

    // Compile report
    report.routes = routes;
    report.totalRoutes = routes.length;
    report.implementedRoutes = routes.filter(
      r => r.status === 'implemented'
    ).length;
    report.placeholderRoutes = routes.filter(
      r => r.status === 'placeholder'
    ).length;

    // Save report to file
    const reportPath = path.join(
      process.cwd(),
      'test-results',
      'feature-discovery-report.json'
    );
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Console output for immediate feedback
    console.log('\n=== FEATURE DISCOVERY REPORT ===');
    console.log(`Total Routes Discovered: ${report.totalRoutes}`);
    console.log(`Implemented Routes: ${report.implementedRoutes}`);
    console.log(`Placeholder Routes: ${report.placeholderRoutes}`);
    console.log(
      `Coming Soon Routes: ${routes.filter(r => r.status === 'coming-soon').length}`
    );
    console.log(
      `Error Routes: ${routes.filter(r => r.status === 'error').length}`
    );
    console.log(`Mobile Compatible: ${report.mobileCompatible}`);
    console.log(`Offline Capable: ${report.offlineCapable}`);

    console.log('\n=== ROUTE DETAILS ===');
    routes.forEach(route => {
      console.log(`${route.href} - ${route.status} (${route.loadTime}ms)`);
    });

    // Assertions to track progress
    expect(report.totalRoutes).toBeGreaterThan(0);
    // Note: Don't fail if no routes are implemented - this is valuable discovery info

    // Alert if too many placeholders
    if (report.placeholderRoutes > report.implementedRoutes) {
      console.warn('WARNING: More placeholder routes than implemented routes!');
    }

    // Alert if no routes are implemented
    if (report.implementedRoutes === 0) {
      console.warn(
        '🚨 DISCOVERY: No fully implemented routes found. This indicates early development stage.'
      );
    }
  });

  test('should discover feature components and widgets', async ({ page }) => {
    await page.goto('/');

    // Look for feature-specific components
    const featureComponents = {
      workOrderComponents: [
        '[data-testid*="work-order"]',
        '.work-order',
        '[class*="WorkOrder"]',
      ],
      equipmentComponents: [
        '[data-testid*="equipment"]',
        '.equipment',
        '[class*="Equipment"]',
      ],
      inventoryComponents: [
        '[data-testid*="inventory"]',
        '.inventory',
        '[class*="Inventory"]',
      ],
      dashboardComponents: [
        '[data-testid*="dashboard"]',
        '.dashboard',
        '.widget',
        '[class*="Dashboard"]',
      ],
      authComponents: [
        '[data-testid*="auth"]',
        '.auth',
        '[data-testid*="login"]',
        '[class*="Auth"]',
      ],
    };

    const componentReport: Record<string, number> = {};

    for (const [category, selectors] of Object.entries(featureComponents)) {
      let found = 0;
      for (const selector of selectors) {
        found += await page.locator(selector).count();
      }
      componentReport[category] = found;
    }

    console.log('\n=== COMPONENT DISCOVERY ===');
    Object.entries(componentReport).forEach(([category, count]) => {
      console.log(`${category}: ${count} components found`);
    });

    // Save component report
    const reportPath = path.join(
      process.cwd(),
      'test-results',
      'component-discovery-report.json'
    );
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(
      reportPath,
      JSON.stringify(componentReport, null, 2)
    );
  });
});
