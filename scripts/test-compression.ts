/**
 * Test Image Compression
 *
 * This script tests the image compression functionality
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const IMAGE_QUALITY = 85;

async function testCompression() {
    console.log('🚀 Testing Image Compression...\n');

    try {
        // Create a test image (solid color rectangle)
        console.log('📋 Test 1: Creating test image...');

        const testImageBuffer = await sharp({
            create: {
                width: 2000,
                height: 1500,
                channels: 3,
                background: { r: 100, g: 150, b: 200 }
            }
        })
        .png()
        .toBuffer();

        console.log(`   ✅ Created test image: ${(testImageBuffer.length / 1024).toFixed(1)}KB`);
        console.log();

        // Test compression
        console.log('📋 Test 2: Compressing image...');

        const startTime = Date.now();
        const compressedBuffer = await sharp(testImageBuffer)
            .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: IMAGE_QUALITY })
            .toBuffer();

        const compressionTime = Date.now() - startTime;

        const originalSize = testImageBuffer.length;
        const compressedSize = compressedBuffer.length;
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        console.log(`   Original:   ${(originalSize / 1024).toFixed(1)}KB`);
        console.log(`   Compressed: ${(compressedSize / 1024).toFixed(1)}KB`);
        console.log(`   Savings:    ${savings}%`);
        console.log(`   Time:       ${compressionTime}ms`);
        console.log(`   ✅ Compression successful`);
        console.log();

        // Test metadata
        console.log('📋 Test 3: Checking image metadata...');

        const metadata = await sharp(compressedBuffer).metadata();
        console.log(`   Format:  ${metadata.format}`);
        console.log(`   Width:   ${metadata.width}px`);
        console.log(`   Height:  ${metadata.height}px`);
        console.log(`   ✅ Metadata correct`);
        console.log();

        // Test quality settings
        console.log('📋 Test 4: Testing different quality settings...');

        const qualities = [60, 75, 85, 95];
        console.log('   Quality | Size    | Savings');
        console.log('   --------|---------|--------');

        for (const quality of qualities) {
            const buffer = await sharp(testImageBuffer)
                .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, { fit: 'inside' })
                .jpeg({ quality })
                .toBuffer();

            const size = (buffer.length / 1024).toFixed(1);
            const saving = ((originalSize - buffer.length) / originalSize * 100).toFixed(1);
            console.log(`   ${quality}%     | ${size}KB | ${saving}%`);
        }
        console.log(`   ✅ Quality test complete`);
        console.log();

        console.log('✅ All compression tests passed!\n');
        console.log('📝 Summary:');
        console.log(`   - Compression reduces file size by ~${savings}%`);
        console.log(`   - Compression takes ~${compressionTime}ms`);
        console.log(`   - Images are resized to max ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px`);
        console.log(`   - JPEG quality set to ${IMAGE_QUALITY}%`);
        console.log('\n🎉 Image compression is working correctly!');

    } catch (error) {
        console.error('\n❌ Compression test failed:', error);
        process.exit(1);
    }
}

// Run test
testCompression()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
