import { setupClerkTestingToken } from '@clerk/testing/playwright'
import type { Page } from '@playwright/test'

/**
 * The chromium project loads the signed-in storage state saved by
 * global.setup.ts, so individual tests never sign in themselves. This
 * installs the Clerk testing token on the page so navigations pass Clerk's
 * bot protection, letting clerk-js refresh the stored session normally.
 */
export async function useSignedInSession(page: Page) {
  await setupClerkTestingToken({ page })
}

/**
 * Best-effort deletion of a board by exact name via the API, for afterEach
 * cleanup when a test fails partway through.
 */
export async function deleteBoardByName(page: Page, name: string) {
  try {
    // Add timestamp to bypass potential caching
    const response = await page.request.get(`/api/boards?_=${Date.now()}`)
    if (response.ok()) {
      const boards = await response.json()
      const board = boards.find((b: { name: string }) => b.name === name)
      if (board) {
        console.log(`[Cleanup] Deleting board: ${name} (${board.id})`)
        await page.request.delete(`/api/boards/${board.id}`)
      }
    }
  } catch (error) {
    console.error('[Cleanup] Failed to clean up board:', error)
  }
}
