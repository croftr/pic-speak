import { Pool, PoolClient } from 'pg';
import { Card, Board, BoardComment } from '@/types';
import { logger } from './logger';

// Database row types (snake_case from DB)
type CardRow = {
    id: string;
    board_id: string;
    label: string;
    image_url: string;
    audio_url: string;
    color?: string;
    order?: number;
    type?: string; // Maps to 'category' in the app - optional free-text field
    template_key?: string;
    source_board_id?: string; // If set, this card was inherited from a public board template
    created_at?: string;
    updated_at?: string;
};

type BoardRow = {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at?: string;
    is_public?: boolean;
    creator_name?: string;
    creator_image_url?: string;
    owner_email?: string;
    email_notifications_enabled?: boolean;
};

// Create a connection pool for better performance
// Pool reuses connections instead of creating new ones for each query
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if unable to get a connection
});

// Helper function to get a database client from the pool
async function getDbClient(): Promise<PoolClient> {
    const startTime = Date.now();
    try {
        const client = await pool.connect();
        const connectionTime = Date.now() - startTime;
        logger.debug('DB Client acquired', {
            duration_ms: connectionTime,
            pool: {
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount
            }
        });
        return client;
    } catch (error) {
        const connectionTime = Date.now() - startTime;
        logger.error('Failed to acquire DB client', error, { duration_ms: connectionTime });
        throw error;
    }
}

// --- Starter Content ---

const STARTER_BOARDS: Board[] = [
    {
        id: 'starter-template',
        userId: 'system',
        name: 'Starter Template',
        description: 'Essential everyday phrases and objects.',
        createdAt: '2024-01-01T00:00:00.000Z',
        isPublic: true,
        creatorName: 'Pic Speak',
        creatorImageUrl: '/logo.png'
    }
];

