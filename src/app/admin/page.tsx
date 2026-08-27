import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { getAppSettings, getAllBoardsAdmin } from '@/lib/storage';
import AdminClient from './AdminClient';
import { clerkClient } from '@clerk/nextjs/server';

export default async function AdminPage() {
    const admin = await isAdmin();
    if (!admin) {
        redirect('/');
    }

    const settings = await getAppSettings();
    let boards = await getAllBoardsAdmin();

    try {
        // Fetch users from Clerk to guarantee we have their emails and names,
        // even if they only have private boards which lack this data in the DB.
        const client = await clerkClient();
        const userListResponse = await client.users.getUserList();
        const clerkUsers = userListResponse.data;

        const userMap = new Map();
        clerkUsers.forEach(u => {
            userMap.set(u.id, {
                email: u.emailAddresses[0]?.emailAddress || null,
                name: [u.firstName, u.lastName].filter(Boolean).join(' ') || null
            });
        });

        // Enrich boards with guaranteed Clerk data
        boards = boards.map(board => {
            const clerkUser = userMap.get(board.userId);
            if (clerkUser) {
                return {
                    ...board,
                    ownerEmail: clerkUser.email || board.ownerEmail,
                    creatorName: clerkUser.name || board.creatorName
                };
            }
            return board;
        });
    } catch (error) {
        console.error('Failed to sync users from Clerk in Admin:', error);
    }

    return <AdminClient initialSettings={settings} boards={boards} />;
}
