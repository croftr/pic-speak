import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { addComment, getCommentsByBoard } from '@/lib/storage';

// Get all comments for a board
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: boardId } = await context.params;
        const comments = await getCommentsByBoard(boardId);

        return NextResponse.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// Add a comment
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
        const body = await request.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'Comment content is required' },
                { status: 400 }
            );
        }

        // Get user details from Clerk
        const user = await currentUser();
        const commenterName = user?.fullName || user?.firstName || 'Anonymous';
        const commenterImageUrl = user?.imageUrl;

        const comment = await addComment(
            boardId,
            userId,
            content.trim(),
            commenterName,
            commenterImageUrl
        );

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error('Error adding comment:', error);
        return NextResponse.json(
            { error: 'Failed to add comment' },
            { status: 500 }
        );
    }
}
