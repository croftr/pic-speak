import { NextResponse } from 'next/server';
import { getCards, addCard, getBoard, getCardLabels } from '@/lib/storage';
import { Card } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin';

export async function GET(request: Request) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    console.log(`[GetCards-${requestId}] Started for board: ${boardId}`);

    if (!boardId) {
        console.log(`[GetCards-${requestId}] No boardId provided`);
        return NextResponse.json([]);
    }

    // Check board access (public or owned) - run auth and board lookup in parallel
    const [board, authResult] = await Promise.all([
        getBoard(boardId),
        auth()
    ]);

    if (!board) {
        console.log(`[GetCards-${requestId}] Board not found`);
        return new NextResponse("Board not found", { status: 404 });
    }

    // Allow access if board is public or user is the owner
    const { userId } = authResult;
    if (!board.isPublic && board.userId !== userId) {
        console.log(`[GetCards-${requestId}] Unauthorized access attempt`);
        return new NextResponse("Unauthorized Board Access", { status: 403 });
    }

    const cardsStart = Date.now();
    const cards = await getCards(boardId);
    const totalTime = Date.now() - startTime;

    console.log(`[GetCards-${requestId}] SUCCESS! Retrieved ${cards.length} cards in ${totalTime}ms (query: ${Date.now() - cardsStart}ms)`);

    // Cache cards with stale-while-revalidate for better performance
    const cacheControl = board.isPublic
        ? 'public, max-age=300, stale-while-revalidate=600'
        : 'private, max-age=60, stale-while-revalidate=300';

    return NextResponse.json(cards, {
        headers: {
            'Cache-Control': cacheControl
        }
    });
}

export async function POST(request: Request) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);

    console.log(`[CreateCard-${requestId}] Started at ${new Date().toISOString()}`);

    const authStart = Date.now();
    const { userId } = await auth();
    console.log(`[CreateCard-${requestId}] Auth check completed in ${Date.now() - authStart}ms`);

    if (!userId) {
        console.log(`[CreateCard-${requestId}] FAILED: Unauthorized user`);
        return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log(`[CreateCard-${requestId}] User: ${userId}`);

    try {
        const parseStart = Date.now();
        const body = await request.json();
        console.log(`[CreateCard-${requestId}] Request body parsed in ${Date.now() - parseStart}ms`);

        const { label, imageUrl, audioUrl, color, boardId, category: rawCategory, sourceBoardId } = body;
        const category = rawCategory ? rawCategory.trim().toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) : rawCategory;

        console.log(`[CreateCard-${requestId}] Card details:`, {
            label: label || 'Untitled',
            boardId,
            hasImage: !!imageUrl,
            hasAudio: !!audioUrl,
            category: category || '(none)'
        });

        // BoardID and imageUrl are mandatory, audioUrl is optional for batch uploads
        if (!imageUrl || !boardId) {
            console.log(`[CreateCard-${requestId}] FAILED: Missing required fields (imageUrl: ${!!imageUrl}, boardId: ${!!boardId})`);
            return NextResponse.json(
                { error: 'Image and Board ID are required' },
                { status: 400 }
            );
        }

        // Verify board ownership or admin status
        // Use retryOnNotFound=true to handle Postgres read replica lag on Vercel
        const boardCheckStart = Date.now();
        console.log(`[CreateCard-${requestId}] Checking board ownership for board: ${boardId}`);

        // Optimization: Check ownership first to avoid expensive admin check (external API call)
        const board = await getBoard(boardId, true);
        const isOwner = board && board.userId === userId;

        let isAdmin = false;
        if (board && !isOwner) {
            console.log(`[CreateCard-${requestId}] User is not owner, checking admin status...`);
            isAdmin = await checkIsAdmin();
        }

        console.log(`[CreateCard-${requestId}] Board check completed in ${Date.now() - boardCheckStart}ms (found: ${!!board}, isOwner: ${isOwner}, isAdmin: ${isAdmin})`);

        if (!board || (!isOwner && !isAdmin)) {
            console.log(`[CreateCard-${requestId}] FAILED: Unauthorized board access`);
            return new NextResponse("Unauthorized Board Access", { status: 403 });
        }

        if (boardId.startsWith('starter-')) {
            console.log(`[CreateCard-${requestId}] FAILED: Attempted to add card to template board`);
            return new NextResponse("Cards cannot be added to template boards", { status: 403 });
        }

        // Check label uniqueness within the board
        const cardLabel = (label || 'Untitled').trim().toLowerCase();
        if (cardLabel) {
            const existingLabels = await getCardLabels(boardId);
            if (existingLabels.has(cardLabel)) {
                console.log(`[CreateCard-${requestId}] FAILED: Duplicate label "${label}" on board ${boardId}`);
                return NextResponse.json(
                    { error: `A card named "${label}" already exists on this board` },
                    { status: 409 }
                );
            }
        }

        const cardId = crypto.randomUUID();
        const newCard: Card = {
            id: cardId,
            boardId,
            label: label || 'Untitled',
            imageUrl,
            audioUrl,
            color: color || 'var(--primary)',
            category: category || undefined, // Optional free-text category
            sourceBoardId: sourceBoardId || undefined, // Track if card was copied from a public board
        };

        console.log(`[CreateCard-${requestId}] Creating card with ID: ${cardId}`);
        const dbInsertStart = Date.now();
        await addCard(newCard);
        const dbInsertTime = Date.now() - dbInsertStart;
        console.log(`[CreateCard-${requestId}] Card inserted into database in ${dbInsertTime}ms`);

        const totalTime = Date.now() - startTime;
        console.log(`[CreateCard-${requestId}] SUCCESS! Card created in ${totalTime}ms`);

        return NextResponse.json(newCard, { status: 201 });
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[CreateCard-${requestId}] FAILED after ${totalTime}ms:`, error);
        console.error(`[CreateCard-${requestId}] Error details:`, {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { error: 'Failed to add card' },
            { status: 500 }
        );
    }
}
