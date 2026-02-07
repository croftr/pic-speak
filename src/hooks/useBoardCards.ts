'use client';

import { useState, useOptimistic, startTransition } from 'react';
import { Card } from '@/types';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';

export function useBoardCards(initialCards: Card[], boardId: string) {
    const [cards, setCards] = useState<Card[]>(initialCards);
    const [optimisticCards, addOptimisticCard] = useOptimistic(
        cards,
        (state, action: { action: 'delete'; cardId: string }) => {
            if (action.action === 'delete') {
                return state.filter(c => c.id !== action.cardId);
            }
            return state;
        }
    );

    const handleCardAdded = (newCard: Card) => {
        setCards(prev => [newCard, ...prev]);
    };

    const handleCardUpdated = (updatedCard: Card) => {
        setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
    };

    const handleDeleteCard = async (cardId: string) => {
        startTransition(() => {
            addOptimisticCard({ action: 'delete', cardId });
        });

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
        optimisticCards,
        setCards,
        handleCardAdded,
        handleCardUpdated,
        handleDeleteCard,
        handleDragEnd,
        handleMoveCopySuccess,
        handleMergeComplete
    };
}
