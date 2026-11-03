import { defineConfig, devices } from '@playwright/test';

// 本番ビルドを vite preview で配信し、利用者の主要な操作経路が壊れていないかを確かめる
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.js',
  use: {
    baseURL: 'http://localhost:4174',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
  },
});
