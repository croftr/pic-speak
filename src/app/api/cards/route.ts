import { NextResponse } from 'next/server';
import { getCards, addCard, getBoard } from '@/lib/storage';
import { Card } from '@/types';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    // If no boardId, currently we returned all cards. 
    // Now we must ensure we only return cards for boards owned by the user.
    // However, the previous logic was just "getCards()". 
    // To be safe/simple, let's require boardId for now or return empty.
    if (!boardId) {
        return NextResponse.json([]);
    }

    // Check board ownership
    const board = await getBoard(boardId);
    if (!board || board.userId !== userId) {
        return new NextResponse("Unauthorized Board Access", { status: 403 });
    }

    const cards = await getCards(boardId);
    return NextResponse.json(cards);
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

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

        // Verify board ownership
        const board = await getBoard(boardId);
        if (!board || board.userId !== userId) {
            return new NextResponse("Unauthorized Board Access", { status: 403 });
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
