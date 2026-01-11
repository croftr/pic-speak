import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

// Maximum dimensions for PECS images (they don't need to be huge)
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const IMAGE_QUALITY = 85; // Good quality with smaller file size

// Maximum audio file size (5MB)
const MAX_AUDIO_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        let fileToUpload: File | Buffer = file;
        let contentType = file.type;
        let fileName = file.name;

        // Compress images before uploading
        if (file.type.startsWith('image/')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Compress and resize image
                const compressedBuffer = await sharp(buffer)
                    .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
                        fit: 'inside',
                        withoutEnlargement: true // Don't enlarge smaller images
                    })
                    .jpeg({ quality: IMAGE_QUALITY }) // Convert to JPEG for better compression
                    .toBuffer();

                fileToUpload = compressedBuffer;
                contentType = 'image/jpeg';

                // Update filename to .jpg
                fileName = fileName.replace(/\.[^/.]+$/, '.jpg');

                const originalSize = buffer.length;
                const compressedSize = compressedBuffer.length;
                const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

                console.log(`Image compressed: ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedSize / 1024).toFixed(1)}KB (${savings}% reduction)`);
            } catch (compressionError) {
                console.error('Image compression failed, uploading original:', compressionError);
                // If compression fails, upload the original
                fileToUpload = file;
            }
        }

        // Check audio file size
        if (file.type.startsWith('audio/')) {
            if (file.size > MAX_AUDIO_SIZE) {
                return NextResponse.json({
                    success: false,
                    error: `Audio file too large. Maximum size is ${MAX_AUDIO_SIZE / 1024 / 1024}MB`
                }, { status: 400 });
            }
        }

        // Upload to Vercel Blob
        const blob = await put(fileName, fileToUpload, {
            access: 'public',
            addRandomSuffix: true,
            contentType: contentType,
        });

        // Return the public URL
        return NextResponse.json({
            success: true,
            url: blob.url,
            type: contentType,
            size: fileToUpload instanceof Buffer ? fileToUpload.length : file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            success: false,
            error: 'Upload failed'
        }, { status: 500 });
    }
}
