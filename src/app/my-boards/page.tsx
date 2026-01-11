'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X, Plus } from 'lucide-react';
import { Board } from '@/types';
import { toast } from 'sonner';

export default function MyBoardsPage() {
    const [boards, setBoards] = useState<Board[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();

    // Create Mode State
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardDesc, setNewBoardDesc] = useState('');

    // Load boards
    useEffect(() => {
        fetch('/api/boards')
            .then(res => res.json())
            .then(data => {
                setBoards(data);
                setIsLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch('/api/boards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newBoardName,
                    description: newBoardDesc
                })
            });

            if (res.ok) {
                const newBoard = await res.json();
                setBoards([...boards, newBoard]);
                setNewBoardName('');
                setNewBoardDesc('');
                setShowCreateForm(false);
                toast.success('Board created successfully!');
            } else {
                toast.error('Failed to create board');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to create board');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteBoard = async (e: React.MouseEvent, boardId: string) => {
        e.preventDefault(); // Prevent navigation
        if (!confirm('Are you sure you want to delete this board? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/boards/${boardId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setBoards(boards.filter(b => b.id !== boardId));
                toast.success('Board deleted successfully');
            } else {
                toast.error('Failed to delete board');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete board');
        }
    };



    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-950 p-3 sm:p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-6 sm:mb-8 md:mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-1 sm:mb-2">
                            My Boards
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500">Manage your communication boards</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex-1 sm:flex-none bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            New Board
                        </button>
                    </div>
                </header>

                {/* Create Board Modal/Overlay */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Create New Board</h2>
                                <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateBoard} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Board Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                                        placeholder="e.g., Daily Routine"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                                    <textarea
                                        value={newBoardDesc}
                                        onChange={(e) => setNewBoardDesc(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none h-24 resize-none"
                                        placeholder="What is this board for?"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating || !newBoardName.trim()}
                                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Board'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}



                {/* Boards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-3xl bg-gray-200 dark:bg-slate-800 animate-pulse" />
                        ))
                    ) : boards.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <Plus className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No boards yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                Create your first communication board to start adding picture cards.
                            </p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                Create Board
                            </button>
                        </div>
                    ) : (
                        boards.map((board) => (
                            <Link
                                key={board.id}
                                href={`/board/${board.id}`}
                                className="group relative block p-5 sm:p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 sm:gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            router.push(`/board/${board.id}?edit=true`);
                                        }}
                                        className="p-1.5 sm:p-2 bg-white dark:bg-slate-800 rounded-full shadow-md text-gray-500 hover:text-primary transition-colors hover:scale-110 flex items-center justify-center"
                                        title="Edit Board"
                                        aria-label={`Edit ${board.name} board`}
                                    >
                                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteBoard(e, board.id)}
                                        className="p-1.5 sm:p-2 bg-white dark:bg-slate-800 rounded-full shadow-md text-gray-500 hover:text-red-500 transition-colors hover:scale-110"
                                        title="Delete Board"
                                        aria-label={`Delete ${board.name} board`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>

                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 pr-12 sm:pr-16 group-hover:text-primary transition-colors">
                                    {board.name}
                                </h3>
                                <p className="text-gray-500 line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 min-h-[3em] sm:min-h-[4.5em]">
                                    {board.description || 'No description provided.'}
                                </p>
                                <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {new Date(board.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </main >
    );
}
