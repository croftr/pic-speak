import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { batchAddCards, getBoard, getCardLabels } from '@/lib/storage';
import { Card } from '@/types';
import { validateColor } from '@/lib/validation';

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

        if (cards.length > 50) {
            return NextResponse.json(
                { error: 'Maximum 50 cards per batch' },
                { status: 400 }
            );
        }

        // Verify user owns the board (retry on not found to handle replica lag)
        const board = await getBoard(boardId, true);
        if (!board || board.userId !== userId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Filter out cards with duplicate labels (skip empty labels)
        const existingLabels = await getCardLabels(boardId);
        const duplicateLabels: string[] = [];
        const seenInBatch = new Set<string>();
        const filteredCards = cards.filter((cardData: any) => {
            const normalized = (cardData.label || '').trim().toLowerCase();
            if (!normalized) return true; // Allow empty labels through
            if (existingLabels.has(normalized) || seenInBatch.has(normalized)) {
                duplicateLabels.push(cardData.label);
                return false;
            }
            seenInBatch.add(normalized);
            return true;
        });

        if (filteredCards.length === 0) {
            return NextResponse.json(
                { error: 'All cards have duplicate labels', duplicateLabels },
                { status: 409 }
            );
        }

        // Validate colors in the batch
        for (const cardData of filteredCards) {
            if (cardData.color) {
                const colorError = validateColor(cardData.color);
                if (colorError) {
                    return NextResponse.json({ error: `Invalid color "${cardData.color}": ${colorError}` }, { status: 400 });
                }
            }
        }

        // Create full card objects with IDs
        const cardsToInsert: Card[] = filteredCards.map((cardData: any, index: number) => ({
            id: crypto.randomUUID(),
            boardId,
            label: cardData.label || '',
            imageUrl: cardData.imageUrl,
            audioUrl: cardData.audioUrl || '',
            color: cardData.color || '#6366f1',
            category: cardData.category ? cardData.category.trim().toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) : undefined,
            order: cardData.order ?? index,
            sourceBoardId: cardData.sourceBoardId || undefined,
            templateKey: cardData.templateKey || undefined,
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
