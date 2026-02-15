'use client';

import { useState, useEffect, useRef } from 'react';
import CommunicationCard from '@/components/CommunicationCard';
import { Card } from '@/types';
import { useSwipeRef } from '@/hooks/useSwipe';
import { Image, Plus, Search } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

interface CardGridProps {
    cards: Card[]; // These are filtered cards
    totalCardsCount: number; // Total cards before filter, to distinguish empty board vs empty filter
    isEditing: boolean;
    cardSize: string;
    onDragEnd: (event: DragEndEvent) => void;
    onDelete: (cardId: string) => void;
    onEdit: (card: Card) => void;
    onMoveCopy: (card: Card) => void;
    searchTerm: string;
    onAddCard: () => void;
    onStartEditing?: () => void;
}

const getColumnCount = (width: number, cardSize: string) => {
    if (cardSize === 'small') {
        if (width >= 1280) return 8;
        if (width >= 1024) return 6;
        if (width >= 768) return 5;
        if (width >= 640) return 4;
        return 3;
    } else if (cardSize === 'large') {
        if (width >= 1280) return 5;
        if (width >= 1024) return 4;
        if (width >= 768) return 3;
        if (width >= 640) return 2;
        return 1;
    } else {
        // medium (default)
        if (width >= 1280) return 6;
        if (width >= 1024) return 5;
        if (width >= 768) return 4;
        if (width >= 640) return 3;
        return 2;
    }
};

export default function CardGrid({
    cards,
    totalCardsCount,
    isEditing,
    cardSize,
    onDragEnd,
    onDelete,
    onEdit,
    onMoveCopy,
    searchTerm,
    onAddCard,
    onStartEditing
}: CardGridProps) {
    const [focusedCardIndex, setFocusedCardIndex] = useState<number>(-1);
    const [columns, setColumns] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            return getColumnCount(window.innerWidth, cardSize);
        }
        return 2; // Default for SSR
    });
    const gridRef = useRef<HTMLDivElement>(null);

    // Update columns on resize or cardSize change
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const handleResize = () => {
            // Debounce the resize event to avoid layout thrashing during active resizing
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setColumns(getColumnCount(window.innerWidth, cardSize));
            }, 150);
        };

        // No need to call handleResize() here because the columns state is already
        // initialized via the lazy initializer, which runs on the client.

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, [cardSize]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const playCardAudio = (card: Card) => {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement instanceof HTMLElement) {
            cardElement.click();
        }
    };

    // Swipe gesture navigation for mobile
    useSwipeRef(gridRef, {
        onSwipeLeft: () => {
            if (cards.length === 0) return;

            if (focusedCardIndex === -1) {
                setFocusedCardIndex(0);
            } else if (focusedCardIndex < cards.length - 1) {
                const newIndex = focusedCardIndex + 1;
                setFocusedCardIndex(newIndex);
                playCardAudio(cards[newIndex]);
            }
        },
        onSwipeRight: () => {
            if (cards.length === 0) return;

            if (focusedCardIndex > 0) {
                const newIndex = focusedCardIndex - 1;
                setFocusedCardIndex(newIndex);
                playCardAudio(cards[newIndex]);
            } else if (focusedCardIndex === -1 && cards.length > 0) {
                setFocusedCardIndex(0);
            }
        },
        minSwipeDistance: 50
    });

    // Keyboard navigation
    useEffect(() => {
        if (cards.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            let newIndex = focusedCardIndex;

            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    if (focusedCardIndex === -1) {
                        newIndex = 0;
                    } else if (focusedCardIndex < cards.length - 1) {
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
                    } else if (focusedCardIndex + columns < cards.length) {
                        newIndex = focusedCardIndex + columns;
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (focusedCardIndex - columns >= 0) {
                        newIndex = focusedCardIndex - columns;
                    }
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (focusedCardIndex >= 0 && focusedCardIndex < cards.length) {
                        playCardAudio(cards[focusedCardIndex]);
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
    }, [cards, focusedCardIndex, columns]);

    return (
        <div ref={gridRef} className="max-w-7xl mx-auto">
            {totalCardsCount === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50">
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full mb-4 sm:mb-6">
                        <Image className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Cards Yet</h3>
                    <p className="text-gray-500 text-sm sm:text-base max-w-sm mb-6">
                        Start building your communication board by adding picture cards
                    </p>
                    {isEditing ? (
                        <button
                            onClick={onAddCard}
                            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all touch-manipulation"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Your First Card</span>
                        </button>
                    ) : onStartEditing ? (
                        <button
                            onClick={onStartEditing}
                            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all touch-manipulation"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Your First Card</span>
                        </button>
                    ) : null}
                </div>
            ) : cards.length === 0 ? (
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
                    onDragEnd={onDragEnd}
                >
                    <SortableContext
                        items={cards.map(c => c.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className={`grid gap-3 sm:gap-4 md:gap-6 ${cardSize === 'small'
                            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
                            : cardSize === 'large'
                                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                            }`}>
                            {cards.map((card, index) => (
                                <CommunicationCard
                                    key={card.id}
                                    card={card}
                                    isEditing={isEditing}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                    onMoveCopy={onMoveCopy}
                                    isFocused={focusedCardIndex === index}
                                    onFocus={() => setFocusedCardIndex(index)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}
