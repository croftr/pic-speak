import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Public Boards - My Voice Board | Community Communication Boards',
    description: 'Browse free communication boards shared by parents, teachers, and therapists. Find pre-made PECS-style boards for routines, activities, feelings, and more.',
    openGraph: {
        title: 'Public Communication Boards - My Voice Board',
        description: 'Browse free communication boards shared by our community. Find boards for routines, activities, feelings, and more.',
    },
};

export default function PublicBoardsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
