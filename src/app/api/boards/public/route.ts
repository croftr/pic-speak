import { NextResponse } from 'next/server';
import { getPublicBoards } from '@/lib/storage';

export async function GET() {
    try {
        const boards = await getPublicBoards();
        return NextResponse.json(boards);
    } catch (error) {
        console.error('Error fetching public boards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch public boards' },
            { status: 500 }
        );
    }
}
