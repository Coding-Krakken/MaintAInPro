/**
 * End-to-end Playwright test suite for automated feature discovery and reporting in a web application.
 *
 * This suite performs two main tasks:
 *
 * 1. **Route and Page Discovery (`should catalog all accessible routes and pages`):**
 *    - Navigates through the application's navigation elements to discover all accessible routes.
 *    - Augments discovered routes with a set of common application routes that may not be present in navigation.
 *    - For each route:
 *      - Measures load time.
 *      - Detects if the route is implemented, a placeholder, coming soon, or results in an error (e.g., 404).
 *      - Checks for meaningful content and placeholder indicators.
 *    - Assesses mobile compatibility by checking for mobile-specific UI elements and main content visibility at a mobile viewport size.
 *    - Evaluates offline capability by simulating offline mode and checking for offline indicators or service worker registration.
 *    - Compiles a detailed `FeatureDiscoveryReport` including route statuses, counts, and compatibility flags.
 *    - Saves the report as a JSON file in the `test-results` directory.
 *    - Outputs a summary and detailed route information to the console.
 *    - Issues warnings if there are more placeholder routes than implemented routes, or if no implemented routes are found.
 *
 * 2. **Component and Widget Discovery (`should discover feature components and widgets`):**
 *    - Scans the home page for the presence of feature-specific components and widgets using a variety of selectors.
 *    - Categorizes components by feature area (e.g., work orders, equipment, inventory, dashboard, authentication).
 *    - Counts the number of components found for each category.
 *    - Outputs the component discovery results to the console.
 *    - Saves the component report as a JSON file in the `test-results` directory.
 *
 * ## Usage
 * - Designed to be run as part of an end-to-end test suite using Playwright.
 * - Generates actionable reports to help track feature implementation progress and surface gaps in navigation, content, and offline/mobile support.
 *
 * ## File Outputs
 * - `test-results/feature-discovery-report.json`: Detailed route discovery and compatibility report.
 * - `test-results/component-discovery-report.json`: Feature component presence summary.
 *
 * @fileoverview Automated feature and component discovery for application QA and progress tracking.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { compareReports, generateHTMLReport } from './report-utils';

// --- CONFIG & CONSTANTS ---
const CONFIG = {
  navigationSelectors: [
    'nav a',
    '[role="navigation"] a',
    'header a',
    '.sidebar a',
    '.menu a',
    '[data-testid*="nav"] a',
    '[data-testid*="menu"] a',
  ],
  placeholderSelectors: [
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
  ],
  contentSelectors: [
    'main',
    '[role="main"]',
    '.content',
    '.page-content',
    'article',
    'section',
  ],
  mobileViewports: [
    { width: 375, height: 667 }, // iPhone 8
    { width: 414, height: 896 }, // iPhone 11 Pro Max
    { width: 360, height: 740 }, // Pixel 4
  ],
  commonRoutes: [
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
  ],
  featureComponents: {
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
  },
  screenshotDir: path.join(process.cwd(), 'test-results', 'screenshots'),
  reportDir: path.join(process.cwd(), 'test-results'),
};

// --- UTILITY FUNCTIONS ---
async function saveScreenshot(page, name) {
  await fs.promises.mkdir(CONFIG.screenshotDir, { recursive: true });
  const filePath = path.join(CONFIG.screenshotDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
}

async function saveJSONReport(filename, data) {
  await fs.promises.mkdir(CONFIG.reportDir, { recursive: true });
  const filePath = path.join(CONFIG.reportDir, filename);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
}

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// --- ENHANCED TYPES ---

interface RouteInfo {
  href: string;
  text: string;
  status:
    | 'implemented'
    | 'placeholder'
    | 'coming-soon'
    | 'error'
    | 'redirect'
    | 'auth-required';
  hasContent: boolean;
  hasPlaceholder: boolean;
  loadTime: number;
  httpStatus?: number;
  redirectedTo?: string;
  screenshotPath?: string;
  accessibilityIssues?: string[];
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

    // --- Recursive Route Discovery ---
    const discoveredHrefs = new Set<string>();
    const routes: RouteInfo[] = [];
    const maxDepth = 2;
    async function discoverRoutes(url: string, depth = 0) {
      if (depth > maxDepth) return;
      try {
        await page.goto(url, { timeout: 10000 });
        const links: string[] = [];
        for (const selector of CONFIG.navigationSelectors) {
          const found = await page.locator(selector).all();
          for (const link of found) {
            const href = await link.getAttribute('href');
            const text = await link.textContent();
            if (href && href.startsWith('/') && !discoveredHrefs.has(href)) {
              discoveredHrefs.add(href);
              routes.push({
                href,
                text: text?.trim() || '',
                status: 'implemented',
                hasContent: false,
                hasPlaceholder: false,
                loadTime: 0,
              });
              links.push(href);
            }
          }
        }
        // Recursively discover links
        for (const href of links) {
          await discoverRoutes(href, depth + 1);
        }
      } catch (e) {
        // Ignore navigation errors
      }
    }
    // Start from home and discover
    await discoverRoutes('/');
    // Add common routes
    for (const route of CONFIG.commonRoutes) {
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

    // --- Test Each Route ---
    for (const route of routes) {
      try {
        console.log(`Testing route: ${route.href}`);
        const startTime = Date.now();
        const response = await page.goto(route.href, { timeout: 10000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        route.loadTime = Date.now() - startTime;
        route.httpStatus = response?.status?.() || 0;
        // Handle redirects
        if (response && response.status() >= 300 && response.status() < 400) {
          route.status = 'redirect';
          route.redirectedTo = response.headers()['location'] || '';
          await saveScreenshot(
            page,
            sanitizeFilename(`redirect_${route.href}`)
          );
          route.screenshotPath = path.join(
            'test-results',
            'screenshots',
            `${sanitizeFilename(`redirect_${route.href}`)}.png`
          );
          continue;
        }
        // Handle auth-required (simple heuristic)
        if (
          (await page
            .locator(
              'input[type="password"], [data-testid*="login"], [data-testid*="auth"]'
            )
            .count()) > 0
        ) {
          route.status = 'auth-required';
          await saveScreenshot(page, sanitizeFilename(`auth_${route.href}`));
          route.screenshotPath = path.join(
            'test-results',
            'screenshots',
            `${sanitizeFilename(`auth_${route.href}`)}.png`
          );
          continue;
        }
        // 404 detection
        const is404 =
          (await page.locator('text=/404|not found|page not found/i').count()) >
            0 ||
          (route.httpStatus >= 400 && route.httpStatus < 600);
        if (is404) {
          route.status = 'error';
          await saveScreenshot(page, sanitizeFilename(`error_${route.href}`));
          route.screenshotPath = path.join(
            'test-results',
            'screenshots',
            `${sanitizeFilename(`error_${route.href}`)}.png`
          );
          continue;
        }
        // Placeholder detection
        let hasPlaceholder = false;
        for (const selector of CONFIG.placeholderSelectors) {
          if ((await page.locator(selector).count()) > 0) {
            hasPlaceholder = true;
            break;
          }
        }
        route.hasPlaceholder = hasPlaceholder;
        if (hasPlaceholder) {
          route.status = 'placeholder';
          await saveScreenshot(
            page,
            sanitizeFilename(`placeholder_${route.href}`)
          );
          route.screenshotPath = path.join(
            'test-results',
            'screenshots',
            `${sanitizeFilename(`placeholder_${route.href}`)}.png`
          );
        } else {
          route.status = 'implemented';
        }
        // Content detection
        let hasContent = false;
        for (const selector of CONFIG.contentSelectors) {
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
        if (!hasContent && !hasPlaceholder) {
          route.status = 'coming-soon';
          await saveScreenshot(
            page,
            sanitizeFilename(`comingsoon_${route.href}`)
          );
          route.screenshotPath = path.join(
            'test-results',
            'screenshots',
            `${sanitizeFilename(`comingsoon_${route.href}`)}.png`
          );
        }
        // Accessibility checks (basic)
        const accessibilityIssues: string[] = [];
        // Check for missing main landmark
        if ((await page.locator('main, [role="main"]').count()) === 0) {
          accessibilityIssues.push('Missing main landmark');
        }
        // Check for images missing alt
        const images = await page.locator('img:not([alt])').count();
        if (images > 0)
          accessibilityIssues.push(`Images missing alt: ${images}`);
        // Check for missing headings
        if ((await page.locator('h1, h2, h3').count()) === 0) {
          accessibilityIssues.push('No headings found');
        }
        route.accessibilityIssues = accessibilityIssues;
      } catch (error) {
        console.log(`Error testing route ${route.href}:`, error);
        route.status = 'error';
        await saveScreenshot(page, sanitizeFilename(`error_${route.href}`));
        route.screenshotPath = path.join(
          'test-results',
          'screenshots',
          `${sanitizeFilename(`error_${route.href}`)}.png`
        );
      }
    }

    // --- Test Mobile Compatibility (multiple viewports) ---
    let mobileCompatible = true;
    for (const viewport of CONFIG.mobileViewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const mobileElements = await page
        .locator('[data-testid*="mobile"], .mobile-menu, .hamburger-menu')
        .count();
      const isMobileResponsive = await page.locator('main').isVisible();
      if (!(mobileElements > 0 && isMobileResponsive)) {
        mobileCompatible = false;
        break;
      }
    }
    report.mobileCompatible = mobileCompatible;

    // --- Test Offline Capability (PWA) ---
    await page.context().setOffline(true);
    try {
      await page.reload();
      const offlineIndicator = await page
        .locator('[data-testid="offline-indicator"], .offline-indicator')
        .count();
      const hasServiceWorker = await page.evaluate(
        () => 'serviceWorker' in navigator
      );
      // Check for manifest
      const hasManifest = await page.evaluate(
        () => !!document.querySelector('link[rel="manifest"]')
      );
      report.offlineCapable =
        (offlineIndicator > 0 || hasServiceWorker) && hasManifest;
    } catch (error) {
      report.offlineCapable = false;
    }
    await page.context().setOffline(false);

    // --- Compile and Save Report ---
    report.routes = routes;
    report.totalRoutes = routes.length;
    report.implementedRoutes = routes.filter(
      r => r.status === 'implemented'
    ).length;
    report.placeholderRoutes = routes.filter(
      r => r.status === 'placeholder'
    ).length;
    // Save JSON report
    await saveJSONReport('feature-discovery-report.json', report);

    // --- Compare with previous report and generate HTML ---
    let prevReport = null;
    const prevPath = path.join(
      CONFIG.reportDir,
      'feature-discovery-report.prev.json'
    );
    try {
      prevReport = JSON.parse(await fs.promises.readFile(prevPath, 'utf-8'));
    } catch {
      // Previous report does not exist or failed to parse
    }
    const changes = compareReports(prevReport, report);
    const html = generateHTMLReport(report, changes);
    await fs.promises.writeFile(
      path.join(CONFIG.reportDir, 'feature-discovery-report.html'),
      html
    );
    // Save current as previous for next run
    await fs.promises.writeFile(prevPath, JSON.stringify(report, null, 2));

    // --- CI Integration: fail if regressions ---
    if (changes.removedRoutes.length > 0) {
      throw new Error(
        `Regression detected: removed routes: ${changes.removedRoutes.join(', ')}`
      );
    }
    if (changes.removedComponents.length > 0) {
      throw new Error(
        `Regression detected: removed components: ${changes.removedComponents.join(', ')}`
      );
    }

    // --- Console Output ---
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
      console.log(
        `${route.href} - ${route.status} (${route.loadTime}ms) [${route.httpStatus}]`
      );
      if (route.screenshotPath)
        console.log(`  Screenshot: ${route.screenshotPath}`);
      if (route.accessibilityIssues && route.accessibilityIssues.length > 0) {
        console.log(`  Accessibility: ${route.accessibilityIssues.join('; ')}`);
      }
    });

    // --- Assertions and Alerts ---
    expect(report.totalRoutes).toBeGreaterThan(0);
    if (report.placeholderRoutes > report.implementedRoutes) {
      console.warn('WARNING: More placeholder routes than implemented routes!');
    }
    if (report.implementedRoutes === 0) {
      console.warn(
        '🚨 DISCOVERY: No fully implemented routes found. This indicates early development stage.'
      );
    }
  });

  test('should discover feature components and widgets', async ({ page }) => {
    await page.goto('/');

    // Enhanced component discovery
    type ComponentMeta = {
      selector: string;
      index: number;
      ariaLabel: string | null;
      role: string | null;
      dataTestId: string | null;
      screenshot: string;
    };
    const componentDetails: Record<string, ComponentMeta[]> = {};
    const componentCounts: Record<string, number> = {};
    const seenSelectors = new Set<string>();
    for (const [category, selectors] of Object.entries(
      CONFIG.featureComponents
    )) {
      componentDetails[category] = [];
      let found = 0;
      for (const selector of selectors) {
        const elements = await page.locator(selector).all();
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          // Avoid duplicate screenshots for same selector/element
          const uniqueKey = `${selector}_${i}`;
          if (seenSelectors.has(uniqueKey)) continue;
          seenSelectors.add(uniqueKey);
          // Screenshot
          const screenshotName = sanitizeFilename(
            `${category}_${selector}_${i}`
          );
          await saveScreenshot(page, screenshotName);
          // Metadata
          const ariaLabel = await el.getAttribute('aria-label');
          const role = await el.getAttribute('role');
          const dataTestId = await el.getAttribute('data-testid');
          componentDetails[category].push({
            selector,
            index: i,
            ariaLabel,
            role,
            dataTestId,
            screenshot: path.join(
              'test-results',
              'screenshots',
              `${screenshotName}.png`
            ),
          });
          found++;
        }
      }
      componentCounts[category] = found;
    }

    // Check for duplicates/missing
    const missing: string[] = [];
    for (const [category, selectors] of Object.entries(
      CONFIG.featureComponents
    )) {
      let anyFound = false;
      for (const selector of selectors) {
        if (componentDetails[category].some(d => d.selector === selector)) {
          anyFound = true;
          break;
        }
      }
      if (!anyFound) missing.push(category);
    }

    // Console output
    console.log('\n=== COMPONENT DISCOVERY ===');
    Object.entries(componentCounts).forEach(([category, count]) => {
      console.log(`${category}: ${count} components found`);
    });
    if (missing.length > 0) {
      console.warn(`Missing components: ${missing.join(', ')}`);
    }

    // Save component report (JSON)
    await saveJSONReport('component-discovery-report.json', {
      details: componentDetails,
      counts: componentCounts,
      missing,
    });
  });
});
