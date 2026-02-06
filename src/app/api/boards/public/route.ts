import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPublicBoardsWithInteractions } from '@/lib/storage';

export async function GET() {
    const { userId } = await auth();

    try {
        const enrichedBoards = await getPublicBoardsWithInteractions(userId || undefined);

        return NextResponse.json(enrichedBoards, {
            headers: {
                'Cache-Control': 'public, max-age=10, stale-while-revalidate=30'
            }
        });
    } catch (error) {
        console.error('Error fetching public boards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch public boards' },
            { status: 500 }
        );
    }
}
