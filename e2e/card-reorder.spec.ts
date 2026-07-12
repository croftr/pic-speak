import { test, expect } from '@playwright/test'
import { useSignedInSession, deleteBoardByName } from './helpers'

/**
 * Card reordering regression test. Deliberately exercises the reorder API +
 * persistence + rendered order rather than simulating a dnd-kit drag —
 * synthetic drag events are one of the flakiest things an e2e suite can do,
 * and the regression that matters is "does the new order stick".
 */

let createdBoardName: string | undefined

test.afterEach(async ({ page }) => {
  if (createdBoardName) {
    await deleteBoardByName(page, createdBoardName)
    createdBoardName = undefined
  }
})

test('reordered cards persist and render in the new order', async ({ page }) => {
  test.setTimeout(60000)
  await useSignedInSession(page)
  // Load a page so clerk-js refreshes the stored session cookie before we
  // make authenticated API calls through this context.
  await page.goto('/my-boards')

  // ── Create a board and seed three cards via the API ────────────────
  createdBoardName = `Reorder Test Board ${Date.now()}`
  const boardRes = await page.request.post('/api/boards', { data: { name: createdBoardName } })
  expect(boardRes.status()).toBe(201)
  const board = await boardRes.json()

  const timestamp = Date.now()
  const labels = [`First ${timestamp}`, `Second ${timestamp}`, `Third ${timestamp}`]
  const cardIds: string[] = []
  for (const label of labels) {
    const res = await page.request.post('/api/cards', {
      data: {
        boardId: board.id,
        label,
        imageUrl: 'https://placehold.co/100',
        audioUrl: 'https://example.com/audio.mp3',
      },
    })
    expect(res.status()).toBe(201)
    cardIds.push((await res.json()).id)
  }

  // ── Reverse the order via the reorder API ───────────────────────────
  const reversedIds = [...cardIds].reverse()
  const reorderRes = await page.request.put('/api/cards/reorder', {
    data: {
      boardId: board.id,
      cardOrders: reversedIds.map((id, index) => ({ id, order: index })),
    },
  })
  expect(reorderRes.ok()).toBeTruthy()

  // ── The API returns cards in the new order ──────────────────────────
  const cardsRes = await page.request.get(`/api/cards?boardId=${board.id}&_=${Date.now()}`)
  expect(cardsRes.ok()).toBeTruthy()
  const cards = await cardsRes.json()
  expect(cards.map((c: { id: string }) => c.id)).toEqual(reversedIds)

  // ── The board page renders cards in the new order ───────────────────
  await page.goto(`/board/${board.id}`)
  const renderedLabels = page.getByTestId('communication-card').locator('h3')
  await expect(renderedLabels.first()).toBeVisible({ timeout: 10000 })
  await expect(renderedLabels).toHaveText([...labels].reverse())

  // ── Cleanup ──────────────────────────────────────────────────────────
  const deleted = await page.request.delete(`/api/boards/${board.id}`)
  if (deleted.ok()) {
    createdBoardName = undefined
  }
})
