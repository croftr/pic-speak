'use client';

import { Card } from '@/types';
import { useState, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { clsx } from 'clsx';

import { Trash2, Pencil } from 'lucide-react';

interface PecsCardProps {
    card: Card;
    onClick?: () => void;
    isEditing?: boolean;
    onDelete?: (cardId: string) => void;
    onEdit?: (card: Card) => void;
}

export default function PecsCard({ card, isEditing, onDelete, onEdit }: PecsCardProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handlePlay = (e: React.MouseEvent) => {
        if (isEditing) {
            e.preventDefault();
            return;
        }

        if (!card.audioUrl) return;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        } else {
            audioRef.current = new Audio(card.audioUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        setIsPlaying(true);
        audioRef.current.play().catch(e => {
            console.error("Audio playback failed", e);
            setIsPlaying(false);
        });
    };

    return (
        <div className="relative group/card">
            {isEditing && (
                <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 z-50 flex gap-0.5 sm:gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onEdit?.(card);
                        }}
                        className="p-1.5 sm:p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors transform hover:scale-110"
                        title="Edit Card"
                    >
                        <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (confirm('Delete this card?')) {
                                onDelete?.(card.id);
                            }
                        }}
                        className="p-1.5 sm:p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors transform hover:scale-110"
                        title="Delete Card"
                    >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                </div>
            )}
            <button
                onClick={handlePlay}
                disabled={isEditing}
                className={clsx(
                    "relative flex flex-col items-center justify-between w-full aspect-[3/4] p-2 sm:p-3",
                    "bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl hover:shadow-2xl",
                    "transition-all duration-300 transform",
                    !isEditing && "hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-105",
                    "border-2 sm:border-4",
                    isPlaying ? "border-accent ring-2 sm:ring-4 ring-accent/30 scale-105" : "border-transparent hover:border-primary/50",
                    isEditing && "cursor-default opacity-90 hover:none"
                )}
                style={{
                    borderColor: isPlaying ? undefined : card.color
                }}
            >
                <div className="relative flex-1 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-gray-700 pointer-events-none">
                    {/* Helper layout for centering image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* Using img tag for simplicity with local/blob urls, Next/Image requires playing nice with loaders */}
                        <img
                            src={card.imageUrl}
                            alt={card.label}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>

                    {/* Overlay showing audio icon on hover only if not editing */}
                    {!isEditing && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
                        </div>
                    )}
                </div>

                <div className="mt-2 sm:mt-3 md:mt-4 w-full text-center pointer-events-none">
                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 truncate px-1">
                        {card.label}
                    </h3>
                </div>
            </button>
        </div>
    );
}
