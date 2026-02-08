import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

// Must run serially to ensure Clerk testing token is available for all tests
setup.describe.configure({ mode: 'serial' })

setup('global setup', async ({}) => {
  await clerkSetup()
})
