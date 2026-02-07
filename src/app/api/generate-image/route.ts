import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { auth } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// 5 image generations per minute per user
const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000;

export async function POST(request: Request) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = logger.withContext({ requestId, operation: 'generate_image' });

    log.info('Image generation request started');

    const { userId } = await auth();
    if (!userId) {
        log.warn('Unauthorized image generation attempt');
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userLog = log.withContext({ userId });

    const limited = rateLimit(userId, 'generate-image', MAX_REQUESTS, WINDOW_MS);
    if (limited) {
        userLog.warn('Rate limit exceeded');
        return limited;
    }

    try {
        const { prompt } = await request.json();

        if (!prompt) {
            userLog.warn('Prompt is required');
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        userLog.info('Generating image', { prompt });

        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            userLog.error('GOOGLE_API_KEY is not set');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const client = new GoogleGenAI({ apiKey });

        // Wrap user prompt with PECS-appropriate instructions
        const pecsPrompt = `Create a simple, clear cartoon-style illustration suitable for a PECS (Picture Exchange Communication System) card for children. The image should be:
- Simple and easy to understand at a glance
- Cartoon or clipart style (not realistic or photographic)
- Bold, clear outlines
- Bright, friendly colors
- Single subject on a clean, simple background
- No text or words in the image

Subject to illustrate: ${prompt}`;

        userLog.debug('Enhanced prompt created', { pecsPrompt });

        const genStart = Date.now();

        const response = await client.models.generateImages({
            model: 'models/imagen-4.0-generate-001',
            prompt: pecsPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: "1:1"
            }
        });

        const genTime = Date.now() - genStart;

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("No image generated");
        }

        const image = response.generatedImages[0];

        if (!image.image) {
            throw new Error("No image data received");
        }

        const base64 = image.image.imageBytes;

        userLog.info('Image generated successfully', {
            duration_ms: genTime,
            total_duration_ms: Date.now() - startTime
        });

        return NextResponse.json({
            image: `data:image/png;base64,${base64}`
        });

    } catch (error) {
        userLog.error('Error generating image', error, {
            duration_ms: Date.now() - startTime
        });
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
