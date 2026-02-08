import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'
import path from 'path'

// The test account has 2FA enabled, so we use the email-based sign-in which
// creates a backend sign-in token and bypasses the second factor step.
async function signIn(page: import('@playwright/test').Page) {
  await setupClerkTestingToken({ page })
  await page.goto('/')
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_USERNAME!,
  })
}

test('can sign in and reach My Boards', async ({ page }) => {
  await signIn(page)

  await page.goto('/my-boards')

  // Verify we landed on the boards page (not redirected to Clerk sign-in)
  await expect(page).toHaveURL(/localhost:\d+\/my-boards/, { timeout: 10000 })

  // The heading only renders when server-side auth() succeeds
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })
})

test('logged-in user can create a board, add a card with image and audio, then delete both', { timeout: 60000 }, async ({ page }) => {
  await signIn(page)

  await page.goto('/my-boards')
  await expect(page).toHaveURL(/localhost:\d+\/my-boards/, { timeout: 10000 })
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })

  // ── Create a new board ──────────────────────────────────────────────
  await page.getByRole('button', { name: /new board/i }).click()

  const boardName = `E2E Test Board ${Date.now()}`
  await page.getByPlaceholder('e.g., Daily Routine').fill(boardName)
  await page.locator('form').getByRole('button', { name: /create board/i }).click()

  // Redirected to the new board in edit mode
  await expect(page).toHaveURL(/\/board\/.*\?edit=true/, { timeout: 10000 })
  await expect(page.getByText(boardName)).toBeVisible({ timeout: 5000 })

  // ── Add a card ──────────────────────────────────────────────────────
  // The empty board shows "Add Your First Card"; click it to open the modal
  await page.getByRole('button', { name: /add your first card/i }).click({ timeout: 10000 })

  // Step 1: Enter label
  const cardLabel = `Test Card ${Date.now()}`
  await page.getByPlaceholder('e.g., Apple, Hungry, Yes').fill(cardLabel)
  await page.getByRole('button', { name: /next step/i }).click()

  // Step 2: Upload an image
  const imageInput = page.locator('input[type="file"][accept="image/*"]')
  await imageInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-image.png'))

  // The crop modal appears — click "Apply" to accept the crop
  await expect(page.getByText('Crop & Resize Image')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /apply/i }).click()

  // Image preview should now be visible; proceed to step 3
  await page.getByRole('button', { name: /next step/i }).click()

  // Step 3: Upload an audio file — click "Upload Audio File" then set the file
  await page.getByText('Upload Audio File').click()
  const audioInput = page.locator('input[type="file"][accept="audio/*"]')
  await audioInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-audio.wav'))

  // Submit the card
  await page.getByRole('button', { name: /finish & save/i }).click()

  // Verify the card now appears on the board
  await expect(page.getByText(cardLabel)).toBeVisible({ timeout: 15000 })

  // ── Edit the card ───────────────────────────────────────────────────
  const updatedCardLabel = `Updated Card Label ${Date.now()}`

  // Open the card's options menu
  const cardElement = page.locator(`[data-card-id]`).filter({ hasText: cardLabel })
  const cardContainer = cardElement.locator('..')
  await cardContainer.getByRole('button', { name: /card options/i }).click()

  // Click "Edit Card"
  await page.getByRole('button', { name: /edit card/i }).click()

  // Verify modal is open
  await expect(page.getByRole('heading', { name: /edit card/i })).toBeVisible()

  // Step 1: Update Label
  await page.getByPlaceholder('e.g., Apple, Hungry, Yes').fill(updatedCardLabel)
  await page.getByRole('button', { name: /next step/i }).click()

  // Step 2: Update Image
  // Hover over image preview to reveal "Change Image" button
  await page.locator('img[alt="Card Preview"]').hover()
  await page.getByRole('button', { name: /change image/i }).click()

  // Upload new image
  const updateImageInput = page.locator('input[type="file"][accept="image/*"]')
  await updateImageInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-image-2.png'))

  // Handle Crop Modal
  await expect(page.getByText('Crop & Resize Image')).toBeVisible()
  await page.getByRole('button', { name: /apply/i }).click()

  // Go to next step
  await page.getByRole('button', { name: /next step/i }).click()

  // Step 3: Update Audio
  await page.getByText('Remove & Record New').click()
  const updateAudioInput = page.locator('input[type="file"][accept="audio/*"]')
  await updateAudioInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-audio-2.wav'))

  // Submit update
  await page.getByRole('button', { name: /update card/i }).click()

  // Verify update
  await expect(page.getByRole('heading', { name: /edit card/i })).not.toBeVisible()
  await expect(page.getByText(updatedCardLabel)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(cardLabel)).not.toBeVisible()

  // ── Delete the card via the UI ──────────────────────────────────────
  // Use the updated label to find the card
  const updatedCardElement = page.locator(`[data-card-id]`).filter({ hasText: updatedCardLabel })
  const updatedCardContainer = updatedCardElement.locator('..')
  await updatedCardContainer.getByRole('button', { name: /card options/i }).click()

  // Click "Delete" in the dropdown menu
  await page.getByRole('button', { name: /delete card/i }).click()

  // Confirm deletion in the dialog (use exact match to avoid hitting "Delete Board")
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  // Verify the card is gone
  await expect(page.getByText(updatedCardLabel)).not.toBeVisible({ timeout: 5000 })

  // ── Delete the board via the API ────────────────────────────────────
  const boardId = page.url().match(/\/board\/([^?]+)/)?.[1]
  if (boardId) {
    await page.request.delete(`/api/boards/${boardId}`)
  }
})
