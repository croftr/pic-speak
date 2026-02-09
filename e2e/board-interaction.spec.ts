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

test('can search, filter, and interact with cards', async ({ page }) => {
  test.setTimeout(90000)

  // Mock Audio to simulate playback and verify visual feedback deterministically
  await page.addInitScript(() => {
    window.Audio = class {
      volume = 1;
      currentTime = 0;
      onended = () => {};
      constructor(src: string) {}
      play() {
        // Simulate playback duration of 500ms
        setTimeout(() => {
             if(this.onended) this.onended();
        }, 500);
        return Promise.resolve();
      }
      pause() {}
    } as any;
  });

  await signIn(page)

  await page.goto('/my-boards')
  await expect(page.getByRole('heading', { name: /my boards/i })).toBeVisible({ timeout: 10000 })

  // ── Create a new board ──────────────────────────────────────────────
  await page.getByRole('button', { name: /new board/i }).click()
  createdBoardName = `Interaction Test Board ${Date.now()}`
  await page.getByPlaceholder('e.g., Daily Routine').fill(createdBoardName)
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
  await expect(searchInput).toBeVisible()

  // Type "Apple"
  await searchInput.fill('Apple')
  await expect(page.getByText(`Apple ${timestamp}`)).toBeVisible()
  await expect(page.getByText(`Banana ${timestamp}`)).not.toBeVisible()

  // Clear search
  await page.getByRole('button', { name: /clear search/i }).click() // Wait, check if clear button exists in BoardFilter
  // Actually, BoardFilter has:
  // {searchTerm && (<button onClick={() => setSearchTerm('')} ...><X .../></button>)}
  // The aria-label is "Clear search".

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

  // We expect the button to gain the 'border-accent' class or 'ring-accent/30' when playing
  // Trigger click
  await appleCardButton.click()

  // Since we mocked Audio to play for 500ms, we check immediately for the playing state
  // Using toHaveClass or checking CSS attribute
  // The component logic: isPlaying ? "border-accent ring-2 sm:ring-4 ring-accent/30 scale-105" : ...
  // Let's check for 'border-accent'
  await expect(appleCardButton).toHaveClass(/border-accent/, { timeout: 2000 })

  // Wait for playback to end (500ms + buffer)
  await page.waitForTimeout(600)

  // Verify it returned to normal (no border-accent)
  await expect(appleCardButton).not.toHaveClass(/border-accent/)
})
