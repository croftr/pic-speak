import { Pool, PoolClient } from 'pg';
import { Card, Board, BoardComment } from '@/types';

// Database row types (snake_case from DB)
type CardRow = {
    id: string;
    board_id: string;
    label: string;
    image_url: string;
    audio_url: string;
    color?: string;
    order?: number;
    type: 'Thing' | 'Word';
    template_key?: string;
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
        console.log(`[DB-Pool] Client acquired in ${connectionTime}ms (pool: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting)`);
        return client;
    } catch (error) {
        const connectionTime = Date.now() - startTime;
        console.error(`[DB-Pool] Failed to acquire client after ${connectionTime}ms:`, error);
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
    'tpl-yes': { label: 'Yes', imageUrl: '/prebuilt/yes.png', audioUrl: '/prebuilt/yes.mp3', type: 'Word', templateKey: 'tpl-yes' },
    'tpl-no': { label: 'No', imageUrl: '/prebuilt/no.png', audioUrl: '/prebuilt/no.mp3', type: 'Word', templateKey: 'tpl-no' },
    'tpl-hello': { label: 'Hello', imageUrl: '/prebuilt/hello.png', audioUrl: '/prebuilt/hello.mp3', type: 'Word', templateKey: 'tpl-hello' },
    'tpl-bye': { label: 'Bye', imageUrl: '/prebuilt/bye.png', audioUrl: '/prebuilt/bye.mp3', type: 'Word', templateKey: 'tpl-bye' },
    'tpl-thank-you': { label: 'Thank You', imageUrl: '/prebuilt/thank_you.png', audioUrl: '/prebuilt/thank_you.mp3', type: 'Word', templateKey: 'tpl-thank-you' },
    'tpl-please': { label: 'Please', imageUrl: '/prebuilt/please.png', audioUrl: '/prebuilt/please.mp3', type: 'Word', templateKey: 'tpl-please' },
    'tpl-computer': { label: 'Computer', imageUrl: '/prebuilt/computer.png', audioUrl: '/prebuilt/computer.mp3', type: 'Thing', templateKey: 'tpl-computer' },
    'tpl-tablet': { label: 'Tablet', imageUrl: '/prebuilt/tablet.png', audioUrl: '/prebuilt/tablet.mp3', type: 'Thing', templateKey: 'tpl-tablet' },
    'tpl-mobile-phone': { label: 'Mobile Phone', imageUrl: '/prebuilt/mobile_phone.png', audioUrl: '/prebuilt/mobile_phone.mp3', type: 'Thing', templateKey: 'tpl-mobile-phone' },
    'tpl-bed': { label: 'Bed', imageUrl: '/prebuilt/bed.png', audioUrl: '/prebuilt/bed.mp3', type: 'Thing', templateKey: 'tpl-bed' },
    'tpl-toilet': { label: 'Toilet', imageUrl: '/prebuilt/toilet.png', audioUrl: '/prebuilt/toilet.mp3', type: 'Thing', templateKey: 'tpl-toilet' },
    'tpl-brush-teeth': { label: 'Brush Teeth', imageUrl: '/prebuilt/brush_teeth.png', audioUrl: '/prebuilt/brush_teeth.mp3', type: 'Thing', templateKey: 'tpl-brush-teeth' },
    'tpl-school': { label: 'School', imageUrl: '/prebuilt/school.png', audioUrl: '/prebuilt/school.mp3', type: 'Thing', templateKey: 'tpl-school' },
    'tpl-juice': { label: 'Juice', imageUrl: '/prebuilt/juice.png', audioUrl: '/prebuilt/juice.mp3', type: 'Thing', templateKey: 'tpl-juice' },
    'tpl-chocolate': { label: 'Chocolate', imageUrl: '/prebuilt/chocolate.png', audioUrl: '/prebuilt/chocolate.mp3', type: 'Thing', templateKey: 'tpl-chocolate' },
    'tpl-sweets': { label: 'Sweets', imageUrl: '/prebuilt/sweets.png', audioUrl: '/prebuilt/sweets.mp3', type: 'Thing', templateKey: 'tpl-sweets' },
    'tpl-cake': { label: 'Cake', imageUrl: '/prebuilt/cake.png', audioUrl: '/prebuilt/cake.mp3', type: 'Thing', templateKey: 'tpl-cake' },
    'tpl-apple': { label: 'Apple', imageUrl: '/prebuilt/apple.png', audioUrl: '/prebuilt/apple.mp3', type: 'Thing', templateKey: 'tpl-apple' },
};

