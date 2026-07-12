import { test, expect } from '@playwright/test'
import { useSignedInSession, deleteBoardByName } from './helpers'

/**
 * API-level authorization tests. These run at the request level (no UI),
 * so they are fast and nearly flake-free — and they cover the class of
 * regression UI tests can never catch: endpoints that stop enforcing
 * ownership, because the UI simply never offers the button.
 *
 * Authenticated calls go through page.request (shares the signed-in
 * browser context's cookies, which clerk-js keeps fresh). Anonymous calls
 * use a separate request context with storageState explicitly emptied —
 * inside the test runner, playwright.request.newContext() inherits the
 * project's signed-in storage state unless overridden.
 */

const ANON = { storageState: { cookies: [], origins: [] } }

let createdBoardName: string | undefined

test.afterEach(async ({ page }) => {
  if (createdBoardName) {
    await deleteBoardByName(page, createdBoardName)
    createdBoardName = undefined
  }
})

test('unauthenticated requests to protected endpoints are rejected', async ({ playwright, baseURL }) => {
  const anon = await playwright.request.newContext({ baseURL: baseURL!, ...ANON })
  try {
    expect((await anon.get('/api/boards')).status()).toBe(401)
    expect((await anon.post('/api/boards', { data: { name: 'x' } })).status()).toBe(401)
    expect(
      (await anon.post('/api/cards', { data: { boardId: 'x', label: 'x', imageUrl: 'https://placehold.co/1' } })).status()
    ).toBe(401)
    expect(
      (await anon.put('/api/cards/reorder', { data: { boardId: 'x', cardOrders: [] } })).status()
    ).toBe(401)
    expect((await anon.delete('/api/boards/starter-template')).status()).toBe(401)
  } finally {
    await anon.dispose()
  }
})

test('a private board is not readable or writable without authentication', async ({ page, playwright, baseURL }) => {
  await useSignedInSession(page)
  // Load a page so clerk-js refreshes the stored session cookie before we
  // make authenticated API calls through this context.
  await page.goto('/my-boards')

  // Create a private board as the signed-in user
  createdBoardName = `API Security Test Board ${Date.now()}`
  const created = await page.request.post('/api/boards', { data: { name: createdBoardName } })
  expect(created.status()).toBe(201)
  const board = await created.json()

  const anon = await playwright.request.newContext({ baseURL: baseURL!, ...ANON })
  try {
    // Reads of a private board require ownership
    expect((await anon.get(`/api/boards/${board.id}`)).status()).toBe(403)
    expect((await anon.get(`/api/cards?boardId=${board.id}`)).status()).toBe(403)

    // Writes require authentication outright
    expect((await anon.put(`/api/boards/${board.id}`, { data: { name: 'hijacked' } })).status()).toBe(401)
    expect((await anon.delete(`/api/boards/${board.id}`)).status()).toBe(401)

    // And the board is untouched
    const check = await page.request.get(`/api/boards/${board.id}`)
    expect(check.status()).toBe(200)
    expect((await check.json()).name).toBe(createdBoardName)
  } finally {
    await anon.dispose()
  }

  // Cleanup
  const deleted = await page.request.delete(`/api/boards/${board.id}`)
  if (deleted.ok()) {
    createdBoardName = undefined
  }
})

test('the starter template cannot be modified or deleted, even signed in', async ({ page }) => {
  await useSignedInSession(page)
  await page.goto('/my-boards')

  expect(
    (await page.request.put('/api/boards/starter-template', { data: { name: 'defaced' } })).status()
  ).toBe(403)
  expect((await page.request.delete('/api/boards/starter-template')).status()).toBe(403)
  expect(
    (await page.request.post('/api/cards', {
      data: { boardId: 'starter-template', label: 'intruder', imageUrl: 'https://placehold.co/1' },
    })).status()
  ).toBe(403)
  expect(
    (await page.request.put('/api/cards/reorder', {
      data: { boardId: 'starter-template', cardOrders: [{ id: 'x', order: 0 }] },
    })).status()
  ).toBe(403)
})
