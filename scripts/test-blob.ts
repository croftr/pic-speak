/**
 * Test Vercel Blob Storage Connection
 *
 * This script tests the Vercel Blob storage by uploading and downloading test files
 */

import { put, del, list } from '@vercel/blob';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testBlobStorage() {
    console.log('🚀 Testing Vercel Blob storage...\n');

    try {
        // Test 1: Check if BLOB_READ_WRITE_TOKEN is set
        console.log('📋 Test 1: Checking environment variables...');
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            throw new Error('BLOB_READ_WRITE_TOKEN is not set in .env.local');
        }
        console.log('   ✅ BLOB_READ_WRITE_TOKEN is set\n');

        // Test 2: Upload a test file
        console.log('📋 Test 2: Uploading test file...');
        const testContent = 'Hello from Pic Speak! This is a test file.';
        const testFileName = `test-${Date.now()}.txt`;

        const blob = await put(testFileName, testContent, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        console.log('   ✅ File uploaded successfully');
        console.log('   URL:', blob.url);
        console.log('   Pathname:', blob.pathname);
        console.log();

        // Test 3: List files in blob storage
        console.log('📋 Test 3: Listing files in blob storage...');
        const { blobs } = await list({
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        console.log(`   ✅ Found ${blobs.length} file(s) in blob storage`);
        if (blobs.length > 0) {
            console.log('   Recent files:');
            blobs.slice(0, 5).forEach(b => {
                console.log(`   - ${b.pathname} (${b.size} bytes)`);
            });
        }
        console.log();

        // Test 4: Download the test file
        console.log('📋 Test 4: Downloading test file...');
        const response = await fetch(blob.url);
        const downloadedContent = await response.text();

        if (downloadedContent === testContent) {
            console.log('   ✅ File downloaded successfully');
            console.log('   Content matches original');
        } else {
            throw new Error('Downloaded content does not match original');
        }
        console.log();

        // Test 5: Delete the test file
        console.log('📋 Test 5: Deleting test file...');
        await del(blob.url, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        console.log('   ✅ Test file deleted\n');

        console.log('✅ All Blob storage tests passed!\n');
        console.log('🎉 Your Vercel Blob storage is working correctly!');
        console.log('\n📝 Next steps:');
        console.log('   1. Update your API routes to use Postgres instead of local storage');
        console.log('   2. Update file uploads to use Vercel Blob instead of local files');
        console.log('   3. Test the application end-to-end');

    } catch (error) {
        console.error('\n❌ Blob storage test failed:', error);
        process.exit(1);
    }
}

// Run test
testBlobStorage()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
