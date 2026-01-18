import { cache } from 'react';
import { Board, Card } from '@/types';

/**
 * Request deduplication for board fetching
 * Multiple components requesting the same board will only trigger one fetch
 */
export const getCachedBoard = cache(async (id: string): Promise<Board | null> => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/boards/${id}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) {
            return null;
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching board:', error);
        return null;
    }
});

/**
 * Request deduplication for cards fetching
 * Multiple components requesting cards for the same board will only trigger one fetch
 */
export const getCachedCards = cache(async (boardId: string): Promise<Card[]> => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/cards?boardId=${boardId}`, {
            next: { revalidate: 30 } // Cache for 30 seconds
        });

        if (!res.ok) {
            return [];
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching cards:', error);
        return [];
    }
});

/**
 * Request deduplication for user boards fetching
 * Multiple components requesting the same user's boards will only trigger one fetch
 */
export const getCachedUserBoards = cache(async (userId: string): Promise<Board[]> => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/boards?userId=${userId}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) {
            return [];
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching user boards:', error);
        return [];
    }
});
