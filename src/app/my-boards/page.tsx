import { auth } from '@clerk/nextjs/server';
import { getBoards } from '@/lib/storage';
import { Board } from '@/types';
import MyBoardsClient from '@/components/MyBoardsClient';
import { redirect } from 'next/navigation';

async function getUserBoards(): Promise<Board[]> {
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
    }

    const boards = await getBoards(userId);
    return boards;
}

async function getTemplateBoards(): Promise<Board[]> {
    // Fetch template boards (system user)
    const boards = await getBoards('system');
    return boards;
}

export default async function MyBoardsPage() {
    // Fetch data on server in parallel
    const [userBoards, templateBoards] = await Promise.all([
        getUserBoards(),
        getTemplateBoards()
    ]);

    return <MyBoardsClient initialBoards={userBoards} initialTemplateBoards={templateBoards} />;
}
