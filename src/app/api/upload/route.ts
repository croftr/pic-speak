import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { auth } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// 20 uploads per minute per user
const MAX_REQUESTS = 20;
const WINDOW_MS = 60_000;

// Maximum dimensions for communication board images (they don't need to be huge)
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

    // Create a child logger with request context
    const log = logger.withContext({ requestId, operation: 'upload' });

    log.info('Upload request started');

    const { userId } = await auth();
    if (!userId) {
        log.warn('Unauthorized upload attempt');
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Add userId to logger context
    const userLog = log.withContext({ userId });

    const limited = await rateLimit(userId, 'upload', MAX_REQUESTS, WINDOW_MS);
    if (limited) {
        userLog.warn('Rate limit exceeded');
        return limited;
    }

    try {
        const formDataStart = Date.now();
        const data = await request.formData();
        userLog.debug('FormData parsed', { duration_ms: Date.now() - formDataStart });

        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            userLog.warn('No file provided');
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        userLog.info('File received', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileSizeKB: (file.size / 1024).toFixed(2)
        });

        let fileToUpload: File | Buffer = file;
        let contentType = file.type;
        let fileName = file.name;

        // Compress images before uploading
        if (file.type.startsWith('image/')) {
            const compressionStart = Date.now();
            userLog.debug('Starting image compression');

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

                userLog.info('Image compressed', {
                    duration_ms: compressionTime,
                    originalSizeKB: (originalSize / 1024).toFixed(1),
                    compressedSizeKB: (compressedSize / 1024).toFixed(1),
                    savingsPercent: savings
                });
            } catch (compressionError) {
                userLog.error('Image compression failed, using original', compressionError, {
                    duration_ms: Date.now() - compressionStart
                });
                // If compression fails, upload the original
                fileToUpload = file;
            }
        }

        // Check audio file size
        if (file.type.startsWith('audio/')) {
            if (file.size > MAX_AUDIO_SIZE) {
                userLog.warn('Audio file too large', {
                    sizeBytes: file.size,
                    maxBytes: MAX_AUDIO_SIZE
                });
                return NextResponse.json({
                    success: false,
                    error: `Audio file too large. Maximum size is ${MAX_AUDIO_SIZE / 1024 / 1024}MB`
                }, { status: 400 });
            }
        }

        // Upload to Vercel Blob with timeout
        const blobUploadStart = Date.now();
        userLog.info('Starting Vercel Blob upload', { fileName });

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

        userLog.info('Blob upload successful', {
            url: blob.url,
            upload_duration_ms: blobUploadTime,
            total_duration_ms: totalTime
        });

        // Return the public URL
        return NextResponse.json({
            success: true,
            url: blob.url,
            type: contentType,
            size: fileToUpload instanceof Buffer ? fileToUpload.length : file.size
        });
    } catch (error) {
        const totalTime = Date.now() - startTime;
        userLog.error('Upload failed', error, { duration_ms: totalTime });

        return NextResponse.json({
            success: false,
            error: 'Upload failed'
        }, { status: 500 });
    }
}
