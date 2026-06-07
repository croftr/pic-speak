import { auth } from '@clerk/nextjs/server';
import { getBoard, getCards } from '@/lib/storage';
import { checkIsAdmin } from '@/lib/admin';
import BoardClient from '@/components/BoardClient';
import { notFound } from 'next/navigation';
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
        alternates: {
            canonical: `/board/${id}`,
        },
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
    // Return 404 rather than redirecting: redirecting unauthenticated crawlers
    // to the robots-disallowed /my-boards page causes "Redirect error" in Google
    // Search Console. A 404 is handled cleanly by crawlers.
    if (!board.isPublic && !isOwner) {
        notFound();
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
