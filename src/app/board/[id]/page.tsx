import { auth } from '@clerk/nextjs/server';
import { getBoard, getCards } from '@/lib/storage';
import { checkIsAdmin } from '@/lib/admin';
import BoardClient from '@/components/BoardClient';
import { redirect } from 'next/navigation';

interface BoardPageProps {
    params: Promise<{ id: string }>;
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
        redirect('/my-boards');
    }

    // Check if user has access to board (public or owner)
    if (!board.isPublic && board.userId !== userId) {
        redirect('/my-boards');
    }

    // Fetch cards and admin status in parallel
    const [cards, isAdmin] = await Promise.all([
        getCards(id),
        checkIsAdmin()
    ]);

    const isOwner = board.userId === userId;

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
