import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import { Pool } from 'pg'

// Must run serially to ensure Clerk testing token is available for all tests
setup.describe.configure({ mode: 'serial' })

setup('global setup', async ({}) => {
  await clerkSetup()

  // Ensure app_settings table exists
  if (process.env.POSTGRES_URL) {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }, // For Vercel/Neon
    });

    try {
      console.log('Ensuring app_settings table exists...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('app_settings table verified.');

      // Clean up orphaned test boards from previous failed runs
      const cleanup = await pool.query(
        `DELETE FROM boards WHERE name LIKE 'Mgmt Test Board%' OR name LIKE 'E2E Test Board%' OR name LIKE 'Interaction Test Board%' OR name LIKE 'Renamed Board%'`
      );
      if (cleanup.rowCount && cleanup.rowCount > 0) {
        console.log(`Cleaned up ${cleanup.rowCount} orphaned test board(s).`);
      }
    } catch (e) {
      console.error('Failed to ensure migrations:', e);
    } finally {
      await pool.end();
    }
  } else {
    console.log('Skipping migration check: POSTGRES_URL not set.');
  }
})
