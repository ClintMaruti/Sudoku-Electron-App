import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'electron',
      use: {
        // Electron-specific setup is done in each test via _electron.launch()
      },
    },
  ],
})
