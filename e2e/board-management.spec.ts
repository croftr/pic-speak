import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

// Used to track the board created during the test for cleanup in case of failure
let createdBoardName: string | undefined

test.afterEach(async ({ page }) => {
  if (createdBoardName) {
    try {
      // Add timestamp to bypass potential caching
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

test('can manage board settings and delete board via UI', async ({ page }) => {
  test.setTimeout(60000)
  await signIn(page)

  await page.goto('/my-boards')
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })

  // ── Create a new board ──────────────────────────────────────────────
  await page.getByRole('button', { name: /new board/i }).click()
  createdBoardName = `Mgmt Test Board ${Date.now()}`
  await page.getByPlaceholder('e.g., Daily Routine').fill(createdBoardName)
  await page.locator('form').getByRole('button', { name: /create board/i }).click()

  await expect(page).toHaveURL(/\/board\/.*\?edit=true/, { timeout: 10000 })
  await expect(page.getByText(createdBoardName)).toBeVisible()

  // ── Edit Board Settings ──────────────────────────────────────────────
  // Ensure we are scrolled to top to see the header
  await page.evaluate(() => window.scrollTo(0, 0))

  // Expand settings panel
  // Use a more generic regex to match "Settings" (mobile) or "Board Settings" (desktop)
  // Ensure it's not the "Batch Upload" or "Merge Board" button if they have similar text (unlikely)
  const settingsButton = page.getByRole('button', { name: /settings/i }).first()
  await expect(settingsButton).toBeVisible()
  await settingsButton.click()

  // Verify inputs are visible
  await expect(page.getByPlaceholder('Enter board name...')).toBeVisible()

  // Change name
  const newBoardName = `Renamed Board ${Date.now()}`
  await page.getByPlaceholder('Enter board name...').fill(newBoardName)
  createdBoardName = newBoardName // Update tracker for cleanup

  // Change description
  const newDesc = 'This is a test description'
  await page.getByPlaceholder('Add a description...').fill(newDesc)

  // Toggle Public
  await page.getByText('Public Board').click()
  // Verify share button appears when public
  await expect(page.getByTitle('Copy share link')).toBeVisible()

  // Save changes
  await page.getByRole('button', { name: 'Save' }).click()

  // Verify toast or UI update (Save button usually shows a loader then checkmark, or toast)
  // We can verify the name in the header changed
  await expect(page.getByRole('link', { name: 'Done Editing' }).locator('..').getByText(newBoardName)).toBeVisible()

  // Reload to verify persistence
  await page.reload()
  // Should still be in edit mode or view mode? Reload usually resets URL params unless persisted.
  // The app might not persist ?edit=true on reload unless logic handles it.
  // Let's assume we land in view mode or edit mode.
  // If view mode, we need to check the title.
  await expect(page.getByText(newBoardName)).toBeVisible()

  // Enter edit mode again to check settings values
  if (!page.url().includes('edit=true')) {
      const boardId = page.url().split('/').pop()?.split('?')[0]
      await page.goto(`/board/${boardId}?edit=true`)
  }

  await page.getByRole('button', { name: /board settings/i }).click()
  await expect(page.getByPlaceholder('Enter board name...')).toHaveValue(newBoardName)
  await expect(page.getByPlaceholder('Add a description...')).toHaveValue(newDesc)
  await expect(page.getByLabel('Public Board')).toBeChecked() // Or getByRole('checkbox')

  // ── Delete Board via UI ──────────────────────────────────────────────
  await page.getByRole('button', { name: /delete board/i }).click()

  // Confirm deletion
  await expect(page.getByText(/are you sure you want to delete/i)).toBeVisible()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  // Verify redirection to My Boards
  await expect(page).toHaveURL(/.*\/my-boards/)
  await expect(page.getByText(newBoardName)).not.toBeVisible()

  // Clear tracker since we successfully deleted it
  createdBoardName = undefined
})
