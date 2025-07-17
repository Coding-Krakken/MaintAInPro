import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceMetrics {
  route: string;
  loadTime: number;
  resourceCount: number;
  totalSize: number;
  errors: string[];
  recommendations: string[];
}

interface QualityMetrics {
  route: string;
  hasErrorBoundaries: boolean;
  hasLoadingStates: boolean;
  hasAccessibilityFeatures: boolean;
  hasProperSEO: boolean;
  codeQualityScore: number;
  issues: string[];
}

test.describe('Performance and Quality Metrics', () => {
  test('should measure page load times and performance', async ({ page }) => {
    const routes = [
      '/',
      '/dashboard',
      '/work-orders',
      '/equipment',
      '/inventory',
      '/login',
    ];
    const performanceMetrics: PerformanceMetrics[] = [];

    for (const route of routes) {
      console.log(`\n=== Performance Testing ${route} ===`);

      const metrics: PerformanceMetrics = {
        route,
        loadTime: 0,
        resourceCount: 0,
        totalSize: 0,
        errors: [],
        recommendations: [],
      };

      // Listen for network requests
      const requests: Array<{
        url: string;
        method: string;
        resourceType: string;
      }> = [];
      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
        });
      });

      // Listen for network errors
      page.on('requestfailed', request => {
        metrics.errors.push(`Failed to load: ${request.url()}`);
      });

      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          metrics.errors.push(`Console error: ${msg.text()}`);
        }
      });

      try {
        const startTime = Date.now();
        await page.goto(route, { timeout: 30000 });
        await page.waitForLoadState('networkidle');
        metrics.loadTime = Date.now() - startTime;

        // Calculate resource metrics
        metrics.resourceCount = requests.length;

        // Get performance timing
        await page.evaluate(() => {
          const navigation = performance.getEntriesByType(
            'navigation'
          )[0] as PerformanceNavigationTiming;
          return {
            domContentLoaded:
              navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: 0, // Would need additional setup for paint timing
            resourceTimings: performance.getEntriesByType('resource').length,
          };
        });

        // Generate performance recommendations
        if (metrics.loadTime > 3000) {
          metrics.recommendations.push(
            'Page load time exceeds 3 seconds - optimize critical resources'
          );
        }
        if (metrics.resourceCount > 100) {
          metrics.recommendations.push(
            'High number of network requests - consider bundling resources'
          );
        }
        if (metrics.errors.length > 0) {
          metrics.recommendations.push(
            'Fix network or console errors affecting performance'
          );
        }

        console.log(`Load Time: ${metrics.loadTime}ms`);
        console.log(`Resource Count: ${metrics.resourceCount}`);
        console.log(`Errors: ${metrics.errors.length}`);
      } catch (error) {
        metrics.errors.push(`Navigation error: ${error}`);
        console.log(`Failed to load ${route}: ${error}`);
      }

      performanceMetrics.push(metrics);
    }

    // Save performance report
    const reportPath = path.join(
      process.cwd(),
      'test-results',
      'performance-metrics.json'
    );
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(
      reportPath,
      JSON.stringify(performanceMetrics, null, 2)
    );

    // Performance summary
    const avgLoadTime =
      performanceMetrics.reduce((sum, m) => sum + m.loadTime, 0) /
      performanceMetrics.length;
    const totalErrors = performanceMetrics.reduce(
      (sum, m) => sum + m.errors.length,
      0
    );
    const slowRoutes = performanceMetrics.filter(m => m.loadTime > 3000).length;

    console.log('\n=== PERFORMANCE SUMMARY ===');
    console.log(`Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(
      `Slow Routes (>3s): ${slowRoutes}/${performanceMetrics.length}`
    );

    // Performance assertions
    expect(avgLoadTime).toBeLessThan(5000); // Average should be under 5 seconds
    expect(totalErrors).toBeLessThan(10); // Should have minimal errors
  });

  test('should assess code quality indicators', async ({ page }) => {
    const routes = ['/', '/dashboard', '/work-orders', '/equipment'];
    const qualityMetrics: QualityMetrics[] = [];

    for (const route of routes) {
      console.log(`\n=== Quality Assessment ${route} ===`);

      await page.goto(route);

      const metrics: QualityMetrics = {
        route,
        hasErrorBoundaries: false,
        hasLoadingStates: false,
        hasAccessibilityFeatures: false,
        hasProperSEO: false,
        codeQualityScore: 0,
        issues: [],
      };

      // Check for error boundaries
      metrics.hasErrorBoundaries =
        (await page.locator('[data-testid="error-boundary"]').count()) > 0;

      // Check for loading states
      const loadingSelectors = [
        '[data-testid="loading-spinner"]',
        '[data-testid="skeleton"]',
        '.loading',
        '.spinner',
        '.skeleton',
      ];

      for (const selector of loadingSelectors) {
        if ((await page.locator(selector).count()) > 0) {
          metrics.hasLoadingStates = true;
          break;
        }
      }

      // Check for accessibility features
      const accessibilityFeatures = [
        'img[alt]',
        '[aria-label]',
        '[aria-labelledby]',
        '[aria-describedby]',
        '[role]',
        'button[aria-expanded]',
        'input[aria-required]',
      ];

      let accessibilityCount = 0;
      for (const selector of accessibilityFeatures) {
        if ((await page.locator(selector).count()) > 0) {
          accessibilityCount++;
        }
      }
      metrics.hasAccessibilityFeatures = accessibilityCount >= 3;

      // Check for proper SEO
      const hasTitle = (await page.locator('title').count()) > 0;
      const hasMetaDescription =
        (await page.locator('meta[name="description"]').count()) > 0;

      metrics.hasProperSEO = hasTitle && hasMetaDescription;

      // Calculate code quality score
      let score = 0;
      if (metrics.hasErrorBoundaries) score += 20;
      if (metrics.hasLoadingStates) score += 20;
      if (metrics.hasAccessibilityFeatures) score += 25;
      if (metrics.hasProperSEO) score += 15;

      // Check for test IDs (indicates testing consideration)
      const testIdCount = await page.locator('[data-testid]').count();
      if (testIdCount > 5) score += 20;

      metrics.codeQualityScore = score;

      // Generate issues
      if (!metrics.hasErrorBoundaries) {
        metrics.issues.push('Missing error boundary components');
      }
      if (!metrics.hasLoadingStates) {
        metrics.issues.push('Missing loading state indicators');
      }
      if (!metrics.hasAccessibilityFeatures) {
        metrics.issues.push('Insufficient accessibility features');
      }
      if (!metrics.hasProperSEO) {
        metrics.issues.push('Missing basic SEO meta tags');
      }
      if (testIdCount < 3) {
        metrics.issues.push('Low test coverage indicators');
      }

      console.log(`Code Quality Score: ${metrics.codeQualityScore}/100`);
      console.log(`Issues: ${metrics.issues.length}`);

      qualityMetrics.push(metrics);
    }

    // Save quality report
    const reportPath = path.join(
      process.cwd(),
      'test-results',
      'quality-metrics.json'
    );
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(
      reportPath,
      JSON.stringify(qualityMetrics, null, 2)
    );

    // Quality summary
    const avgQualityScore =
      qualityMetrics.reduce((sum, m) => sum + m.codeQualityScore, 0) /
      qualityMetrics.length;
    const totalIssues = qualityMetrics.reduce(
      (sum, m) => sum + m.issues.length,
      0
    );
    const routesWithGoodSEO = qualityMetrics.filter(m => m.hasProperSEO).length;

    console.log('\n=== CODE QUALITY SUMMARY ===');
    console.log(`Average Quality Score: ${avgQualityScore.toFixed(1)}/100`);
    console.log(`Total Issues: ${totalIssues}`);
    console.log(
      `Routes with SEO: ${routesWithGoodSEO}/${qualityMetrics.length}`
    );

    expect(avgQualityScore).toBeGreaterThan(50);
  });

  test('should check for security best practices', async ({ page }) => {
    console.log('\n=== Security Assessment ===');

    await page.goto('/');

    const securityChecks = {
      hasCSP: false,
      hasHTTPS: false,
      hasSecureHeaders: false,
      hasInputValidation: false,
      hasXSSProtection: false,
      hasClickjackingProtection: false,
      vulnerabilities: [] as string[],
      recommendations: [] as string[],
    };

    // Check for HTTPS
    securityChecks.hasHTTPS = page.url().startsWith('https://');

    // Check for CSP
    securityChecks.hasCSP =
      (await page
        .locator('meta[http-equiv="Content-Security-Policy"]')
        .count()) > 0;

    // Check for input validation
    const inputsWithValidation = await page
      .locator(
        'input[pattern], input[required], input[minlength], input[maxlength]'
      )
      .count();
    securityChecks.hasInputValidation = inputsWithValidation > 0;

    // Check for XSS protection headers
    const xssProtection = await page.evaluate(() => {
      const metaTags = document.querySelectorAll('meta[http-equiv]');
      return Array.from(metaTags).some(tag =>
        tag
          .getAttribute('http-equiv')
          ?.toLowerCase()
          .includes('x-xss-protection')
      );
    });
    securityChecks.hasXSSProtection = xssProtection;

    // Check for clickjacking protection
    const frameOptions = await page.evaluate(() => {
      const metaTags = document.querySelectorAll('meta[http-equiv]');
      return Array.from(metaTags).some(tag =>
        tag
          .getAttribute('http-equiv')
          ?.toLowerCase()
          .includes('x-frame-options')
      );
    });
    securityChecks.hasClickjackingProtection = frameOptions;

    // Generate vulnerabilities and recommendations
    if (!securityChecks.hasHTTPS) {
      securityChecks.vulnerabilities.push(
        'No HTTPS - data transmitted in plain text'
      );
      securityChecks.recommendations.push('Implement HTTPS encryption');
    }

    if (!securityChecks.hasCSP) {
      securityChecks.vulnerabilities.push(
        'No Content Security Policy - vulnerable to XSS'
      );
      securityChecks.recommendations.push(
        'Implement Content Security Policy headers'
      );
    }

    if (!securityChecks.hasInputValidation) {
      securityChecks.vulnerabilities.push('Insufficient input validation');
      securityChecks.recommendations.push(
        'Add proper input validation and sanitization'
      );
    }

    if (!securityChecks.hasXSSProtection) {
      securityChecks.recommendations.push('Add X-XSS-Protection header');
    }

    if (!securityChecks.hasClickjackingProtection) {
      securityChecks.recommendations.push(
        'Add X-Frame-Options header to prevent clickjacking'
      );
    }

    // Test authentication routes if available
    try {
      await page.goto('/login');
      const loginForm = await page.locator('form').count();
      if (loginForm > 0) {
        const passwordFields = await page
          .locator('input[type="password"]')
          .count();
        const hasMinLength = await page
          .locator('input[type="password"][minlength]')
          .count();
        const hasPattern = await page
          .locator('input[type="password"][pattern]')
          .count();

        if (passwordFields > 0 && !hasMinLength && !hasPattern) {
          securityChecks.vulnerabilities.push(
            'Password fields lack complexity requirements'
          );
          securityChecks.recommendations.push(
            'Add password complexity validation'
          );
        }
      }
    } catch (error) {
      console.log('No login form found for security assessment');
    }

    // Save security report
    const reportPath = path.join(
      process.cwd(),
      'test-results',
      'security-assessment.json'
    );
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(
      reportPath,
      JSON.stringify(securityChecks, null, 2)
    );

    console.log(
      `Security Vulnerabilities: ${securityChecks.vulnerabilities.length}`
    );
    console.log(
      `Security Recommendations: ${securityChecks.recommendations.length}`
    );

    securityChecks.vulnerabilities.forEach(vuln => console.log(`⚠️  ${vuln}`));
    securityChecks.recommendations.forEach(rec => console.log(`🔧 ${rec}`));

    // Basic security assertion
    expect(securityChecks.vulnerabilities.length).toBeLessThan(5);
  });

  test('should generate comprehensive improvement roadmap', async () => {
    console.log('\n=== Generating Improvement Roadmap ===');

    // Read all previous test results
    const testResultsDir = path.join(process.cwd(), 'test-results');
    const reports = [
      'feature-discovery-report.json',
      'gap-analysis-report.json',
      'mobile-ux-assessment.json',
      'performance-metrics.json',
      'quality-metrics.json',
      'security-assessment.json',
    ];

    const improvementRoadmap = {
      timestamp: new Date().toISOString(),
      priority1: [] as string[],
      priority2: [] as string[],
      priority3: [] as string[],
      longTerm: [] as string[],
      estimatedEffort: {} as Record<string, string>,
    };

    for (const reportFile of reports) {
      try {
        const reportPath = path.join(testResultsDir, reportFile);
        const reportData = JSON.parse(
          await fs.promises.readFile(reportPath, 'utf8')
        );

        // Extract recommendations from each report
        if (reportData.recommendations) {
          reportData.recommendations.forEach((rec: string) => {
            if (rec.includes('Priority 1')) {
              improvementRoadmap.priority1.push(rec);
            } else if (rec.includes('Priority 2')) {
              improvementRoadmap.priority2.push(rec);
            } else if (rec.includes('Priority 3')) {
              improvementRoadmap.priority3.push(rec);
            } else {
              improvementRoadmap.priority2.push(rec);
            }
          });
        }

        // Extract critical issues
        if (reportData.criticalGaps) {
          reportData.criticalGaps.forEach((gap: string) => {
            improvementRoadmap.priority1.push(`Critical Gap: ${gap}`);
          });
        }

        if (reportData.vulnerabilities) {
          reportData.vulnerabilities.forEach((vuln: string) => {
            improvementRoadmap.priority1.push(`Security: ${vuln}`);
          });
        }
      } catch (error) {
        console.log(`Could not read ${reportFile}: ${error}`);
      }
    }

    // Add effort estimates
    improvementRoadmap.estimatedEffort = {
      'Implement basic work order CRUD': '2-3 weeks',
      'Create authentication system': '1-2 weeks',
      'Add mobile responsiveness': '1-2 weeks',
      'Implement offline functionality': '3-4 weeks',
      'Add equipment management': '2-3 weeks',
      'Create dashboard and analytics': '2-3 weeks',
      'Implement inventory tracking': '3-4 weeks',
      'Add security headers': '1-2 days',
      'Improve accessibility': '1-2 weeks',
    };

    // Remove duplicates and sort by priority
    improvementRoadmap.priority1 = [...new Set(improvementRoadmap.priority1)];
    improvementRoadmap.priority2 = [...new Set(improvementRoadmap.priority2)];
    improvementRoadmap.priority3 = [...new Set(improvementRoadmap.priority3)];

    // Save improvement roadmap
    const roadmapPath = path.join(testResultsDir, 'improvement-roadmap.json');
    await fs.promises.writeFile(
      roadmapPath,
      JSON.stringify(improvementRoadmap, null, 2)
    );

    console.log('\n=== IMPROVEMENT ROADMAP GENERATED ===');
    console.log(`Priority 1 Items: ${improvementRoadmap.priority1.length}`);
    console.log(`Priority 2 Items: ${improvementRoadmap.priority2.length}`);
    console.log(`Priority 3 Items: ${improvementRoadmap.priority3.length}`);

    console.log('\n=== IMMEDIATE ACTIONS (Priority 1) ===');
    improvementRoadmap.priority1.forEach(item => console.log(`- ${item}`));

    expect(improvementRoadmap.priority1.length).toBeGreaterThan(0);
  });
});
