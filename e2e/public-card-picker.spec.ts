import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

// Used to track the board created during the test for cleanup in case of failure
let createdBoardName: string | undefined

test.afterEach(async ({ page }) => {
  if (createdBoardName) {
    try {
      const response = await page.request.get(`/api/boards?_=${Date.now()}`)
      if (response.ok()) {
        const boards = await response.json()
        const board = boards.find((b: { name: string }) => b.name === createdBoardName)
        if (board) {
          console.log(`[Cleanup] Deleting board: ${createdBoardName} (${board.id})`)
          await page.request.delete(`/api/boards/${board.id}`)
        }
      }
    } catch (error) {
      console.error('[Cleanup] Failed to clean up board:', error)
    } finally {
      createdBoardName = undefined
    }
  }
})

async function signIn(page: import('@playwright/test').Page) {
  await setupClerkTestingToken({ page })
  await page.goto('/')
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_USERNAME!,
  })
}

test('can add a card from a public board via the public card picker', async ({ page }) => {
  test.setTimeout(60000)
  await signIn(page)

  await page.goto('/my-boards')
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })

  // ── Create a new board ──────────────────────────────────────────────
  await page.getByRole('button', { name: /new board/i }).click()
  createdBoardName = `Public Picker Test Board ${Date.now()}`
  await page.getByPlaceholder('e.g., Daily Routine').fill(createdBoardName)
  await page.locator('form').getByRole('button', { name: /create board/i }).click()

  await expect(page).toHaveURL(/\/board\/.*\?edit=true/, { timeout: 10000 })
  await expect(page.getByText(createdBoardName)).toBeVisible()

  // ── Open Add Card modal ─────────────────────────────────────────────
  await page.getByRole('button', { name: /add your first card/i }).click()
  await expect(page.getByRole('heading', { name: /what is it/i })).toBeVisible()

  // ── Click "Browse Public Cards" ─────────────────────────────────────
  await page.getByRole('button', { name: /browse public cards/i }).click()

  // ── Verify the Public Card Picker modal opened ──────────────────────
  await expect(page.getByRole('heading', { name: /browse public cards/i })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Pick from community boards')).toBeVisible()
  await expect(page.getByPlaceholder('Search boards...')).toBeVisible()

  // ── Verify the Starter Template board appears ───────────────────────
  const starterBoardButton = page.getByRole('button', { name: /starter template/i })
  await expect(starterBoardButton).toBeVisible({ timeout: 10000 })

  // ── Click the Starter Template board ────────────────────────────────
  await starterBoardButton.click()

  // Verify the heading changed to the board name and cards are loading
  await expect(page.getByRole('heading', { name: /starter template/i })).toBeVisible()
  await expect(page.getByText('by My Voice Board')).toBeVisible()
  await expect(page.getByPlaceholder('Search cards...')).toBeVisible()

  // Wait for cards to load — check for a known card from the Starter Template
  await expect(page.getByText('Yes', { exact: true }).first()).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Hello', { exact: true }).first()).toBeVisible()

  // ── Search for a specific card ──────────────────────────────────────
  await page.getByPlaceholder('Search cards...').fill('Apple')
  // "Apple" card should be visible, "Hello" should be filtered out
  await expect(page.getByText('Apple', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Hello', { exact: true })).not.toBeVisible()

  // Clear search to see all cards again
  await page.getByPlaceholder('Search cards...').fill('')
  await expect(page.getByText('Hello', { exact: true }).first()).toBeVisible()

  // ── Select a card to add to the board ───────────────────────────────
  // Pick "Apple" since it's a simple, unique label
  await page.getByPlaceholder('Search cards...').fill('Apple')
  await expect(page.getByText('Apple', { exact: true }).first()).toBeVisible()

  // Click the "Select" button on the Apple card
  await page.getByRole('button', { name: 'Select' }).click()

  // ── Verify success ──────────────────────────────────────────────────
  // Toast should confirm the card was added
  await expect(page.getByText(/"Apple" added to your board!/)).toBeVisible({ timeout: 5000 })

  // Modal should close and we should be back on the board
  await expect(page.getByRole('heading', { name: /browse public cards/i })).not.toBeVisible()

  // The card should now appear on the board (use role to avoid matching the toast)
  await expect(page.getByRole('button', { name: /Apple/ })).toBeVisible({ timeout: 10000 })

  // ── Verify "Already Added" state ────────────────────────────────────
  // Open the Add Card modal again and go back to the public picker
  await page.getByRole('button', { name: /add new card/i }).click()
  await expect(page.getByRole('heading', { name: /what is it/i })).toBeVisible()

  await page.getByRole('button', { name: /browse public cards/i }).click()
  await expect(page.getByRole('heading', { name: /browse public cards/i })).toBeVisible({ timeout: 10000 })

  // Click the Starter Template board again
  await page.getByRole('button', { name: /starter template/i }).click()
  await expect(page.getByRole('heading', { name: /starter template/i })).toBeVisible()

  // Search for Apple again — it should now show "Already Added" instead of "Select"
  await page.getByPlaceholder('Search cards...').fill('Apple')
  await expect(page.getByText('Already Added')).toBeVisible({ timeout: 10000 })

  // ── Navigate back to board list ─────────────────────────────────────
  // Click the back button (ChevronLeft) to go back to the board list
  // The back button is the first button in the header area
  const backButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') })
  await backButton.click()

  // Verify we're back at the board list
  await expect(page.getByRole('heading', { name: /browse public cards/i })).toBeVisible()
  await expect(page.getByPlaceholder('Search boards...')).toBeVisible()

  // ── Delete the board via API for cleanup ────────────────────────────
  const boardId = page.url().match(/\/board\/([^?]+)/)?.[1]
  if (boardId) {
    const response = await page.request.delete(`/api/boards/${boardId}`)
    if (response.ok()) {
      createdBoardName = undefined
    }
  }
})
