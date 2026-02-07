'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Board } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import {
    Upload, ArrowLeft, Loader2, Trash2,
    Share2, Check, MoreHorizontal, ChevronDown, ChevronUp,
    Grid3X3, Grid2X2, LayoutGrid, Layers
} from 'lucide-react';

interface BoardToolbarProps {
    board: Board;
    isEditing: boolean;
    editName: string;
    setEditName: (name: string) => void;
    editDesc: string;
    setEditDesc: (desc: string) => void;
    isPublic: boolean;
    setIsPublic: (isPublic: boolean) => void;
    isSaving: boolean;
    onSave: () => void;
    onDelete: () => void;
    onShare: () => void;
    isCopied: boolean;
    onBatchUpload: () => void;
    onMergeBoard: () => void;
}

export default function BoardToolbar({
    board,
    isEditing,
    editName,
    setEditName,
    editDesc,
    setEditDesc,
    isPublic,
    setIsPublic,
    isSaving,
    onSave,
    onDelete,
    onShare,
    isCopied,
    onBatchUpload,
    onMergeBoard
}: BoardToolbarProps) {
    const { cardSize: userCardSize, setCardSize } = useSettings();
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Header scroll visibility
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show header when scrolling up, hide when scrolling down
            if (currentScrollY < lastScrollY || currentScrollY < 10) {
                setIsHeaderVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setIsHeaderVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <>
            <header className={`max-w-7xl mx-auto mb-4 md:mb-6 sticky top-16 sm:top-[4.5rem] z-40 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-[150%]'
                }`}>
                {isEditing ? (
                    // EDIT MODE - Clean, minimal header
                    <div className="flex items-center justify-between gap-2 p-2 sm:p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Link
                                href={`/board/${board?.id}`}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center text-gray-600 dark:text-gray-300 flex-shrink-0 touch-manipulation"
                                title="Done Editing"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                                className="flex items-center gap-2 min-w-0 flex-1 p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors touch-manipulation"
                            >
                                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                    {editName || 'Untitled Board'}
                                </span>
                                {isSettingsExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* More options menu for secondary actions */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 touch-manipulation"
                                    title="More options"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {isMoreMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-[60]"
                                            onClick={() => setIsMoreMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-1.5 min-w-[180px] z-[61] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                            <button
                                                onClick={() => {
                                                    onBatchUpload();
                                                    setIsMoreMenuOpen(false);
                                                }}
                                                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors text-left"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Batch Upload
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onMergeBoard();
                                                    setIsMoreMenuOpen(false);
                                                }}
                                                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors text-left"
                                            >
                                                <Layers className="w-4 h-4" />
                                                Merge Board
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onDelete();
                                                    setIsMoreMenuOpen(false);
                                                }}
                                                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Board
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={onSave}
                                disabled={isSaving}
                                className="bg-primary text-white px-3 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg hover:bg-primary/90 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm touch-manipulation"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                <span className="hidden sm:inline">Save</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    // VIEW MODE - Ultra clean for focus on cards
                    <div className="flex items-center justify-between gap-2 px-1.5 py-1 rounded-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Link
                                href="/my-boards"
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 touch-manipulation"
                                title="Back"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </Link>
                            <h1 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                                {board?.name || 'Loading...'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Share button - show for public boards */}
                            {board?.isPublic && (
                                <button
                                    onClick={onShare}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-manipulation"
                                    title="Share board"
                                >
                                    {isCopied ? (
                                        <Check className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <Share2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    )}
                                </button>
                            )}
                            {/* Card size toggle - cycles through sizes */}
                            <button
                                onClick={() => {
                                    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
                                    const currentIndex = sizes.indexOf(userCardSize);
                                    const nextIndex = (currentIndex + 1) % sizes.length;
                                    setCardSize(sizes[nextIndex]);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-manipulation"
                                title={`Card size: ${userCardSize}`}
                            >
                                {userCardSize === 'small' && <Grid3X3 className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                                {userCardSize === 'medium' && <Grid2X2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                                {userCardSize === 'large' && <LayoutGrid className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Board Settings Panel - Collapsible in Edit Mode */}
            {isEditing && isSettingsExpanded && (
                <div className="max-w-7xl mx-auto mb-4 px-1 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                        {/* Board Name Input */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 px-0.5">
                                Board Name
                            </label>
                            <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full text-base font-semibold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-lg px-3 py-2.5 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                                placeholder="Enter board name..."
                            />
                        </div>

                        {/* Description Input */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 px-0.5">
                                Description <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-lg px-3 py-2.5 outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 transition-all"
                                placeholder="Add a description..."
                            />
                        </div>

                        {/* Public Toggle - Compact */}
                        <label className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 text-primary focus:ring-primary focus:ring-2 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">Public Board</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">Share with anyone via link</span>
                            </div>
                            {isPublic && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onShare();
                                    }}
                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors flex-shrink-0"
                                    title="Copy share link"
                                >
                                    {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                </button>
                            )}
                        </label>
                    </div>
                </div>
            )}
        </>
    );
}
