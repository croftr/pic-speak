import { auth } from '@clerk/nextjs/server';
import { getBoard, getCards } from '@/lib/storage';
import { checkIsAdmin } from '@/lib/admin';
import BoardClient from '@/components/BoardClient';
import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface BoardPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BoardPageProps): Promise<Metadata> {
    const { id } = await params;
    const board = await getBoard(id);

    if (!board || !board.isPublic) {
        return {
            title: 'Board - My Voice Board',
        };
    }

    const title = `${board.name} - My Voice Board`;
    const description = board.description || `${board.name} - a communication board on My Voice Board`;

    return {
        title,
        description,
        openGraph: {
            title: board.name,
            description,
        },
    };
}

export default async function BoardPage({ params }: BoardPageProps) {
    const { id } = await params;

    // Fetch authentication and board data in parallel
    const [authResult, board] = await Promise.all([
        auth(),
        getBoard(id)
    ]);

    const { userId } = authResult;

    // Check if board exists
    if (!board) {
        notFound();
    }

    const isOwner = board.userId === userId;

    // Check if user has access to board (public or owner)
    if (!board.isPublic && !isOwner) {
        redirect('/my-boards');
    }

    // Fetch cards and admin status in parallel
    // Optimization: If user is owner, they have edit rights so we don't need to check admin status
    // This saves an external API call
    const [cards, isAdmin] = await Promise.all([
        getCards(id),
        isOwner ? Promise.resolve(false) : checkIsAdmin()
    ]);

    return (
        <BoardClient
            boardId={id}
            initialBoard={board}
            initialCards={cards}
            initialIsOwner={isOwner}
            initialIsAdmin={isAdmin}
        />
    );
}
