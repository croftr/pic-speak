import { NextResponse } from 'next/server';
import { getBoard, updateBoard, deleteBoard, getBoardCardBlobUrls, getBlobUrlsStillInUse } from '@/lib/storage';
import type { Board } from '@/types';
import { del } from '@vercel/blob';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin';
import { validateStringLength, validateCoverImageUrl } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    let board: Board | undefined;
    try {
        board = await getBoard(id);
    } catch {
        return NextResponse.json({ error: 'Failed to load board' }, { status: 500 });
    }

    if (!board) {
        return new NextResponse("Board not found", { status: 404 });
    }

    // Allow access if board is public or user is the owner or admin
    const { userId } = await auth();
    if (!board.isPublic && board.userId !== userId) {
        // Only fall back to the admin check (a Clerk API call) when needed
        const isAdmin = await checkIsAdmin();
        if (!isAdmin) {
            return new NextResponse("Unauthorized", { status: 403 });
        }
    }

    // Cache public boards longer than private boards
    const cacheControl = board.isPublic
        ? 'public, max-age=300, stale-while-revalidate=600'
        : 'no-store, no-cache, must-revalidate, proxy-revalidate';

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
    let existingBoard: Board | undefined;
    try {
        existingBoard = await getBoard(id);
    } catch {
        return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
    }

    const isOwner = existingBoard && existingBoard.userId === userId;
    const isAdmin = existingBoard && !isOwner ? await checkIsAdmin() : false;

    if (!existingBoard || (!isOwner && !isAdmin)) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    if (id.startsWith('starter-')) {
        return new NextResponse("Template boards cannot be modified", { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, description, isPublic, emailNotificationsEnabled, coverImageUrl } = body;

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

        // coverImageUrl semantics: undefined = unchanged, ''/null = clear, string = set
        if (coverImageUrl) {
            const coverError = validateCoverImageUrl(coverImageUrl);
            if (coverError) {
                return NextResponse.json({ error: coverError }, { status: 400 });
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
                : existingBoard.emailNotificationsEnabled,
            coverImageUrl: coverImageUrl !== undefined
                ? (coverImageUrl || undefined)
                : existingBoard.coverImageUrl
        };

        await updateBoard(updatedBoard);

        // Clean up a replaced/cleared cover blob in the background — but only
        // if no card or other board's cover still references it (the cover can
        // be picked directly from a card's image, and cards can be copied
        // across boards)
        const oldCover = existingBoard.coverImageUrl;
        if (coverImageUrl !== undefined && oldCover && oldCover !== updatedBoard.coverImageUrl
            && oldCover.includes('.blob.vercel-storage.com')) {
            getBlobUrlsStillInUse([oldCover])
                .then(inUse => (inUse.has(oldCover) ? Promise.resolve() : del(oldCover)))
                .catch(err => {
                    logger.error('Failed to clean up replaced board cover blob', err, { boardId: id });
                });
        }

        return NextResponse.json(updatedBoard);
    } catch {
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
    let existingBoard: Board | undefined;
    try {
        existingBoard = await getBoard(id);
    } catch {
        return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
    }

    const isOwner = existingBoard && existingBoard.userId === userId;
    const isAdmin = existingBoard && !isOwner ? await checkIsAdmin() : false;

    if (!existingBoard || (!isOwner && !isAdmin)) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    if (id.startsWith('starter-')) {
        return new NextResponse("Template boards cannot be deleted", { status: 403 });
    }

    try {
        // Collect blob URLs before deleting (cards cascade-delete with the board)
        const blobUrls = await getBoardCardBlobUrls(id);
        if (existingBoard.coverImageUrl?.includes('.blob.vercel-storage.com')) {
            blobUrls.push(existingBoard.coverImageUrl);
        }
        // Dedupe: the cover may be one of the card images
        const uniqueBlobUrls = [...new Set(blobUrls)];

        await deleteBoard(id);

        // Clean up orphaned blobs in the background (don't block the response).
        // Cloned/merged/copied cards on other boards share these URLs — now that
        // this board's cards are gone, only delete URLs nothing else references.
        if (uniqueBlobUrls.length > 0) {
            getBlobUrlsStillInUse(uniqueBlobUrls)
                .then(inUse => {
                    const orphaned = uniqueBlobUrls.filter(url => !inUse.has(url));
                    return orphaned.length > 0 ? del(orphaned) : undefined;
                })
                .catch(err => {
                    logger.error('Failed to clean up board blobs', err, { boardId: id, urlCount: uniqueBlobUrls.length });
                });
        }

        return new NextResponse(null, { status: 204 });
    } catch {
        return NextResponse.json(
            { error: 'Failed to delete board' },
            { status: 500 }
        );
    }
}
