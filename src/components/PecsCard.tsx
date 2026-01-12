'use client';

import { Card } from '@/types';
import { useState, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Trash2, Pencil, GripVertical, Copy } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PecsCardProps {
    card: Card;
    onClick?: () => void;
    isEditing?: boolean;
    onDelete?: (cardId: string) => void;
    onEdit?: (card: Card) => void;
    onMoveCopy?: (card: Card) => void;
    isFocused?: boolean;
    onFocus?: () => void;
}

export default function PecsCard({ card, isEditing, onDelete, onEdit, onMoveCopy, isFocused = false, onFocus }: PecsCardProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1.0); // 0.0 to 1.0
    const [showVolumeControl, setShowVolumeControl] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id, disabled: !isEditing });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

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
            audioRef.current.volume = volume;
            audioRef.current.onended = () => setIsPlaying(false);
        }

        setIsPlaying(true);
        audioRef.current.play().catch(e => {
            console.error("Audio playback failed", e);
            setIsPlaying(false);
        });
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const toggleVolumeControl = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowVolumeControl(!showVolumeControl);
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group/card">
            {isEditing && (
                <>
                    <div className="absolute -top-2 -right-2 sm:-top-2 sm:-right-2 z-50 flex gap-1 sm:gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onMoveCopy?.(card);
                            }}
                            className="p-2 sm:p-2 md:p-2.5 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors transform active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Move/Copy Card"
                        >
                            <Copy className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onEdit?.(card);
                            }}
                            className="p-2 sm:p-2 md:p-2.5 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors transform active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Edit Card"
                        >
                            <Pencil className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (confirm('Delete this card?')) {
                                    onDelete?.(card.id);
                                }
                            }}
                            className="p-2 sm:p-2 md:p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors transform active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Delete Card"
                        >
                            <Trash2 className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                    <div
                        {...attributes}
                        {...listeners}
                        className="absolute -top-2 -left-2 sm:-top-2 sm:-left-2 z-50 cursor-grab active:cursor-grabbing touch-manipulation"
                        title="Drag to reorder"
                    >
                        <div className="p-2 sm:p-2 md:p-2.5 bg-gray-500 text-white rounded-full shadow-lg hover:bg-gray-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <GripVertical className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                </>
            )}
            <button
                onClick={handlePlay}
                onMouseEnter={onFocus}
                disabled={isEditing}
                data-card-id={card.id}
                className={clsx(
                    "relative flex flex-col items-center justify-between w-full aspect-[3/4] p-3 sm:p-3 md:p-4",
                    "bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl hover:shadow-2xl",
                    "transition-all duration-300 transform touch-manipulation",
                    !isEditing && "active:scale-95 hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-105",
                    "border-2 sm:border-4",
                    isPlaying ? "border-accent ring-2 sm:ring-4 ring-accent/30 scale-105" : isFocused ? "border-primary ring-2 sm:ring-4 ring-primary/30" : "border-transparent hover:border-primary/50",
                    isEditing && "cursor-default opacity-90 hover:none",
                    isDragging && "z-50",
                    "min-h-[120px]"
                )}
                style={{
                    borderColor: isPlaying ? undefined : isFocused ? undefined : card.color
                }}
            >
                <div className="relative flex-1 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-gray-700 pointer-events-none">
                    {/* Helper layout for centering image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* Using img tag for simplicity with local/blob urls, Next/Image requires playing nice with loaders */}
                        <img
                            src={card.imageUrl}
                            alt={card.label}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>

                    {/* Overlay showing audio icon on hover only if not editing */}
                    {!isEditing && (
                        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/card:opacity-100">
                            <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
                        </div>
                    )}

                    {/* Volume Control - show in bottom right when not editing */}
                    {!isEditing && (
                        <div className="absolute bottom-2 right-2 z-10">
                            <button
                                onClick={toggleVolumeControl}
                                className="p-2 sm:p-2 md:p-2.5 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-md hover:scale-110 transition-transform touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                title="Volume Control"
                            >
                                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                            {showVolumeControl && (
                                <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-3 min-w-[120px] animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2">
                                        <Volume2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={volume}
                                            onChange={handleVolumeChange}
                                            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-8 text-right">
                                            {Math.round(volume * 100)}%
                                        </span>
                                    </div>
                                </div>
                            )}
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
