import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

test('can sign in and reach My Boards', async ({ page }) => {
  // Inject the Clerk testing token so bot detection is bypassed
  await setupClerkTestingToken({ page })

  // Navigate to the landing page (loads Clerk)
  await page.goto('/')

  // Sign in using Clerk's testing helper
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  })

  // Navigate to a protected page
  await page.goto('/my-boards')

  // Verify we landed on the boards page (not redirected to sign-in)
  await expect(page).toHaveURL(/my-boards/)
  await expect(page.locator('body')).not.toContainText('Sign in')
})
