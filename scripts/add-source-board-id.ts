import { Client } from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function addSourceBoardIdColumn() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Add source_board_id column to cards table
        await client.query(`
            ALTER TABLE cards
            ADD COLUMN IF NOT EXISTS source_board_id TEXT
        `);
        console.log('✓ Added source_board_id column to cards table');

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await client.end();
    }
}

addSourceBoardIdColumn();
