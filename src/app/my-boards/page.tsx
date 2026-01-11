'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function MyBoardsPage() {
    const [boards, setBoards] = useState<any[]>([]); // Using 'any' for now or import type
    const [isLoading, setIsLoading] = useState(true);
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Load boards on mount
    useState(() => {
        fetch('/api/boards')
            .then(res => res.json())
            .then(data => {
                setBoards(data);
                setIsLoading(false);
            })
            .catch(err => console.error(err));
    });

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch('/api/boards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newBoardName })
            });

            if (res.ok) {
                const newBoard = await res.json();
                setBoards([...boards, newBoard]);
                setNewBoardName('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        My Boards
                    </h1>
                    <UserButton />
                </header>

                {/* Create Board Form */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-12">
                    <form onSubmit={handleCreateBoard} className="flex gap-4">
                        <input
                            type="text"
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            placeholder="Enter board name (e.g., 'Daily Routine')"
                            className="flex-1 px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newBoardName.trim() || isCreating}
                            className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary/25"
                        >
                            {isCreating ? 'Creating...' : 'Create Board'}
                        </button>
                    </form>
                </div>

                {/* Boards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-3xl bg-gray-200 dark:bg-slate-800 animate-pulse" />
                        ))
                    ) : boards.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <p className="text-xl text-gray-500">You haven't created any boards yet.</p>
                        </div>
                    ) : (
                        boards.map((board) => (
                            <Link
                                key={board.id}
                                href={`/board/${board.id}`}
                                className="group relative block p-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                    {board.name}
                                </h3>
                                <p className="text-gray-500 line-clamp-2">
                                    {board.description || `${new Date(board.createdAt).toLocaleDateString()} • No description`}
                                </p>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
