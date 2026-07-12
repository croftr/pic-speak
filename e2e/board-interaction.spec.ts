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

test('can search, filter, and interact with cards', async ({ page }) => {
  test.setTimeout(90000)

  // Mock Audio to simulate playback and verify visual feedback deterministically
  await page.addInitScript(() => {
    window.Audio = class {
      volume = 1;
      currentTime = 0;
      onended = () => {};
      constructor() {}
      play() {
        // Simulate playback duration of 500ms
        setTimeout(() => {
             if(this.onended) this.onended();
        }, 500);
        return Promise.resolve();
      }
      pause() {}
    } as unknown as typeof Audio;
  });

  await useSignedInSession(page)

  await page.goto('/my-boards')
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })

  // ── Create a new board ──────────────────────────────────────────────
  await page.getByRole('button', { name: /new board/i }).click()
  createdBoardName = `Interaction Test Board ${Date.now()}`
  await page.getByPlaceholder(/routine/i).fill(createdBoardName)
  await page.locator('form').getByRole('button', { name: /create board/i }).click()

  // Wait for redirect to edit mode
  await expect(page).toHaveURL(/\/board\/.*\?edit=true/, { timeout: 10000 })

  // Get Board ID from URL
  const boardId = page.url().match(/\/board\/([^?]+)/)?.[1]
  if (!boardId) throw new Error('Could not get board ID from URL')

  // ── Seed Cards via API ──────────────────────────────────────────────
  // Use unique labels to avoid conflicts if test re-runs quickly (though board is unique)
  const timestamp = Date.now()
  const cardsToCreate = [
      { label: `Apple ${timestamp}`, category: 'Food' },
      { label: `Banana ${timestamp}`, category: 'Food' },
      { label: `Carrot ${timestamp}`, category: 'Food' },
      { label: `Dog ${timestamp}`, category: 'Animals' },
      { label: `Cat ${timestamp}`, category: 'Animals' },
      { label: `Fish ${timestamp}`, category: 'Animals' },
      { label: `Hello ${timestamp}`, category: 'Greetings' },
  ]

  for (const card of cardsToCreate) {
      const response = await page.request.post('/api/cards', {
          data: {
              boardId,
              label: card.label,
              category: card.category,
              imageUrl: 'https://placehold.co/100', // Dummy image
              audioUrl: 'https://example.com/audio.mp3', // Dummy audio URL required for interaction
          }
      })
      expect(response.ok()).toBeTruthy()
  }

  // Reload page to fetch seeded cards
  await page.reload()

  // Ensure we are in edit mode to see search/filter
  if (!page.url().includes('edit=true')) {
      await page.goto(`/board/${boardId}?edit=true`)
  }

  // ── Test Search Functionality ────────────────────────────────────────
  // Verify search input is visible (requires > 6 cards)
  const searchInput = page.getByPlaceholder('Search cards...')

  // Wait for cards to load first
  await expect(page.getByText(`Hello ${timestamp}`)).toBeVisible({ timeout: 10000 })

  // Now verify search input
  await expect(searchInput).toBeVisible()

  // Type "Apple"
  await searchInput.fill('Apple')
  await expect(page.getByText(`Apple ${timestamp}`)).toBeVisible()
  await expect(page.getByText(`Banana ${timestamp}`)).not.toBeVisible()

  // Clear search
  await page.getByRole('button', { name: /clear search/i }).click()
  await expect(page.getByText(`Banana ${timestamp}`)).toBeVisible()

  // ── Test Category Filtering ──────────────────────────────────────────
  // Click "Food" category
  // Use regex for category name as it might have emoji or count
  await page.getByRole('button', { name: /Food/i }).click()
  await expect(page.getByText(`Apple ${timestamp}`)).toBeVisible()
  await expect(page.getByText(`Dog ${timestamp}`)).not.toBeVisible()

  // Click "Animals" category
  await page.getByRole('button', { name: /Animals/i }).click()
  await expect(page.getByText(`Dog ${timestamp}`)).toBeVisible()
  await expect(page.getByText(`Apple ${timestamp}`)).not.toBeVisible()

  // Click "All" category
  await page.getByRole('button', { name: /All/i }).click()
  await expect(page.getByText(`Apple ${timestamp}`)).toBeVisible()
  await expect(page.getByText(`Dog ${timestamp}`)).toBeVisible()

  // ── Test Card Interaction (Click to Speak) ───────────────────────────
  // Exit edit mode
  await page.getByTitle('Done Editing').click()

  // Verify we are in view mode
  await expect(searchInput).not.toBeVisible()

  // Click "Apple" card
  const appleCardButton = page.getByRole('button', { name: `Apple ${timestamp}` })
  await appleCardButton.click()

  // The card exposes its playback state via data-playing (styling-independent).
  // Our mocked Audio "plays" for 500ms, so the state flips on then back off.
  await expect(appleCardButton).toHaveAttribute('data-playing', 'true', { timeout: 2000 })
  await expect(appleCardButton).toHaveAttribute('data-playing', 'false', { timeout: 3000 })
})
