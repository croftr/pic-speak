import { NextResponse } from 'next/server';
import { getBoards, addBoard } from '@/lib/storage';
import { Board } from '@/types';
import { auth, clerkClient } from '@clerk/nextjs/server';

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

        // Fetch user info from Clerk
        let creatorName: string | undefined;
        let creatorImageUrl: string | undefined;
        try {
            const client = await clerkClient();
            const user = await client.users.getUser(userId);
            creatorName = user.fullName || user.firstName || user.username || undefined;
            creatorImageUrl = user.imageUrl || undefined;
        } catch (error) {
            console.error('Error fetching user from Clerk:', error);
            // Continue without creator info if Clerk fails
        }

        const newBoard: Board = {
            id: crypto.randomUUID(),
            userId,
            name,
            description: description || '',
            createdAt: new Date().toISOString(),
            creatorName,
            creatorImageUrl
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
