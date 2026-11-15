import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { getAppSettings, getAllBoardsAdmin } from '@/lib/storage';
import AdminClient from './AdminClient';
import { clerkClient } from '@clerk/nextjs/server';
import { AdminUserSummary } from '@/types';

export default async function AdminPage() {
    const admin = await isAdmin();
    if (!admin) {
        redirect('/');
    }

    const settings = await getAppSettings();
    let boards = await getAllBoardsAdmin();
    const clerkUsersSummary: AdminUserSummary[] = [];
    let totalClerkUsers = 0;

    try {
        // Fetch users from Clerk to guarantee we have their emails and names,
        // even if they only have private boards or haven't created a board yet.
        const client = await clerkClient();
        const userListResponse = await client.users.getUserList({
            limit: 500,
            orderBy: '-created_at',
        });
        const clerkUsers = userListResponse.data;
        totalClerkUsers = userListResponse.totalCount ?? clerkUsers.length;

        const userMap = new Map<string, { email: string | null; name: string | null }>();
        clerkUsers.forEach(u => {
            const email = u.emailAddresses[0]?.emailAddress || null;
            const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || null;
            userMap.set(u.id, { email, name });
            clerkUsersSummary.push({
                id: u.id,
                name: name || 'Unnamed User',
                email: email || 'No Email',
                createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
                lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : undefined,
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

    return (
        <AdminClient
            initialSettings={settings}
            boards={boards}
            clerkUsers={clerkUsersSummary}
            totalClerkUsers={totalClerkUsers}
        />
    );
}
