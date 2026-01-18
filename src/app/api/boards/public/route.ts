import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPublicBoards, getBoardLikeCount, getBoardCommentCount, isUserLikedBoard } from '@/lib/storage';

export async function GET() {
    const { userId } = await auth();

    try {
        const boards = await getPublicBoards();

        // Enrich with interaction counts
        const enrichedBoards = await Promise.all(
            boards.map(async (board) => ({
                ...board,
                likeCount: await getBoardLikeCount(board.id),
                commentCount: await getBoardCommentCount(board.id),
                isLikedByUser: userId ? await isUserLikedBoard(board.id, userId) : false
            }))
        );

        return NextResponse.json(enrichedBoards, {
            headers: {
                'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
            }
        });
    } catch (error) {
        console.error('Error fetching public boards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch public boards' },
            { status: 500 }
        );
    }
}
