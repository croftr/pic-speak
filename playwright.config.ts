import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import path from 'path'

// Local runs pick up secrets from .env.local. CI provides real env vars,
// which win — dotenv never overrides an already-set variable.
loadEnv({ path: path.join(__dirname, '.env.local') })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Signed-in session saved by global.setup.ts — tests reuse it instead
        // of paying a Clerk network sign-in per test.
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    // In CI the workflow runs `npm run build` first and tests hit the
    // production server — dev-mode on-demand compilation is a major source
    // of timeout flakes. Locally the dev server is reused if running.
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      MAX_BOARDS_PER_USER: '100',
    },
  },
})