// Template card definitions - these are referenced by templateKey and never stored in DB
const TEMPLATE_CARDS_REGISTRY: Record<string, Omit<Card, 'id' | 'boardId' | 'order'>> = {
    // Core
    'tpl-yes': { label: 'Yes', imageUrl: '/prebuilt/yes.png', audioUrl: '/prebuilt/yes.mp3', category: 'Core', templateKey: 'tpl-yes' },
    'tpl-no': { label: 'No', imageUrl: '/prebuilt/no.png', audioUrl: '/prebuilt/no.mp3', category: 'Core', templateKey: 'tpl-no' },
    'tpl-hello': { label: 'Hello', imageUrl: '/prebuilt/hello.png', audioUrl: '/prebuilt/hello.mp3', category: 'Core', templateKey: 'tpl-hello' },
    'tpl-bye': { label: 'Goodbye', imageUrl: '/prebuilt/bye.png', audioUrl: '/prebuilt/bye.mp3', category: 'Core', templateKey: 'tpl-bye' },
    'tpl-thank-you': { label: 'Thank You', imageUrl: '/prebuilt/thank_you.png', audioUrl: '/prebuilt/thank_you.mp3', category: 'Core', templateKey: 'tpl-thank-you' },
    'tpl-please': { label: 'Please', imageUrl: '/prebuilt/please.png', audioUrl: '/prebuilt/please.mp3', category: 'Core', templateKey: 'tpl-please' },
    // Activities
    'tpl-computer': { label: 'Computer', imageUrl: '/prebuilt/computer.png', audioUrl: '/prebuilt/computer.mp3', category: 'Activities', templateKey: 'tpl-computer' },
    'tpl-tablet': { label: 'Tablet', imageUrl: '/prebuilt/tablet.png', audioUrl: '/prebuilt/tablet.mp3', category: 'Activities', templateKey: 'tpl-tablet' },
    'tpl-mobile-phone': { label: 'Mobile Phone', imageUrl: '/prebuilt/mobile_phone.png', audioUrl: '/prebuilt/mobile_phone.mp3', category: 'Activities', templateKey: 'tpl-mobile-phone' },
    'tpl-toilet': { label: 'Toilet', imageUrl: '/prebuilt/toilet.png', audioUrl: '/prebuilt/toilet.mp3', category: 'Activities', templateKey: 'tpl-toilet' },
    'tpl-brush-teeth': { label: 'Brush Teeth', imageUrl: '/prebuilt/brush_teeth.png', audioUrl: '/prebuilt/brush_teeth.mp3', category: 'Activities', templateKey: 'tpl-brush-teeth' },
    // Places
    'tpl-bed': { label: 'Bed', imageUrl: '/prebuilt/bed.png', audioUrl: '/prebuilt/bed.mp3', category: 'Places', templateKey: 'tpl-bed' },
    'tpl-school': { label: 'School', imageUrl: '/prebuilt/school.png', audioUrl: '/prebuilt/school.wav', category: 'Places', templateKey: 'tpl-school' },
    // Food
    'tpl-juice': { label: 'Juice', imageUrl: '/prebuilt/juice.png', audioUrl: '/prebuilt/juice.wav', category: 'Food', templateKey: 'tpl-juice' },
    'tpl-chocolate': { label: 'Chocolate', imageUrl: '/prebuilt/chocolate.png', audioUrl: '/prebuilt/chocolate.wav', category: 'Food', templateKey: 'tpl-chocolate' },
    'tpl-sweets': { label: 'Sweets', imageUrl: '/prebuilt/sweets.png', audioUrl: '/prebuilt/sweets.wav', category: 'Food', templateKey: 'tpl-sweets' },
    'tpl-cake': { label: 'Cake', imageUrl: '/prebuilt/cake.png', audioUrl: '/prebuilt/cake.wav', category: 'Food', templateKey: 'tpl-cake' },
    'tpl-apple': { label: 'Apple', imageUrl: '/prebuilt/apple.png', audioUrl: '/prebuilt/apple.wav', category: 'Food', templateKey: 'tpl-apple' },
    // Core - New
    'tpl-help': { label: 'Help', imageUrl: '/prebuilt/help.png', audioUrl: '/prebuilt/help.wav', category: 'Core', templateKey: 'tpl-help' },
    'tpl-start': { label: 'Start', imageUrl: '/prebuilt/start.png', audioUrl: '/prebuilt/start.wav', category: 'Core', templateKey: 'tpl-start' },
    'tpl-stop': { label: 'Stop', imageUrl: '/prebuilt/stop.png', audioUrl: '/prebuilt/stop.wav', category: 'Core', templateKey: 'tpl-stop' },
    'tpl-more': { label: 'More', imageUrl: '/prebuilt/more.png', audioUrl: '/prebuilt/more.wav', category: 'Core', templateKey: 'tpl-more' },
    // Feelings
    'tpl-hungry': { label: 'Hungry', imageUrl: '/prebuilt/hungry.png', audioUrl: '/prebuilt/hungry.wav', category: 'Feelings', templateKey: 'tpl-hungry' },
    'tpl-tired': { label: 'Tired', imageUrl: '/prebuilt/tired.jpg', audioUrl: '/prebuilt/tired.wav', category: 'Feelings', templateKey: 'tpl-tired' },
};

// Export for use in other modules
export function getTemplateCard(templateKey: string): Omit<Card, 'id' | 'boardId' | 'order'> | undefined {
    return TEMPLATE_CARDS_REGISTRY[templateKey];
}

