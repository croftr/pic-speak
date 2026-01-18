'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, User, Heart, MessageCircle } from 'lucide-react';
import { Board } from '@/types';
import Image from 'next/image';

function PublicBoardsContent() {
    const searchParams = useSearchParams();
    const creatorFilter = searchParams.get('creator');

    const [publicBoards, setPublicBoards] = useState<Board[]>([]);
    const [isLoadingBoards, setIsLoadingBoards] = useState(true);

    useEffect(() => {
        fetch('/api/boards/public')
            .then(res => res.json())
            .then(data => {
                setPublicBoards(data);
                setIsLoadingBoards(false);
            })
            .catch(err => {
                console.error('Error loading public boards:', err);
                setIsLoadingBoards(false);
            });
    }, []);

    // Filter boards by creator if specified
    const displayedBoards = creatorFilter
        ? publicBoards.filter(board => board.userId === creatorFilter)
        : publicBoards;

    return (
        <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8 group"
                >
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                    {creatorFilter ? `Boards by ${displayedBoards[0]?.creatorName || 'Creator'}` : 'Explore Public Boards'}
                </h1>
                <p className="text-lg text-gray-500 max-w-2xl">
                    {creatorFilter ? 'All public boards from this creator' : 'Check out these communication boards shared by our community'}
                </p>
            </div>

            {isLoadingBoards ? (
                <div className="py-20 text-center text-gray-500">Loading public boards...</div>
            ) : displayedBoards.length === 0 ? (
                <div className="py-20 text-center">
                    <h2 className="text-2xl font-bold mb-4">No boards found</h2>
                    <p className="text-gray-500 mb-8">Be the first to share a board with the community!</p>
                    <Link href="/" className="text-primary hover:underline font-medium">
                        ← Back to home
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedBoards.map((board) => (
                        <Link
                            key={board.id}
                            href={`/board/${board.id}`}
                            className="group relative block p-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                        >
                            <div className="absolute top-3 right-3 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Public
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 pr-16 group-hover:text-primary transition-colors">
                                {board.name}
                            </h3>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                {board.description || 'No description provided.'}
                            </p>
                            {board.creatorName && (
                                <div className="mb-3 flex items-center gap-2">
                                    {board.creatorImageUrl ? (
                                        <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                                            <Image
                                                src={board.creatorImageUrl}
                                                alt={board.creatorName}
                                                fill
                                                sizes="24px"
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-3 h-3 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                            {board.creatorName}
                                        </p>
                                        {board.userId && (
                                            <Link
                                                href={`/public-boards?creator=${board.userId}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    window.location.href = `/public-boards?creator=${board.userId}`;
                                                }}
                                                className="text-[10px] text-primary hover:underline"
                                            >
                                                View more boards
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Interaction Stats */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <div className="flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    <span>{board.likeCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{board.commentCount || 0}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>
                                    {new Date(board.createdAt).toLocaleDateString()}
                                </span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PublicBoardsPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-slate-950 py-16">
            <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading...</div>}>
                <PublicBoardsContent />
            </Suspense>
        </main>
    );
}
