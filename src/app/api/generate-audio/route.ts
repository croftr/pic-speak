import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// 10 TTS generations per minute per user
const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000;

// Maximum text length for TTS (PECS labels should be short)
const MAX_TEXT_LENGTH = 200;

// Upload timeout (25 seconds - less than Vercel's 30s function timeout)
const UPLOAD_TIMEOUT_MS = 25000;

// Create TTS client with credentials from environment
function getTTSClient(): TextToSpeechClient {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
    const privateKeyBase64 = process.env.GOOGLE_CLOUD_PRIVATE_KEY_BASE64;

    if (!projectId || !clientEmail || (!privateKey && !privateKeyBase64)) {
        throw new Error('Google Cloud TTS credentials not configured');
    }

    // Support base64-encoded private key (recommended for Vercel)
    if (privateKeyBase64) {
        privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    } else if (privateKey) {
        // Handle different formats of the private key:
        // 1. If wrapped in quotes, remove them
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        // 2. Replace escaped newlines with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    return new TextToSpeechClient({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey!,
        },
        projectId,
    });
}

export async function POST(request: Request) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = logger.withContext({ requestId, operation: 'generate_audio' });

    log.info('TTS request started');

    const { userId } = await auth();
    if (!userId) {
        log.warn('Unauthorized TTS attempt');
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userLog = log.withContext({ userId });

    const limited = rateLimit(userId, 'generate-audio', MAX_REQUESTS, WINDOW_MS);
    if (limited) {
        userLog.warn('Rate limit exceeded');
        return limited;
    }

    try {
        const { text, languageCode = 'en-US', voiceName } = await request.json();

        if (!text || typeof text !== 'string') {
            userLog.warn('Invalid text input');
            return NextResponse.json(
                { success: false, error: 'Text is required' },
                { status: 400 }
            );
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            userLog.warn('Empty text input');
            return NextResponse.json(
                { success: false, error: 'Text cannot be empty' },
                { status: 400 }
            );
        }

        if (trimmedText.length > MAX_TEXT_LENGTH) {
            userLog.warn('Text too long', { length: trimmedText.length, max: MAX_TEXT_LENGTH });
            return NextResponse.json(
                { success: false, error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.` },
                { status: 400 }
            );
        }

        // Select voice - use Neural2 for high quality
        // Default to a pleasant female voice suitable for children
        const selectedVoice = voiceName || 'en-US-Neural2-C';

        userLog.info('Generating audio', {
            textLength: trimmedText.length,
            textSnippet: trimmedText.slice(0, 20),
            voice: selectedVoice,
            language: languageCode
        });

        // Get TTS client
        const client = getTTSClient();

        // Generate speech
        const ttsStart = Date.now();
        const [response] = await client.synthesizeSpeech({
            input: { text: trimmedText },
            voice: {
                languageCode: languageCode,
                name: selectedVoice,
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.9, // Slightly slower for clarity (good for children)
                pitch: 0.0, // Normal pitch
            },
        });

        const ttsTime = Date.now() - ttsStart;

        if (!response.audioContent) {
            throw new Error('No audio content received from TTS');
        }

        // Convert to Buffer
        const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

        userLog.info('TTS generated successfully', {
            duration_ms: ttsTime,
            sizeBytes: audioBuffer.length,
            sizeKB: (audioBuffer.length / 1024).toFixed(2)
        });

        // Upload to Vercel Blob
        const fileName = `tts-${Date.now()}.mp3`;
        const blobUploadStart = Date.now();
        userLog.info('Uploading audio to Blob', { fileName });

        const blob = await Promise.race([
            put(fileName, audioBuffer, {
                access: 'public',
                addRandomSuffix: true,
                contentType: 'audio/mpeg',
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Blob upload timeout')), UPLOAD_TIMEOUT_MS)
            )
        ]);

        const blobUploadTime = Date.now() - blobUploadStart;
        const totalTime = Date.now() - startTime;

        userLog.info('Audio generation complete', {
            url: blob.url,
            upload_duration_ms: blobUploadTime,
            total_duration_ms: totalTime
        });

        return NextResponse.json({
            success: true,
            url: blob.url,
            text: trimmedText,
            voice: selectedVoice,
        });

    } catch (error) {
        const totalTime = Date.now() - startTime;
        userLog.error('TTS generation failed', error, { duration_ms: totalTime });

        // Check for specific error types
        if (error instanceof Error) {
            if (error.message.includes('credentials')) {
                return NextResponse.json(
                    { success: false, error: 'TTS service not configured' },
                    { status: 503 }
                );
            }
            if (error.message.includes('quota') || error.message.includes('QUOTA')) {
                return NextResponse.json(
                    { success: false, error: 'TTS quota exceeded' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { success: false, error: 'Failed to generate audio' },
            { status: 500 }
        );
    }
}
