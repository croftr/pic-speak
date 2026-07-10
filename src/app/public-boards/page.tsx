import { getPublicBoardsWithInteractions } from '@/lib/storage';
import { Board } from '@/types';
import PublicBoardsClient from '@/components/PublicBoardsClient';

// Boards must be in the server-rendered HTML (not fetched client-side) so
// crawlers see the board names/descriptions and links to /board/* pages.
export const dynamic = 'force-dynamic';

export default async function PublicBoardsPage() {
    let boards: Board[] = [];
    try {
        boards = await getPublicBoardsWithInteractions();
    } catch (error) {
        console.error('Error fetching public boards:', error);
    }

    return <PublicBoardsClient initialBoards={boards} />;
}
