import { Client } from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function addPublicBoardsColumn() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Add is_public column to boards table
        await client.query(`
            ALTER TABLE boards
            ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE
        `);
        console.log('✓ Added is_public column to boards table');

        // Create index for public boards queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_boards_is_public ON boards(is_public) WHERE is_public = true
        `);
        console.log('✓ Created index for public boards');

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await client.end();
    }
}

addPublicBoardsColumn();
