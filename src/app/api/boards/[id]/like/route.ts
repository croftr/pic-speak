import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { likeBoardByUser, unlikeBoardByUser, isUserLikedBoard, getBoardLikeCount, getBoard } from '@/lib/storage';
import { sendLikeNotification } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

// Toggle like (POST = like, DELETE = unlike)
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Rate limit: 10 likes per minute per user
    const limited = await rateLimit(userId, 'like', 10, 60_000);
    if (limited) return limited;

    try {
        const { id: boardId } = await context.params;

        // Get user details from Clerk
        const user = await currentUser();
        const userName = user?.fullName || user?.firstName || 'Someone';

        await likeBoardByUser(boardId, userId, userName);
        const likeCount = await getBoardLikeCount(boardId);

        // Send email notification to board owner (async, don't await)
        const board = await getBoard(boardId);
        if (board && board.ownerEmail && board.emailNotificationsEnabled && board.userId !== userId) {
            // Don't notify if user likes their own board
            sendLikeNotification(
                board.ownerEmail,
                board.name,
                boardId,
                userName,
                likeCount
            ).catch(err => console.error('[Like] Failed to send notification:', err));
        }

        return NextResponse.json({
            liked: true,
            likeCount
        });
    } catch (error) {
        console.error('Error liking board:', error);
        return NextResponse.json(
            { error: 'Failed to like board' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: boardId } = await context.params;

        await unlikeBoardByUser(boardId, userId);
        const likeCount = await getBoardLikeCount(boardId);

        return NextResponse.json({
            liked: false,
            likeCount
        });
    } catch (error) {
        console.error('Error unliking board:', error);
        return NextResponse.json(
            { error: 'Failed to unlike board' },
            { status: 500 }
        );
    }
}

// Get like status for current user
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();

    try {
        const { id: boardId } = await context.params;
        const likeCount = await getBoardLikeCount(boardId);
        const isLiked = userId ? await isUserLikedBoard(boardId, userId) : false;

        return NextResponse.json({
            liked: isLiked,
            likeCount
        });
    } catch (error) {
        console.error('Error getting like status:', error);
        return NextResponse.json(
            { error: 'Failed to get like status' },
            { status: 500 }
        );
    }
}
