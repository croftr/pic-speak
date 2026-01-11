import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { prompt } = await request.json();

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

        // @ts-ignore
        const response = await client.models.generateImages({
            model: 'models/imagen-4.0-generate-001',
            prompt,
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
