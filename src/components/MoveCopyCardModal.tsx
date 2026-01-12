'use client';

import { useState, useEffect } from 'react';
import { X, Copy, ArrowRight, Loader2 } from 'lucide-react';
import { Card, Board } from '@/types';
import { toast } from 'sonner';
import clsx from 'clsx';

interface MoveCopyCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (action: 'move' | 'copy') => void;
    card: Card;
    currentBoardId: string;
}

export default function MoveCopyCardModal({ isOpen, onClose, onSuccess, card, currentBoardId }: MoveCopyCardModalProps) {
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');
    const [action, setAction] = useState<'move' | 'copy'>('copy');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingBoards, setIsLoadingBoards] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadBoards();
        }
    }, [isOpen]);

    // Auto-select if only one board available
    useEffect(() => {
        if (boards.length === 1 && !selectedBoardId) {
            setSelectedBoardId(boards[0].id);
        }
    }, [boards, selectedBoardId]);

    const loadBoards = async () => {
        setIsLoadingBoards(true);
        try {
            // Get user's boards
            const userRes = await fetch('/api/user');
            const userData = await userRes.json();

            const boardsRes = await fetch(`/api/boards?userId=${userData.userId}`);
            if (boardsRes.ok) {
                const allBoards = await boardsRes.json();
                // Filter out current board
                const otherBoards = allBoards.filter((b: Board) => b.id !== currentBoardId);
                setBoards(otherBoards);
            }
        } catch (error) {
            console.error('Error loading boards:', error);
            toast.error('Failed to load boards');
        } finally {
            setIsLoadingBoards(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBoardId) {
            toast.error('Please select a board');
            return;
        }

        setIsLoading(true);
        try {
            if (action === 'copy') {
                // Copy card to new board
                const res = await fetch('/api/cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        label: card.label,
                        imageUrl: card.imageUrl,
                        audioUrl: card.audioUrl,
                        boardId: selectedBoardId,
                        color: card.color,
                        type: card.type
                    })
                });

                if (!res.ok) throw new Error('Failed to copy card');
                toast.success(`Card copied successfully!`);
            } else {
                // Move card to new board
                const res = await fetch(`/api/cards/${card.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...card,
                        boardId: selectedBoardId
                    })
                });

                if (!res.ok) throw new Error('Failed to move card');
                toast.success(`Card moved successfully!`);
            }

            onSuccess(action);
            onClose();
        } catch (error) {
            console.error(`Error ${action}ing card:`, error);
            toast.error(`Failed to ${action} card`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedBoard = boards.find(b => b.id === selectedBoardId);
    const actionVerb = action === 'copy' ? 'Copy' : 'Move';
    const actionVerbLower = action === 'copy' ? 'copy' : 'move';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden glass-card">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {selectedBoard ? `${actionVerb} card to "${selectedBoard.name}"` : `${actionVerb} Card`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Card Preview */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedBoard
                                ? `${actionVerb} card to "${selectedBoard.name}"`
                                : `Choose board to ${actionVerbLower} card to`
                            }
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <img
                                src={card.imageUrl}
                                alt={card.label}
                                className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 dark:text-white">{card.label}</p>
                                <p className="text-xs text-gray-500">{card.type}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Toggle */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Action
                        </label>
                        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1.5">
                            <button
                                type="button"
                                onClick={() => setAction('copy')}
                                className={clsx(
                                    "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2",
                                    action === 'copy'
                                        ? "bg-white dark:bg-slate-700 shadow-md text-primary"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                <Copy className="w-4 h-4" />
                                Copy
                            </button>
                            <button
                                type="button"
                                onClick={() => setAction('move')}
                                className={clsx(
                                    "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2",
                                    action === 'move'
                                        ? "bg-white dark:bg-slate-700 shadow-md text-primary"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                <ArrowRight className="w-4 h-4" />
                                Move
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 px-1">
                            {action === 'copy'
                                ? "Create a duplicate in another board (original stays here)"
                                : "Remove from this board and add to another"}
                        </p>
                    </div>

                    {/* Board Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedBoard ? 'Selected Board' : 'Choose Destination Board'}
                        </label>
                        {isLoadingBoards ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : boards.length === 0 ? (
                            <div className="text-center p-8 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-sm text-gray-500">No other boards available</p>
                                <p className="text-xs text-gray-400 mt-1">Create a new board to {action} cards to it</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {boards.map((board) => (
                                    <button
                                        key={board.id}
                                        type="button"
                                        onClick={() => setSelectedBoardId(board.id)}
                                        className={clsx(
                                            "w-full text-left p-3 rounded-xl border-2 transition-all",
                                            selectedBoardId === board.id
                                                ? "border-primary bg-primary/5 dark:bg-primary/10"
                                                : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                                        )}
                                    >
                                        <p className="font-bold text-gray-900 dark:text-white">{board.name}</p>
                                        {board.description && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{board.description}</p>
                                        )}
                                        {board.isPublic && (
                                            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                                Public
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !selectedBoardId || boards.length === 0}
                            className={clsx(
                                "px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2",
                                (isLoading || !selectedBoardId || boards.length === 0)
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-primary to-accent hover:shadow-primary/25"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : action === 'copy' ? (
                                <Copy className="w-5 h-5" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                            {action === 'copy' ? 'Copy Card' : 'Move Card'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
