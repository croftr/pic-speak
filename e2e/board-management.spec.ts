import { test, expect } from '@playwright/test'
import { useSignedInSession, deleteBoardByName } from './helpers'

// Used to track the board created during the test for cleanup in case of failure
let createdBoardName: string | undefined

test.afterEach(async ({ page }) => {
  if (createdBoardName) {
    await deleteBoardByName(page, createdBoardName)
    createdBoardName = undefined
  }
})

test('can manage board settings and delete board via UI', async ({ page }) => {
  test.setTimeout(60000)
  await useSignedInSession(page)

  await page.goto('/my-boards')
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })

  // ── Create a new board ──────────────────────────────────────────────
  await page.getByRole('button', { name: /new board/i }).click()
  createdBoardName = `Mgmt Test Board ${Date.now()}`
  await page.getByPlaceholder(/routine/i).fill(createdBoardName)
  await page.locator('form').getByRole('button', { name: /create board/i }).click()

  await expect(page).toHaveURL(/\/board\/.*\?edit=true/, { timeout: 10000 })
  await expect(page.getByText(createdBoardName)).toBeVisible()

  // ── Edit Board Settings ──────────────────────────────────────────────
  // Ensure we are scrolled to top to see the header
  await page.evaluate(() => window.scrollTo(0, 0))

  // Expand settings panel — matches "Settings" (mobile) or "Board Settings" (desktop)
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

  // Verify the name in the toolbar changed
  await expect(page.getByTestId('board-toolbar-name')).toHaveText(newBoardName)

  // Wait for save-triggered navigation to view mode (router.push removes ?edit=true)
  await expect(page).not.toHaveURL(/edit=true/, { timeout: 10000 })
  // Verify the board name is visible in view mode before reloading
  await expect(page.getByRole('heading', { name: newBoardName })).toBeVisible({ timeout: 10000 })

  // Reload to verify persistence
  await page.reload()
  await page.waitForLoadState('load')

  // Ensure we are scrolled to top after reload to see the header
  await page.evaluate(() => window.scrollTo(0, 0))

  // Verify the board name persisted after reload
  await expect(page.getByRole('heading', { name: newBoardName })).toBeVisible({ timeout: 10000 })

  // Enter edit mode again to check settings values
  if (!page.url().includes('edit=true')) {
      const boardId = page.url().split('/').pop()?.split('?')[0]
      await page.goto(`/board/${boardId}?edit=true`)
  }

  await page.getByRole('button', { name: /settings/i }).first().click()
  await expect(page.getByPlaceholder('Enter board name...')).toHaveValue(newBoardName)
  await expect(page.getByPlaceholder('Add a description...')).toHaveValue(newDesc)
  await expect(page.getByLabel('Public Board')).toBeChecked()

  // ── Delete Board via UI ──────────────────────────────────────────────
  await page.getByRole('button', { name: /delete board/i }).click()

  // Confirm deletion — scoped to the dialog
  const confirmDialog = page.getByTestId('confirm-dialog')
  await expect(confirmDialog.getByText(/are you sure you want to delete/i)).toBeVisible()
  await confirmDialog.getByRole('button', { name: 'Delete', exact: true }).click()

  // Verify redirection to My Boards
  await expect(page).toHaveURL(/.*\/my-boards/)
  await expect(page.getByText(newBoardName)).not.toBeVisible()

  // Clear tracker since we successfully deleted it
  createdBoardName = undefined
})
