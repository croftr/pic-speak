import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { clerkClient } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin';
import { getAppSettings, getAllBoardsAdmin } from '@/lib/storage';
import { AdminUserSummary, Board } from '@/types';

export const dynamic = 'force-dynamic';

function hasValidBearerToken(request: NextRequest): boolean {
    const expected = process.env.DEVOPS_STATS_TOKEN?.trim();
    if (!expected || expected.length < 16) return false;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const provided = authHeader.slice('Bearer '.length).trim();
    const expectedBuf = Buffer.from(expected, 'utf8');
    const providedBuf = Buffer.from(provided, 'utf8');

    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

const pct = (num: number, den: number) =>
    den > 0 ? Math.round((num / den) * 100) : 0;

export async function GET(request: NextRequest) {
    const authorizedByToken = hasValidBearerToken(request);
    if (!authorizedByToken && !(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const detail = request.nextUrl.searchParams.get('detail') === 'full';

    try {
        const [settings, rawBoards] = await Promise.all([
            getAppSettings(),
            getAllBoardsAdmin(),
        ]);

        let boards: Board[] = rawBoards;
        const clerkUsersSummary: AdminUserSummary[] = [];
        let totalClerkUsers = 0;
        let clerkSynced = false;

        try {
            const client = await clerkClient();
            const pageSize = 500;
            let offset = 0;
            const allClerkUsers = [];

            // Fetch up to 2,500 users (5 pages) safely
            for (let page = 0; page < 5; page++) {
                const res = await client.users.getUserList({
                    limit: pageSize,
                    offset,
                    orderBy: '-created_at',
                });
                if (page === 0) {
                    totalClerkUsers = res.totalCount ?? res.data.length;
                }
                allClerkUsers.push(...res.data);
                if (res.data.length < pageSize || allClerkUsers.length >= totalClerkUsers) {
                    break;
                }
                offset += pageSize;
            }

            clerkSynced = true;

            const userMap = new Map<string, { email: string | null; name: string | null }>();
            for (const u of allClerkUsers) {
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
            }

            boards = boards.map((board) => {
                const clerkUser = userMap.get(board.userId);
                if (clerkUser) {
                    return {
                        ...board,
                        ownerEmail: clerkUser.email || board.ownerEmail,
                        creatorName: clerkUser.name || board.creatorName,
                    };
                }
                return board;
            });
        } catch (error) {
            console.error('Failed to sync users from Clerk in /api/admin/stats:', error);
        }

        // Group boards by user
        const grouped = new Map<
            string,
            {
                userId: string;
                creatorName: string;
                ownerEmail: string;
                boards: Board[];
                totalCards: number;
                customCards: number;
            }
        >();

        for (const board of boards) {
            const userKey = board.userId || 'Unknown';
            let entry = grouped.get(userKey);
            if (!entry) {
                entry = {
                    userId: userKey,
                    creatorName: board.creatorName || 'Unknown User',
                    ownerEmail: board.ownerEmail || 'No Email',
                    boards: [],
                    totalCards: 0,
                    customCards: 0,
                };
                grouped.set(userKey, entry);
            } else {
                if (board.ownerEmail && entry.ownerEmail === 'No Email') {
                    entry.ownerEmail = board.ownerEmail;
                }
                if (board.creatorName && entry.creatorName === 'Unknown User') {
                    entry.creatorName = board.creatorName;
                }
            }
            entry.boards.push(board);
            entry.totalCards += board.cardCount || 0;
            entry.customCards += board.customCardCount || 0;
        }

        const allUserGroups = Array.from(grouped.values());
        const nonSystemUserGroups = allUserGroups.filter((g) => g.userId !== 'system');
        const userIdsWithBoards = new Set(nonSystemUserGroups.map((g) => g.userId));
        const zeroBoardUsers = clerkUsersSummary.filter((u) => !userIdsWithBoards.has(u.id));

        const totalSignedUpUsers = Math.max(
            totalClerkUsers,
            clerkUsersSummary.length,
            nonSystemUserGroups.length
        );
        const usersWithBoardsCount = nonSystemUserGroups.length;
        const usersWithCardsCount = nonSystemUserGroups.filter((g) => g.totalCards > 0).length;
        const usersWithCustomCardsCount = nonSystemUserGroups.filter((g) => g.customCards > 0).length;
        const usersWithEmptyBoardsOnly = usersWithBoardsCount - usersWithCardsCount;
        const usersWithZeroBoardsCount = Math.max(0, totalSignedUpUsers - usersWithBoardsCount);

        const userBoards = boards.filter((b) => b.userId !== 'system');
        const systemBoards = boards.length - userBoards.length;
        const totalCards = boards.reduce((sum, b) => sum + (b.cardCount || 0), 0);
        const totalCustomCards = boards.reduce((sum, b) => sum + (b.customCardCount || 0), 0);
        const publicBoards = boards.filter((b) => b.isPublic).length;
        const totalLikes = boards.reduce((sum, b) => sum + (b.likeCount || 0), 0);
        const totalComments = boards.reduce((sum, b) => sum + (b.commentCount || 0), 0);

        const nowMs = Date.now();
        const ms7d = 7 * 24 * 60 * 60 * 1000;
        const ms30d = 30 * 24 * 60 * 60 * 1000;
        const isWithin = (iso: string | undefined, windowMs: number) => {
            if (!iso) return false;
            const ts = Date.parse(iso);
            return !Number.isNaN(ts) && nowMs - ts <= windowMs;
        };

        const activity = {
            newUsersLast7d: clerkUsersSummary.filter((u) => isWithin(u.createdAt, ms7d)).length,
            newUsersLast30d: clerkUsersSummary.filter((u) => isWithin(u.createdAt, ms30d)).length,
            activeUsersLast7d: clerkUsersSummary.filter((u) => isWithin(u.lastSignInAt, ms7d)).length,
            activeUsersLast30d: clerkUsersSummary.filter((u) => isWithin(u.lastSignInAt, ms30d)).length,
            newBoardsLast7d: userBoards.filter((b) => isWithin(b.createdAt, ms7d)).length,
            newBoardsLast30d: userBoards.filter((b) => isWithin(b.createdAt, ms30d)).length,
        };

        const payload: Record<string, unknown> = {
            generatedAt: new Date().toISOString(),
            clerkSynced,
            summary: {
                signedUpUsers: totalSignedUpUsers,
                totalBoards: boards.length,
                userBoards: userBoards.length,
                systemBoards,
                totalCards,
                totalCustomCards,
                publicBoards,
                totalLikes,
                totalComments,
            },
            activationFunnel: {
                signedUp: { count: totalSignedUpUsers, pct: 100 },
                createdBoard: {
                    count: usersWithBoardsCount,
                    pct: pct(usersWithBoardsCount, totalSignedUpUsers),
                },
                boardHasCards: {
                    count: usersWithCardsCount,
                    pct: pct(usersWithCardsCount, totalSignedUpUsers),
                },
                customCardsAdded: {
                    count: usersWithCustomCardsCount,
                    pct: pct(usersWithCustomCardsCount, totalSignedUpUsers),
                },
                zeroBoards: usersWithZeroBoardsCount,
                emptyBoardsOnly: usersWithEmptyBoardsOnly,
            },
            activity,
            settings: {
                max_boards_per_user: settings.max_boards_per_user ?? '5',
                max_cards_per_board: settings.max_cards_per_board ?? '100',
            },
        };

        if (detail) {
            payload.usersWithBoards = allUserGroups.map((g) => ({
                userId: g.userId,
                name: g.creatorName,
                email: g.ownerEmail,
                boardCount: g.boards.length,
                totalCards: g.totalCards,
                customCards: g.customCards,
                boards: g.boards.map((b) => ({
                    id: b.id,
                    name: b.name,
                    isPublic: b.isPublic,
                    cardCount: b.cardCount || 0,
                    customCardCount: b.customCardCount || 0,
                    likeCount: b.likeCount || 0,
                    commentCount: b.commentCount || 0,
                    createdAt: b.createdAt,
                    updatedAt: b.updatedAt,
                })),
            }));
            payload.zeroBoardUsers = zeroBoardUsers;
        }

        return NextResponse.json(payload, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        console.error('Error generating /api/admin/stats:', error);
        return NextResponse.json(
            { error: 'Failed to load admin stats' },
            { status: 500 }
        );
    }
}
