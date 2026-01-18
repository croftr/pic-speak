'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, X, Plus, Sparkles } from 'lucide-react';
import { Board } from '@/types';
import { toast } from 'sonner';

interface MyBoardsClientProps {
    initialBoards: Board[];
    initialTemplateBoards: Board[];
}

export default function MyBoardsClient({ initialBoards, initialTemplateBoards }: MyBoardsClientProps) {
    const [boards, setBoards] = useState<Board[]>(initialBoards);
    const [templateBoards] = useState<Board[]>(initialTemplateBoards);

    const router = useRouter();

    // Create Mode State
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardDesc, setNewBoardDesc] = useState('');

    // Template clone state
    const [isCloningTemplate, setIsCloningTemplate] = useState(false);
    const [showTemplateCloneForm, setShowTemplateCloneForm] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [cloneBoardName, setCloneBoardName] = useState('');

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

    const handleCloneTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cloneBoardName.trim() || !selectedTemplateId) return;

        setIsCloningTemplate(true);
        try {
            const res = await fetch('/api/boards/clone-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateBoardId: selectedTemplateId,
                    newBoardName: cloneBoardName
                })
            });

            if (res.ok) {
                const { board, cardCount } = await res.json();
                setBoards([...boards, board]);
                setCloneBoardName('');
                setSelectedTemplateId('');
                setShowTemplateCloneForm(false);
                toast.success(`Template board created with ${cardCount} cards!`);
                router.push(`/board/${board.id}`);
            } else {
                toast.error('Failed to create board from template');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to create board from template');
        } finally {
            setIsCloningTemplate(false);
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

                {/* Template Clone Modal */}
                {showTemplateCloneForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-amber-500" />
                                    Use Template
                                </h2>
                                <button onClick={() => setShowTemplateCloneForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleCloneTemplate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Board Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={cloneBoardName}
                                        onChange={(e) => setCloneBoardName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                                        placeholder="e.g., My Daily Words"
                                    />
                                </div>
                                <p className="text-sm text-gray-500">
                                    This will create a new board with all cards from the template. You can remove individual cards but cannot edit template cards.
                                </p>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplateCloneForm(false)}
                                        className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCloningTemplate || !cloneBoardName.trim()}
                                        className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        {isCloningTemplate ? 'Creating...' : 'Use Template'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Template Boards Section */}
                {templateBoards.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-6 h-6 text-amber-500" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Templates</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {templateBoards.map((template) => (
                                <div
                                    key={template.id}
                                    className="group relative p-5 sm:p-6 md:p-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl sm:rounded-3xl border-2 border-amber-200 dark:border-amber-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-white" />
                                        <span className="text-[10px] font-bold text-white uppercase">Template</span>
                                    </div>

                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 pr-16 sm:pr-20">
                                        {template.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 min-h-[3em] sm:min-h-[4.5em]">
                                        {template.description || 'No description provided.'}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSelectedTemplateId(template.id);
                                            setCloneBoardName(template.name);
                                            setShowTemplateCloneForm(true);
                                        }}
                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Use This Template
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Boards Header */}
                {boards.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Boards</h2>
                    </div>
                )}

                {/* Boards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {boards.length === 0 ? (
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
                                onMouseEnter={() => {
                                    // Prefetch board data on hover for instant navigation
                                    router.prefetch(`/board/${board.id}`);
                                }}
                                className="group relative block p-5 sm:p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            router.push(`/board/${board.id}?edit=true`);
                                        }}
                                        className="p-3 sm:p-3.5 md:p-4 bg-primary/10 dark:bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center touch-manipulation min-w-[48px] min-h-[48px] sm:min-w-[52px] sm:min-h-[52px]"
                                        title="Edit Board"
                                        aria-label={`Edit ${board.name} board`}
                                    >
                                        <Pencil className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
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
        </main>
    );
}
