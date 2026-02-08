import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

test('can browse public boards and open the Starter Template', async ({ page }) => {
  // Sign in — the /board/* routes are protected by middleware
  await setupClerkTestingToken({ page })
  await page.goto('/')
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_USERNAME!,
  })

  // Navigate to the public boards page
  await page.goto('/public-boards')

  // Verify the page loaded
  await expect(page.getByRole('heading', { name: /public boards/i })).toBeVisible()

  // The Starter Template board should always be listed
  const starterCard = page.getByRole('link', { name: /starter template/i })
  await expect(starterCard).toBeVisible()

  // Click through to the board
  await starterCard.click()

  // Verify we landed on the board page
  await expect(page).toHaveURL(/\/board\/starter-template/, { timeout: 10000 })

  // Verify the board name is displayed
  await expect(page.getByText('Starter Template')).toBeVisible()

  // Verify some of the known communication cards are rendered (use button role since
  // cards are interactive buttons on the board)
  await expect(page.getByRole('button', { name: /^Yes/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^No / })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Hello/ })).toBeVisible()
})
