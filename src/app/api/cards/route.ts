import { NextResponse } from 'next/server';
import { getCards, addCard } from '@/lib/storage';
import { Card } from '@/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    // If no boardId, return empty list or all cards (depending on policy). 
    // For now return empty to encourage board usage, or maybe all if really needed.
    if (!boardId) {
        const cards = await getCards(); // returns all
        return NextResponse.json(cards);
    }

    const cards = await getCards(boardId);
    return NextResponse.json(cards);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { label, imageUrl, audioUrl, color, boardId } = body;

        // BoardID is mandatory now for new cards
        if (!imageUrl || !audioUrl || !boardId) {
            return NextResponse.json(
                { error: 'Image, Audio, and Board ID are required' },
                { status: 400 }
            );
        }

        const newCard: Card = {
            id: crypto.randomUUID(),
            boardId,
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
