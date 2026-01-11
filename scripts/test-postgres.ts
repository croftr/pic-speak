/**
 * Test Postgres Connection
 *
 * This script tests the Postgres connection by inserting and querying test data
 */

import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testPostgres() {
    console.log('🚀 Testing Postgres connection...\n');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Postgres database\n');

        // Test 1: Check if tables exist
        console.log('📋 Test 1: Checking if tables exist...');
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('   Tables found:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        console.log();

        // Test 2: Insert a test board
        console.log('📋 Test 2: Inserting test board...');
        const testBoardId = 'test-board-' + Date.now();
        await client.query(`
            INSERT INTO boards (id, user_id, name, description)
            VALUES ($1, $2, $3, $4)
        `, [testBoardId, 'test-user', 'Test Board', 'This is a test board']);
        console.log('   ✅ Test board inserted\n');

        // Test 3: Query the test board
        console.log('📋 Test 3: Querying test board...');
        const boardResult = await client.query(`
            SELECT * FROM boards WHERE id = $1
        `, [testBoardId]);

        if (boardResult.rows.length > 0) {
            console.log('   ✅ Board retrieved successfully:');
            console.log('   ', JSON.stringify(boardResult.rows[0], null, 2));
        }
        console.log();

        // Test 4: Insert a test card
        console.log('📋 Test 4: Inserting test card...');
        const testCardId = 'test-card-' + Date.now();
        await client.query(`
            INSERT INTO cards (id, board_id, label, image_url, audio_url, color)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [testCardId, testBoardId, 'Test Card', 'https://example.com/image.jpg', 'https://example.com/audio.mp3', '#FF5733']);
        console.log('   ✅ Test card inserted\n');

        // Test 5: Query cards for the board
        console.log('📋 Test 5: Querying cards for board...');
        const cardsResult = await client.query(`
            SELECT * FROM cards WHERE board_id = $1
        `, [testBoardId]);

        if (cardsResult.rows.length > 0) {
            console.log('   ✅ Cards retrieved successfully:');
            console.log('   ', JSON.stringify(cardsResult.rows, null, 2));
        }
        console.log();

        // Test 6: Clean up test data
        console.log('📋 Test 6: Cleaning up test data...');
        await client.query('DELETE FROM cards WHERE id = $1', [testCardId]);
        await client.query('DELETE FROM boards WHERE id = $1', [testBoardId]);
        console.log('   ✅ Test data cleaned up\n');

        console.log('✅ All Postgres tests passed!\n');
        console.log('🎉 Your Postgres database is working correctly!');

    } catch (error) {
        console.error('\n❌ Postgres test failed:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n👋 Disconnected from database');
    }
}

// Run test
testPostgres()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
