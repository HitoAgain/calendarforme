import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'msedge', timezoneId: 'Asia/Bangkok', viewport: { width: 1440, height: 900 } },
  webServer: { command: 'node server.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
});
