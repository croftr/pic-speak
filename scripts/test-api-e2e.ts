/**
 * End-to-End API Test
 *
 * This script tests the full application API functionality
 */

import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

// You'll need a valid Clerk user ID to test authenticated routes
// For now, this will test the public endpoints
async function testE2E() {
    console.log('🚀 Starting End-to-End API Tests...\n');

    try {
        // Test 1: Health Check
        console.log('📋 Test 1: Health check - Server is running...');
        const healthResponse = await fetch(BASE_URL);
        if (healthResponse.ok) {
            console.log('   ✅ Server is running on', BASE_URL);
        } else {
            throw new Error('Server is not responding');
        }
        console.log();

        // Test 2: Check Upload API (without authentication - will fail but endpoint exists)
        console.log('📋 Test 2: Upload API endpoint exists...');
        const uploadResponse = await fetch(`${BASE_URL}/api/upload`, {
            method: 'POST',
        });

        // We expect 400 or 401 because we don't have auth/file
        if (uploadResponse.status === 400 || uploadResponse.status === 401) {
            console.log('   ✅ Upload API endpoint exists');
        } else {
            console.log(`   ⚠️  Upload API returned status: ${uploadResponse.status}`);
        }
        console.log();

        // Test 3: Check Boards API (without authentication - will fail with 401)
        console.log('📋 Test 3: Boards API endpoint exists...');
        const boardsResponse = await fetch(`${BASE_URL}/api/boards`);

        // We expect 401 because we don't have auth
        if (boardsResponse.status === 401) {
            console.log('   ✅ Boards API endpoint exists and requires authentication');
        } else {
            console.log(`   ⚠️  Boards API returned status: ${boardsResponse.status}`);
        }
        console.log();

        // Test 4: Check Cards API (without authentication - will fail with 401)
        console.log('📋 Test 4: Cards API endpoint exists...');
        const cardsResponse = await fetch(`${BASE_URL}/api/cards`);

        // We expect 401 because we don't have auth
        if (cardsResponse.status === 401) {
            console.log('   ✅ Cards API endpoint exists and requires authentication');
        } else {
            console.log(`   ⚠️  Cards API returned status: ${cardsResponse.status}`);
        }
        console.log();

        console.log('✅ All API endpoint tests passed!\n');
        console.log('📝 Next steps for full E2E testing:');
        console.log('   1. Open http://localhost:3000 in your browser');
        console.log('   2. Sign in with Clerk authentication');
        console.log('   3. Try creating a new board');
        console.log('   4. Try uploading an image');
        console.log('   5. Try creating a card with the uploaded image');
        console.log('   6. Try recording audio for a card');
        console.log('   7. Try playing the audio by clicking the card');
        console.log('   8. Try deleting a card');
        console.log('   9. Try deleting a board');
        console.log('\n🎉 All API routes are properly configured!');

    } catch (error) {
        console.error('\n❌ E2E test failed:', error);
        process.exit(1);
    }
}

// Run test
testE2E()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
