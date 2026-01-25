import { NextResponse } from 'next/server';
import { getCards, deleteCard, updateCard, getBoard } from '@/lib/storage';
import { auth } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin';

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
        // Verification step: Ensure user owns the board that this card belongs to
        const allCards = await getCards();
        const existingCard = allCards.find(c => c.id === id);

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
        const { label, imageUrl, audioUrl, color, category, boardId } = body;

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
        // Verification step: Ensure user owns the board that this card belongs to
        const allCards = await getCards();
        const card = allCards.find(c => c.id === id);

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

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting card:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
