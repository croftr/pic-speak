import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, checkDailyLimit, checkGlobalDailyLimit } from '@/lib/rate-limit';
import { validateStringLength } from '@/lib/validation';
import { logger } from '@/lib/logger';

// 5 image generations per minute per user
const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000;

// Daily caps
const MAX_PER_USER_PER_DAY = 20;
const MAX_GLOBAL_PER_DAY = 500;
const MAX_PROMPT_LENGTH = 500;

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

    const limited = await rateLimit(userId, 'generate-image', MAX_REQUESTS, WINDOW_MS);
    if (limited) {
        userLog.warn('Rate limit exceeded');
        return limited;
    }

    // Check daily per-user and global caps
    const dailyLimited = await checkDailyLimit(userId, 'generate-image', MAX_PER_USER_PER_DAY);
    if (dailyLimited) {
        userLog.warn('Daily user limit exceeded');
        return dailyLimited;
    }
    const globalLimited = await checkGlobalDailyLimit('generate-image', MAX_GLOBAL_PER_DAY);
    if (globalLimited) {
        userLog.warn('Global daily limit exceeded');
        return globalLimited;
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

        const promptError = validateStringLength(prompt, MAX_PROMPT_LENGTH, 'Prompt');
        if (promptError) {
            userLog.warn('Prompt too long', { length: prompt.length });
            return NextResponse.json({ error: promptError }, { status: 400 });
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

        // Wrap user prompt with communication board-appropriate instructions
        const imagePrompt = `Create a simple, clear cartoon-style illustration suitable for a communication board card for children. The image should be:
- Simple and easy to understand at a glance
- Cartoon or clipart style (not realistic or photographic)
- Bold, clear outlines
- Bright, friendly colors
- Single subject on a clean, simple background
- No text or words in the image

Subject to illustrate: ${prompt}`;

        userLog.debug('Enhanced prompt created', { imagePrompt });

        const genStart = Date.now();

        const response = await client.models.generateContent({
            model: 'models/gemini-3.1-flash-image',
            contents: imagePrompt,
            config: {
                responseModalities: ['IMAGE']
            }
        });

        const genTime = Date.now() - genStart;

        const candidate = response.candidates?.[0];
        const part = candidate?.content?.parts?.find(p => p.inlineData);
        if (!part || !part.inlineData || !part.inlineData.data) {
            throw new Error("No image data received from Gemini");
        }

        const base64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/jpeg';

        userLog.info('Image generated successfully', {
            duration_ms: genTime,
            total_duration_ms: Date.now() - startTime
        });

        return NextResponse.json({
            image: `data:${mimeType};base64,${base64}`
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
