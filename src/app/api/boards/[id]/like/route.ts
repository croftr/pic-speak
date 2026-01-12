import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { likeBoardByUser, unlikeBoardByUser, isUserLikedBoard, getBoardLikeCount } from '@/lib/storage';

// Toggle like (POST = like, DELETE = unlike)
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: boardId } = await context.params;

        // Get user name from Clerk (optional, can pass in body if needed)
        const userName = "User"; // You can get this from Clerk API or pass in request

        await likeBoardByUser(boardId, userId, userName);
        const likeCount = await getBoardLikeCount(boardId);

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
