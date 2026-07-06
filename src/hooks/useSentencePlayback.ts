'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/types';

const GAP_MS = 150;
const START_WATCHDOG_MS = 5000;

interface SentenceItem {
    key: string;
    card: Card;
}

// Sequential playback of a list of cards' own recordings using a single
// reused HTMLAudioElement (critical for iOS: the element unlocked by the
// user's Play tap keeps its permission to play new sources from `onended`,
// whereas a fresh `new Audio()` per word risks autoplay rejection mid-sentence).
export function useSentencePlayback() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentKey, setCurrentKey] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const runIdRef = useRef(0);
    const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const gapRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const getAudio = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        return audioRef.current;
    };

    const clearTimers = () => {
        if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
        }
        if (gapRef.current) {
            clearTimeout(gapRef.current);
            gapRef.current = null;
        }
    };

    const stop = useCallback(() => {
        runIdRef.current += 1;
        clearTimers();
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setCurrentKey(null);
    }, []);

    const play = useCallback((items: SentenceItem[]) => {
        stop();
        if (items.length === 0) return;

        const runId = runIdRef.current + 1;
        runIdRef.current = runId;
        setIsPlaying(true);

        const audio = getAudio();

        const playIndex = (index: number) => {
            if (runId !== runIdRef.current) return;
            if (index >= items.length) {
                setIsPlaying(false);
                setCurrentKey(null);
                return;
            }

            const item = items[index];
            if (!item.card.audioUrl) {
                gapRef.current = setTimeout(() => playIndex(index + 1), GAP_MS);
                return;
            }

            setCurrentKey(item.key);

            const advance = () => {
                if (runId !== runIdRef.current) return;
                clearTimers();
                gapRef.current = setTimeout(() => playIndex(index + 1), GAP_MS);
            };

            audio.onended = advance;
            audio.onerror = advance;
            audio.onplaying = () => {
                if (watchdogRef.current) {
                    clearTimeout(watchdogRef.current);
                    watchdogRef.current = null;
                }
            };

            audio.src = item.card.audioUrl;
            audio.currentTime = 0;

            watchdogRef.current = setTimeout(advance, START_WATCHDOG_MS);

            audio.play().catch(() => {
                if (runId !== runIdRef.current) return;
                advance();
            });
        };

        playIndex(0);
    }, [stop]);

    useEffect(() => stop, [stop]);

    return { isPlaying, currentKey, play, stop };
}

export type { SentenceItem };
