'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, X, Plus, Sparkles, Layers, Image as ImageIcon, Copy, Loader2 } from 'lucide-react';
import { Board } from '@/types';
import { toast } from 'sonner';
import { useLockMode } from '@/contexts/LockModeContext';
import BoardCoverPicker from './BoardCoverPicker';
import BoardCoverBanner from './BoardCoverBanner';

interface MyBoardsClientProps {
    initialBoards: Board[];
    initialTemplateBoards: Board[];
    initialPublicBoards?: Board[];
}

export default function MyBoardsClient({ initialBoards, initialTemplateBoards, initialPublicBoards = [] }: MyBoardsClientProps) {
    // Drop null/undefined entries defensively — a single bad element in these
    // arrays crashes the whole page when the tiles read board.coverImageUrl
    const [boards, setBoards] = useState<Board[]>(() => (initialBoards ?? []).filter(Boolean));
    const [templateBoards] = useState<Board[]>(() => (initialTemplateBoards ?? []).filter(Boolean));
    const [publicBoards] = useState<Board[]>(() => (initialPublicBoards ?? []).filter(Boolean));

    const router = useRouter();
    const { lock } = useLockMode();

    // Create Mode State
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardDesc, setNewBoardDesc] = useState('');
    const [newBoardCover, setNewBoardCover] = useState<string | null>(null);
    const [showCoverPicker, setShowCoverPicker] = useState(false);
    const [selectedTemplateBoardId, setSelectedTemplateBoardId] = useState<string>('');

    // Combine system templates and public boards for template selection
    const availableTemplates = [...templateBoards, ...publicBoards.filter(pb =>
        // Exclude system template boards that are already in templateBoards
        !templateBoards.some(tb => tb.id === pb.id)
    )];

    // Duplicate board state
    const [duplicatingBoardId, setDuplicatingBoardId] = useState<string | null>(null);

    // Template clone state
    const [isCloningTemplate, setIsCloningTemplate] = useState(false);
    const [showTemplateCloneForm, setShowTemplateCloneForm] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [cloneBoardName, setCloneBoardName] = useState('');

    // Read the server's error message from a failed response, falling back to a default
    const getApiError = async (res: Response, fallback: string): Promise<string> => {
        const data = await res.json().catch(() => null);
        return data?.error || fallback;
    };

    const handleDuplicateBoard = async (board: Board) => {
        if (duplicatingBoardId) return;
        setDuplicatingBoardId(board.id);
        try {
            const res = await fetch('/api/boards/clone-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateBoardId: board.id,
                    newBoardName: `${board.name} copy`,
                    newBoardDesc: board.description || '',
                    coverImageUrl: board.coverImageUrl || undefined
                })
            });

            if (res.ok) {
                const { board: newBoard, cardCount } = await res.json();
                setBoards(prev => [...prev, { ...newBoard, cardCount }]);
                toast.success(`Created "${newBoard.name}"`);
            } else {
                toast.error(await getApiError(res, 'Failed to duplicate board'));
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to duplicate board');
        } finally {
            setDuplicatingBoardId(null);
        }
    };

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;

        setIsCreating(true);
        try {
            // If a template is selected, use the clone-template endpoint
            if (selectedTemplateBoardId) {
                const res = await fetch('/api/boards/clone-template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        templateBoardId: selectedTemplateBoardId,
                        newBoardName: newBoardName,
                        newBoardDesc: newBoardDesc,
                        coverImageUrl: newBoardCover || undefined
                    })
                });

                if (res.ok) {
                    const { board, cardCount } = await res.json();
                    toast.success(`Board created with ${cardCount} cards from template!`);
                    router.push(`/board/${board.id}?edit=true`);
                    return;
                } else {
                    toast.error(await getApiError(res, 'Failed to create board from template'));
                }
            } else {
                // Create an empty board
                const res = await fetch('/api/boards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: newBoardName,
                        description: newBoardDesc,
                        coverImageUrl: newBoardCover || undefined
                    })
                });

                if (res.ok) {
                    const newBoard = await res.json();
                    toast.success('Board created successfully!');
                    router.push(`/board/${newBoard.id}?edit=true`);
                    return;
                } else {
                    toast.error(await getApiError(res, 'Failed to create board'));
                }
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
                if (board) setBoards([...boards, board]);
                setCloneBoardName('');
                setSelectedTemplateId('');
                setShowTemplateCloneForm(false);
                toast.success(`Template board created with ${cardCount} cards!`);
                router.push(`/board/${board.id}`);
            } else {
                toast.error(await getApiError(res, 'Failed to create board from template'));
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to create board from template');
        } finally {
            setIsCloningTemplate(false);
        }
    };

    return (
        <main className="min-h-screen p-3 sm:p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-6 sm:mb-8 md:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl sm:text-4xl font-display font-black text-gray-900 dark:text-white tracking-tight mb-1">
                            My Boards
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
                            Tap <span className="font-bold text-primary">Use</span> to start talking, or <span className="font-bold">Edit</span> to add cards.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex-1 sm:flex-none bg-primary text-primary-foreground px-5 sm:px-6 py-3 rounded-full font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation min-h-[48px]"
                        >
                            <Plus className="w-5 h-5" />
                            New Board
                        </button>
                    </div>
                </header>

                {/* Create Board Modal/Overlay */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 sm:slide-in-from-bottom-0 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-display font-extrabold">Create a Board</h2>
                                <button onClick={() => { setShowCreateForm(false); setNewBoardCover(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full touch-manipulation" aria-label="Close">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateBoard} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Board name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                        placeholder="e.g. Morning Routine, Snack Time"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Description <span className="font-normal text-gray-400">(optional)</span></label>
                                    <textarea
                                        value={newBoardDesc}
                                        onChange={(e) => setNewBoardDesc(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none h-20 resize-none transition-all"
                                        placeholder="Who is this board for?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Cover picture <span className="font-normal text-gray-400">(optional)</span></label>
                                    {newBoardCover ? (
                                        <div className="space-y-2">
                                            <div className="relative w-full aspect-[2/1] max-h-40 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={newBoardCover} alt="Board cover" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCoverPicker(true)}
                                                    className="px-4 py-2 text-sm font-bold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors"
                                                >
                                                    Change
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewBoardCover(null)}
                                                    className="px-4 py-2 text-sm font-bold rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowCoverPicker(true)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary hover:text-primary transition-colors font-medium touch-manipulation"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                            Add a cover picture
                                        </button>
                                    )}
                                    <p className="mt-1 text-xs text-gray-400">Without a cover, the board&apos;s first card image is shown.</p>
                                </div>
                                {availableTemplates.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5">
                                            Start from a template <span className="font-normal text-gray-400">(optional)</span>
                                        </label>
                                        <select
                                            value={selectedTemplateBoardId}
                                            onChange={(e) => setSelectedTemplateBoardId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                        >
                                            <option value="">Start with an empty board</option>
                                            {availableTemplates.map((template) => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name}
                                                    {template.creatorName && template.userId !== 'system' ? ` (by ${template.creatorName})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedTemplateBoardId && (
                                            <p className="mt-2 text-xs text-gray-500">
                                                Cards from the template will be copied to your board. You can add your own cards and delete inherited ones.
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setSelectedTemplateBoardId('');
                                            setNewBoardCover(null);
                                        }}
                                        className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors touch-manipulation"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating || !newBoardName.trim()}
                                        className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20 touch-manipulation"
                                    >
                                        {isCreating ? 'Creating...' : selectedTemplateBoardId ? 'Create from Template' : 'Create Board'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Template Clone Modal */}
                {showTemplateCloneForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 sm:slide-in-from-bottom-0">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-display font-extrabold flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-amber-500" />
                                    Use Template
                                </h2>
                                <button onClick={() => setShowTemplateCloneForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full touch-manipulation" aria-label="Close">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleCloneTemplate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Board name</label>
                                    <input
                                        type="text"
                                        required
                                        value={cloneBoardName}
                                        onChange={(e) => setCloneBoardName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                        placeholder="e.g. My Daily Words"
                                    />
                                </div>
                                <p className="text-sm text-gray-500">
                                    This creates a new board with every card from the template. You can remove cards you don&apos;t need and add your own.
                                </p>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplateCloneForm(false)}
                                        className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors touch-manipulation"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCloningTemplate || !cloneBoardName.trim()}
                                        className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25 touch-manipulation"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        {isCloningTemplate ? 'Creating...' : 'Use Template'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Boards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {boards.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 rotate-3">
                                <Plus className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-2xl font-display font-extrabold text-gray-900 dark:text-white mb-2">Let&apos;s make your first board</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                A board is a set of picture cards that speak when tapped — start with a template or your own photos.
                            </p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center gap-2 touch-manipulation"
                            >
                                <Plus className="w-5 h-5" />
                                Create a Board
                            </button>
                        </div>
                    ) : (
                        boards.map((board) => (
                            <div
                                key={board.id}
                                onMouseEnter={() => {
                                    router.prefetch(`/board/${board.id}`);
                                }}
                                onClick={() => {
                                    document.documentElement.requestFullscreen?.().catch(() => {});
                                    lock(board.id);
                                    router.push(`/board/${board.id}`);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        document.documentElement.requestFullscreen?.().catch(() => {});
                                        lock(board.id);
                                        router.push(`/board/${board.id}`);
                                    }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`Use ${board.name} board`}
                                className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <BoardCoverBanner src={board.coverImageUrl ?? board.fallbackCoverImageUrl} alt="" />
                                <div className="flex flex-col flex-1 p-4 sm:p-5">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="text-lg sm:text-xl font-display font-extrabold text-gray-900 dark:text-white min-w-0 truncate">
                                            {board.name}
                                        </h3>
                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-full border border-gray-100 dark:border-gray-700 flex-shrink-0">
                                            <Layers className="w-3 h-3" />
                                            <span>{board.cardCount || 0}</span>
                                        </div>
                                    </div>
                                    {board.description && (
                                        <p className="text-gray-500 dark:text-gray-400 line-clamp-2 text-xs sm:text-sm leading-relaxed mb-3">
                                            {board.description}
                                        </p>
                                    )}
                                    <div className="mt-auto pt-2 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/board/${board.id}?edit=true`);
                                            }}
                                            className="flex-1 px-4 py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation min-h-[48px]"
                                            aria-label={`Edit ${board.name} board`}
                                        >
                                            <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>Edit Board</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDuplicateBoard(board);
                                            }}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            disabled={duplicatingBoardId !== null}
                                            title="Duplicate board"
                                            className="flex-none px-4 py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary disabled:opacity-50 transition-all flex items-center justify-center touch-manipulation min-h-[48px]"
                                            aria-label={`Duplicate ${board.name} board`}
                                        >
                                            {duplicatingBoardId === board.id ? (
                                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                            ) : (
                                                <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Template Boards Section */}
                {templateBoards.length > 0 && (
                    <div className="mt-12">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-6 h-6 text-amber-500" />
                            <h2 className="text-2xl font-display font-extrabold text-gray-900 dark:text-white">Templates</h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ready-made boards to copy and make your own.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {templateBoards.map((template) => (
                                <div
                                    key={template.id}
                                    className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-800/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="relative">
                                        <BoardCoverBanner src={template.coverImageUrl ?? template.fallbackCoverImageUrl} alt="" />
                                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center gap-1 shadow-md">
                                            <Sparkles className="w-3 h-3 text-white" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wide">Template</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 p-4 sm:p-5">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="text-lg sm:text-xl font-display font-extrabold text-gray-900 dark:text-white min-w-0 truncate">
                                                {template.name}
                                            </h3>
                                            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-100 dark:border-amber-800/60 flex-shrink-0">
                                                <Layers className="w-3 h-3" />
                                                <span>{template.cardCount || 0}</span>
                                            </div>
                                        </div>
                                        {template.description && (
                                            <p className="text-gray-500 dark:text-gray-400 line-clamp-2 text-xs sm:text-sm leading-relaxed mb-3">
                                                {template.description}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => {
                                                setSelectedTemplateId(template.id);
                                                setCloneBoardName(template.name);
                                                setShowTemplateCloneForm(true);
                                            }}
                                            className="w-full mt-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl font-bold shadow-md shadow-amber-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            Use This Template
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Cover picker for the create-board form (no cards yet, so upload/AI only) */}
            <BoardCoverPicker
                isOpen={showCoverPicker}
                onClose={() => setShowCoverPicker(false)}
                onSelected={(url) => {
                    setNewBoardCover(url);
                    setShowCoverPicker(false);
                }}
            />
        </main>
    );
}
