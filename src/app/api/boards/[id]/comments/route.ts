import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { addComment, getCommentsByBoard, getBoard, getBoardCommentCount } from '@/lib/storage';
import { sendCommentNotification } from '@/lib/email';

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

        // Send email notification to board owner (async, don't await)
        const board = await getBoard(boardId);
        if (board && board.ownerEmail && board.emailNotificationsEnabled && board.userId !== userId) {
            // Don't notify if user comments on their own board
            const commentCount = await getBoardCommentCount(boardId);
            console.log('[Comment] Attempting to send email notification for board:', board.name);
            sendCommentNotification(
                board.ownerEmail,
                board.name,
                boardId,
                commenterName,
                content.trim(),
                commentCount
            )
                .then(success => {
                    if (success) {
                        console.log('[Comment] Email sent successfully');
                    } else {
                        console.log('[Comment] Email send returned false - check Resend configuration');
                    }
                })
                .catch(err => console.error('[Comment] Failed to send notification:', err));
        } else {
            // Log why notification was skipped
            console.log('[Comment] Email notification skipped:', {
                hasBoard: !!board,
                hasOwnerEmail: !!board?.ownerEmail,
                emailNotificationsEnabled: board?.emailNotificationsEnabled,
                isSameUser: board?.userId === userId
            });
        }

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error('Error adding comment:', error);
        return NextResponse.json(
            { error: 'Failed to add comment' },
            { status: 500 }
        );
    }
}
