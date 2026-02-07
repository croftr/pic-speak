'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Search, ChevronLeft, Check, Globe, User, AlertTriangle, CheckSquare, Square, Minus } from 'lucide-react';
import { Card, Board } from '@/types';
import { toast } from 'sonner';
import Image from 'next/image';

interface MergeBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMergeComplete: (addedCards: Card[]) => void;
    boardId: string;
    existingCards: Card[];
}

type Phase = 'pick-board' | 'review';
type BoardSource = 'mine' | 'public';

export default function MergeBoardModal({ isOpen, onClose, onMergeComplete, boardId, existingCards }: MergeBoardModalProps) {
    const [phase, setPhase] = useState<Phase>('pick-board');
    const [boardSource, setBoardSource] = useState<BoardSource>('mine');
    const [myBoards, setMyBoards] = useState<Board[]>([]);
    const [publicBoards, setPublicBoards] = useState<Board[]>([]);
    const [isLoadingBoards, setIsLoadingBoards] = useState(true);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [sourceCards, setSourceCards] = useState<Card[]>([]);
    const [isLoadingCards, setIsLoadingCards] = useState(false);
    const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
    const [conflictCardIds, setConflictCardIds] = useState<Set<string>>(new Set());

    const [isMerging, setIsMerging] = useState(false);

    // Build a set of existing labels for conflict detection
    const existingLabels = useMemo(() => {
        return new Set(existingCards.map(c => c.label.trim().toLowerCase()));
    }, [existingCards]);

    useEffect(() => {
        if (isOpen) {
            loadBoards();
        } else {
            // Reset all state when modal closes
            setPhase('pick-board');
            setBoardSource('mine');
            setSelectedBoard(null);
            setSourceCards([]);
            setSelectedCardIds(new Set());
            setConflictCardIds(new Set());
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadBoards = async () => {
        setIsLoadingBoards(true);
        try {
            const [myRes, publicRes] = await Promise.all([
                fetch('/api/boards'),
                fetch('/api/boards/public'),
            ]);

            if (myRes.ok) {
                const boards: Board[] = await myRes.json();
                setMyBoards(boards.filter(b => b.id !== boardId));
            }
            if (publicRes.ok) {
                const boards: Board[] = await publicRes.json();
                setPublicBoards(boards.filter(b => b.id !== boardId));
            }
        } catch (error) {
            console.error('Error loading boards:', error);
            toast.error('Failed to load boards');
        } finally {
            setIsLoadingBoards(false);
        }
    };

    const handleSelectBoard = async (board: Board) => {
        setSelectedBoard(board);
        setIsLoadingCards(true);
        setSearchQuery('');

        try {
            const res = await fetch(`/api/cards?boardId=${board.id}`);
            if (!res.ok) throw new Error('Failed to load cards');

            const cards: Card[] = await res.json();
            setSourceCards(cards);

            // Detect conflicts
            const conflicts = new Set<string>();
            const selectable = new Set<string>();

            for (const card of cards) {
                const normalizedLabel = card.label.trim().toLowerCase();
                if (normalizedLabel && existingLabels.has(normalizedLabel)) {
                    conflicts.add(card.id);
                } else {
                    selectable.add(card.id);
                }
            }

            setConflictCardIds(conflicts);
            setSelectedCardIds(selectable);
            setPhase('review');
        } catch (error) {
            console.error('Error loading board cards:', error);
            toast.error('Failed to load cards from board');
        } finally {
            setIsLoadingCards(false);
        }
    };

    const handleBackToBoards = () => {
        setPhase('pick-board');
        setSelectedBoard(null);
        setSourceCards([]);
        setSelectedCardIds(new Set());
        setConflictCardIds(new Set());
        setSearchQuery('');
    };

    const toggleCard = (cardId: string) => {
        setSelectedCardIds(prev => {
            const next = new Set(prev);
            if (next.has(cardId)) {
                next.delete(cardId);
            } else {
                next.add(cardId);
            }
            return next;
        });
    };

    const selectableCards = sourceCards.filter(c => !conflictCardIds.has(c.id));
    const conflictCards = sourceCards.filter(c => conflictCardIds.has(c.id));
    const selectedCount = selectedCardIds.size;
    const allSelected = selectableCards.length > 0 && selectableCards.every(c => selectedCardIds.has(c.id));
    const noneSelected = selectableCards.every(c => !selectedCardIds.has(c.id));

    const handleToggleAll = () => {
        if (allSelected) {
            setSelectedCardIds(new Set());
        } else {
            setSelectedCardIds(new Set(selectableCards.map(c => c.id)));
        }
    };

    // Determine if the selected board is owned by the current user
    // If it's in "myBoards" list, the user owns it
    const isOwnBoard = selectedBoard ? myBoards.some(b => b.id === selectedBoard.id) : false;

    const handleMerge = async () => {
        if (selectedCount === 0 || !selectedBoard) return;

        setIsMerging(true);
        try {
            const cardsToMerge = sourceCards
                .filter(c => selectedCardIds.has(c.id))
                .map(card => ({
                    label: card.label,
                    imageUrl: card.imageUrl,
                    audioUrl: card.audioUrl,
                    color: card.color,
                    category: card.category,
                    // Only set sourceBoardId for cards from other users' public boards
                    sourceBoardId: isOwnBoard ? undefined : selectedBoard.id,
                    templateKey: card.templateKey || undefined,
                }));

            const res = await fetch('/api/cards/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boardId,
                    cards: cardsToMerge,
                }),
            });

            if (!res.ok) {
                if (res.status === 409) {
                    toast.error('All selected cards already exist on your board');
                    return;
                }
                throw new Error('Failed to merge cards');
            }

            const newCards: Card[] = await res.json();
            toast.success(`${newCards.length} card${newCards.length !== 1 ? 's' : ''} merged successfully!`);
            onMergeComplete(newCards);
            onClose();
        } catch (error) {
            console.error('Error merging cards:', error);
            toast.error('Failed to merge cards');
        } finally {
            setIsMerging(false);
        }
    };

    // Filter boards by search
    const displayBoards = boardSource === 'mine' ? myBoards : publicBoards;
    const filteredBoards = displayBoards.filter(board =>
        board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (board.description && board.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (board.creatorName && board.creatorName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3">
                        {phase === 'review' && (
                            <button
                                onClick={handleBackToBoards}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {phase === 'pick-board' ? 'Merge Board' : selectedBoard?.name}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {phase === 'pick-board'
                                    ? 'Choose a board to merge cards from'
                                    : `Review cards to add${selectedBoard?.creatorName ? ` from ${selectedBoard.creatorName}` : ''}`
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {phase === 'pick-board' ? (
                    <>
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <button
                                onClick={() => { setBoardSource('mine'); setSearchQuery(''); }}
                                className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                                    boardSource === 'mine'
                                        ? 'text-primary border-b-2 border-primary'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                My Boards
                            </button>
                            <button
                                onClick={() => { setBoardSource('public'); setSearchQuery(''); }}
                                className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                                    boardSource === 'public'
                                        ? 'text-primary border-b-2 border-primary'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <Globe className="w-4 h-4" />
                                Public Boards
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search boards..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Board List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isLoadingBoards ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : filteredBoards.length === 0 ? (
                                <div className="text-center p-12">
                                    {boardSource === 'mine' ? (
                                        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    ) : (
                                        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    )}
                                    <p className="text-gray-500">
                                        {searchQuery
                                            ? 'No boards match your search'
                                            : boardSource === 'mine'
                                                ? 'No other boards to merge from'
                                                : 'No public boards available'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {filteredBoards.map((board) => (
                                        <button
                                            key={board.id}
                                            onClick={() => handleSelectBoard(board)}
                                            disabled={isLoadingCards}
                                            className="text-left p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50"
                                        >
                                            <div className="flex items-start gap-3">
                                                {board.creatorImageUrl ? (
                                                    <Image
                                                        src={board.creatorImageUrl}
                                                        alt={board.creatorName || ''}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shrink-0">
                                                        {(board.creatorName || board.name || 'B')[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                                        {board.name}
                                                    </h3>
                                                    {board.description && (
                                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                            {board.description}
                                                        </p>
                                                    )}
                                                    {boardSource === 'public' && board.creatorName && (
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            by {board.creatorName}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Review Phase */}
                        {isLoadingCards ? (
                            <div className="flex-1 flex items-center justify-center p-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : sourceCards.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center p-12">
                                <div className="text-center">
                                    <p className="text-gray-500 text-lg">This board has no cards</p>
                                    <button
                                        onClick={handleBackToBoards}
                                        className="mt-4 text-primary font-semibold hover:underline"
                                    >
                                        Choose a different board
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Select All / Summary Bar */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                                    <button
                                        onClick={handleToggleAll}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                                        disabled={selectableCards.length === 0}
                                    >
                                        {allSelected ? (
                                            <CheckSquare className="w-5 h-5 text-primary" />
                                        ) : noneSelected ? (
                                            <Square className="w-5 h-5" />
                                        ) : (
                                            <Minus className="w-5 h-5 text-primary" />
                                        )}
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="font-medium text-primary">{selectedCount} selected</span>
                                        {conflictCards.length > 0 && (
                                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                {conflictCards.length} conflict{conflictCards.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Lists */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {/* Cards to Add */}
                                    {selectableCards.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                Cards to Add ({selectableCards.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {selectableCards.map(card => (
                                                    <button
                                                        key={card.id}
                                                        onClick={() => toggleCard(card.id)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                                            selectedCardIds.has(card.id)
                                                                ? 'border-primary/50 bg-primary/5'
                                                                : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                                        }`}
                                                    >
                                                        {selectedCardIds.has(card.id) ? (
                                                            <CheckSquare className="w-5 h-5 text-primary shrink-0" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-gray-400 shrink-0" />
                                                        )}
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-slate-800">
                                                            {card.imageUrl.startsWith('http') ? (
                                                                <Image
                                                                    src={card.imageUrl}
                                                                    alt={card.label}
                                                                    width={48}
                                                                    height={48}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={card.imageUrl}
                                                                    alt={card.label}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                                {card.label}
                                                            </p>
                                                            {card.category && (
                                                                <p className="text-xs text-gray-500 truncate">{card.category}</p>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Conflict Cards */}
                                    {conflictCards.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                Already on Your Board ({conflictCards.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {conflictCards.map(card => (
                                                    <div
                                                        key={card.id}
                                                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 opacity-50"
                                                    >
                                                        <div className="w-5 h-5 shrink-0" />
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-slate-800">
                                                            {card.imageUrl.startsWith('http') ? (
                                                                <Image
                                                                    src={card.imageUrl}
                                                                    alt={card.label}
                                                                    width={48}
                                                                    height={48}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={card.imageUrl}
                                                                    alt={card.label}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-900 dark:text-white truncate line-through">
                                                                {card.label}
                                                            </p>
                                                            {card.category && (
                                                                <p className="text-xs text-gray-500 truncate">{card.category}</p>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full shrink-0">
                                                            Conflict
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* All cards conflict */}
                                    {selectableCards.length === 0 && conflictCards.length > 0 && (
                                        <div className="text-center py-4">
                                            <p className="text-gray-500">All cards from this board already exist on your board.</p>
                                            <button
                                                onClick={handleBackToBoards}
                                                className="mt-3 text-primary font-semibold hover:underline"
                                            >
                                                Choose a different board
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Merge Button */}
                                <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
                                    <button
                                        onClick={handleMerge}
                                        disabled={selectedCount === 0 || isMerging}
                                        className="w-full py-4 bg-gradient-to-r from-primary via-primary to-accent text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isMerging ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Merging...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Merge {selectedCount} Card{selectedCount !== 1 ? 's' : ''}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
