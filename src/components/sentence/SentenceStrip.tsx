'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Square, Delete, X } from 'lucide-react';
import { clsx } from 'clsx';
import { SentenceItem } from '@/hooks/useSentencePlayback';

interface SentenceStripProps {
    items: SentenceItem[];
    isPlaying: boolean;
    currentKey: string | null;
    isFull: boolean;
    onPlay: () => void;
    onStop: () => void;
    onRemoveItem: (key: string) => void;
    onRemoveLast: () => void;
    onClear: () => void;
}

export default function SentenceStrip({
    items,
    isPlaying,
    currentKey,
    isFull,
    onPlay,
    onStop,
    onRemoveItem,
    onRemoveLast,
    onClear,
}: SentenceStripProps) {
    const chipRowRef = useRef<HTMLDivElement>(null);
    const prevCountRef = useRef(items.length);
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        const prevCount = prevCountRef.current;
        prevCountRef.current = items.length;

        if (items.length === 0 && prevCount > 0) {
            setAnnouncement('Sentence cleared');
            return;
        }

        if (items.length > prevCount) {
            const last = items[items.length - 1];
            const sentence = items.map(i => i.card.label).join(' ');
            setAnnouncement(`Added ${last.card.label}. Sentence: ${sentence}.`);

            const el = chipRowRef.current;
            if (el) {
                const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
                el.scrollTo({ left: el.scrollWidth, behavior });
            }
        } else if (items.length < prevCount) {
            setAnnouncement('Removed from sentence');
        }
    }, [items]);

    return (
        <div
            data-testid="sentence-strip"
            role="region"
            aria-label="Sentence strip"
            className="fixed bottom-0 inset-x-0 z-40 px-2 sm:px-4 pb-2 sm:pb-4"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
            <div className="max-w-7xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                <div aria-live="polite" className="sr-only">{announcement}</div>

                {items.length === 0 ? (
                    <div
                        data-testid="sentence-empty-hint"
                        className="flex-1 text-center text-sm sm:text-base text-gray-500 dark:text-gray-400 py-3"
                    >
                        Tap cards to build a sentence
                    </div>
                ) : (
                    <div
                        ref={chipRowRef}
                        className="flex-1 flex items-center gap-2 overflow-x-auto scroll-smooth"
                    >
                        {isFull && (
                            <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 self-center px-1">
                                Full
                            </span>
                        )}
                        {items.map(item => (
                            <button
                                key={item.key}
                                data-testid="sentence-chip"
                                data-playing={currentKey === item.key ? 'true' : undefined}
                                onClick={() => onRemoveItem(item.key)}
                                aria-label={`Remove ${item.card.label} from sentence`}
                                className={clsx(
                                    'flex-shrink-0 flex flex-col items-center justify-center gap-1 w-16 sm:w-20 rounded-xl border-2 p-1.5 transition-all touch-manipulation',
                                    'bg-gray-50 dark:bg-slate-800',
                                    currentKey === item.key
                                        ? 'border-accent ring-2 ring-accent/40'
                                        : 'border-gray-200 dark:border-gray-700'
                                )}
                            >
                                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white dark:bg-slate-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.card.imageUrl}
                                        alt=""
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate w-full text-center">
                                    {item.card.label}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <button
                        data-testid="sentence-backspace"
                        onClick={onRemoveLast}
                        disabled={items.length === 0}
                        aria-label="Remove last word"
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 disabled:opacity-40 touch-manipulation"
                    >
                        <Delete className="w-5 h-5" />
                    </button>

                    <button
                        data-testid="sentence-play"
                        onClick={isPlaying ? onStop : onPlay}
                        disabled={items.length === 0}
                        aria-label={isPlaying ? 'Stop sentence' : 'Play sentence'}
                        className="w-14 h-14 flex items-center justify-center rounded-full bg-primary text-white shadow-lg disabled:opacity-40 touch-manipulation"
                    >
                        {isPlaying ? <Square className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>

                    <button
                        data-testid="sentence-clear"
                        onClick={onClear}
                        disabled={items.length === 0}
                        aria-label="Clear sentence"
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 disabled:opacity-40 touch-manipulation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