const STARTER_CARDS: Record<string, Card[]> = {
    'starter-template': [
        // Core
        { id: 'sbp-1', boardId: 'starter-template', label: 'Yes', imageUrl: '/prebuilt/yes.png', audioUrl: '/prebuilt/yes.mp3', category: 'Core', order: 0, templateKey: 'tpl-yes' },
        { id: 'sbp-2', boardId: 'starter-template', label: 'No', imageUrl: '/prebuilt/no.png', audioUrl: '/prebuilt/no.mp3', category: 'Core', order: 1, templateKey: 'tpl-no' },
        { id: 'sbp-3', boardId: 'starter-template', label: 'Hello', imageUrl: '/prebuilt/hello.png', audioUrl: '/prebuilt/hello.mp3', category: 'Core', order: 2, templateKey: 'tpl-hello' },
        { id: 'sbp-4', boardId: 'starter-template', label: 'Goodbye', imageUrl: '/prebuilt/bye.png', audioUrl: '/prebuilt/bye.mp3', category: 'Core', order: 3, templateKey: 'tpl-bye' },
        { id: 'sbp-5', boardId: 'starter-template', label: 'Thank You', imageUrl: '/prebuilt/thank_you.png', audioUrl: '/prebuilt/thank_you.mp3', category: 'Core', order: 4, templateKey: 'tpl-thank-you' },
        { id: 'sbp-6', boardId: 'starter-template', label: 'Please', imageUrl: '/prebuilt/please.png', audioUrl: '/prebuilt/please.mp3', category: 'Core', order: 5, templateKey: 'tpl-please' },
        // Activities
        { id: 'sbp-7', boardId: 'starter-template', label: 'Computer', imageUrl: '/prebuilt/computer.png', audioUrl: '/prebuilt/computer.mp3', category: 'Activities', order: 6, templateKey: 'tpl-computer' },
        { id: 'sbp-8', boardId: 'starter-template', label: 'Tablet', imageUrl: '/prebuilt/tablet.png', audioUrl: '/prebuilt/tablet.mp3', category: 'Activities', order: 7, templateKey: 'tpl-tablet' },
        { id: 'sbp-9', boardId: 'starter-template', label: 'Mobile Phone', imageUrl: '/prebuilt/mobile_phone.png', audioUrl: '/prebuilt/mobile_phone.mp3', category: 'Activities', order: 8, templateKey: 'tpl-mobile-phone' },
        { id: 'sbp-10', boardId: 'starter-template', label: 'Toilet', imageUrl: '/prebuilt/toilet.png', audioUrl: '/prebuilt/toilet.mp3', category: 'Activities', order: 9, templateKey: 'tpl-toilet' },
        { id: 'sbp-11', boardId: 'starter-template', label: 'Brush Teeth', imageUrl: '/prebuilt/brush_teeth.png', audioUrl: '/prebuilt/brush_teeth.mp3', category: 'Activities', order: 10, templateKey: 'tpl-brush-teeth' },
        // Places
        { id: 'sbp-12', boardId: 'starter-template', label: 'Bed', imageUrl: '/prebuilt/bed.png', audioUrl: '/prebuilt/bed.mp3', category: 'Places', order: 11, templateKey: 'tpl-bed' },
        { id: 'sbp-13', boardId: 'starter-template', label: 'School', imageUrl: '/prebuilt/school.png', audioUrl: '/prebuilt/school.wav', category: 'Places', order: 12, templateKey: 'tpl-school' },
        // Food
        { id: 'sbp-14', boardId: 'starter-template', label: 'Juice', imageUrl: '/prebuilt/juice.png', audioUrl: '/prebuilt/juice.wav', category: 'Food', order: 13, templateKey: 'tpl-juice' },
        { id: 'sbp-15', boardId: 'starter-template', label: 'Chocolate', imageUrl: '/prebuilt/chocolate.png', audioUrl: '/prebuilt/chocolate.wav', category: 'Food', order: 14, templateKey: 'tpl-chocolate' },
        { id: 'sbp-16', boardId: 'starter-template', label: 'Sweets', imageUrl: '/prebuilt/sweets.png', audioUrl: '/prebuilt/sweets.wav', category: 'Food', order: 15, templateKey: 'tpl-sweets' },
        { id: 'sbp-17', boardId: 'starter-template', label: 'Cake', imageUrl: '/prebuilt/cake.png', audioUrl: '/prebuilt/cake.wav', category: 'Food', order: 16, templateKey: 'tpl-cake' },
        { id: 'sbp-18', boardId: 'starter-template', label: 'Apple', imageUrl: '/prebuilt/apple.png', audioUrl: '/prebuilt/apple.wav', category: 'Food', order: 17, templateKey: 'tpl-apple' },
        // Core - New
        { id: 'sbp-19', boardId: 'starter-template', label: 'Help', imageUrl: '/prebuilt/help.png', audioUrl: '/prebuilt/help.wav', category: 'Core', order: 18, templateKey: 'tpl-help' },
        { id: 'sbp-20', boardId: 'starter-template', label: 'Start', imageUrl: '/prebuilt/start.png', audioUrl: '/prebuilt/start.wav', category: 'Core', order: 19, templateKey: 'tpl-start' },
        { id: 'sbp-21', boardId: 'starter-template', label: 'Stop', imageUrl: '/prebuilt/stop.png', audioUrl: '/prebuilt/stop.wav', category: 'Core', order: 20, templateKey: 'tpl-stop' },
        { id: 'sbp-22', boardId: 'starter-template', label: 'More', imageUrl: '/prebuilt/more.png', audioUrl: '/prebuilt/more.wav', category: 'Core', order: 21, templateKey: 'tpl-more' },
        // Feelings
        { id: 'sbp-23', boardId: 'starter-template', label: 'Hungry', imageUrl: '/prebuilt/hungry.png', audioUrl: '/prebuilt/hungry.wav', category: 'Feelings', order: 22, templateKey: 'tpl-hungry' },
        { id: 'sbp-24', boardId: 'starter-template', label: 'Tired', imageUrl: '/prebuilt/tired.jpg', audioUrl: '/prebuilt/tired.wav', category: 'Feelings', order: 23, templateKey: 'tpl-tired' },
    ]
};

