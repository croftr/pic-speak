'use client';

import { useState, useEffect, use } from 'react';
import PecsCard from '@/components/PecsCard';
import AddCardModal from '@/components/AddCardModal';
import { Card, Board } from '@/types';
import { Plus, LayoutGrid, ArrowLeft, Save, Loader2, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import SettingsMenu from '@/components/SettingsMenu';
import { useSettings } from '@/contexts/SettingsContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEditing = searchParams.get('edit') === 'true';
    const { cardSize } = useSettings();

    const unwrappedParams = use(params);
    const [cards, setCards] = useState<Card[]>([]);
    const [board, setBoard] = useState<Board | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingCard, setEditingCard] = useState<Card | null>(null);

    // Edit states
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Search/Filter state
    const [searchTerm, setSearchTerm] = useState('');

    // Keyboard navigation state
    const [focusedCardIndex, setFocusedCardIndex] = useState<number>(-1);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Fetch Cards
                const cardsRes = await fetch(`/api/cards?boardId=${unwrappedParams.id}`);
                if (cardsRes.ok) {
                    const fetchedCards = await cardsRes.json();
                    // Sort by order field (if exists), then by creation order
                    fetchedCards.sort((a: Card, b: Card) => {
                        const orderA = a.order ?? 9999;
                        const orderB = b.order ?? 9999;
                        return orderA - orderB;
                    });
                    setCards(fetchedCards);
                }

                // Fetch Board Info
                const boardsRes = await fetch('/api/boards');
                if (boardsRes.ok) {
                    const boards = await boardsRes.json();
                    const found = boards.find((b: Board) => b.id === unwrappedParams.id);
                    if (found) {
                        setBoard(found);
                        setEditName(found.name);
                        setEditDesc(found.description || '');
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [unwrappedParams.id]);


    const handleCardAdded = (newCard: Card) => {
        setCards(prev => [...prev, newCard]);
    };

    const handleCardUpdated = (updatedCard: Card) => {
        setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
        setEditingCard(null);
        setIsModalOpen(false);
    };

    const handleEditCard = (card: Card) => {
        setEditingCard(card);
        setIsModalOpen(true);
    };

    const handleDeleteCard = async (cardId: string) => {
        try {
            const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
            if (res.ok) {
                setCards(prev => prev.filter(c => c.id !== cardId));
                toast.success('Card deleted successfully');
            } else {
                toast.error('Failed to delete card');
            }
        } catch (error) {
            console.error("Failed to delete card", error);
            toast.error('Failed to delete card');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCard(null);
    };

    const handleSaveBoard = async () => {
        if (!board) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/boards/${board.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    description: editDesc
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setBoard(updated);
                toast.success('Board updated successfully!');
                // Exit edit mode
                router.push(`/board/${board.id}`);
            } else {
                toast.error('Failed to update board');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update board');
        } finally {
            setIsSaving(false);
        }
    };

    // Filter cards based on search term
    const filteredCards = cards.filter(card =>
        card.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = cards.findIndex(card => card.id === active.id);
        const newIndex = cards.findIndex(card => card.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Optimistically update UI
        const newCards = arrayMove(cards, oldIndex, newIndex);
        setCards(newCards);

        // Update orders in backend
        try {
            const cardOrders = newCards.map((card, index) => ({
                id: card.id,
                order: index
            }));

            const res = await fetch('/api/cards/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boardId: unwrappedParams.id,
                    cardOrders
                })
            });

            if (!res.ok) {
                // Revert on error
                setCards(cards);
                toast.error('Failed to reorder cards');
            }
        } catch (error) {
            console.error('Error reordering cards:', error);
            setCards(cards);
            toast.error('Failed to reorder cards');
        }
    };

    // Keyboard navigation
    useEffect(() => {
        if (isEditing || filteredCards.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't interfere if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const gridCols = {
                sm: 2,
                md: 3,
                lg: 4,
                xl: 5,
                '2xl': 6
            };

            // Get current grid columns based on viewport (simplified)
            const width = window.innerWidth;
            let cols = 2; // mobile
            if (width >= 640) cols = 3;   // sm
            if (width >= 768) cols = 4;   // md
            if (width >= 1024) cols = 5;  // lg
            if (width >= 1280) cols = 6;  // xl

            let newIndex = focusedCardIndex;

            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    if (focusedCardIndex === -1) {
                        newIndex = 0;
                    } else if (focusedCardIndex < filteredCards.length - 1) {
                        newIndex = focusedCardIndex + 1;
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (focusedCardIndex > 0) {
                        newIndex = focusedCardIndex - 1;
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (focusedCardIndex === -1) {
                        newIndex = 0;
                    } else if (focusedCardIndex + cols < filteredCards.length) {
                        newIndex = focusedCardIndex + cols;
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (focusedCardIndex - cols >= 0) {
                        newIndex = focusedCardIndex - cols;
                    }
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (focusedCardIndex >= 0 && focusedCardIndex < filteredCards.length) {
                        const card = filteredCards[focusedCardIndex];
                        // Trigger audio playback
                        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                        if (cardElement instanceof HTMLElement) {
                            cardElement.click();
                        }
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setFocusedCardIndex(-1);
                    break;
            }

            if (newIndex !== focusedCardIndex) {
                setFocusedCardIndex(newIndex);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, filteredCards, focusedCardIndex]);

    return (
        <main className="min-h-screen p-2 sm:p-4 md:p-8 relative pb-32">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-6 md:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-4 sm:p-6 rounded-2xl md:rounded-3xl sticky top-2 sm:top-4 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-2 sm:gap-4 flex-1 w-full sm:w-auto">
                    <Link href="/my-boards" className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0">
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Link>
                    <div className="bg-gradient-to-br from-primary to-secondary p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg transform rotate-3 hidden sm:block flex-shrink-0">
                        <LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    {isEditing ? (
                        <div className="flex-1 max-w-lg space-y-2">
                            <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full text-xl sm:text-2xl md:text-3xl font-bold bg-transparent border-b-2 border-primary/50 focus:border-primary outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Board Name"
                            />
                            <input
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full text-gray-500 bg-transparent border-b border-gray-200 focus:border-primary outline-none"
                                placeholder="Description (optional)"
                            />
                        </div>
                    ) : (
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 justify-between">
                                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent tracking-tight truncate">
                                    {board?.name || 'Loading...'}
                                </h1>
                                {!isEditing && <SettingsMenu />}
                            </div>

                            {board?.description && (
                                <p className="text-gray-500 mt-1 line-clamp-1 sm:line-clamp-2">{board.description}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isEditing && (
                        <button
                            onClick={handleSaveBoard}
                            disabled={isSaving}
                            className="bg-primary text-white px-4 sm:px-6 py-2 rounded-full font-bold shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto justify-center"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                    )}
                </div>
            </header>

            {/* Search Bar - Only show when cards exist */}
            {isEditing && !isLoading && cards.length > 0 && (
                <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search cards..."
                            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                    {searchTerm && (
                        <p className="mt-2 text-xs sm:text-sm text-gray-500 px-1">
                            {filteredCards.length === 0
                                ? 'No cards found'
                                : `${filteredCards.length} card${filteredCards.length === 1 ? '' : 's'} found`}
                        </p>
                    )}
                </div>
            )}

            {/* Grid */}
            <div className="max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-bounce p-4 rounded-full bg-primary/20">
                            <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                        </div>
                    </div>
                ) : cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50">
                        <div className="p-6 bg-gray-100 dark:bg-slate-700 rounded-full mb-6 animate-float">
                            <Plus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Cards Yet</h3>
                        <p className="text-gray-500 max-w-md">
                            Tap the + button below to create your first picture card for {board?.name}!
                        </p>
                    </div>
                ) : filteredCards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50">
                        <div className="p-6 bg-gray-100 dark:bg-slate-700 rounded-full mb-6">
                            <Search className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No cards match &quot;{searchTerm}&quot;</h3>
                        <p className="text-gray-500 max-w-md">
                            Try a different search term
                        </p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={filteredCards.map(c => c.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className={`grid gap-3 sm:gap-4 md:gap-6 ${cardSize === 'small'
                                ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
                                : cardSize === 'large'
                                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                                }`}>
                                {filteredCards.map((card, index) => (
                                    <PecsCard
                                        key={card.id}
                                        card={card}
                                        isEditing={isEditing}
                                        onDelete={handleDeleteCard}
                                        onEdit={handleEditCard}
                                        isFocused={focusedCardIndex === index}
                                        onFocus={() => setFocusedCardIndex(index)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Floating Action Button - Only in Edit Mode */}
            {isEditing && (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 p-4 sm:p-5 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-2xl hover:shadow-primary/50 transition-all transform hover:scale-110 active:scale-95 group"
                    aria-label="Add New Card"
                >
                    <Plus className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            {/* Modal */}
            <AddCardModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onCardAdded={handleCardAdded}
                onCardUpdated={handleCardUpdated}
                boardId={unwrappedParams.id}
                editCard={editingCard}
            />
        </main>
    );
}
