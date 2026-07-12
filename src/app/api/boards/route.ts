import { NextResponse } from 'next/server';
import { getBoards, addBoard, getBoardCount } from '@/lib/storage';
import { Board } from '@/types';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { validateStringLength, validateCoverImageUrl } from '@/lib/validation';
import { getMaxBoardsPerUser } from '@/lib/limits';

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const boards = await getBoards(userId);
        return NextResponse.json(boards, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    } catch (error) {
        console.error('Error getting boards:', error);
        return NextResponse.json(
            { error: 'Failed to load boards' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, coverImageUrl } = body;

        // Check board limit
        const maxBoards = await getMaxBoardsPerUser();
        const boardCount = await getBoardCount(userId);
        if (boardCount >= maxBoards) {
            return NextResponse.json(
                { error: `Maximum number of boards (${maxBoards}) reached` },
                { status: 403 }
            );
        }

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const nameError = validateStringLength(name, 100, 'Board name');
        if (nameError) {
            return NextResponse.json({ error: nameError }, { status: 400 });
        }

        if (description) {
            const descError = validateStringLength(description, 500, 'Description');
            if (descError) {
                return NextResponse.json({ error: descError }, { status: 400 });
            }
        }

        if (coverImageUrl) {
            const coverError = validateCoverImageUrl(coverImageUrl);
            if (coverError) {
                return NextResponse.json({ error: coverError }, { status: 400 });
            }
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
            creatorImageUrl,
            coverImageUrl: coverImageUrl || undefined
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
