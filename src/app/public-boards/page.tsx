'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, User, Heart, MessageCircle, Layers, Trash2 } from 'lucide-react';
import { Board } from '@/types';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const ConfirmDialog = dynamic(() => import('@/components/ConfirmDialog'), {
    loading: () => null
});
import BoardCoverIcon from '@/components/BoardCoverIcon';

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
                setPublicBoards(data);
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
                        <div
                            key={board.id}
                            className="group relative block p-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                        >
                            {/* Stretched link covers the whole card; interactive
                                children below use relative z-10 to stay clickable.
                                Avoids nesting <a> inside <a> (invalid HTML). */}
                            <Link
                                href={`/board/${board.id}`}
                                aria-label={board.name}
                                className="absolute inset-0 z-0 rounded-2xl"
                            />
                            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                                {(isAdmin || (currentUserId && board.userId === currentUserId)) && !board.id.startsWith('starter-') && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteClick(board);
                                        }}
                                        disabled={deletingBoardId === board.id}
                                        className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                                        title={isAdmin && board.userId !== currentUserId ? "Admin: Delete board" : "Delete board"}
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
                            <div className="flex items-center gap-3 mb-2 pr-16">
                                <BoardCoverIcon src={board.coverImageUrl ?? board.fallbackCoverImageUrl} />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white min-w-0 group-hover:text-primary transition-colors">
                                    {board.name}
                                </h3>
                            </div>
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
                                                className="relative z-10 text-[10px] text-primary hover:underline"
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
        <main className="min-h-screen bg-white dark:bg-slate-950 py-16">
            <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading...</div>}>
                <PublicBoardsContent />
            </Suspense>
        </main>
    );
}
