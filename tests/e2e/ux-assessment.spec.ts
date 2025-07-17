import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  interactionToNextPaint: number;
}

interface UXAssessment {
  route: string;
  mobileCompatible: boolean;
  accessibilityScore: number;
  hasLoadingStates: boolean;
  hasErrorStates: boolean;
  hasOfflineSupport: boolean;
  performanceMetrics: PerformanceMetrics;
  userExperienceIssues: string[];
}

test.describe('UX Quality Assessment', () => {
  test('should evaluate mobile experience across all routes', async ({
    page,
  }) => {
    const routes = [
      '/',
      '/dashboard',
      '/work-orders',
      '/equipment',
      '/inventory',
    ];
    const mobileAssessments: UXAssessment[] = [];

    for (const route of routes) {
      console.log(`\n=== Testing Mobile UX for ${route} ===`);

      // Test on mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const startTime = Date.now();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      const assessment: UXAssessment = {
        route,
        mobileCompatible: false,
        accessibilityScore: 0,
        hasLoadingStates: false,
        hasErrorStates: false,
        hasOfflineSupport: false,
        performanceMetrics: {
          loadTime,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          interactionToNextPaint: 0,
        },
        userExperienceIssues: [],
      };

      // Check mobile compatibility
      const mobileMenu =
        (await page
          .locator('[data-testid="mobile-menu"], .mobile-menu, .hamburger-menu')
          .count()) > 0;
      const mainContentVisible = await page
        .locator('main, [role="main"]')
        .isVisible();
      const horizontalScroll = await page.evaluate(
        () => document.body.scrollWidth > window.innerWidth
      );

      assessment.mobileCompatible =
        mobileMenu && mainContentVisible && !horizontalScroll;

      if (!mobileMenu) {
        assessment.userExperienceIssues.push('Missing mobile navigation menu');
      }
      if (!mainContentVisible) {
        assessment.userExperienceIssues.push(
          'Main content not visible on mobile'
        );
      }
      if (horizontalScroll) {
        assessment.userExperienceIssues.push(
          'Horizontal scrolling required on mobile'
        );
      }

      // Check touch target sizes
      const buttons = await page
        .locator('button, a, input[type="submit"]')
        .all();
      let smallTouchTargets = 0;

      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (box.height < 44 || box.width < 44)) {
          smallTouchTargets++;
        }
      }

      if (smallTouchTargets > 0) {
        assessment.userExperienceIssues.push(
          `${smallTouchTargets} touch targets smaller than 44px`
        );
      }

      // Check loading states
      assessment.hasLoadingStates =
        (await page
          .locator(
            '[data-testid="loading-spinner"], [data-testid="skeleton"], .loading, .spinner'
          )
          .count()) > 0;

      // Check error states
      assessment.hasErrorStates =
        (await page
          .locator('[data-testid="error-message"], .error, .alert-error')
          .count()) > 0;

      // Test performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          firstContentfulPaint: 0, // Would need more complex setup for FCP
          largestContentfulPaint: 0, // Would need more complex setup for LCP
          cumulativeLayoutShift: 0, // Would need more complex setup for CLS
          interactionToNextPaint: 0, // Would need more complex setup for INP
        };
      });

      assessment.performanceMetrics = performanceMetrics;

      // Basic accessibility check
      let accessibilityScore = 0;
      const accessibilityChecks = [
        { check: 'Alt text on images', selector: 'img[alt]' },
        {
          check: 'Proper heading hierarchy',
          selector: 'h1, h2, h3, h4, h5, h6',
        },
        {
          check: 'Focus indicators',
          selector: 'input:focus, button:focus, a:focus',
        },
        { check: 'ARIA labels', selector: '[aria-label], [aria-labelledby]' },
        {
          check: 'Skip links',
          selector: '[data-testid="skip-link"], .skip-link',
        },
      ];

      for (const { check, selector } of accessibilityChecks) {
        const hasFeature = (await page.locator(selector).count()) > 0;
        if (hasFeature) {
          accessibilityScore += 20;
        } else {
          assessment.userExperienceIssues.push(`Missing: ${check}`);
        }
      }

      assessment.accessibilityScore = accessibilityScore;

      mobileAssessments.push(assessment);

      console.log(`Mobile Compatible: ${assessment.mobileCompatible}`);
      console.log(`Accessibility Score: ${assessment.accessibilityScore}%`);
      console.log(`Load Time: ${assessment.performanceMetrics.loadTime}ms`);
      console.log(`Issues: ${assessment.userExperienceIssues.length}`);
    }

    // Save mobile assessment report
    const reportPath = path.join(
      process.cwd(),
      'test-results',
      'mobile-ux-assessment.json'
    );
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(
      reportPath,
      JSON.stringify(mobileAssessments, null, 2)
    );

    // Console summary
    console.log('\n=== MOBILE UX SUMMARY ===');
    const totalRoutes = mobileAssessments.length;
    const mobileCompatibleRoutes = mobileAssessments.filter(
      a => a.mobileCompatible
    ).length;
    const avgAccessibilityScore =
      mobileAssessments.reduce((sum, a) => sum + a.accessibilityScore, 0) /
      totalRoutes;
    const avgLoadTime =
      mobileAssessments.reduce(
        (sum, a) => sum + a.performanceMetrics.loadTime,
        0
      ) / totalRoutes;

    console.log(
      `Mobile Compatible Routes: ${mobileCompatibleRoutes}/${totalRoutes}`
    );
    console.log(
      `Average Accessibility Score: ${avgAccessibilityScore.toFixed(1)}%`
    );
    console.log(`Average Load Time: ${avgLoadTime.toFixed(0)}ms`);

    // Assertions
    expect(mobileCompatibleRoutes).toBeGreaterThan(0);
    expect(avgAccessibilityScore).toBeGreaterThan(40); // At least 40% accessibility
  });

  test('should test offline functionality and progressive web app features', async ({
    page,
  }) => {
    console.log('\n=== Testing Offline Functionality ===');

    await page.goto('/');

    // Check for service worker
    const hasServiceWorker = await page.evaluate(
      () => 'serviceWorker' in navigator
    );
    console.log(`Service Worker Support: ${hasServiceWorker}`);

    // Check for web app manifest
    const hasManifest =
      (await page.locator('link[rel="manifest"]').count()) > 0;
    console.log(`Web App Manifest: ${hasManifest}`);

    // Test offline behavior
    await page.context().setOffline(true);

    try {
      await page.reload();

      const offlineIndicator =
        (await page
          .locator('[data-testid="offline-indicator"], .offline-indicator')
          .count()) > 0;
      const hasOfflineContent = await page
        .locator('main, [role="main"]')
        .isVisible();
      const offlineMessage =
        (await page.locator('text=/offline|no connection|network/i').count()) >
        0;

      console.log(`Offline Indicator: ${offlineIndicator}`);
      console.log(`Content Available Offline: ${hasOfflineContent}`);
      console.log(`User-friendly Offline Message: ${offlineMessage}`);

      const offlineReport = {
        hasServiceWorker,
        hasManifest,
        offlineIndicator,
        hasOfflineContent,
        offlineMessage,
        recommendedImprovements: [],
      };

      if (!hasServiceWorker) {
        offlineReport.recommendedImprovements.push(
          'Implement service worker for offline functionality'
        );
      }
      if (!hasManifest) {
        offlineReport.recommendedImprovements.push(
          'Add web app manifest for PWA features'
        );
      }
      if (!offlineIndicator) {
        offlineReport.recommendedImprovements.push(
          'Add offline status indicator'
        );
      }
      if (!hasOfflineContent) {
        offlineReport.recommendedImprovements.push(
          'Implement offline content caching'
        );
      }

      const reportPath = path.join(
        process.cwd(),
        'test-results',
        'offline-functionality-report.json'
      );
      await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.promises.writeFile(
        reportPath,
        JSON.stringify(offlineReport, null, 2)
      );
    } catch (error) {
      console.log('Application fails completely when offline');
    } finally {
      await page.context().setOffline(false);
    }
  });

  test('should assess form usability and validation', async ({ page }) => {
    console.log('\n=== Testing Form Usability ===');

    const formRoutes = ['/login', '/work-orders/create', '/equipment/register'];
    const formAssessments: Array<{
      route: string;
      formIndex: number;
      hasValidation: boolean;
      hasErrorMessages: boolean;
      hasHelpText: boolean;
      hasRequiredIndicators: boolean;
      hasAccessibleLabels: boolean;
      issues: string[];
    }> = [];

    for (const route of formRoutes) {
      try {
        await page.goto(route);

        const forms = await page.locator('form').all();

        for (let i = 0; i < forms.length; i++) {
          const form = forms[i];
          const assessment = {
            route,
            formIndex: i,
            hasValidation: false,
            hasErrorMessages: false,
            hasHelpText: false,
            hasRequiredIndicators: false,
            hasAccessibleLabels: false,
            issues: [],
          };

          // Check for validation
          const hasRequiredFields =
            (await form
              .locator('input[required], select[required], textarea[required]')
              .count()) > 0;
          const hasPatternValidation =
            (await form.locator('input[pattern]').count()) > 0;
          assessment.hasValidation = hasRequiredFields || hasPatternValidation;

          // Check for error messages
          assessment.hasErrorMessages =
            (await form
              .locator('.error, [data-testid*="error"], .invalid-feedback')
              .count()) > 0;

          // Check for help text
          assessment.hasHelpText =
            (await form
              .locator('.help-text, [data-testid*="help"], .form-text')
              .count()) > 0;

          // Check for required indicators
          assessment.hasRequiredIndicators =
            (await form
              .locator('.required, [data-testid*="required"], .asterisk')
              .count()) > 0;

          // Check for accessible labels
          const inputs = await form.locator('input, select, textarea').all();
          let labeledInputs = 0;

          for (const input of inputs) {
            const hasLabel =
              (await input.locator('xpath=../label').count()) > 0;
            const hasAriaLabel = await input.getAttribute('aria-label');
            const hasAriaLabelledby =
              await input.getAttribute('aria-labelledby');

            if (hasLabel || hasAriaLabel || hasAriaLabelledby) {
              labeledInputs++;
            }
          }

          assessment.hasAccessibleLabels = labeledInputs === inputs.length;

          // Generate issues
          if (!assessment.hasValidation) {
            assessment.issues.push('Missing form validation');
          }
          if (!assessment.hasErrorMessages) {
            assessment.issues.push('Missing error message display');
          }
          if (!assessment.hasAccessibleLabels) {
            assessment.issues.push('Some inputs lack accessible labels');
          }

          formAssessments.push(assessment);
        }
      } catch (error) {
        console.log(`Could not assess forms on ${route}`);
      }
    }

    const reportPath = path.join(
      process.cwd(),
      'test-results',
      'form-usability-report.json'
    );
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(
      reportPath,
      JSON.stringify(formAssessments, null, 2)
    );

    console.log(`Forms assessed: ${formAssessments.length}`);
    console.log(
      `Forms with validation: ${formAssessments.filter(f => f.hasValidation).length}`
    );
    console.log(
      `Forms with error handling: ${formAssessments.filter(f => f.hasErrorMessages).length}`
    );
  });

  test('should evaluate navigation and information architecture', async ({
    page,
  }) => {
    console.log('\n=== Testing Navigation and Information Architecture ===');

    await page.goto('/');

    const navigationAssessment = {
      hasMainNavigation: false,
      hasBreadcrumbs: false,
      hasSearchFunctionality: false,
      hasUserMenu: false,
      hasHelpSection: false,
      navigationDepth: 0,
      brokenLinks: [] as string[],
      navigationIssues: [] as string[],
    };

    // Check for main navigation
    const mainNavSelectors = [
      'nav',
      '[role="navigation"]',
      '.navbar',
      '.navigation',
      '.main-nav',
    ];
    for (const selector of mainNavSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        navigationAssessment.hasMainNavigation = true;
        break;
      }
    }

    // Check for breadcrumbs
    navigationAssessment.hasBreadcrumbs =
      (await page
        .locator(
          '[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]'
        )
        .count()) > 0;

    // Check for search
    navigationAssessment.hasSearchFunctionality =
      (await page
        .locator('input[type="search"], [data-testid="search"], .search-box')
        .count()) > 0;

    // Check for user menu
    navigationAssessment.hasUserMenu =
      (await page
        .locator('[data-testid="user-menu"], .user-menu, .profile-menu')
        .count()) > 0;

    // Check for help section
    navigationAssessment.hasHelpSection =
      (await page
        .locator('[data-testid="help"], .help, a[href*="help"]')
        .count()) > 0;

    // Test all navigation links
    const navLinks = await page.locator('nav a, [role="navigation"] a').all();

    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/')) {
        try {
          await page.goto(href);
          const is404 =
            (await page.locator('text=/404|not found/i').count()) > 0;
          if (is404) {
            navigationAssessment.brokenLinks.push(href);
          }
        } catch (error) {
          navigationAssessment.brokenLinks.push(href);
        }
      }
    }

    // Generate issues
    if (!navigationAssessment.hasMainNavigation) {
      navigationAssessment.navigationIssues.push('Missing main navigation');
    }
    if (!navigationAssessment.hasBreadcrumbs) {
      navigationAssessment.navigationIssues.push(
        'Missing breadcrumb navigation'
      );
    }
    if (!navigationAssessment.hasSearchFunctionality) {
      navigationAssessment.navigationIssues.push(
        'Missing search functionality'
      );
    }
    if (navigationAssessment.brokenLinks.length > 0) {
      navigationAssessment.navigationIssues.push(
        `${navigationAssessment.brokenLinks.length} broken navigation links`
      );
    }

    const reportPath = path.join(
      process.cwd(),
      'test-results',
      'navigation-assessment.json'
    );
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(
      reportPath,
      JSON.stringify(navigationAssessment, null, 2)
    );

    console.log(
      `Navigation Issues: ${navigationAssessment.navigationIssues.length}`
    );
    console.log(`Broken Links: ${navigationAssessment.brokenLinks.length}`);

    expect(navigationAssessment.hasMainNavigation).toBe(true);
    expect(navigationAssessment.brokenLinks.length).toBe(0);
  });
});
