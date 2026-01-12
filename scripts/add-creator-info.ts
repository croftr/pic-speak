/**
 * Migration Script: Add Creator Info to Boards
 *
 * This script adds creator_name and creator_image_url columns to boards table
 *
 * Usage:
 * 1. Make sure you have POSTGRES_URL in your .env.local
 * 2. Run: npm run tsx scripts/add-creator-info.ts
 */

import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrateDatabase() {
    console.log('🚀 Adding creator info columns to boards table...\n');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();
    console.log('✅ Connected to database\n');

    try {
        // Add creator_name column
        console.log('⚙️  Adding creator_name column...');
        try {
            await client.query('ALTER TABLE boards ADD COLUMN IF NOT EXISTS creator_name TEXT');
            console.log('   ✅ creator_name column added\n');
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                console.log('   ⚠️  creator_name column already exists (skipping)\n');
            } else {
                throw error;
            }
        }

        // Add creator_image_url column
        console.log('⚙️  Adding creator_image_url column...');
        try {
            await client.query('ALTER TABLE boards ADD COLUMN IF NOT EXISTS creator_image_url TEXT');
            console.log('   ✅ creator_image_url column added\n');
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                console.log('   ⚠️  creator_image_url column already exists (skipping)\n');
            } else {
                throw error;
            }
        }

        // Add is_public column if it doesn't exist
        console.log('⚙️  Ensuring is_public column exists...');
        try {
            await client.query('ALTER TABLE boards ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false');
            console.log('   ✅ is_public column ensured\n');
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                console.log('   ⚠️  is_public column already exists (skipping)\n');
            } else {
                throw error;
            }
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
