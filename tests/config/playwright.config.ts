import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../../tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: '../../test-results/e2e',
  // Add timeout settings to help with browser startup
  timeout: 30000,
  reporter: [
    ['html', { outputFolder: '../../test-results/reports/playwright-report' }],
    ['json', { outputFile: '../../test-results/e2e/results.json' }],
    ['junit', { outputFile: '../../test-results/e2e/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173/',
    // Disable video/trace recording to avoid ffmpeg dependency issues
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off', // Disabled due to ffmpeg not being available
    // Force headless mode in CI or when no DISPLAY is available
    headless: !!process.env.CI || !process.env.DISPLAY,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use system Chrome browser instead of downloading Playwright's browsers
        channel: 'chrome',
      },
    },
  ],
  webServer: [
    {
      command: 'TEST_AUTH_MODE=true DISABLE_RATE_LIMITING=true npm run dev',
      port: 4173,
      reuseExistingServer: true,
      timeout: 120000,
      cwd: '../../',
    },
  ],
});
