import { NextResponse } from 'next/server';
import { getCards, addCard } from '@/lib/storage';
import { Card } from '@/types';

export async function GET() {
    const cards = await getCards();
    return NextResponse.json(cards);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { label, imageUrl, audioUrl, color } = body;

        if (!imageUrl || !audioUrl) {
            return NextResponse.json(
                { error: 'Image and Audio are required' },
                { status: 400 }
            );
        }

        const newCard: Card = {
            id: crypto.randomUUID(),
            label: label || 'Untitled',
            imageUrl,
            audioUrl,
            color: color || 'var(--primary)',
        };

        await addCard(newCard);

        return NextResponse.json(newCard, { status: 201 });
    } catch (error) {
        console.error('Error adding card:', error);
        return NextResponse.json(
            { error: 'Failed to add card' },
            { status: 500 }
        );
    }
}
