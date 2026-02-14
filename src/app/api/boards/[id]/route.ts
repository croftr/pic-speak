import { NextResponse } from 'next/server';
import { getBoard, updateBoard, deleteBoard, getBoardCardBlobUrls } from '@/lib/storage';
import { del } from '@vercel/blob';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin';
import { validateStringLength } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const board = await getBoard(id);

    if (!board) {
        return new NextResponse("Board not found", { status: 404 });
    }

    // Allow access if board is public or user is the owner or admin
    const { userId } = await auth();
    const isAdmin = await checkIsAdmin();
    if (!board.isPublic && board.userId !== userId && !isAdmin) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    // Cache public boards longer than private boards
    const cacheControl = board.isPublic
        ? 'public, max-age=300, stale-while-revalidate=600'
        : 'private, max-age=60, stale-while-revalidate=300';

    return NextResponse.json(board, {
        headers: {
            'Cache-Control': cacheControl
        }
    });
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const existingBoard = await getBoard(id);

    const isAdmin = await checkIsAdmin();
    const isOwner = existingBoard && existingBoard.userId === userId;

    if (!existingBoard || (!isOwner && !isAdmin)) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    if (id.startsWith('starter-')) {
        return new NextResponse("Template boards cannot be modified", { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, description, isPublic, emailNotificationsEnabled } = body;

        if (name) {
            const nameError = validateStringLength(name, 100, 'Board name');
            if (nameError) {
                return NextResponse.json({ error: nameError }, { status: 400 });
            }
        }

        if (description !== undefined && description) {
            const descError = validateStringLength(description, 500, 'Description');
            if (descError) {
                return NextResponse.json({ error: descError }, { status: 400 });
            }
        }

        // Determine if we need to fetch user email (when making board public for the first time)
        let ownerEmail = existingBoard.ownerEmail;
        const isBecomingPublic = isPublic === true && !existingBoard.isPublic;

        if (isBecomingPublic && !ownerEmail) {
            // Fetch user's email from Clerk when making board public
            try {
                const client = await clerkClient();
                const user = await client.users.getUser(userId);
                ownerEmail = user.emailAddresses?.[0]?.emailAddress || undefined;
            } catch (error) {
                console.error('Error fetching user email from Clerk:', error);
                // Continue without email if Clerk fails
            }
        }

        const updatedBoard = {
            ...existingBoard,
            name: name || existingBoard.name,
            description: description !== undefined ? description : existingBoard.description,
            isPublic: isPublic !== undefined ? isPublic : existingBoard.isPublic,
            ownerEmail,
            emailNotificationsEnabled: emailNotificationsEnabled !== undefined
                ? emailNotificationsEnabled
                : existingBoard.emailNotificationsEnabled
        };

        await updateBoard(updatedBoard);

        return NextResponse.json(updatedBoard);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update board' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const existingBoard = await getBoard(id);

    const isAdmin = await checkIsAdmin();
    const isOwner = existingBoard && existingBoard.userId === userId;

    if (!existingBoard || (!isOwner && !isAdmin)) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    if (id.startsWith('starter-')) {
        return new NextResponse("Template boards cannot be deleted", { status: 403 });
    }

    try {
        // Collect blob URLs before deleting (cards cascade-delete with the board)
        const blobUrls = await getBoardCardBlobUrls(id);

        await deleteBoard(id);

        // Clean up orphaned blobs in the background (don't block the response)
        if (blobUrls.length > 0) {
            del(blobUrls).catch(err => {
                logger.error('Failed to clean up board blobs', err, { boardId: id, urlCount: blobUrls.length });
            });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete board' },
            { status: 500 }
        );
    }
}
