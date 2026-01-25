import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Maximum text length for TTS (PECS labels should be short)
const MAX_TEXT_LENGTH = 200;

// Upload timeout (25 seconds - less than Vercel's 30s function timeout)
const UPLOAD_TIMEOUT_MS = 25000;

// Create TTS client with credentials from environment
function getTTSClient(): TextToSpeechClient {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Google Cloud TTS credentials not configured');
    }

    return new TextToSpeechClient({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        projectId,
    });
}

export async function POST(request: Request) {
    const requestId = crypto.randomUUID().slice(0, 8);
    console.log(`[TTS-${requestId}] Started at ${new Date().toISOString()}`);

    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log(`[TTS-${requestId}] User authenticated: ${userId}`);

    try {
        const { text, languageCode = 'en-US', voiceName } = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Text is required' },
                { status: 400 }
            );
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Text cannot be empty' },
                { status: 400 }
            );
        }

        if (trimmedText.length > MAX_TEXT_LENGTH) {
            return NextResponse.json(
                { success: false, error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.` },
                { status: 400 }
            );
        }

        console.log(`[TTS-${requestId}] Generating audio for: "${trimmedText}" (${trimmedText.length} chars)`);

        // Get TTS client
        const client = getTTSClient();

        // Select voice - use Neural2 for high quality
        // Default to a pleasant female voice suitable for children
        const selectedVoice = voiceName || 'en-US-Neural2-C';

        console.log(`[TTS-${requestId}] Using voice: ${selectedVoice}, language: ${languageCode}`);

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
        console.log(`[TTS-${requestId}] TTS generated in ${ttsTime}ms`);

        if (!response.audioContent) {
            throw new Error('No audio content received from TTS');
        }

        // Convert to Buffer
        const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
        console.log(`[TTS-${requestId}] Audio size: ${(audioBuffer.length / 1024).toFixed(2)}KB`);

        // Upload to Vercel Blob
        const fileName = `tts-${Date.now()}.mp3`;
        const blobUploadStart = Date.now();
        console.log(`[TTS-${requestId}] Uploading to Vercel Blob...`);

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
        const totalTime = Date.now() - ttsStart;

        console.log(`[TTS-${requestId}] SUCCESS! Blob uploaded in ${blobUploadTime}ms (total: ${totalTime}ms)`);
        console.log(`[TTS-${requestId}] URL: ${blob.url}`);

        return NextResponse.json({
            success: true,
            url: blob.url,
            text: trimmedText,
            voice: selectedVoice,
        });

    } catch (error) {
        console.error(`[TTS-${requestId}] FAILED:`, error);
        console.error(`[TTS-${requestId}] Error details:`, {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
        });

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
