import { NextResponse } from 'next/server';
import { getCard, deleteCard, updateCard, getBoard, getCardLabels } from '@/lib/storage';
import { del } from '@vercel/blob';
import { auth } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin';
import { validateStringLength, validateColor } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        // Fetch only this card by ID (not all cards in the DB)
        const existingCard = await getCard(id);

        if (!existingCard) {
            return new NextResponse("Card not found", { status: 404 });
        }

        const [board, isAdmin] = await Promise.all([
            getBoard(existingCard.boardId),
            checkIsAdmin()
        ]);
        const isOwner = board && board.userId === userId;

        if (!board || (!isOwner && !isAdmin)) {
            return new NextResponse("Unauthorized Access to Board", { status: 403 });
        }

        if (id.startsWith('sbp-')) {
            return new NextResponse("Template cards cannot be modified", { status: 403 });
        }

        const body = await request.json();
        const { label, imageUrl, audioUrl, color, category: rawCategory, boardId } = body;

        // Cards inherited from public boards cannot be edited (only moved/deleted)
        // Allow boardId changes (move) but block content changes
        if (existingCard.sourceBoardId) {
            const hasContentChanges = (label !== undefined && label !== existingCard.label) ||
                (imageUrl !== undefined && imageUrl !== existingCard.imageUrl) ||
                (audioUrl !== undefined && audioUrl !== existingCard.audioUrl) ||
                (color !== undefined && color !== existingCard.color) ||
                (rawCategory !== undefined && rawCategory !== existingCard.category);
            if (hasContentChanges) {
                return new NextResponse("Inherited cards from public boards cannot be edited", { status: 403 });
            }
        }
        const category = rawCategory ? rawCategory.trim().toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) : rawCategory;

        if (label !== undefined) {
            const labelError = validateStringLength(label, 100, 'Card label');
            if (labelError) {
                return NextResponse.json({ error: labelError }, { status: 400 });
            }
        }

        if (color !== undefined) {
            const colorError = validateColor(color);
            if (colorError) {
                return NextResponse.json({ error: colorError }, { status: 400 });
            }
        }

        // Check label uniqueness if label is changing
        const targetBoardId = boardId || existingCard.boardId;
        if (label !== undefined && label.trim().toLowerCase() !== existingCard.label.trim().toLowerCase()) {
            const normalizedLabel = label.trim().toLowerCase();
            if (normalizedLabel) {
                const existingLabels = await getCardLabels(targetBoardId);
                if (existingLabels.has(normalizedLabel)) {
                    return NextResponse.json(
                        { error: `A card named "${label}" already exists on this board` },
                        { status: 409 }
                    );
                }
            }
        }

        // If moving to a different board, verify user owns the destination board
        if (boardId && boardId !== existingCard.boardId) {
            const [destinationBoard, isAdmin] = await Promise.all([
                getBoard(boardId),
                checkIsAdmin()
            ]);
            const isDestinationOwner = destinationBoard && destinationBoard.userId === userId;
            if (!destinationBoard || (!isDestinationOwner && !isAdmin)) {
                return new NextResponse("Unauthorized Access to Destination Board", { status: 403 });
            }

            // Check label uniqueness on the destination board
            const moveLabel = (label !== undefined ? label : existingCard.label).trim().toLowerCase();
            if (moveLabel) {
                const destLabels = await getCardLabels(boardId);
                if (destLabels.has(moveLabel)) {
                    return NextResponse.json(
                        { error: `A card named "${label !== undefined ? label : existingCard.label}" already exists on the destination board` },
                        { status: 409 }
                    );
                }
            }
        }

        const updatedCard = {
            ...existingCard,
            label: label !== undefined ? label : existingCard.label,
            imageUrl: imageUrl !== undefined ? imageUrl : existingCard.imageUrl,
            audioUrl: audioUrl !== undefined ? audioUrl : existingCard.audioUrl,
            color: color !== undefined ? color : existingCard.color,
            category: category !== undefined ? category : existingCard.category,
            boardId: boardId !== undefined ? boardId : existingCard.boardId,
        };

        await updateCard(updatedCard);

        return NextResponse.json(updatedCard);
    } catch (error) {
        console.error('Error updating card:', error);
        return NextResponse.json(
            { error: 'Failed to update card' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        // Fetch only this card by ID (not all cards in the DB)
        const card = await getCard(id);

        if (!card) {
            return new NextResponse("Card not found", { status: 404 });
        }

        const [board, isAdmin] = await Promise.all([
            getBoard(card.boardId),
            checkIsAdmin()
        ]);
        const isOwner = board && board.userId === userId;

        if (!board || (!isOwner && !isAdmin)) {
            return new NextResponse("Unauthorized Access to Board", { status: 403 });
        }

        if (id.startsWith('sbp-')) {
            return new NextResponse("Template cards cannot be deleted", { status: 403 });
        }

        await deleteCard(id);

        // Clean up orphaned blobs in the background (don't block the response)
        const blobUrls: string[] = [];
        if (card.imageUrl?.includes('.blob.vercel-storage.com')) blobUrls.push(card.imageUrl);
        if (card.audioUrl?.includes('.blob.vercel-storage.com')) blobUrls.push(card.audioUrl);
        if (blobUrls.length > 0) {
            del(blobUrls).catch(err => {
                logger.error('Failed to clean up card blobs', err, { cardId: id, urls: blobUrls });
            });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting card:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
