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
        launchOptions: {
          executablePath: '/usr/bin/google-chrome',
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-web-security']
        }
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
