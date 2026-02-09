import { test } from '@playwright/test';
import { Pool } from 'pg';

test('run pending migrations', async () => {
  // Check if we are running in a CI environment or against a local dev server
  // that might not have migrations applied.
  // Note: This relies on POSTGRES_URL being available in the environment.
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
    } catch (e) {
      console.error('Failed to ensure migrations:', e);
    } finally {
      await pool.end();
    }
  } else {
    console.log('Skipping migration check: POSTGRES_URL not set.');
  }
});
