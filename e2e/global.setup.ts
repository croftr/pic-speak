import { clerk, clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright'
import { test as setup, expect } from '@playwright/test'
import { Pool } from 'pg'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth', 'user.json')

// Name prefixes used by the specs when creating throwaway boards. Cleanup
// only ever deletes boards that BOTH match one of these AND belong to the
// test user — never scan the whole table by name alone.
const TEST_BOARD_PREFIXES = [
  'E2E Test Board%',
  'Mgmt Test Board%',
  'Interaction Test Board%',
  'Renamed Board%',
  'Public Picker Test Board%',
  'Public Mgmt Test Board%',
  'API Security Test Board%',
  'Reorder Test Board%',
]

// Must run serially to ensure Clerk testing token is available for all tests
setup.describe.configure({ mode: 'serial' })

setup('global setup', async ({ page }) => {
  await clerkSetup()

  // The test account has 2FA enabled, so we use the email-based sign-in which
  // creates a backend sign-in token and bypasses the second factor step.
  await setupClerkTestingToken({ page })
  await page.goto('/')
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_USERNAME!,
  })

  // Confirm server-side auth works before freezing the session
  await page.goto('/my-boards')
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 15000 })

  // Save the signed-in session for all test projects
  await page.context().storageState({ path: AUTH_FILE })

  // Resolve the test user's Clerk id so DB cleanup below can be scoped to it
  const testUserId = await page.evaluate(
    () => (window as unknown as { Clerk?: { user?: { id?: string } } }).Clerk?.user?.id
  )

  if (process.env.POSTGRES_URL) {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }, // For Vercel/Neon
    })

    try {
      console.log('Ensuring app_settings table exists...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)
      console.log('app_settings table verified.')

      // Clean up orphaned test boards from previous failed runs — strictly
      // scoped to the test user so a real user's board can never match.
      if (testUserId) {
        const likeClauses = TEST_BOARD_PREFIXES.map((_, i) => `name LIKE $${i + 2}`).join(' OR ')
        const cleanup = await pool.query(
          `DELETE FROM boards WHERE user_id = $1 AND (${likeClauses})`,
          [testUserId, ...TEST_BOARD_PREFIXES]
        )
        if (cleanup.rowCount && cleanup.rowCount > 0) {
          console.log(`Cleaned up ${cleanup.rowCount} orphaned test board(s).`)
        }
      } else {
        console.warn('Could not resolve test user id — skipping orphaned-board cleanup.')
      }
    } catch (e) {
      console.error('Failed to ensure migrations:', e)
    } finally {
      await pool.end()
    }
  } else {
    console.log('Skipping migration check: POSTGRES_URL not set.')
  }
})
