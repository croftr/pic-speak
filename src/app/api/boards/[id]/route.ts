import { NextResponse } from 'next/server';
import { getBoard, updateBoard, deleteBoard } from '@/lib/storage';
import { auth } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin';

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
        const { name, description, isPublic } = body;

        const updatedBoard = {
            ...existingBoard,
            name: name || existingBoard.name,
            description: description !== undefined ? description : existingBoard.description,
            isPublic: isPublic !== undefined ? isPublic : existingBoard.isPublic
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
        await deleteBoard(id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete board' },
            { status: 500 }
        );
    }
}
