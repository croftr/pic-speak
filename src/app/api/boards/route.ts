import { NextResponse } from 'next/server';
import { getBoards, addBoard } from '@/lib/storage';
import { Board } from '@/types';

export async function GET() {
    const boards = await getBoards();
    return NextResponse.json(boards);
}

export async function POST(request: Request) {
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