// --- Cards ---

export async function getCards(boardId?: string): Promise<Card[]> {
    if (boardId && STARTER_CARDS[boardId]) {
        return STARTER_CARDS[boardId];
    }

    const client = await getDbClient();
    try {
        let result;
        if (boardId) {
            result = await client.query<CardRow>(
                'SELECT * FROM cards WHERE board_id = $1 ORDER BY "order" ASC, created_at ASC',
                [boardId]
            );
        } else {
            result = await client.query<CardRow>(
                'SELECT * FROM cards ORDER BY created_at ASC'
            );
        }

        return result.rows.map(row => {
            // If this card has a template key, get data from the template registry
            if (row.template_key && TEMPLATE_CARDS_REGISTRY[row.template_key]) {
                const template = TEMPLATE_CARDS_REGISTRY[row.template_key];
                return {
                    id: row.id,
                    boardId: row.board_id,
                    label: template.label,
                    imageUrl: template.imageUrl,
                    audioUrl: template.audioUrl,
                    color: row.color,
                    order: row.order,
                    category: template.category,
                    templateKey: row.template_key
                };
            }

            // Regular user-created card - map 'type' column to 'category'
            return {
                id: row.id,
                boardId: row.board_id,
                label: row.label,
                imageUrl: row.image_url,
                audioUrl: row.audio_url,
                color: row.color,
                order: row.order,
                category: row.type || undefined, // DB column is 'type', app uses 'category'
                sourceBoardId: row.source_board_id || undefined
            };
        });
    } catch (error) {
        logger.error('Error getting cards', error, { boardId });
        return [];
    } finally {
        client.release();
    }
}

export async function getCardLabels(boardId: string): Promise<Set<string>> {
    const client = await getDbClient();
    try {
        const result = await client.query<{ label: string }>(
            'SELECT LOWER(TRIM(label)) as label FROM cards WHERE board_id = $1 AND label != \'\'',
            [boardId]
        );
        const labels = new Set(result.rows.map(row => row.label));

        // Also include labels from starter cards if applicable
        if (STARTER_CARDS[boardId]) {
            for (const card of STARTER_CARDS[boardId]) {
                const normalized = card.label.trim().toLowerCase();
                if (normalized) labels.add(normalized);
            }
        }

        return labels;
    } finally {
        client.release();
    }
}

export async function addCard(card: Card): Promise<void> {
    const startTime = Date.now();
    logger.info('Adding card', { cardId: card.id, boardId: card.boardId });

    const client = await getDbClient();
    try {
        const queryStart = Date.now();

        // Get the current minimum order value for this board, then insert below it.
        // This avoids updating every existing card's order on each insert.
        const minResult = await client.query(
            'SELECT COALESCE(MIN("order"), 0) - 1 AS new_order FROM cards WHERE board_id = $1',
            [card.boardId]
        );
        const newOrder = minResult.rows[0].new_order;

        // If this is a template card, only store the template key and minimal data
        if (card.templateKey) {
            logger.debug('Inserting template card', { templateKey: card.templateKey, cardId: card.id });
            await client.query(
                'INSERT INTO cards (id, board_id, template_key, "order", color) VALUES ($1, $2, $3, $4, $5)',
                [card.id, card.boardId, card.templateKey, newOrder, card.color || '#6366f1']
            );
        } else {
            // Regular user card - insert at lowest order (top of board)
            // Note: 'category' maps to 'type' column in database (NOT NULL with default 'Thing')
            logger.debug('Inserting user card', {
                label: card.label,
                imageUrl: card.imageUrl,
                audioUrl: card.audioUrl,
                cardId: card.id
            });
            await client.query(
                'INSERT INTO cards (id, board_id, label, image_url, audio_url, color, "order", type, source_board_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [card.id, card.boardId, card.label, card.imageUrl, card.audioUrl, card.color || '#6366f1', newOrder, card.category || 'Thing', card.sourceBoardId || null]
            );
        }

        const queryTime = Date.now() - queryStart;
        const totalTime = Date.now() - startTime;
        logger.info('Card added successfully', {
            cardId: card.id,
            query_duration_ms: queryTime,
            total_duration_ms: totalTime
        });
    } catch (error) {
        const totalTime = Date.now() - startTime;
        logger.error('Failed to add card', error, {
            cardId: card.id,
            boardId: card.boardId,
            duration_ms: totalTime,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            db_error_code: (error as any)?.code,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            db_error_detail: (error as any)?.detail
        });
        throw error;
    } finally {
        client.release();
    }
}

