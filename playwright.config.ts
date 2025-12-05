import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    headless: true
  },
  
  webServer: {
    command: 'node server.js',
    port: 3000,
    timeout: 30_000,
    reuseExistingServer: false,
    env: { RESET_DB: '1' }
  }
});