// Export for use in other modules
export function getTemplateCard(templateKey: string): Omit<Card, 'id' | 'boardId' | 'order'> | undefined {
    return TEMPLATE_CARDS_REGISTRY[templateKey];
}

const STARTER_CARDS: Record<string, Card[]> = {
    'starter-template': [
        { id: 'sbp-1', boardId: 'starter-template', label: 'Yes', imageUrl: '/prebuilt/yes.png', audioUrl: '/prebuilt/yes.mp3', type: 'Word', order: 0, templateKey: 'tpl-yes' },
        { id: 'sbp-2', boardId: 'starter-template', label: 'No', imageUrl: '/prebuilt/no.png', audioUrl: '/prebuilt/no.mp3', type: 'Word', order: 1, templateKey: 'tpl-no' },
        { id: 'sbp-3', boardId: 'starter-template', label: 'Hello', imageUrl: '/prebuilt/hello.png', audioUrl: '/prebuilt/hello.mp3', type: 'Word', order: 2, templateKey: 'tpl-hello' },
        { id: 'sbp-4', boardId: 'starter-template', label: 'Bye', imageUrl: '/prebuilt/bye.png', audioUrl: '/prebuilt/bye.mp3', type: 'Word', order: 3, templateKey: 'tpl-bye' },
        { id: 'sbp-5', boardId: 'starter-template', label: 'Thank You', imageUrl: '/prebuilt/thank_you.png', audioUrl: '/prebuilt/thank_you.mp3', type: 'Word', order: 4, templateKey: 'tpl-thank-you' },
        { id: 'sbp-6', boardId: 'starter-template', label: 'Please', imageUrl: '/prebuilt/please.png', audioUrl: '/prebuilt/please.mp3', type: 'Word', order: 5, templateKey: 'tpl-please' },
        { id: 'sbp-7', boardId: 'starter-template', label: 'Computer', imageUrl: '/prebuilt/computer.png', audioUrl: '/prebuilt/computer.mp3', type: 'Thing', order: 6, templateKey: 'tpl-computer' },
        { id: 'sbp-8', boardId: 'starter-template', label: 'Tablet', imageUrl: '/prebuilt/tablet.png', audioUrl: '/prebuilt/tablet.mp3', type: 'Thing', order: 7, templateKey: 'tpl-tablet' },
        { id: 'sbp-9', boardId: 'starter-template', label: 'Mobile Phone', imageUrl: '/prebuilt/mobile_phone.png', audioUrl: '/prebuilt/mobile_phone.mp3', type: 'Thing', order: 8, templateKey: 'tpl-mobile-phone' },
        { id: 'sbp-10', boardId: 'starter-template', label: 'Bed', imageUrl: '/prebuilt/bed.png', audioUrl: '/prebuilt/bed.mp3', type: 'Thing', order: 9, templateKey: 'tpl-bed' },
        { id: 'sbp-11', boardId: 'starter-template', label: 'Toilet', imageUrl: '/prebuilt/toilet.png', audioUrl: '/prebuilt/toilet.mp3', type: 'Thing', order: 10, templateKey: 'tpl-toilet' },
        { id: 'sbp-12', boardId: 'starter-template', label: 'Brush Teeth', imageUrl: '/prebuilt/brush_teeth.png', audioUrl: '/prebuilt/brush_teeth.mp3', type: 'Thing', order: 11, templateKey: 'tpl-brush-teeth' },
        { id: 'sbp-13', boardId: 'starter-template', label: 'School', imageUrl: '/prebuilt/school.png', audioUrl: '/prebuilt/school.mp3', type: 'Thing', order: 12, templateKey: 'tpl-school' },
        { id: 'sbp-14', boardId: 'starter-template', label: 'Juice', imageUrl: '/prebuilt/juice.png', audioUrl: '/prebuilt/juice.mp3', type: 'Thing', order: 13, templateKey: 'tpl-juice' },
        { id: 'sbp-15', boardId: 'starter-template', label: 'Chocolate', imageUrl: '/prebuilt/chocolate.png', audioUrl: '/prebuilt/chocolate.mp3', type: 'Thing', order: 14, templateKey: 'tpl-chocolate' },
        { id: 'sbp-16', boardId: 'starter-template', label: 'Sweets', imageUrl: '/prebuilt/sweets.png', audioUrl: '/prebuilt/sweets.mp3', type: 'Thing', order: 15, templateKey: 'tpl-sweets' },
        { id: 'sbp-17', boardId: 'starter-template', label: 'Cake', imageUrl: '/prebuilt/cake.png', audioUrl: '/prebuilt/cake.mp3', type: 'Thing', order: 16, templateKey: 'tpl-cake' },
        { id: 'sbp-18', boardId: 'starter-template', label: 'Apple', imageUrl: '/prebuilt/apple.png', audioUrl: '/prebuilt/apple.mp3', type: 'Thing', order: 17, templateKey: 'tpl-apple' },
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
                    type: template.type,
                    templateKey: row.template_key
                };
            }

            // Regular user-created card
            return {
                id: row.id,
                boardId: row.board_id,
                label: row.label,
                imageUrl: row.image_url,
                audioUrl: row.audio_url,
                color: row.color,
                order: row.order,
                type: row.type || 'Thing'
            };
        });
    } catch (error) {
        console.error('Error getting cards:', error);
        return [];
    } finally {
        client.release();
    }
}

