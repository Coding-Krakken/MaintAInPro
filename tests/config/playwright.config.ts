import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../../tests/e2e',
  outputDir: '../../test-results/playwright-artifacts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '../../reports/playwright-report' }],
    ['json', { outputFile: '../../reports/e2e/results.json' }],
    ['junit', { outputFile: '../../reports/e2e/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5000/',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    // Force headless mode in CI or when no DISPLAY is available
    headless: !!process.env.CI || !process.env.DISPLAY,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use Playwright's managed Chromium instead of a system Chrome binary.
        // This prevents errors when /usr/bin/google-chrome is missing (common in CI/dev containers).
        // Playwright will automatically download and manage its own browser binaries.
        // If you ever see browser launch errors, run: npx playwright install
        // For CI: ensure 'npx playwright install' is run in setup scripts to pre-download browsers.
        // For more info: https://playwright.dev/docs/browsers#managing-browsers
        launchOptions: {
          // No executablePath: use Playwright's default Chromium
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-web-security'],
        },
      },
    },
    // Disable other browsers for now to focus on fixing core issues
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
  // Startup of frontend/backend is handled by scripts/testing/playwright-e2e-start.sh
  // Extensive error handling is integrated in the shell script.
});
