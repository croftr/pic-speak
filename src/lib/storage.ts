import { sql } from '@vercel/postgres';
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
};

// Using @vercel/postgres for optimal serverless performance
// This SDK is optimized for Vercel's infrastructure and handles
// connection pooling automatically for both local and production

// --- Cards ---

export async function getCards(boardId?: string): Promise<Card[]> {
    try {
        let result;
        if (boardId) {
            result = await sql<CardRow>`
                SELECT * FROM cards
                WHERE board_id = ${boardId}
                ORDER BY "order" ASC, created_at ASC
            `;
        } else {
            result = await sql<CardRow>`
                SELECT * FROM cards
                ORDER BY created_at ASC
            `;
        }

        return result.rows.map(row => ({
            id: row.id,
            boardId: row.board_id,
            label: row.label,
            imageUrl: row.image_url,
            audioUrl: row.audio_url,
            color: row.color,
            order: row.order
        }));
    } catch (error) {
        console.error('Error getting cards:', error);
        return [];
    }
}

export async function addCard(card: Card): Promise<void> {
    try {
        await sql`
            INSERT INTO cards (id, board_id, label, image_url, audio_url, color, "order")
            VALUES (${card.id}, ${card.boardId}, ${card.label}, ${card.imageUrl}, ${card.audioUrl}, ${card.color || '#6366f1'}, ${card.order || 0})
        `;
    } catch (error) {
        console.error('Error adding card:', error);
        throw error;
    }
}

export async function updateCard(updatedCard: Card): Promise<void> {
    try {
        await sql`
            UPDATE cards
            SET label = ${updatedCard.label},
                image_url = ${updatedCard.imageUrl},
                audio_url = ${updatedCard.audioUrl},
                color = ${updatedCard.color || '#6366f1'},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${updatedCard.id}
        `;
    } catch (error) {
        console.error('Error updating card:', error);
        throw error;
    }
}

export async function deleteCard(id: string): Promise<void> {
    try {
        await sql`DELETE FROM cards WHERE id = ${id}`;
    } catch (error) {
        console.error('Error deleting card:', error);
        throw error;
    }
}

export async function updateCardOrders(boardId: string, cardOrders: { id: string; order: number }[]): Promise<void> {
    try {
        // Use a transaction to update all orders atomically
        for (const { id, order } of cardOrders) {
            await sql`
                UPDATE cards
                SET "order" = ${order}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id} AND board_id = ${boardId}
            `;
        }
    } catch (error) {
        console.error('Error updating card orders:', error);
        throw error;
    }
}

// --- Boards ---

export async function getBoards(userId: string): Promise<Board[]> {
    try {
        const result = await sql<BoardRow>`
            SELECT * FROM boards
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;

        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at
        }));
    } catch (error) {
        console.error('Error getting boards:', error);
        return [];
    }
}

export async function addBoard(board: Board): Promise<void> {
    try {
        await sql`
            INSERT INTO boards (id, user_id, name, description, created_at)
            VALUES (${board.id}, ${board.userId}, ${board.name}, ${board.description || ''}, ${board.createdAt})
        `;
    } catch (error) {
        console.error('Error adding board:', error);
        throw error;
    }
}

export async function getBoard(id: string): Promise<Board | undefined> {
    try {
        const result = await sql<BoardRow>`
            SELECT * FROM boards WHERE id = ${id} LIMIT 1
        `;

        if (result.rows.length === 0) return undefined;

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at
        };
    } catch (error) {
        console.error('Error getting board:', error);
        return undefined;
    }
}

export async function updateBoard(updatedBoard: Board): Promise<void> {
    try {
        await sql`
            UPDATE boards
            SET name = ${updatedBoard.name},
                description = ${updatedBoard.description || ''},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${updatedBoard.id}
        `;
    } catch (error) {
        console.error('Error updating board:', error);
        throw error;
    }
}

export async function deleteBoard(id: string): Promise<void> {
    try {
        // Cards will be automatically deleted due to CASCADE
        await sql`DELETE FROM boards WHERE id = ${id}`;
    } catch (error) {
        console.error('Error deleting board:', error);
        throw error;
    }
}
