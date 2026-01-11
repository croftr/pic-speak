import { NextResponse } from 'next/server';
import { getBoards, addBoard } from '@/lib/storage';
import { Board } from '@/types';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const boards = await getBoards(userId);
    return NextResponse.json(boards);
}

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const newBoard: Board = {
            id: crypto.randomUUID(),
            userId,
            name,
            description: description || '',
            createdAt: new Date().toISOString()
        };

        await addBoard(newBoard);

        return NextResponse.json(newBoard, { status: 201 });
    } catch (error) {
        console.error('Error adding board:', error);
        return NextResponse.json(
            { error: 'Failed to add board' },
            { status: 500 }
        );
    }
}
