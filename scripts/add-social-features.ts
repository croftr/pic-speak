/**
 * Migration Script: Add Social Features (Likes and Comments)
 *
 * This script creates board_likes and board_comments tables
 *
 * Usage:
 * 1. Make sure you have POSTGRES_URL in your .env.local
 * 2. Run: npx tsx scripts/add-social-features.ts
 */

import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrateDatabase() {
    console.log('🚀 Adding social features tables...\n');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();
    console.log('✅ Connected to database\n');

    try {
        // Create board_likes table
        console.log('⚙️  Creating board_likes table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS board_likes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                board_id TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, board_id)
            )
        `);
        await client.query('CREATE INDEX IF NOT EXISTS idx_board_likes_board_id ON board_likes(board_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_board_likes_user_id ON board_likes(user_id)');
        console.log('   ✅ board_likes table created\n');

        // Create board_comments table
        console.log('⚙️  Creating board_comments table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS board_comments (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                board_id TEXT NOT NULL,
                content TEXT NOT NULL,
                commenter_name TEXT NOT NULL,
                commenter_image_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_edited BOOLEAN DEFAULT FALSE
            )
        `);
        await client.query('CREATE INDEX IF NOT EXISTS idx_board_comments_board_id ON board_comments(board_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_board_comments_user_id ON board_comments(user_id)');
        console.log('   ✅ board_comments table created\n');

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