export async function batchAddCards(cards: Card[], preserveOrder: boolean = false): Promise<void> {
    if (cards.length === 0) return;

    const client = await getDbClient();
    try {
        await client.query('BEGIN');

        // Get the boardId from the first card (all cards should be for the same board)
        const boardId = cards[0].boardId;

        // Get the current minimum order so we can insert below it without shifting existing cards
        let baseOrder = 0;
        if (!preserveOrder) {
            const minResult = await client.query(
                'SELECT COALESCE(MIN("order"), 0) AS min_order FROM cards WHERE board_id = $1',
                [boardId]
            );
            // New cards get orders: min-N, min-N+1, ..., min-1 (newest batch at top, preserving batch internal order)
            baseOrder = minResult.rows[0].min_order - cards.length;
        }

        // Separate template cards from regular cards
        const templateCards = cards.filter(c => c.templateKey);
        const regularCards = cards.filter(c => !c.templateKey);

        // Batch insert template cards if any
        if (templateCards.length > 0) {
            const templateValues: (string | number | null)[] = [];
            const templatePlaceholders: string[] = [];
            let paramIndex = 1;

            templateCards.forEach((card, index) => {
                const order = preserveOrder ? (card.order || 0) : (baseOrder + index);
                templateValues.push(
                    card.id,
                    card.boardId,
                    card.templateKey || null,
                    order,
                    card.color || '#6366f1'
                );
                templatePlaceholders.push(
                    `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`
                );
                paramIndex += 5;
            });

            await client.query(
                `INSERT INTO cards (id, board_id, template_key, "order", color) VALUES ${templatePlaceholders.join(',')}`,
                templateValues
            );
        }

        // Batch insert regular cards if any
        if (regularCards.length > 0) {
            const regularValues: (string | number | null)[] = [];
            const regularPlaceholders: string[] = [];
            let paramIndex = 1;

            // Regular cards continue the sequence after template cards
            const templateCount = preserveOrder ? 0 : templateCards.length;

            regularCards.forEach((card, index) => {
                const order = preserveOrder ? (card.order || 0) : (baseOrder + templateCount + index);
                regularValues.push(
                    card.id,
                    card.boardId,
                    card.label,
                    card.imageUrl,
                    card.audioUrl,
                    card.color || '#6366f1',
                    order,
                    card.category || 'Thing', // 'category' maps to 'type' column in DB (NOT NULL)
                    card.sourceBoardId || null // Track inherited cards from public boards
                );
                regularPlaceholders.push(
                    `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`
                );
                paramIndex += 9;
            });

            await client.query(
                `INSERT INTO cards (id, board_id, label, image_url, audio_url, color, "order", type, source_board_id) VALUES ${regularPlaceholders.join(',')}`,
                regularValues
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error batch adding cards', error, { cardCount: cards.length });
        throw error;
    } finally {
        client.release();
    }
}

export async function updateCard(updatedCard: Card): Promise<void> {
    const client = await getDbClient();
    try {
        logger.debug('Updating card', {
            cardId: updatedCard.id,
            label: updatedCard.label,
            imageUrl: updatedCard.imageUrl,
            audioUrl: updatedCard.audioUrl
        });

        // Note: 'category' maps to 'type' column in database (NOT NULL with default 'Thing')
        await client.query(
            'UPDATE cards SET label = $1, image_url = $2, audio_url = $3, color = $4, type = $5, board_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
            [updatedCard.label, updatedCard.imageUrl, updatedCard.audioUrl, updatedCard.color || '#6366f1', updatedCard.category || 'Thing', updatedCard.boardId, updatedCard.id]
        );
    } catch (error) {
        logger.error('Error updating card', error, { cardId: updatedCard.id });
        throw error;
    } finally {
        client.release();
    }
}

export async function deleteCard(id: string): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query('DELETE FROM cards WHERE id = $1', [id]);
        logger.debug('Card deleted', { cardId: id });
    } catch (error) {
        logger.error('Error deleting card', error, { cardId: id });
        throw error;
    } finally {
        client.release();
    }
}

