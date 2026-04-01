import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  /* 1. Global timeout for each test (in milliseconds) */
  timeout: 30000, // Sets a 60-second limit per test

  expect: {
    /* 2. Maximum time expect() should wait for a condition (e.g., toHaveURL) */
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

    /* 3. Navigation timeout (how long to wait for page.goto) */
    navigationTimeout: 30000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',

    /* 4. Increase startup timeout for the dev server */
    timeout: 60000, // Gives the server 2 minutes to boot up
  },
});
