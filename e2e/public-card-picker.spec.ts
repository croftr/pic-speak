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

  // ── Click "Browse Existing Cards" ───────────────────────────────────
  await page.getByRole('button', { name: /browse existing cards/i }).click()

  // ── Verify the Merge Board modal opened ─────────────────────────────
  await expect(page.getByRole('heading', { name: /merge board/i })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Choose a board to merge cards from')).toBeVisible()

  // ── Switch to Public Boards tab ─────────────────────────────────────
  await page.getByRole('button', { name: /public boards/i }).click()
  await expect(page.getByPlaceholder('Search boards...')).toBeVisible()

  // ── Verify the Starter Template board appears ───────────────────────
  const starterBoardButton = page.getByRole('button', { name: /starter template/i })
  await expect(starterBoardButton).toBeVisible({ timeout: 10000 })

  // ── Click the Starter Template board ────────────────────────────────
  await starterBoardButton.click()

  // Verify the heading changed to the board name and cards are loading
  await expect(page.getByRole('heading', { name: /starter template/i })).toBeVisible()

  // Wait for cards to load — check for a known card from the Starter Template
  await expect(page.getByText('Yes', { exact: true }).first()).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Hello', { exact: true }).first()).toBeVisible()

  // ── Merge selected cards into the board ─────────────────────────────
  // All non-conflict cards are pre-selected, so just click Merge
  await page.getByRole('button', { name: /merge \d+ cards?/i }).click()

  // ── Verify success ──────────────────────────────────────────────────
  // Toast should confirm the cards were merged
  await expect(page.getByText(/merged successfully/)).toBeVisible({ timeout: 5000 })

  // The cards should now appear on the board
  await expect(page.getByRole('button', { name: /Yes/ })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: /Hello/ })).toBeVisible()

  // ── Verify conflict state ──────────────────────────────────────────
  // Open the Add Card modal again and go back to merge
  await page.getByRole('button', { name: /add new card/i }).click()
  await expect(page.getByRole('heading', { name: /what is it/i })).toBeVisible()

  await page.getByRole('button', { name: /browse existing cards/i }).click()
  await expect(page.getByRole('heading', { name: /merge board/i })).toBeVisible({ timeout: 10000 })

  // Switch to public boards and click the Starter Template board again
  await page.getByRole('button', { name: /public boards/i }).click()
  await page.getByRole('button', { name: /starter template/i }).click()
  await expect(page.getByRole('heading', { name: /starter template/i })).toBeVisible()

  // All cards should now show as conflicts since they were already added
  await expect(page.getByText(/already on your board/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('All cards from this board already exist on your board.')).toBeVisible()

  // ── Navigate back to board list ─────────────────────────────────────
  const backButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') })
  await backButton.click()

  // Verify we're back at the board list
  await expect(page.getByRole('heading', { name: /merge board/i })).toBeVisible()
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