export async function updateCardOrders(boardId: string, cardOrders: { id: string; order: number }[]): Promise<void> {
    if (cardOrders.length === 0) return;

    const client = await getDbClient();
    try {
        // Build a single UPDATE using unnest() to batch all order changes in one query
        const ids: string[] = [];
        const orders: number[] = [];
        for (const { id, order } of cardOrders) {
            ids.push(id);
            orders.push(order);
        }

        await client.query(
            `UPDATE cards SET "order" = v.new_order, updated_at = CURRENT_TIMESTAMP
             FROM unnest($1::text[], $2::int[]) AS v(card_id, new_order)
             WHERE cards.id = v.card_id AND cards.board_id = $3`,
            [ids, orders, boardId]
        );

        logger.debug('Card orders updated', { boardId, count: cardOrders.length });
    } catch (error) {
        logger.error('Error updating card orders', error, { boardId });
        throw error;
    } finally {
        client.release();
    }
}

// --- Boards ---

export async function getBoards(userId: string): Promise<Board[]> {
    const client = await getDbClient();
    try {
        const result = await client.query<BoardRow>(
            'SELECT * FROM boards WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url,
            ownerEmail: row.owner_email,
            emailNotificationsEnabled: row.email_notifications_enabled ?? true
        }));
    } catch (error) {
        logger.error('Error getting boards', error, { userId });
        return [];
    } finally {
        client.release();
    }
}

export async function addBoard(board: Board): Promise<void> {
    const client = await getDbClient();
    try {
        logger.info('Adding board', { boardId: board.id, userId: board.userId });
        await client.query(
            'INSERT INTO boards (id, user_id, name, description, created_at, is_public, creator_name, creator_image_url, owner_email, email_notifications_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [board.id, board.userId, board.name, board.description || '', board.createdAt, board.isPublic || false, board.creatorName, board.creatorImageUrl, board.ownerEmail || null, board.emailNotificationsEnabled ?? true]
        );
    } catch (error) {
        logger.error('Error adding board', error, { boardId: board.id });
        throw error;
    } finally {
        client.release();
    }
}

export async function getBoard(id: string, retryOnNotFound: boolean = false): Promise<Board | undefined> {
    const startTime = Date.now();

    const starterBoard = STARTER_BOARDS.find(b => b.id === id);
    if (starterBoard) {
        return starterBoard;
    }

    const client = await getDbClient();
    try {
        const queryStart = Date.now();
        let result = await client.query<BoardRow>(
            'SELECT * FROM boards WHERE id = $1 LIMIT 1',
            [id]
        );
        let queryTime = Date.now() - queryStart;

        // If not found and retry is enabled, wait briefly and try again
        // This handles Postgres read replica lag on Vercel
        if (result.rows.length === 0 && retryOnNotFound) {
            logger.warn('Board not found on first attempt, retrying...', { boardId: id });
            await new Promise(resolve => setTimeout(resolve, 500));

            const retryStart = Date.now();
            result = await client.query<BoardRow>(
                'SELECT * FROM boards WHERE id = $1 LIMIT 1',
                [id]
            );
            queryTime += Date.now() - retryStart;
            logger.info('Retry completed', { boardId: id, found: result.rows.length > 0 });
        }

        if (result.rows.length === 0) {
            logger.info('Board not found', { boardId: id, query_duration_ms: queryTime });
            return undefined;
        }

        const row = result.rows[0];
        const totalTime = Date.now() - startTime;

        logger.debug('Board retrieved', {
            boardId: id,
            name: row.name,
            query_duration_ms: queryTime,
            total_duration_ms: totalTime
        });

        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url,
            ownerEmail: row.owner_email,
            emailNotificationsEnabled: row.email_notifications_enabled ?? true
        };
    } catch (error) {
        const totalTime = Date.now() - startTime;
        logger.error('Failed to get board', error, { boardId: id, duration_ms: totalTime });
        return undefined;
    } finally {
        client.release();
    }
}

export async function updateBoard(updatedBoard: Board): Promise<void> {
    const client = await getDbClient();
    try {
        logger.debug('Updating board', { boardId: updatedBoard.id });
        await client.query(
            'UPDATE boards SET name = $1, description = $2, is_public = $3, creator_name = $4, creator_image_url = $5, owner_email = $6, email_notifications_enabled = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
            [updatedBoard.name, updatedBoard.description || '', updatedBoard.isPublic || false, updatedBoard.creatorName, updatedBoard.creatorImageUrl, updatedBoard.ownerEmail || null, updatedBoard.emailNotificationsEnabled ?? true, updatedBoard.id]
        );
    } catch (error) {
        logger.error('Error updating board', error, { boardId: updatedBoard.id });
        throw error;
    } finally {
        client.release();
    }
}

