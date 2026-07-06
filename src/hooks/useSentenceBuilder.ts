'use client';

import { useCallback, useRef, useState } from 'react';
import { Card } from '@/types';
import { useSentencePlayback, SentenceItem } from './useSentencePlayback';

export const MAX_SENTENCE_ITEMS = 10;

export function useSentenceBuilder() {
    const [items, setItems] = useState<SentenceItem[]>([]);
    const counterRef = useRef(0);
    const playback = useSentencePlayback();

    const addCard = useCallback((card: Card): boolean => {
        let added = false;
        setItems(prev => {
            if (prev.length >= MAX_SENTENCE_ITEMS) return prev;
            added = true;
            counterRef.current += 1;
            return [...prev, { key: `${card.id}-${counterRef.current}`, card }];
        });
        return added;
    }, []);

    const removeItem = useCallback((key: string) => {
        playback.stop();
        setItems(prev => prev.filter(item => item.key !== key));
    }, [playback]);

    const removeLast = useCallback(() => {
        playback.stop();
        setItems(prev => prev.slice(0, -1));
    }, [playback]);

    const clear = useCallback(() => {
        playback.stop();
        setItems([]);
    }, [playback]);

    return {
        items,
        isFull: items.length >= MAX_SENTENCE_ITEMS,
        addCard,
        removeItem,
        removeLast,
        clear,
        playback,
    };
}
