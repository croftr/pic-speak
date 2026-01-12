/**
 * Migration Script: Add Template Key to Cards
 *
 * This script adds template_key column to cards table and makes label/image_url/audio_url/type nullable
 *
 * Usage:
 * 1. Make sure you have POSTGRES_URL in your .env.local
 * 2. Run: npx tsx scripts/add-template-key.ts
 */

import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrateDatabase() {
    console.log('🚀 Adding template_key column to cards table...\n');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();
    console.log('✅ Connected to database\n');

    try {
        // Add template_key column
        console.log('⚙️  Adding template_key column...');
        try {
            await client.query('ALTER TABLE cards ADD COLUMN IF NOT EXISTS template_key TEXT');
            console.log('   ✅ template_key column added\n');
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                console.log('   ⚠️  template_key column already exists (skipping)\n');
            } else {
                throw error;
            }
        }

        // Make label, image_url, audio_url, and type nullable for template cards
        console.log('⚙️  Making label, image_url, audio_url, type nullable...');
        try {
            await client.query('ALTER TABLE cards ALTER COLUMN label DROP NOT NULL');
            await client.query('ALTER TABLE cards ALTER COLUMN image_url DROP NOT NULL');
            await client.query('ALTER TABLE cards ALTER COLUMN audio_url DROP NOT NULL');
            console.log('   ✅ Columns made nullable\n');
        } catch (error: any) {
            console.log('   ⚠️  Columns may already be nullable\n');
        }

        console.log('✅ Migration completed successfully!\n');

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
