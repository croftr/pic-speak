import { NextResponse } from 'next/server';
import { getCards, deleteCard, getBoard } from '@/lib/storage';
import { auth } from '@clerk/nextjs/server';

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

        const board = await getBoard(card.boardId);
        if (!board || board.userId !== userId) {
            return new NextResponse("Unauthorized Access to Board", { status: 403 });
        }

        await deleteCard(id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting card:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
