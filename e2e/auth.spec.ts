import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'
import path from 'path'

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
  // Check for path only to support both localhost and 127.0.0.1
  await expect(page).toHaveURL(/\/my-boards/, { timeout: 10000 })

  // The heading only renders when server-side auth() succeeds
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })
})

test('logged-in user can create a board, add a card with image and audio, then delete both', async ({ page }) => {
  test.setTimeout(60000)
  await signIn(page)

  await page.goto('/my-boards')
  // Check for path only to support both localhost and 127.0.0.1
  await expect(page).toHaveURL(/\/my-boards/, { timeout: 10000 })
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })

  // ── Create a new board ──────────────────────────────────────────────
  await page.getByRole('button', { name: /new board/i }).click()

  // Store in the top-level variable for cleanup
  createdBoardName = `E2E Test Board ${Date.now()}`
  // Use a local const for convenience, though they are the same string
  const boardName = createdBoardName

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

  // Capture initial image src for verification
  const initialImageSrc = await cardElement.locator('img').getAttribute('src')

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
  // The button is centered over the image, so we force the click
  await page.getByRole('button', { name: /change image/i }).click({ force: true })

  // Upload new image - scope to the visible file input to avoid ambiguity
  const updateImageInput = page.locator('input[type="file"][accept="image/*"]').last()
  await updateImageInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-image-2.png'))

  // Handle Crop Modal
  await expect(page.getByText('Crop & Resize Image')).toBeVisible()
  await page.getByRole('button', { name: /apply/i }).click()

  // Go to next step
  await page.getByRole('button', { name: /next step/i }).click()

  // Step 3: Update Audio
  await page.getByText('Remove & Record New').click()
  // Scope audio input similarly
  const updateAudioInput = page.locator('input[type="file"][accept="audio/*"]').last()
  await updateAudioInput.setInputFiles(path.resolve(__dirname, 'fixtures/test-audio-2.wav'))

  // Submit update
  await page.getByRole('button', { name: /update card/i }).click()

  // Verify update
  await expect(page.getByRole('heading', { name: /edit card/i })).not.toBeVisible()
  await expect(page.getByText(updatedCardLabel)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(cardLabel)).not.toBeVisible()

  // Verify image has changed
  const updatedCardElement = page.locator(`[data-card-id]`).filter({ hasText: updatedCardLabel })
  const updatedImageSrc = await updatedCardElement.locator('img').getAttribute('src')
  expect(updatedImageSrc).not.toBe(initialImageSrc)

  // ── Delete the card via the UI ──────────────────────────────────────
  // Use the updated label to find the card
  const updatedCardContainer = updatedCardElement.locator('..')
  await updatedCardContainer.getByRole('button', { name: /card options/i }).click()

  // Click "Delete" in the dropdown menu
  await page.getByRole('button', { name: /delete card/i }).click()

  // Confirm deletion in the dialog (use exact match to avoid hitting "Delete Board")
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  // Verify the card is gone
  await expect(page.getByText(updatedCardLabel)).not.toBeVisible({ timeout: 5000 })

  // ── Delete the board via the API ────────────────────────────────────
  // Explicitly delete the board as part of the test verification
  const boardId = page.url().match(/\/board\/([^?]+)/)?.[1]
  if (boardId) {
    const response = await page.request.delete(`/api/boards/${boardId}`)
    // If deletion succeeded, clear the tracker so afterEach doesn't try again
    if (response.ok()) {
      createdBoardName = undefined
    }
  }
})
