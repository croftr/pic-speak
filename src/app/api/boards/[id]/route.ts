import { NextResponse } from 'next/server';
import { getBoard, updateBoard, deleteBoard } from '@/lib/storage';
import { auth } from '@clerk/nextjs/server';

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

    if (!existingBoard || existingBoard.userId !== userId) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, description } = body;

        const updatedBoard = {
            ...existingBoard,
            name: name || existingBoard.name,
            description: description !== undefined ? description : existingBoard.description
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

    if (!existingBoard || existingBoard.userId !== userId) {
        return new NextResponse("Unauthorized", { status: 403 });
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
