'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/types';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';

// How long the "Undo" toast stays available before the delete is sent to the server
const UNDO_WINDOW_MS = 5000;

export function useBoardCards(initialCards: Card[], boardId: string) {
    const [cards, setCards] = useState<Card[]>(initialCards);
    const pendingDeletesRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    // If the page is left while a delete is still inside its undo window, the
    // deferred request would never fire and the card would reappear on next
    // load. Flush pending deletes immediately; keepalive lets the request
    // outlive the page.
    useEffect(() => {
        const flushPendingDeletes = () => {
            for (const [cardId, timer] of pendingDeletesRef.current) {
                clearTimeout(timer);
                fetch(`/api/cards/${cardId}`, { method: 'DELETE', keepalive: true }).catch(() => {});
            }
            pendingDeletesRef.current.clear();
        };
        window.addEventListener('pagehide', flushPendingDeletes);
        return () => {
            window.removeEventListener('pagehide', flushPendingDeletes);
            // Also flush on unmount (client-side navigation away from the board)
            flushPendingDeletes();
        };
    }, []);

    const handleCardAdded = (newCard: Card) => {
        setCards(prev => [newCard, ...prev]);
    };

    const handleCardUpdated = (updatedCard: Card) => {
        setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
    };

    const handleDeleteCard = (cardId: string) => {
        const index = cards.findIndex(c => c.id === cardId);
        if (index === -1) return;
        const card = cards[index];

        // Remove from the UI immediately; the server delete is deferred so it can be undone
        setCards(prev => prev.filter(c => c.id !== cardId));

        // Fire the real delete slightly after the toast closes so a last-moment
        // Undo click can't race the request
        const timer = setTimeout(async () => {
            pendingDeletesRef.current.delete(cardId);
            try {
                await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
            } catch (error) {
                // The undo window has passed, so there's nothing useful to show the
                // user; the card stays server-side and reappears on next load
                console.error('Failed to delete card', error);
            }
        }, UNDO_WINDOW_MS + 500);
        pendingDeletesRef.current.set(cardId, timer);

        toast('Card deleted', {
            duration: UNDO_WINDOW_MS,
            action: {
                label: 'Undo',
                onClick: () => {
                    const pending = pendingDeletesRef.current.get(cardId);
                    if (!pending) return;
                    clearTimeout(pending);
                    pendingDeletesRef.current.delete(cardId);
                    setCards(prev => {
                        const next = [...prev];
                        next.splice(Math.min(index, next.length), 0, card);
                        return next;
                    });
                }
            }
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const currentCards = cards;
        const oldIndex = currentCards.findIndex(card => card.id === active.id);
        const newIndex = currentCards.findIndex(card => card.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const newCards = arrayMove(currentCards, oldIndex, newIndex);
        setCards(newCards);

        try {
            const cardOrders = newCards.map((card, index) => ({
                id: card.id,
                order: index
            }));

            const res = await fetch('/api/cards/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boardId: boardId,
                    cardOrders
                })
            });

            if (!res.ok) {
                setCards(currentCards);
                toast.error('Failed to reorder cards');
            }
        } catch (error) {
            console.error('Error reordering cards:', error);
            setCards(currentCards);
            toast.error('Failed to reorder cards');
        }
    };

    const handleMoveCopySuccess = (action: 'move' | 'copy', movedCardId: string) => {
        if (action === 'move') {
             setCards(prev => prev.filter(c => c.id !== movedCardId));
        }
    };

    const handleMergeComplete = (addedCards: Card[]) => {
        setCards(prev => [...addedCards, ...prev]);
    };


    return {
        cards,
        setCards,
        handleCardAdded,
        handleCardUpdated,
        handleDeleteCard,
        handleDragEnd,
        handleMoveCopySuccess,
        handleMergeComplete
    };
}
