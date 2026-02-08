import { NextResponse } from 'next/server';
import { getCards, addCard, getBoard, getCardLabels } from '@/lib/storage';
import { Card } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';
import { validateStringLength, validateColor } from '@/lib/validation';

export async function GET(request: Request) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = logger.withContext({ requestId, operation: 'get_cards' });

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    log.debug('Request started', { boardId });

    if (!boardId) {
        log.warn('No boardId provided');
        return NextResponse.json([]);
    }

    // Check board access (public or owned) - run auth and board lookup in parallel
    const [board, authResult] = await Promise.all([
        getBoard(boardId),
        auth()
    ]);

    if (!board) {
        log.warn('Board not found', { boardId });
        return new NextResponse("Board not found", { status: 404 });
    }

    // Allow access if board is public or user is the owner
    const { userId } = authResult;
    const userLog = log.withContext({ userId });

    if (!board.isPublic && board.userId !== userId) {
        userLog.warn('Unauthorized access attempt', {
            boardId,
            boardOwner: board.userId
        });
        return new NextResponse("Unauthorized Board Access", { status: 403 });
    }

    const cardsStart = Date.now();
    const cards = await getCards(boardId);
    const totalTime = Date.now() - startTime;

    userLog.info('Cards retrieved', {
        count: cards.length,
        query_duration_ms: Date.now() - cardsStart,
        total_duration_ms: totalTime
    });

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
    const log = logger.withContext({ requestId, operation: 'create_card' });

    log.info('Create card request started');

    const authStart = Date.now();
    const { userId } = await auth();
    log.debug('Auth check completed', { duration_ms: Date.now() - authStart });

    if (!userId) {
        log.warn('Unauthorized user');
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Add userId to logger context
    const userLog = log.withContext({ userId });

    try {
        const parseStart = Date.now();
        const body = await request.json();
        userLog.debug('Request body parsed', { duration_ms: Date.now() - parseStart });

        const { label, imageUrl, audioUrl, color, boardId, category: rawCategory, sourceBoardId } = body;
        const category = rawCategory ? rawCategory.trim().toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) : rawCategory;

        userLog.info('Card details received', {
            label: label || 'Untitled',
            boardId,
            hasImage: !!imageUrl,
            hasAudio: !!audioUrl,
            category: category || '(none)'
        });

        if (label) {
            const labelError = validateStringLength(label, 100, 'Card label');
            if (labelError) {
                userLog.warn('Label too long', { length: label.length });
                return NextResponse.json({ error: labelError }, { status: 400 });
            }
        }

        if (color) {
            const colorError = validateColor(color);
            if (colorError) {
                userLog.warn('Invalid color', { color });
                return NextResponse.json({ error: colorError }, { status: 400 });
            }
        }

        // BoardID and imageUrl are mandatory, audioUrl is optional for batch uploads
        if (!imageUrl || !boardId) {
            userLog.warn('Missing required fields', {
                hasImage: !!imageUrl,
                hasBoardId: !!boardId
            });
            return NextResponse.json(
                { error: 'Image and Board ID are required' },
                { status: 400 }
            );
        }

        // Verify board ownership or admin status
        // Use retryOnNotFound=true to handle Postgres read replica lag on Vercel
        const boardCheckStart = Date.now();
        userLog.debug('Checking board ownership', { boardId });

        // Optimization: Check ownership first to avoid expensive admin check (external API call)
        const board = await getBoard(boardId, true);
        const isOwner = board && board.userId === userId;

        let isAdmin = false;
        if (board && !isOwner) {
            userLog.debug('User is not owner, checking admin status');
            isAdmin = await checkIsAdmin();
        }

        userLog.debug('Board check completed', {
            duration_ms: Date.now() - boardCheckStart,
            found: !!board,
            isOwner,
            isAdmin
        });

        if (!board || (!isOwner && !isAdmin)) {
            userLog.warn('Unauthorized board access', { boardId });
            return new NextResponse("Unauthorized Board Access", { status: 403 });
        }

        if (boardId.startsWith('starter-')) {
            userLog.warn('Attempted to add card to template board', { boardId });
            return new NextResponse("Cards cannot be added to template boards", { status: 403 });
        }

        // Check label uniqueness within the board
        const cardLabel = (label || 'Untitled').trim().toLowerCase();
        if (cardLabel) {
            const existingLabels = await getCardLabels(boardId);
            if (existingLabels.has(cardLabel)) {
                userLog.warn('Duplicate label', { label: cardLabel, boardId });
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

        userLog.info('Creating card', { cardId });

        const dbInsertStart = Date.now();
        await addCard(newCard);

        userLog.info('Card created successfully', {
            cardId,
            db_duration_ms: Date.now() - dbInsertStart,
            total_duration_ms: Date.now() - startTime
        });

        return NextResponse.json(newCard, { status: 201 });
    } catch (error) {
        const totalTime = Date.now() - startTime;
        userLog.error('Failed to add card', error, { duration_ms: totalTime });

        return NextResponse.json(
            { error: 'Failed to add card' },
            { status: 500 }
        );
    }
}
