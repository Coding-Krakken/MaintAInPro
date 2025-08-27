import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../../tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: '../../test-results/e2e',
  reporter: [
    ['html', { outputFolder: '../../test-results/reports/playwright-report' }],
    ['json', { outputFile: '../../test-results/e2e/results.json' }],
    ['junit', { outputFile: '../../test-results/e2e/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure', // This can cause issues in headless mode
    // Force headless mode in CI or when no DISPLAY is available
    headless: !!process.env.CI || !process.env.DISPLAY,
    // Add timeout settings to help with browser startup
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      port: 5000,
      reuseExistingServer: true,
      timeout: 120000,
      cwd: '../../',
    },
    {
      command: 'vite --port 4173',
      port: 4173,
      reuseExistingServer: true,
      timeout: 120000,
      cwd: '../../',
    }
  ],
});
