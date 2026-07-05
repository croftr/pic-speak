'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, User, Heart, MessageCircle, Layers, Trash2, Globe } from 'lucide-react';
import { Board } from '@/types';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const ConfirmDialog = dynamic(() => import('@/components/ConfirmDialog'), {
    loading: () => null
});
import BoardCoverBanner from '@/components/BoardCoverBanner';

function PublicBoardsContent() {
    const searchParams = useSearchParams();
    const creatorFilter = searchParams.get('creator');

    const [publicBoards, setPublicBoards] = useState<Board[]>([]);
    const [isLoadingBoards, setIsLoadingBoards] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/boards/public')
            .then(res => res.json())
            .then(data => {
                // API errors return {error} instead of an array; a bad entry
                // would crash every tile below, so sanitize before rendering
                setPublicBoards(Array.isArray(data) ? data.filter(Boolean) : []);
                setIsLoadingBoards(false);
            })
            .catch(err => {
                console.error('Error loading public boards:', err);
                setIsLoadingBoards(false);
            });
        fetch('/api/user')
            .then(res => res.json())
            .then(data => {
                setIsAdmin(data.isAdmin);
                setCurrentUserId(data.userId);
            })
            .catch(() => {});
    }, []);

    const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

    const handleDeleteClick = (board: Board) => {
        setBoardToDelete(board);
    };

    const executeDeleteBoard = async (boardId: string) => {
        setDeletingBoardId(boardId);
        try {
            const res = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' });
            if (res.ok) {
                setPublicBoards(boards => boards.filter(b => b.id !== boardId));
                toast.success('Board deleted successfully');
            } else {
                const text = await res.text();
                toast.error(`Failed to delete board: ${text}`);
            }
        } catch {
            toast.error('Failed to delete board. Please try again.');
        } finally {
            setDeletingBoardId(null);
            setBoardToDelete(null);
        }
    };

    // Filter boards by creator if specified
    const displayedBoards = creatorFilter
        ? publicBoards.filter(board => board.userId === creatorFilter)
        : publicBoards;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-gray-900 dark:text-white mb-3">
                    {creatorFilter ? `Boards by ${displayedBoards[0]?.creatorName || 'Creator'}` : 'Explore Boards'}
                </h1>
                <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                    {creatorFilter
                        ? 'All public boards from this creator'
                        : 'Ready-made communication boards shared by the community — open one to try it, or copy it as a starting point.'}
                </p>
            </div>

            {isLoadingBoards ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="w-full aspect-[2/1] bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            <div className="p-4 sm:p-5 space-y-3">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : displayedBoards.length === 0 ? (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 mx-auto bg-sky-100 dark:bg-sky-900/30 rounded-3xl flex items-center justify-center mb-6 rotate-3">
                        <Globe className="w-10 h-10 text-sky-500" />
                    </div>
                    <h2 className="text-2xl font-display font-extrabold mb-3">No boards here yet</h2>
                    <p className="text-gray-500 mb-8">Be the first to share a board with the community!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {displayedBoards.map((board) => (
                        <div
                            key={board.id}
                            className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        >
                            {/* Stretched link covers the whole card; interactive
                                children below use z-20 to stay clickable.
                                Avoids nesting <a> inside <a> (invalid HTML). */}
                            <Link
                                href={`/board/${board.id}`}
                                aria-label={board.name}
                                className="absolute inset-0 z-10 rounded-3xl"
                            />
                            <div className="relative">
                                <BoardCoverBanner src={board.coverImageUrl ?? board.fallbackCoverImageUrl} alt="" />
                            </div>
                            {(isAdmin || (currentUserId && board.userId === currentUserId)) && !board.id.startsWith('starter-') && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteClick(board);
                                    }}
                                    disabled={deletingBoardId === board.id}
                                    className="absolute top-3 right-3 z-20 px-2.5 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-red-600 dark:text-red-400 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors cursor-pointer shadow-md touch-manipulation"
                                    title={isAdmin && board.userId !== currentUserId ? "Admin: Delete board" : "Delete board"}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deletingBoardId === board.id ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                            <div className="flex flex-col flex-1 p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="text-lg sm:text-xl font-display font-extrabold text-gray-900 dark:text-white min-w-0 truncate group-hover:text-primary transition-colors">
                                        {board.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-full border border-gray-100 dark:border-gray-700 flex-shrink-0" title={`${board.cardCount || 0} cards`}>
                                        <Layers className="w-3 h-3" />
                                        <span>{board.cardCount || 0}</span>
                                    </div>
                                </div>
                                {board.description && (
                                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm line-clamp-2 mb-3">
                                        {board.description}
                                    </p>
                                )}
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
                                        <div className="flex-1 min-w-0 flex items-baseline gap-2">
                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                                {board.creatorName}
                                            </p>
                                            {board.userId && (
                                                <Link
                                                    href={`/public-boards?creator=${board.userId}`}
                                                    className="relative z-20 text-[11px] text-primary hover:underline whitespace-nowrap"
                                                >
                                                    More boards
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Interaction Stats */}
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-gray-800">
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Heart className="w-4 h-4 text-rose-400" />
                                            <span>{board.likeCount || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle className="w-4 h-4 text-sky-400" />
                                            <span>{board.commentCount || 0}</span>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1 text-xs font-bold text-primary">
                                        Open
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={boardToDelete !== null}
                onClose={() => setBoardToDelete(null)}
                onConfirm={() => {
                    if (boardToDelete) {
                        executeDeleteBoard(boardToDelete.id);
                    }
                }}
                title="Delete Board?"
                message={`Are you sure you want to delete "${boardToDelete?.name}"? This will permanently delete the board and all its cards. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}

export default function PublicBoardsPage() {
    return (
        <main className="min-h-screen py-8 sm:py-16">
            <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading...</div>}>
                <PublicBoardsContent />
            </Suspense>
        </main>
    );
}
