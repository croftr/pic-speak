'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Search, ChevronLeft, Check, Globe, Volume2 } from 'lucide-react';
import { Card, Board } from '@/types';
import { toast } from 'sonner';
import clsx from 'clsx';
import Image from 'next/image';

interface PublicCardPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void; // Go back to New Card modal
    onCardSelected: (card: Card) => void;
    boardId: string; // The board we're adding to
}

export default function PublicCardPickerModal({ isOpen, onClose, onBack, onCardSelected, boardId }: PublicCardPickerModalProps) {
    const [publicBoards, setPublicBoards] = useState<Board[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [boardCards, setBoardCards] = useState<Card[]>([]);
    const [isLoadingBoards, setIsLoadingBoards] = useState(true);
    const [isLoadingCards, setIsLoadingCards] = useState(false);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadPublicBoards();
        } else {
            // Reset state when modal closes
            setSelectedBoard(null);
            setBoardCards([]);
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadPublicBoards = async () => {
        setIsLoadingBoards(true);
        try {
            const res = await fetch('/api/boards/public');
            if (res.ok) {
                const boards = await res.json();
                setPublicBoards(boards);
            }
        } catch (error) {
            console.error('Error loading public boards:', error);
            toast.error('Failed to load public boards');
        } finally {
            setIsLoadingBoards(false);
        }
    };

    const loadBoardCards = async (board: Board) => {
        setIsLoadingCards(true);
        setSelectedBoard(board);
        try {
            const res = await fetch(`/api/cards?boardId=${board.id}`);
            if (res.ok) {
                const cards = await res.json();
                setBoardCards(cards);
            }
        } catch (error) {
            console.error('Error loading board cards:', error);
            toast.error('Failed to load cards');
        } finally {
            setIsLoadingCards(false);
        }
    };

    const handleAddCard = async (card: Card) => {
        setIsAddingCard(true);
        try {
            // Copy the card to the user's board
            const res = await fetch('/api/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label: card.label,
                    imageUrl: card.imageUrl,
                    audioUrl: card.audioUrl,
                    boardId: boardId,
                    color: card.color,
                    category: card.category,
                    sourceBoardId: selectedBoard?.id // Mark as inherited from public board
                })
            });

            if (!res.ok) throw new Error('Failed to add card');

            const newCard = await res.json();
            toast.success(`"${card.label}" added to your board!`);
            onCardSelected(newCard);
            onClose();
        } catch (error) {
            console.error('Error adding card:', error);
            toast.error('Failed to add card');
        } finally {
            setIsAddingCard(false);
        }
    };

    const playAudio = (card: Card) => {
        if (!card.audioUrl) return;

        if (playingAudioId === card.id) {
            setPlayingAudioId(null);
            return;
        }

        const audio = new Audio(card.audioUrl);
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = () => {
            setPlayingAudioId(null);
            toast.error('Failed to play audio');
        };
        setPlayingAudioId(card.id);
        audio.play().catch(() => {
            setPlayingAudioId(null);
        });
    };

    // Filter cards based on search query
    const filteredCards = boardCards.filter(card =>
        card.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.category && card.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Filter boards based on search query (when no board is selected)
    const filteredBoards = publicBoards.filter(board =>
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
                        {/* Back button - goes to board list if viewing cards, or back to New Card modal if viewing boards */}
                        <button
                            onClick={() => {
                                if (selectedBoard) {
                                    setSelectedBoard(null);
                                    setBoardCards([]);
                                    setSearchQuery('');
                                } else if (onBack) {
                                    onBack();
                                }
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />
                                {selectedBoard ? selectedBoard.name : 'Browse Public Cards'}
                            </h2>
                            {selectedBoard ? (
                                selectedBoard.creatorName && (
                                    <p className="text-sm text-gray-500">by {selectedBoard.creatorName}</p>
                                )
                            ) : (
                                <p className="text-sm text-gray-500">Pick from community boards</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={selectedBoard ? "Search cards..." : "Search boards..."}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4">
                    {!selectedBoard ? (
                        /* Board List */
                        isLoadingBoards ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : filteredBoards.length === 0 ? (
                            <div className="text-center p-12">
                                <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No public boards found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredBoards.map((board) => (
                                    <button
                                        key={board.id}
                                        onClick={() => loadBoardCards(board)}
                                        className="text-left p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:bg-primary/5 transition-all group"
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
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                                                    {(board.creatorName || 'U')[0].toUpperCase()}
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
                                                <p className="text-xs text-gray-400 mt-2">
                                                    by {board.creatorName || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )
                    ) : (
                        /* Card Grid */
                        isLoadingCards ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : filteredCards.length === 0 ? (
                            <div className="text-center p-12">
                                <p className="text-gray-500">
                                    {searchQuery ? 'No cards match your search' : 'No cards in this board'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {filteredCards.map((card) => (
                                    <div
                                        key={card.id}
                                        className="relative rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-800"
                                    >
                                        {/* Card Image - tap to play audio */}
                                        <button
                                            type="button"
                                            onClick={() => playAudio(card)}
                                            disabled={!card.audioUrl}
                                            className="aspect-square relative w-full block"
                                        >
                                            {card.imageUrl.startsWith('http') ? (
                                                <Image
                                                    src={card.imageUrl}
                                                    alt={card.label}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={card.imageUrl}
                                                    alt={card.label}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}

                                            {/* Audio playing indicator */}
                                            {playingAudioId === card.id && (
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                    <div className="bg-primary text-white p-3 rounded-full">
                                                        <Volume2 className="w-6 h-6" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sound icon hint */}
                                            {card.audioUrl && playingAudioId !== card.id && (
                                                <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full">
                                                    <Volume2 className="w-3 h-3" />
                                                </div>
                                            )}
                                        </button>

                                        {/* Card Label & Add Button */}
                                        <div className="p-2">
                                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate text-center">
                                                {card.label}
                                            </p>
                                            {card.category && (
                                                <p className="text-xs text-gray-500 truncate text-center mb-2">
                                                    {card.category}
                                                </p>
                                            )}
                                            <button
                                                onClick={() => handleAddCard(card)}
                                                disabled={isAddingCard}
                                                className="w-full mt-1 py-2 px-3 bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isAddingCard ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Select
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Footer hint */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-xs text-gray-400">
                        {selectedBoard
                            ? "Tap the checkmark to add a card to your board"
                            : "Browse community boards to find cards"}
                    </p>
                </div>
            </div>
        </div>
    );
}
