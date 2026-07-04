import { useEffect, useRef } from 'react';
import { Card } from '@/types';

/**
 * Warm every card's audio when a board opens.
 *
 * Two reasons: the first tap on a card speaks instantly instead of waiting on
 * a network fetch (tap -> voice latency is what makes a communication board
 * feel like it "works"), and the service worker caches each file so the board
 * still speaks with no connection.
 */
export function useAudioPreload(cards: Card[]) {
    const preloadedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const urls = cards
            .map((card) => card.audioUrl)
            .filter((url): url is string => !!url && url.startsWith('http'))
            .filter((url) => !preloadedRef.current.has(url));

        if (urls.length === 0) return;

        let cancelled = false;

        // Fetch a few at a time — audio clips are small, but a board can have
        // dozens of cards and we don't want to stampede slow connections.
        const CONCURRENCY = 4;
        const queue = [...urls];

        const worker = async () => {
            while (!cancelled) {
                const url = queue.shift();
                if (!url) return;
                preloadedRef.current.add(url);
                try {
                    await fetch(url, { mode: 'cors' });
                } catch {
                    // Offline or transient failure — allow a retry on next mount.
                    preloadedRef.current.delete(url);
                }
            }
        };

        for (let i = 0; i < CONCURRENCY; i++) {
            worker();
        }

        return () => {
            cancelled = true;
        };
    }, [cards]);
}
