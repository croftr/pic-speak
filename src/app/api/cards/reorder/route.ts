import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateCardOrders, getBoard } from '@/lib/storage';
import { checkIsAdmin } from '@/lib/admin';

export async function PUT(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { boardId, cardOrders } = body;

        if (!boardId || !cardOrders || !Array.isArray(cardOrders)) {
            return new NextResponse("Invalid request body", { status: 400 });
        }

        // Verify user owns the board or is admin
        const board = await getBoard(boardId);
        const isAdmin = await checkIsAdmin();
        const isOwner = board && board.userId === userId;

        if (!board || (!isOwner && !isAdmin)) {
            return new NextResponse("Unauthorized access to board", { status: 403 });
        }

        if (boardId.startsWith('starter-')) {
            return new NextResponse("Template boards cannot be reordered", { status: 403 });
        }

        await updateCardOrders(boardId, cardOrders);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering cards:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
