/**
 * Migration Script: Add owner_email column to boards table
 *
 * This allows sending email notifications when someone likes/comments on a public board
 *
 * Usage:
 * 1. Make sure you have POSTGRES_URL in your .env.local
 * 2. Run: npx tsx scripts/add-owner-email.ts
 */

import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrateDatabase() {
    console.log('🚀 Adding owner_email column to boards table...\n');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();
    console.log('✅ Connected to database\n');

    try {
        // Add owner_email column
        console.log('⚙️  Adding owner_email column...');
        await client.query(`
            ALTER TABLE boards
            ADD COLUMN IF NOT EXISTS owner_email TEXT
        `);
        console.log('   ✅ owner_email column added\n');

        // Add email_notifications_enabled column (allows users to opt-out)
        console.log('⚙️  Adding email_notifications_enabled column...');
        await client.query(`
            ALTER TABLE boards
            ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE
        `);
        console.log('   ✅ email_notifications_enabled column added\n');

        console.log('✅ Migration completed successfully!\n');
        console.log('📝 Next steps:');
        console.log('   1. Set RESEND_API_KEY in your .env.local');
        console.log('   2. Set RESEND_FROM_EMAIL in your .env.local (e.g., notifications@yourdomain.com)');
        console.log('   3. When users make boards public, their email will be stored for notifications');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        await client.end();
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run migration
migrateDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
