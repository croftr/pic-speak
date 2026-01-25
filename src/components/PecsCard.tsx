'use client';

import { Card } from '@/types';
import { useState, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Trash2, Pencil, GripVertical, Copy, Sparkles, MoreVertical, Link } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConfirmDialog from './ConfirmDialog';
import Image from 'next/image';

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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Template cards and cards inherited from public boards cannot be edited
    const isTemplateCard = !!card.templateKey;
    const isInheritedCard = !!card.sourceBoardId;
    const canEdit = !isTemplateCard && !isInheritedCard;

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


    return (
        <div ref={setNodeRef} style={style} className="relative group/card">
            {isEditing && (
                <>
                    <div className={`absolute top-2 right-2 ${isMenuOpen ? 'z-[50]' : 'z-[5]'}`}>
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className="p-2.5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-all border border-gray-100 dark:border-gray-600 active:scale-95 touch-manipulation w-10 h-10 flex items-center justify-center"
                                title="Card Options"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-[61]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(false);
                                        }}
                                    />
                                    <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-1.5 min-w-[160px] flex flex-col gap-1 z-[62] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                onMoveCopy?.(card);
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors text-left"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy / Move
                                        </button>
                                        {canEdit && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    onEdit?.(card);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors text-left"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                Edit Card
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setIsDeleteDialogOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div
                        {...attributes}
                        {...listeners}
                        className="absolute top-2 left-2 z-[5] cursor-grab active:cursor-grabbing touch-manipulation"
                        title="Press and hold to drag"
                    >
                        <div className="p-2.5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-gray-400 dark:text-gray-400 rounded-full shadow-lg hover:text-primary hover:bg-gray-50 dark:hover:bg-slate-600 transition-all border border-gray-100 dark:border-gray-600 active:scale-95 w-10 h-10 flex items-center justify-center">
                            <GripVertical className="w-5 h-5" />
                        </div>
                    </div>
                </>
            )}
            <button
                onClick={handlePlay}
                onMouseEnter={onFocus}
                data-card-id={card.id}
                className={clsx(
                    "relative flex flex-col items-center justify-between w-full aspect-[3/4] p-3 sm:p-3 md:p-4",
                    "bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl hover:shadow-2xl",
                    "transition-all duration-300 transform touch-manipulation",
                    "active:scale-95 hover:scale-105",
                    !isEditing && "hover:-translate-y-1 sm:hover:-translate-y-2",
                    "border-2 sm:border-4",
                    isPlaying ? "border-accent ring-2 sm:ring-4 ring-accent/30 scale-105" : isFocused ? "border-primary ring-2 sm:ring-4 ring-primary/30" : "border-transparent hover:border-primary/50",
                    isEditing && "opacity-90",
                    isDragging && "z-50",
                    "min-h-[120px]"
                )}
                style={{
                    borderColor: isPlaying ? undefined : isFocused ? undefined : card.color
                }}
            >
                <div className="relative flex-1 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-gray-700 pointer-events-none">
                    {/* Template badge */}
                    {isTemplateCard && (
                        <div className="absolute top-1 right-1 z-10 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-md flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-white" />
                            <span className="text-[9px] font-bold text-white uppercase tracking-wide">Template</span>
                        </div>
                    )}
                    {/* Inherited card badge (from public board template) */}
                    {isInheritedCard && !isTemplateCard && (
                        <div className="absolute top-1 right-1 z-10 px-1.5 py-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-md flex items-center gap-0.5">
                            <Link className="w-2.5 h-2.5 text-white" />
                            <span className="text-[9px] font-bold text-white uppercase tracking-wide">Inherited</span>
                        </div>
                    )}
                    {/* Helper layout for centering image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* Use Next.js Image for uploaded images (http/https), fallback to img for blob URLs */}
                        {card.imageUrl.startsWith('http') ? (
                            <Image
                                src={card.imageUrl}
                                alt={card.label}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                className="object-contain transition-transform duration-500 group-hover:scale-110"
                                priority={false}
                            />
                        ) : (
                            <img
                                src={card.imageUrl}
                                alt={card.label}
                                loading="lazy"
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                            />
                        )}
                    </div>

                    {/* Overlay showing audio icon on hover if audio exists */}
                    {card.audioUrl && (
                        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/card:opacity-100">
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={() => onDelete?.(card.id)}
                title="Delete Card?"
                message={`Are you sure you want to delete "${card.label}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
