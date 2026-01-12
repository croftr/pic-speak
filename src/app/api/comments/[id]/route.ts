import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateComment, deleteComment } from '@/lib/storage';

// Update a comment
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: commentId } = await context.params;
        const body = await request.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'Comment content is required' },
                { status: 400 }
            );
        }

        const updatedComment = await updateComment(commentId, userId, content.trim());

        if (!updatedComment) {
            return new NextResponse("Not found or unauthorized", { status: 404 });
        }

        return NextResponse.json(updatedComment);
    } catch (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json(
            { error: 'Failed to update comment' },
            { status: 500 }
        );
    }
}

// Delete a comment
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: commentId } = await context.params;
        const success = await deleteComment(commentId, userId);

        if (!success) {
            return new NextResponse("Not found or unauthorized", { status: 404 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return NextResponse.json(
            { error: 'Failed to delete comment' },
            { status: 500 }
        );
    }
}