export async function deleteBoard(id: string): Promise<void> {
    const client = await getDbClient();
    try {
        // Cards will be automatically deleted due to CASCADE
        await client.query('DELETE FROM boards WHERE id = $1', [id]);
        logger.info('Board deleted', { boardId: id });
    } catch (error) {
        logger.error('Error deleting board', error, { boardId: id });
        throw error;
    } finally {
        client.release();
    }
}

export async function getPublicBoards(): Promise<Board[]> {
    const client = await getDbClient();
    try {
        const result = await client.query<BoardRow>(
            'SELECT * FROM boards WHERE is_public = true ORDER BY created_at DESC'
        );

        const dbBoards = result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url,
            ownerEmail: row.owner_email,
            emailNotificationsEnabled: row.email_notifications_enabled ?? true
        }));

        return [...STARTER_BOARDS, ...dbBoards];
    } catch (error) {
        logger.error('Error getting public boards', error);
        return [];
    } finally {
        client.release();
    }
}

export async function getPublicBoardsWithInteractions(userId?: string): Promise<(Board & { likeCount: number, commentCount: number, isLikedByUser: boolean })[]> {
    const client = await getDbClient();
    try {
        // Fetch DB boards with counts using LEFT JOINs + GROUP BY
        const params: string[] = [];
        let userLikeJoin = '';
        let userLikeSelect = 'false as is_liked_by_user';

        if (userId) {
            params.push(userId);
            userLikeJoin = `LEFT JOIN board_likes ul ON ul.board_id = b.id AND ul.user_id = $1`;
            userLikeSelect = '(ul.id IS NOT NULL) as is_liked_by_user';
        }

        const result = await client.query(
            `SELECT
                b.id, b.user_id, b.name, b.description, b.created_at, b.is_public,
                b.creator_name, b.creator_image_url, b.owner_email, b.email_notifications_enabled,
                COUNT(DISTINCT bl.id) as like_count,
                COUNT(DISTINCT bc.id) as comment_count,
                ${userLikeSelect}
            FROM boards b
            LEFT JOIN board_likes bl ON bl.board_id = b.id
            LEFT JOIN board_comments bc ON bc.board_id = b.id
            ${userLikeJoin}
            WHERE b.is_public = true
            GROUP BY b.id${userId ? ', ul.id' : ''}
            ORDER BY b.created_at DESC`,
            params
        );

        const dbBoards = result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url,
            ownerEmail: row.owner_email,
            emailNotificationsEnabled: row.email_notifications_enabled ?? true,
            likeCount: parseInt(row.like_count),
            commentCount: parseInt(row.comment_count),
            isLikedByUser: row.is_liked_by_user
        }));

        // Enrich starter boards with interaction counts in a single query
        const starterIds = STARTER_BOARDS.map(b => b.id);
        const starterParams: (string | string[])[] = [starterIds];
        let starterUserLikeJoin = '';
        let starterUserLikeSelect = 'false as is_liked_by_user';

        if (userId) {
            starterParams.push(userId);
            starterUserLikeJoin = `LEFT JOIN board_likes ul ON ul.board_id = bl.board_id AND ul.user_id = $2`;
            starterUserLikeSelect = '(ul.id IS NOT NULL) as is_liked_by_user';
        }

        const starterResult = await client.query(
            `SELECT
                bl.board_id,
                COUNT(DISTINCT bl.id) as like_count,
                COUNT(DISTINCT bc.id) as comment_count,
                ${starterUserLikeSelect}
            FROM (SELECT unnest($1::text[]) as board_id) ids
            LEFT JOIN board_likes bl ON bl.board_id = ids.board_id
            LEFT JOIN board_comments bc ON bc.board_id = ids.board_id
            ${starterUserLikeJoin}
            GROUP BY bl.board_id${userId ? ', ul.id' : ''}`,
            starterParams
        );

        const starterInteractions = new Map<string, { likeCount: number, commentCount: number, isLikedByUser: boolean }>();
        starterResult.rows.forEach(row => {
            if (row.board_id) {
                starterInteractions.set(row.board_id, {
                    likeCount: parseInt(row.like_count),
                    commentCount: parseInt(row.comment_count),
                    isLikedByUser: row.is_liked_by_user
                });
            }
        });

        const enrichedStarterBoards = STARTER_BOARDS.map(b => ({
            ...b,
            likeCount: starterInteractions.get(b.id)?.likeCount ?? 0,
            commentCount: starterInteractions.get(b.id)?.commentCount ?? 0,
            isLikedByUser: starterInteractions.get(b.id)?.isLikedByUser ?? false
        }));

        return [...enrichedStarterBoards, ...dbBoards];
    } catch (error) {
        logger.error('Error getting public boards with interactions', error, { userId });
        throw error;
    } finally {
        client.release();
    }
}

