import { auth } from '@clerk/nextjs/server';
import { getBoard, getCards } from '@/lib/storage';
import PrintBoardClient from '@/components/PrintBoardClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PrintPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PrintPageProps): Promise<Metadata> {
    const { id } = await params;
    const board = await getBoard(id);

    return {
        title: board ? `Print ${board.name} - My Voice Board` : 'Print Board - My Voice Board',
        robots: { index: false },
    };
}

export default async function PrintBoardPage({ params }: PrintPageProps) {
    const { id } = await params;

    const [authResult, board] = await Promise.all([
        auth(),
        getBoard(id)
    ]);

    const { userId } = authResult;

    if (!board) {
        notFound();
    }

    // Same access rule as the board page: owner or public, otherwise 404
    const isOwner = board.userId === userId;
    if (!board.isPublic && !isOwner) {
        notFound();
    }

    const cards = await getCards(id);

    return <PrintBoardClient board={board} cards={cards} />;
}
