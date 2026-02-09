import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { addBoard, getCards, batchAddCards, getBoard, getBoardCount } from '@/lib/storage';
import { Board, Card } from '@/types';
import { MAX_BOARDS_PER_USER, MAX_CARDS_PER_BOARD } from '@/lib/limits';

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { templateBoardId, newBoardName, newBoardDesc } = body;

        if (!templateBoardId || !newBoardName) {
            return NextResponse.json(
                { error: 'Template board ID and new board name are required' },
                { status: 400 }
            );
        }

        // Check board limit
        const boardCount = await getBoardCount(userId);
        if (boardCount >= MAX_BOARDS_PER_USER) {
            return NextResponse.json(
                { error: `Maximum number of boards (${MAX_BOARDS_PER_USER}) reached` },
                { status: 403 }
            );
        }

        // Get template board to verify it exists
        const templateBoard = await getBoard(templateBoardId);
        if (!templateBoard) {
            return NextResponse.json(
                { error: 'Template board not found' },
                { status: 404 }
            );
        }

        // Get all cards from template and check limit
        const templateCards = await getCards(templateBoardId);
        if (templateCards.length > MAX_CARDS_PER_BOARD) {
            return NextResponse.json(
                { error: `Template has too many cards (${templateCards.length}). Max allowed is ${MAX_CARDS_PER_BOARD}.` },
                { status: 403 }
            );
        }

        // Fetch user info from Clerk
        let creatorName: string | undefined;
        let creatorImageUrl: string | undefined;
        try {
            const client = await clerkClient();
            const user = await client.users.getUser(userId);
            creatorName = user.fullName || user.firstName || user.username || undefined;
            creatorImageUrl = user.imageUrl || undefined;
        } catch (error) {
            console.error('Error fetching user from Clerk:', error);
        }

        // Create new board
        const newBoardId = crypto.randomUUID();
        const newBoard: Board = {
            id: newBoardId,
            userId,
            name: newBoardName,
            description: newBoardDesc || `Based on ${templateBoard.name}`,
            createdAt: new Date().toISOString(),
            isPublic: false,
            creatorName,
            creatorImageUrl
        };

        await addBoard(newBoard);

        // Clone all cards to new board, preserving their original order
        // Mark non-template cards with sourceBoardId so they can be identified as inherited
        const cardsToInsert: Card[] = templateCards.map(templateCard => ({
            ...templateCard,
            id: crypto.randomUUID(),
            boardId: newBoardId,
            // Template cards keep their templateKey, regular cards get sourceBoardId
            // sourceBoardId marks cards as inherited from a public board (cannot edit, can delete)
            sourceBoardId: templateCard.templateKey ? undefined : templateBoardId,
        }));

        if (cardsToInsert.length > 0) {
            await batchAddCards(cardsToInsert, true); // preserveOrder = true
        }

        return NextResponse.json({
            board: newBoard,
            cardCount: templateCards.length
        }, { status: 201 });
    } catch (error) {
        console.error('Error cloning template board:', error);
        return NextResponse.json(
            { error: 'Failed to clone template board' },
            { status: 500 }
        );
    }
}