export async function addCard(card: Card): Promise<void> {
    const startTime = Date.now();
    console.log(`[DB-AddCard] Starting for card ${card.id} on board ${card.boardId}`);

    const client = await getDbClient();
    try {
        const queryStart = Date.now();
        // If this is a template card, only store the template key and minimal data
        if (card.templateKey) {
            console.log(`[DB-AddCard] Inserting template card with key: ${card.templateKey}`);
            await client.query(
                'INSERT INTO cards (id, board_id, template_key, "order", color) VALUES ($1, $2, $3, $4, $5)',
                [card.id, card.boardId, card.templateKey, card.order || 0, card.color || '#6366f1']
            );
        } else {
            // Regular user card - store all data
            console.log(`[DB-AddCard] Inserting user card: ${card.label}`);
            await client.query(
                'INSERT INTO cards (id, board_id, label, image_url, audio_url, color, "order", type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [card.id, card.boardId, card.label, card.imageUrl, card.audioUrl, card.color || '#6366f1', card.order || 0, card.type || 'Thing']
            );
        }
        const queryTime = Date.now() - queryStart;
        const totalTime = Date.now() - startTime;
        console.log(`[DB-AddCard] SUCCESS! Query: ${queryTime}ms, Total: ${totalTime}ms`);
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[DB-AddCard] FAILED after ${totalTime}ms for card ${card.id}:`, error);
        console.error(`[DB-AddCard] Error details:`, {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            code: (error as any)?.code,
            detail: (error as any)?.detail,
            constraint: (error as any)?.constraint
        });
        throw error;
    } finally {
        const releaseStart = Date.now();
        client.release();
        console.log(`[DB-AddCard] Client released in ${Date.now() - releaseStart}ms`);
    }
}

export async function batchAddCards(cards: Card[]): Promise<void> {
    if (cards.length === 0) return;

    const client = await getDbClient();
    try {
        await client.query('BEGIN');

        // Separate template cards from regular cards
        const templateCards = cards.filter(c => c.templateKey);
        const regularCards = cards.filter(c => !c.templateKey);

        // Batch insert template cards if any
        if (templateCards.length > 0) {
            const templateValues: any[] = [];
            const templatePlaceholders: string[] = [];
            let paramIndex = 1;

            templateCards.forEach((card) => {
                templateValues.push(
                    card.id,
                    card.boardId,
                    card.templateKey,
                    card.order || 0,
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
            const regularValues: any[] = [];
            const regularPlaceholders: string[] = [];
            let paramIndex = 1;

            regularCards.forEach((card) => {
                regularValues.push(
                    card.id,
                    card.boardId,
                    card.label,
                    card.imageUrl,
                    card.audioUrl,
                    card.color || '#6366f1',
                    card.order || 0,
                    card.type || 'Thing'
                );
                regularPlaceholders.push(
                    `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`
                );
                paramIndex += 8;
            });

            await client.query(
                `INSERT INTO cards (id, board_id, label, image_url, audio_url, color, "order", type) VALUES ${regularPlaceholders.join(',')}`,
                regularValues
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error batch adding cards:', error);
        throw error;
    } finally {
        client.release();
    }
}

export async function updateCard(updatedCard: Card): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query(
            'UPDATE cards SET label = $1, image_url = $2, audio_url = $3, color = $4, type = $5, board_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
            [updatedCard.label, updatedCard.imageUrl, updatedCard.audioUrl, updatedCard.color || '#6366f1', updatedCard.type || 'Thing', updatedCard.boardId, updatedCard.id]
        );
    } catch (error) {
        console.error('Error updating card:', error);
        throw error;
    } finally {
        client.release();
    }
}

export async function deleteCard(id: string): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query('DELETE FROM cards WHERE id = $1', [id]);
    } catch (error) {
        console.error('Error deleting card:', error);
        throw error;
    } finally {
        client.release();
    }
}

export async function updateCardOrders(boardId: string, cardOrders: { id: string; order: number }[]): Promise<void> {
    const client = await getDbClient();
    try {
        // Use a transaction to update all orders atomically
        await client.query('BEGIN');

        for (const { id, order } of cardOrders) {
            await client.query(
                'UPDATE cards SET "order" = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND board_id = $3',
                [order, id, boardId]
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating card orders:', error);
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
            creatorImageUrl: row.creator_image_url
        }));
    } catch (error) {
        console.error('Error getting boards:', error);
        return [];
    } finally {
        client.release();
    }
}

export async function addBoard(board: Board): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query(
            'INSERT INTO boards (id, user_id, name, description, created_at, is_public, creator_name, creator_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [board.id, board.userId, board.name, board.description || '', board.createdAt, board.isPublic || false, board.creatorName, board.creatorImageUrl]
        );
    } catch (error) {
        console.error('Error adding board:', error);
        throw error;
    } finally {
        client.release();
    }
}

export async function getBoard(id: string): Promise<Board | undefined> {
    const startTime = Date.now();
    console.log(`[DB-GetBoard] Looking up board: ${id}`);

    const starterBoard = STARTER_BOARDS.find(b => b.id === id);
    if (starterBoard) {
        console.log(`[DB-GetBoard] Found starter board in ${Date.now() - startTime}ms`);
        return starterBoard;
    }

    const client = await getDbClient();
    try {
        const queryStart = Date.now();
        const result = await client.query<BoardRow>(
            'SELECT * FROM boards WHERE id = $1 LIMIT 1',
            [id]
        );
        const queryTime = Date.now() - queryStart;

        if (result.rows.length === 0) {
            console.log(`[DB-GetBoard] Board not found (query: ${queryTime}ms)`);
            return undefined;
        }

        const row = result.rows[0];
        const totalTime = Date.now() - startTime;
        console.log(`[DB-GetBoard] Found board "${row.name}" in ${totalTime}ms (query: ${queryTime}ms)`);

        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url
        };
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[DB-GetBoard] FAILED after ${totalTime}ms:`, error);
        return undefined;
    } finally {
        client.release();
    }
}

export async function updateBoard(updatedBoard: Board): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query(
            'UPDATE boards SET name = $1, description = $2, is_public = $3, creator_name = $4, creator_image_url = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
            [updatedBoard.name, updatedBoard.description || '', updatedBoard.isPublic || false, updatedBoard.creatorName, updatedBoard.creatorImageUrl, updatedBoard.id]
        );
    } catch (error) {
        console.error('Error updating board:', error);
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
    } catch (error) {
        console.error('Error deleting board:', error);
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
            creatorImageUrl: row.creator_image_url
        }));

        return [...STARTER_BOARDS, ...dbBoards];
    } catch (error) {
        console.error('Error getting public boards:', error);
        return [];
    } finally {
        client.release();
    }
}

// ============= LIKES =============

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
