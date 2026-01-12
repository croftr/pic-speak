import { Pool, PoolClient } from 'pg';
import { Card, Board } from '@/types';

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
    return await pool.connect();
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

const STARTER_CARDS: Record<string, Card[]> = {
    'starter-template': [
        // Word types
        { id: 'sbp-1', boardId: 'starter-template', label: 'Yes', imageUrl: '/prebuilt/yes.png', audioUrl: '/prebuilt/yes.mp3', type: 'Word', order: 0 },
        { id: 'sbp-2', boardId: 'starter-template', label: 'No', imageUrl: '/prebuilt/no.png', audioUrl: '/prebuilt/no.mp3', type: 'Word', order: 1 },
        { id: 'sbp-3', boardId: 'starter-template', label: 'Hello', imageUrl: '/prebuilt/hello.png', audioUrl: '/prebuilt/hello.mp3', type: 'Word', order: 2 },
        { id: 'sbp-4', boardId: 'starter-template', label: 'Bye', imageUrl: '/prebuilt/bye.png', audioUrl: '/prebuilt/bye.mp3', type: 'Word', order: 3 },
        { id: 'sbp-5', boardId: 'starter-template', label: 'Thank You', imageUrl: '/prebuilt/thank_you.png', audioUrl: '/prebuilt/thank_you.mp3', type: 'Word', order: 4 },
        { id: 'sbp-6', boardId: 'starter-template', label: 'Please', imageUrl: '/prebuilt/please.png', audioUrl: '/prebuilt/please.mp3', type: 'Word', order: 5 },
        // Thing types
        { id: 'sbp-7', boardId: 'starter-template', label: 'Computer', imageUrl: '/prebuilt/computer.png', audioUrl: '/prebuilt/computer.mp3', type: 'Thing', order: 6 },
        { id: 'sbp-8', boardId: 'starter-template', label: 'Tablet', imageUrl: '/prebuilt/tablet.png', audioUrl: '/prebuilt/tablet.mp3', type: 'Thing', order: 7 },
        { id: 'sbp-9', boardId: 'starter-template', label: 'Mobile Phone', imageUrl: '/prebuilt/mobile_phone.png', audioUrl: '/prebuilt/mobile_phone.mp3', type: 'Thing', order: 8 },
        { id: 'sbp-10', boardId: 'starter-template', label: 'Bed', imageUrl: '/prebuilt/bed.png', audioUrl: '/prebuilt/bed.mp3', type: 'Thing', order: 9 },
        { id: 'sbp-11', boardId: 'starter-template', label: 'Toilet', imageUrl: '/prebuilt/toilet.png', audioUrl: '/prebuilt/toilet.mp3', type: 'Thing', order: 10 },
        { id: 'sbp-12', boardId: 'starter-template', label: 'Brush Teeth', imageUrl: '/prebuilt/brush_teeth.png', audioUrl: '/prebuilt/brush_teeth.mp3', type: 'Thing', order: 11 },
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

        return result.rows.map(row => ({
            id: row.id,
            boardId: row.board_id,
            label: row.label,
            imageUrl: row.image_url,
            audioUrl: row.audio_url,
            color: row.color,
            order: row.order,
            type: row.type || 'Thing'
        }));
    } catch (error) {
        console.error('Error getting cards:', error);
        return [];
    } finally {
        client.release();
    }
}

export async function addCard(card: Card): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query(
            'INSERT INTO cards (id, board_id, label, image_url, audio_url, color, "order", type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [card.id, card.boardId, card.label, card.imageUrl, card.audioUrl, card.color || '#6366f1', card.order || 0, card.type || 'Thing']
        );
    } catch (error) {
        console.error('Error adding card:', error);
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
    const starterBoard = STARTER_BOARDS.find(b => b.id === id);
    if (starterBoard) return starterBoard;

    const client = await getDbClient();
    try {
        const result = await client.query<BoardRow>(
            'SELECT * FROM boards WHERE id = $1 LIMIT 1',
            [id]
        );

        if (result.rows.length === 0) return undefined;

        const row = result.rows[0];
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
        console.error('Error getting board:', error);
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