// ============= LIKES =============

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function likeBoardByUser(boardId: string, userId: string, userName: string): Promise<void> {
    const client = await getDbClient();
    try {
        const id = crypto.randomUUID();
        await client.query(
            'INSERT INTO board_likes (id, user_id, board_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, board_id) DO NOTHING',
            [id, userId, boardId]
        );
    } finally {
        client.release();
    }
}

export async function unlikeBoardByUser(boardId: string, userId: string): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query(
            'DELETE FROM board_likes WHERE user_id = $1 AND board_id = $2',
            [userId, boardId]
        );
    } finally {
        client.release();
    }
}

export async function getBoardLikeCount(boardId: string): Promise<number> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'SELECT COUNT(*) FROM board_likes WHERE board_id = $1',
            [boardId]
        );
        return parseInt(result.rows[0].count);
    } finally {
        client.release();
    }
}

export async function isUserLikedBoard(boardId: string, userId: string): Promise<boolean> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'SELECT 1 FROM board_likes WHERE user_id = $1 AND board_id = $2',
            [userId, boardId]
        );
        return result.rows.length > 0;
    } finally {
        client.release();
    }
}

// ============= COMMENTS =============

interface CommentRow {
    id: string;
    user_id: string;
    board_id: string;
    content: string;
    commenter_name: string;
    commenter_image_url: string | null;
    created_at: Date;
    updated_at: Date;
    is_edited: boolean;
}

export async function addComment(
    boardId: string,
    userId: string,
    content: string,
    commenterName: string,
    commenterImageUrl?: string
): Promise<BoardComment> {
    const client = await getDbClient();
    try {
        const id = crypto.randomUUID();
        const result = await client.query<CommentRow>(
            `INSERT INTO board_comments (id, user_id, board_id, content, commenter_name, commenter_image_url)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [id, userId, boardId, content, commenterName, commenterImageUrl || null]
        );

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            boardId: row.board_id,
            content: row.content,
            commenterName: row.commenter_name,
            commenterImageUrl: row.commenter_image_url || undefined,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            isEdited: row.is_edited
        };
    } finally {
        client.release();
    }
}

export async function updateComment(commentId: string, userId: string, content: string): Promise<BoardComment | null> {
    const client = await getDbClient();
    try {
        const result = await client.query<CommentRow>(
            `UPDATE board_comments
             SET content = $1, updated_at = NOW(), is_edited = true
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [content, commentId, userId]
        );

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            boardId: row.board_id,
            content: row.content,
            commenterName: row.commenter_name,
            commenterImageUrl: row.commenter_image_url || undefined,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            isEdited: row.is_edited
        };
    } finally {
        client.release();
    }
}

export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'DELETE FROM board_comments WHERE id = $1 AND user_id = $2',
            [commentId, userId]
        );
        return result.rowCount !== null && result.rowCount > 0;
    } finally {
        client.release();
    }
}

export async function getCommentsByBoard(boardId: string): Promise<BoardComment[]> {
    const client = await getDbClient();
    try {
        const result = await client.query<CommentRow>(
            'SELECT * FROM board_comments WHERE board_id = $1 ORDER BY created_at DESC',
            [boardId]
        );

        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            boardId: row.board_id,
            content: row.content,
            commenterName: row.commenter_name,
            commenterImageUrl: row.commenter_image_url || undefined,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            isEdited: row.is_edited
        }));
    } finally {
        client.release();
    }
}

export async function getBoardCommentCount(boardId: string): Promise<number> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'SELECT COUNT(*) FROM board_comments WHERE board_id = $1',
            [boardId]
        );
        return parseInt(result.rows[0].count);
    } finally {
        client.release();
    }
}
