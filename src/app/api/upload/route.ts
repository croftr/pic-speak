import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { auth } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rate-limit';

// 20 uploads per minute per user
const MAX_REQUESTS = 20;
const WINDOW_MS = 60_000;

// Maximum dimensions for PECS images (they don't need to be huge)
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const IMAGE_QUALITY = 85; // Good quality with smaller file size

// Maximum audio file size (5MB)
const MAX_AUDIO_SIZE = 5 * 1024 * 1024;

// Upload timeout (25 seconds - less than Vercel's 30s function timeout)
const UPLOAD_TIMEOUT_MS = 25000;

export async function POST(request: Request) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);

    console.log(`[Upload-${requestId}] Started at ${new Date().toISOString()}`);

    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const limited = rateLimit(userId, 'upload', MAX_REQUESTS, WINDOW_MS);
    if (limited) return limited;

    try {
        const formDataStart = Date.now();
        const data = await request.formData();
        console.log(`[Upload-${requestId}] FormData parsed in ${Date.now() - formDataStart}ms`);

        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            console.log(`[Upload-${requestId}] FAILED: No file provided`);
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`[Upload-${requestId}] File received: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);

        let fileToUpload: File | Buffer = file;
        let contentType = file.type;
        let fileName = file.name;

        // Compress images before uploading
        if (file.type.startsWith('image/')) {
            const compressionStart = Date.now();
            console.log(`[Upload-${requestId}] Starting image compression...`);

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
                const compressionTime = Date.now() - compressionStart;

                console.log(`[Upload-${requestId}] Image compressed in ${compressionTime}ms: ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedSize / 1024).toFixed(1)}KB (${savings}% reduction)`);
            } catch (compressionError) {
                console.error(`[Upload-${requestId}] Image compression FAILED after ${Date.now() - compressionStart}ms:`, compressionError);
                // If compression fails, upload the original
                fileToUpload = file;
            }
        }

        // Check audio file size
        if (file.type.startsWith('audio/')) {
            console.log(`[Upload-${requestId}] Audio file detected: ${(file.size / 1024).toFixed(2)}KB`);
            if (file.size > MAX_AUDIO_SIZE) {
                console.log(`[Upload-${requestId}] FAILED: Audio file too large (${(file.size / 1024 / 1024).toFixed(2)}MB > ${MAX_AUDIO_SIZE / 1024 / 1024}MB)`);
                return NextResponse.json({
                    success: false,
                    error: `Audio file too large. Maximum size is ${MAX_AUDIO_SIZE / 1024 / 1024}MB`
                }, { status: 400 });
            }
        }

        // Upload to Vercel Blob with timeout
        const blobUploadStart = Date.now();
        console.log(`[Upload-${requestId}] Starting Vercel Blob upload for ${fileName}...`);

        const blob = await Promise.race([
            put(fileName, fileToUpload, {
                access: 'public',
                addRandomSuffix: true,
                contentType: contentType,
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Blob upload timeout')), UPLOAD_TIMEOUT_MS)
            )
        ]);

        const blobUploadTime = Date.now() - blobUploadStart;
        const totalTime = Date.now() - startTime;

        console.log(`[Upload-${requestId}] SUCCESS! Blob uploaded in ${blobUploadTime}ms (total: ${totalTime}ms)`);
        console.log(`[Upload-${requestId}] Blob URL: ${blob.url}`);

        // Return the public URL
        return NextResponse.json({
            success: true,
            url: blob.url,
            type: contentType,
            size: fileToUpload instanceof Buffer ? fileToUpload.length : file.size
        });
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[Upload-${requestId}] FAILED after ${totalTime}ms:`, error);
        console.error(`[Upload-${requestId}] Error details:`, {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json({
            success: false,
            error: 'Upload failed'
        }, { status: 500 });
    }
}
