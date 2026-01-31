import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { batchAddCards, getBoard } from '@/lib/storage';
import { Card } from '@/types';

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { boardId, cards } = body;

        if (!boardId || !Array.isArray(cards) || cards.length === 0) {
            return NextResponse.json(
                { error: 'Board ID and cards array are required' },
                { status: 400 }
            );
        }

        // Verify user owns the board (retry on not found to handle replica lag)
        const board = await getBoard(boardId, true);
        if (!board || board.userId !== userId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Create full card objects with IDs
        const cardsToInsert: Card[] = cards.map((cardData: any, index: number) => ({
            id: crypto.randomUUID(),
            boardId,
            label: cardData.label || '',
            imageUrl: cardData.imageUrl,
            audioUrl: cardData.audioUrl || '',
            color: cardData.color || '#6366f1',
            category: cardData.category || undefined, // Optional free-text category
            order: cardData.order ?? index
        }));

        // Batch insert all cards in a single transaction
        await batchAddCards(cardsToInsert);

        return NextResponse.json(cardsToInsert, { status: 201 });
    } catch (error) {
        console.error('Error batch creating cards:', error);
        return NextResponse.json(
            { error: 'Failed to create cards' },
            { status: 500 }
        );
    }
}
