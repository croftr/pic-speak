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

test('can browse public boards and open the Starter Template', async ({ page }) => {
  await useSignedInSession(page)

  // Navigate to the public boards page
  await page.goto('/public-boards')

  // Verify the page loaded
  await expect(page.getByRole('heading', { name: /explore boards/i })).toBeVisible()

  // The Starter Template board should always be listed
  const starterCard = page.getByRole('link', { name: /starter template/i })
  await expect(starterCard).toBeVisible()

  // Click through to the board
  await starterCard.click()

  // Verify we landed on the board page
  await expect(page).toHaveURL(/\/board\/starter-template/, { timeout: 10000 })

  // Verify the board name is displayed
  await expect(page.getByRole('heading', { name: 'Starter Template' })).toBeVisible()

  // Verify some of the known communication cards are rendered (use button role since
  // cards are interactive buttons on the board)
  await expect(page.getByRole('button', { name: /^Yes/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^No / })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Hello/ })).toBeVisible()
})

test('creator can delete their own public board from public boards list', async ({ page }) => {
  test.setTimeout(60000)
  await useSignedInSession(page)

  await page.goto('/my-boards')
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })

  // Create a new board
  await page.getByRole('button', { name: /new board/i }).click()
  createdBoardName = `Public Mgmt Test Board ${Date.now()}`
  await page.getByPlaceholder(/routine/i).fill(createdBoardName)
  await page.locator('form').getByRole('button', { name: /create board/i }).click()

  // Redirected to the new board in edit mode
  await expect(page).toHaveURL(/\/board\/.*\?edit=true/, { timeout: 10000 })
  await expect(page.getByText(createdBoardName)).toBeVisible()

  // Expand settings panel
  await page.evaluate(() => window.scrollTo(0, 0))
  const settingsButton = page.getByRole('button', { name: /settings/i }).first()
  await expect(settingsButton).toBeVisible()
  await settingsButton.click()

  // Make board public
  await page.getByText('Public Board').click()
  await page.getByRole('button', { name: 'Save' }).click()

  // Wait for edit mode to finish
  await expect(page).not.toHaveURL(/edit=true/, { timeout: 10000 })

  // Go to public boards list
  await page.goto('/public-boards')
  await expect(page.getByRole('heading', { name: /explore boards/i })).toBeVisible()

  // Find our board card
  const boardCard = page.getByTestId('public-board-card').filter({ hasText: createdBoardName })
  await expect(boardCard).toBeVisible()

  // Delete button should be visible for our own board
  const deleteBtn = boardCard.getByRole('button', { name: /delete/i })
  await expect(deleteBtn).toBeVisible()

  // Delete button should NOT be visible on Starter Template
  const starterCard = page.getByTestId('public-board-card').filter({ hasText: /starter template/i })
  await expect(starterCard.getByRole('button', { name: /delete/i })).not.toBeVisible()

  // Click delete and confirm in dialog
  await deleteBtn.click()
  const confirmDialog = page.getByTestId('confirm-dialog')
  await expect(confirmDialog).toBeVisible()
  await expect(confirmDialog.getByText(/are you sure you want to delete/i)).toBeVisible()
  await confirmDialog.getByRole('button', { name: 'Delete', exact: true }).click()

  // Verify the board card is gone
  await expect(boardCard).not.toBeVisible({ timeout: 10000 })

  // Reset tracking variable since it was successfully deleted
  createdBoardName = undefined
})
