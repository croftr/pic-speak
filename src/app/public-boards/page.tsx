'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, User, Heart, MessageCircle, Layers, Trash2 } from 'lucide-react';
import { Board } from '@/types';
import Image from 'next/image';

function PublicBoardsContent() {
    const searchParams = useSearchParams();
    const creatorFilter = searchParams.get('creator');

    const [publicBoards, setPublicBoards] = useState<Board[]>([]);
    const [isLoadingBoards, setIsLoadingBoards] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);

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
        fetch('/api/user')
            .then(res => res.json())
            .then(data => setIsAdmin(data.isAdmin))
            .catch(() => {});
    }, []);

    const handleDeleteBoard = async (boardId: string) => {
        if (!confirm('Are you sure you want to delete this board? This cannot be undone.')) return;
        setDeletingBoardId(boardId);
        try {
            const res = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' });
            if (res.ok) {
                setPublicBoards(boards => boards.filter(b => b.id !== boardId));
            } else {
                const text = await res.text();
                alert(`Failed to delete board: ${text}`);
            }
        } catch {
            alert('Failed to delete board. Please try again.');
        } finally {
            setDeletingBoardId(null);
        }
    };

    // Filter boards by creator if specified
    const displayedBoards = creatorFilter
        ? publicBoards.filter(board => board.userId === creatorFilter)
        : publicBoards;

    return (
        <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                    {creatorFilter ? `Boards by ${displayedBoards[0]?.creatorName || 'Creator'}` : 'Public Boards'}
                </h1>
                <p className="text-lg text-gray-500 max-w-2xl">
                    {creatorFilter ? 'All public boards from this creator' : 'Communication boards shared by our community'}
                </p>
            </div>

            {isLoadingBoards ? (
                <div className="py-20 text-center text-gray-500">Loading public boards...</div>
            ) : displayedBoards.length === 0 ? (
                <div className="py-20 text-center">
                    <h2 className="text-2xl font-bold mb-4">No boards found</h2>
                    <p className="text-gray-500 mb-8">Be the first to share a board with the community!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedBoards.map((board) => (
                        <Link
                            key={board.id}
                            href={`/board/${board.id}`}
                            className="group relative block p-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                        >
                            <div className="absolute top-3 right-3 flex items-center gap-2">
                                {isAdmin && !board.id.startsWith('starter-') && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteBoard(board.id);
                                        }}
                                        disabled={deletingBoardId === board.id}
                                        className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                                        title="Admin: Delete board"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        {deletingBoardId === board.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                )}
                                <div className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Public
                                </div>
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
                                <div className="flex items-center gap-1" title={`${board.cardCount || 0} cards`}>
                                    <Layers className="w-4 h-4" />
                                    <span>{board.cardCount || 0}</span>
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
