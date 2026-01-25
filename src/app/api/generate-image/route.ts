import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { auth } from '@clerk/nextjs/server';


export async function POST(request: Request) {
    console.log('Received request to generate image');
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log('User authenticated:', userId);
    try {
        const { prompt } = await request.json();

        console.log('Generating image for prompt:', prompt);

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            console.error('GOOGLE_API_KEY is not set');
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

        console.log('Enhanced PECS prompt:', pecsPrompt);

        // @ts-ignore
        const response = await client.models.generateImages({
            model: 'models/imagen-4.0-generate-001',
            prompt: pecsPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: "1:1"
            }
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("No image generated");
        }

        const image = response.generatedImages[0];

        if (!image.image) {
            throw new Error("No image data received");
        }

        const base64 = image.image.imageBytes;

        return NextResponse.json({
            image: `data:image/png;base64,${base64}`
        });

    } catch (error) {
        console.error('Error generating image:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
