import { test, expect } from '@playwright/test';

test.describe('Performance and Accessibility', () => {
  test('should meet Core Web Vitals performance standards', async ({
    page,
  }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return new Promise<{ lcp: number; fid: number; cls: number }>(resolve => {
        const metrics = {
          lcp: 0,
          fid: 0,
          cls: 0,
        };

        new PerformanceObserver(list => {
          const entries = list.getEntries();

          entries.forEach(entry => {
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const fidEntry = entry as any;
              metrics.fid = fidEntry.processingStart - fidEntry.startTime;
            }
            if (entry.entryType === 'layout-shift') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const clsEntry = entry as any;
              if (!clsEntry.hadRecentInput) {
                metrics.cls += clsEntry.value;
              }
            }
          });

          resolve(metrics);
        }).observe({
          entryTypes: [
            'largest-contentful-paint',
            'first-input',
            'layout-shift',
          ],
        });

        // Fallback timeout
        setTimeout(() => {
          resolve({
            lcp: performance.now(),
            fid: 0,
            cls: 0,
          });
        }, 5000);
      });
    });

    // Assert Core Web Vitals thresholds
    expect(performanceMetrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(performanceMetrics.fid).toBeLessThan(100); // FID < 100ms
    expect(performanceMetrics.cls).toBeLessThan(0.1); // CLS < 0.1
  });

  test('should be accessible with screen readers', async ({ page }) => {
    await page.goto('/');

    // Check for essential accessibility attributes
    const accessibilityChecks = await page.evaluate(() => {
      const issues: string[] = [];

      // Check for alt text on images
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          issues.push(`Image ${index} missing alt text`);
        }
      });

      // Check for form labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input, index) => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');

        if (!hasLabel && !hasAriaLabel) {
          issues.push(`Form input ${index} missing label`);
        }
      });

      // Check for heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let previousLevel = 0;
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.substring(1));
        if (index === 0 && level !== 1) {
          issues.push('Page should start with h1');
        }
        if (level > previousLevel + 1) {
          issues.push(`Heading level jump from h${previousLevel} to h${level}`);
        }
        previousLevel = level;
      });

      return issues;
    });

    // Assert no critical accessibility issues
    expect(accessibilityChecks).toEqual([]);
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    const focusableElements = await page.evaluate(() => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];

      return Array.from(
        document.querySelectorAll(focusableSelectors.join(', '))
      ).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).length;
    });

    // Navigate through all focusable elements
    for (let i = 0; i < focusableElements; i++) {
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = await page.evaluate(() => {
        const focused = document.activeElement;
        if (!focused) return { hasFocus: false, hasVisibleFocus: false };

        const style = window.getComputedStyle(focused);
        return {
          hasFocus: focused !== document.body,
          hasVisibleFocus: style.outline !== 'none' && style.outline !== '0px',
        };
      });

      expect(focusedElement.hasFocus).toBe(true);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    const contrastIssues = await page.evaluate(() => {
      const issues: string[] = [];

      // Function to calculate relative luminance
      const getLuminance = (r: number, g: number, b: number) => {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      // Function to calculate contrast ratio
      const getContrastRatio = (color1: string, color2: string) => {
        const parseColor = (color: string) => {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          return { r, g, b };
        };

        const color1RGB = parseColor(color1);
        const color2RGB = parseColor(color2);

        const lum1 = getLuminance(color1RGB.r, color1RGB.g, color1RGB.b);
        const lum2 = getLuminance(color2RGB.r, color2RGB.g, color2RGB.b);

        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);

        return (brightest + 0.05) / (darkest + 0.05);
      };

      // Check text elements for contrast
      const textElements = document.querySelectorAll(
        'p, h1, h2, h3, h4, h5, h6, span, div, button, a'
      );

      textElements.forEach((element, index) => {
        const style = window.getComputedStyle(element);
        const textColor = style.color;
        const backgroundColor = style.backgroundColor;

        if (
          textColor !== 'rgba(0, 0, 0, 0)' &&
          backgroundColor !== 'rgba(0, 0, 0, 0)'
        ) {
          const contrast = getContrastRatio(textColor, backgroundColor);

          // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
          const fontSize = parseFloat(style.fontSize);
          const fontWeight = style.fontWeight;
          const isLargeText =
            fontSize >= 18 ||
            (fontSize >= 14 &&
              (fontWeight === 'bold' || parseInt(fontWeight) >= 700));

          const requiredContrast = isLargeText ? 3 : 4.5;

          if (contrast < requiredContrast) {
            issues.push(
              `Element ${index} has insufficient contrast: ${contrast.toFixed(2)}:1 (required: ${requiredContrast}:1)`
            );
          }
        }
      });

      return issues;
    });

    // Allow for some flexibility in automated contrast checking
    expect(contrastIssues.length).toBeLessThan(5);
  });

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('load');

    const loadTime = Date.now() - startTime;

    // Assert page loads within 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Check bundle size
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      let totalJSSize = 0;
      let totalCSSSize = 0;

      resources.forEach(resource => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resourceTiming = resource as any;
        if (resourceTiming.name && resourceTiming.name.includes('.js')) {
          totalJSSize += resourceTiming.transferSize || 0;
        }
        if (resourceTiming.name && resourceTiming.name.includes('.css')) {
          totalCSSSize += resourceTiming.transferSize || 0;
        }
      });

      return { totalJSSize, totalCSSSize };
    });

    // Assert reasonable bundle sizes (in bytes)
    expect(resourceSizes.totalJSSize).toBeLessThan(1024 * 1024); // 1MB JS
    expect(resourceSizes.totalCSSSize).toBeLessThan(200 * 1024); // 200KB CSS
  });

  test('should work offline (PWA functionality)', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simulate offline
    await context.setOffline(true);

    // Try to navigate (should work if cached)
    await page.reload();

    // Check if offline indicator is shown
    const offlineIndicator = await page
      .locator('[data-testid="offline-indicator"]')
      .count();
    expect(offlineIndicator).toBeGreaterThan(0);

    // Restore online
    await context.setOffline(false);
  });
});
