import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Points to your tests directory
  testDir: './tests',

  /* Global timeout for each test */
  timeout: 30000,

  expect: {
    /* Maximum time expect() should wait for a condition */
    timeout: 10000,
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',

    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    // Navigates to frontend folder and starts dev server
    command: 'cd ../frontend && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',

    /* Startup timeout for the dev server */
    timeout: 60000,
  },
});