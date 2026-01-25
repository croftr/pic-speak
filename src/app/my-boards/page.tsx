import { auth } from '@clerk/nextjs/server';
import { getBoards, getPublicBoards } from '@/lib/storage';
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

async function fetchPublicBoards(): Promise<Board[]> {
    // Fetch all public boards that can be used as templates
    const boards = await getPublicBoards();
    return boards;
}

export default async function MyBoardsPage() {
    // Fetch data on server in parallel
    const [userBoards, templateBoards, publicBoards] = await Promise.all([
        getUserBoards(),
        getTemplateBoards(),
        fetchPublicBoards()
    ]);

    return <MyBoardsClient
        initialBoards={userBoards}
        initialTemplateBoards={templateBoards}
        initialPublicBoards={publicBoards}
    />;
}
