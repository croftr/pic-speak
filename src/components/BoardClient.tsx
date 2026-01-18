'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import PecsCard from '@/components/PecsCard';

// Dynamically import heavy components that are not immediately visible
const AddCardModal = dynamic(() => import('@/components/AddCardModal'), {
    loading: () => null
});
const MoveCopyCardModal = dynamic(() => import('@/components/MoveCopyCardModal'), {
    loading: () => null
});
const LikeButton = dynamic(() => import('@/components/LikeButton'), {
    loading: () => <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
});
const CommentsSection = dynamic(() => import('@/components/CommentsSection'), {
    loading: () => <div className="space-y-4"><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" /></div>
});
const ConfirmDialog = dynamic(() => import('@/components/ConfirmDialog'), {
    loading: () => null
});
import { Card, Board } from '@/types';
import { Plus, Upload, ArrowLeft, Save, Loader2, Search, X, Trash2, Share2, Check, User, Pencil } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
const SettingsMenu = dynamic(() => import('@/components/SettingsMenu'), {
    loading: () => <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
});
import { useSettings } from '@/contexts/SettingsContext';
import { useSwipeRef } from '@/hooks/useSwipe';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import clsx from 'clsx';

interface BoardClientProps {
    boardId: string;
    initialBoard: Board;
    initialCards: Card[];
    initialIsOwner: boolean;
    initialIsAdmin: boolean;
}

export default function BoardClient({ boardId, initialBoard, initialCards, initialIsOwner, initialIsAdmin }: BoardClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedEdit = searchParams.get('edit') === 'true';
    const { cardSize } = useSettings();

    const [cards, setCards] = useState<Card[]>(initialCards);
    const [board, setBoard] = useState<Board>(initialBoard);
    const [isOwner] = useState(initialIsOwner);
    const [isAdmin] = useState(initialIsAdmin);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [isMoveCopyModalOpen, setIsMoveCopyModalOpen] = useState(false);
    const [moveCopyCard, setMoveCopyCard] = useState<Card | null>(null);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Edit states
    const [editName, setEditName] = useState(initialBoard.name);
    const [editDesc, setEditDesc] = useState(initialBoard.description || '');
    const [isPublic, setIsPublic] = useState(initialBoard.isPublic || false);
    const [isSaving, setIsSaving] = useState(false);

    // Search/Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Thing' | 'Word'>('All');

    // Keyboard navigation state
    const [focusedCardIndex, setFocusedCardIndex] = useState<number>(-1);

    // Header visibility state
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Share button state
    const [isCopied, setIsCopied] = useState(false);

    // Swipe gesture ref
    const gridRef = useRef<HTMLDivElement>(null);

    // Computed: check if it's a template board
    const isStarterBoard = boardId.startsWith('starter-');

    // Computed: only allow editing if owner or admin, and requested, and NOT a template board
    const isEditing = requestedEdit && (isOwner || isAdmin) && !isStarterBoard;

    // Drag and drop sensors - configured for both desktop and mobile
    const sensors = useSensors(
        // Mouse sensor for desktop with activation distance to prevent conflicts with clicks
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        // Touch sensor for mobile with activation distance to prevent conflicts with scrolling
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 200ms press required before drag starts
                tolerance: 8, // Allow 8px of movement during the delay
            },
        }),
        // Keyboard sensor for accessibility
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCardAdded = (newCard: Card) => {
        setCards(prev => [...prev, newCard]);
    };

    const handleCardUpdated = (updatedCard: Card) => {
        setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
        setEditingCard(null);
        setIsModalOpen(false);
    };

    const handleEditCard = (card: Card) => {
        setEditingCard(card);
        setIsModalOpen(true);
    };

    const handleDeleteCard = async (cardId: string) => {
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

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCard(null);
        setIsBatchMode(false);
    };

    const handleBatchUpload = () => {
        setIsBatchMode(true);
        setIsModalOpen(true);
    };

    const handleMoveCopyCard = (card: Card) => {
        setMoveCopyCard(card);
        setIsMoveCopyModalOpen(true);
    };

    const handleMoveCopySuccess = (action: 'move' | 'copy') => {
        if (action === 'move' && moveCopyCard) {
            // Remove card from current board if moved
            setCards(prev => prev.filter(c => c.id !== moveCopyCard.id));
        }
        setIsMoveCopyModalOpen(false);
        setMoveCopyCard(null);
    };

    const handleSaveBoard = async () => {
        if (!board) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/boards/${board.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    description: editDesc,
                    isPublic: isPublic
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setBoard(updated);
                toast.success('Board updated successfully!');
                // Exit edit mode
                router.push(`/board/${board.id}`);
            } else {
                toast.error('Failed to update board');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update board');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBoard = async () => {
        if (!board) return;

        try {
            const res = await fetch(`/api/boards/${board.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Board deleted successfully');
                router.push('/my-boards');
            } else {
                toast.error('Failed to delete board');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete board');
        }
    };

    const handleShare = async () => {
        if (!board) return;

        // Generate shareable link
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/board/${board.id}`;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            toast.success('Board link copied to clipboard!');

            // Reset copied state after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            toast.error('Failed to copy link');
        }
    };

    // Filter cards based on search term and type
    const hasThings = cards.some(c => c.type === 'Thing');
    const hasWords = cards.some(c => c.type === 'Word');
    const showTypeFilter = hasThings && hasWords;

    const filteredCards = cards.filter(card => {
        const matchesSearch = card.label.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || card.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = cards.findIndex(card => card.id === active.id);
        const newIndex = cards.findIndex(card => card.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Optimistically update UI
        const newCards = arrayMove(cards, oldIndex, newIndex);
        setCards(newCards);

        // Update orders in backend
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
                // Revert on error
                setCards(cards);
                toast.error('Failed to reorder cards');
            }
        } catch (error) {
            console.error('Error reordering cards:', error);
            setCards(cards);
            toast.error('Failed to reorder cards');
        }
    };

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

    // Swipe gesture navigation for mobile
    useSwipeRef(gridRef, {
        onSwipeLeft: () => {
            if (isEditing || filteredCards.length === 0) return;

            if (focusedCardIndex === -1) {
                setFocusedCardIndex(0);
            } else if (focusedCardIndex < filteredCards.length - 1) {
                const newIndex = focusedCardIndex + 1;
                setFocusedCardIndex(newIndex);

                // Play the card
                const card = filteredCards[newIndex];
                const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                if (cardElement instanceof HTMLElement) {
                    cardElement.click();
                }
            }
        },
        onSwipeRight: () => {
            if (isEditing || filteredCards.length === 0) return;

            if (focusedCardIndex > 0) {
                const newIndex = focusedCardIndex - 1;
                setFocusedCardIndex(newIndex);

                // Play the card
                const card = filteredCards[newIndex];
                const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                if (cardElement instanceof HTMLElement) {
                    cardElement.click();
                }
            } else if (focusedCardIndex === -1 && filteredCards.length > 0) {
                setFocusedCardIndex(0);
            }
        },
        minSwipeDistance: 50
    });

    // Keyboard navigation
    useEffect(() => {
        if (isEditing || filteredCards.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't interfere if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Get current grid columns based on viewport (simplified)
            const width = window.innerWidth;
            let cols = 2; // mobile
            if (width >= 640) cols = 3;   // sm
            if (width >= 768) cols = 4;   // md
            if (width >= 1024) cols = 5;  // lg
            if (width >= 1280) cols = 6;  // xl

            let newIndex = focusedCardIndex;

            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    if (focusedCardIndex === -1) {
                        newIndex = 0;
                    } else if (focusedCardIndex < filteredCards.length - 1) {
                        newIndex = focusedCardIndex + 1;
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (focusedCardIndex > 0) {
                        newIndex = focusedCardIndex - 1;
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (focusedCardIndex === -1) {
                        newIndex = 0;
                    } else if (focusedCardIndex + cols < filteredCards.length) {
                        newIndex = focusedCardIndex + cols;
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (focusedCardIndex - cols >= 0) {
                        newIndex = focusedCardIndex - cols;
                    }
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (focusedCardIndex >= 0 && focusedCardIndex < filteredCards.length) {
                        const card = filteredCards[focusedCardIndex];
                        // Trigger audio playback
                        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                        if (cardElement instanceof HTMLElement) {
                            cardElement.click();
                        }
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setFocusedCardIndex(-1);
                    break;
            }

            if (newIndex !== focusedCardIndex) {
                setFocusedCardIndex(newIndex);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, filteredCards, focusedCardIndex]);

    return (
        <main className="min-h-screen p-2 sm:p-4 md:p-8 relative pb-32">
            {/* Header */}
            <header className={`max-w-7xl mx-auto mb-4 md:mb-6 sticky top-16 sm:top-[4.5rem] z-40 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-[150%]'
                }`}>
                {isEditing ? (
                    // EDIT MODE - Spacious and mobile-friendly
                    <div className="flex flex-col gap-4 glass p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg">
                        {/* Back Button - Above everything on mobile, inline on desktop */}
                        <div className="flex items-center gap-3 sm:gap-4 sm:hidden">
                            <Link
                                href="/my-boards"
                                className="p-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
                                title="Back to My Boards"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Edit Board
                            </span>
                        </div>

                        {/* Desktop: Back Button + Board Info in one row */}
                        <div className="hidden sm:flex items-start gap-3 sm:gap-4">
                            <Link
                                href="/my-boards"
                                className="p-3 sm:p-3.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
                                title="Back to My Boards"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div className="flex-1 space-y-3 min-w-0">
                                {/* Board Name Input */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                                        Board Name
                                    </label>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full text-xl sm:text-2xl font-bold bg-white/50 dark:bg-slate-800/50 border-2 border-primary/30 focus:border-primary rounded-xl px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
                                        placeholder="Enter board name..."
                                    />
                                </div>

                                {/* Description Input */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                                        Description (Optional)
                                    </label>
                                    <input
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        className="w-full text-base bg-white/50 dark:bg-slate-800/50 border-2 border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-4 py-3 outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 transition-colors"
                                        placeholder="Add a description..."
                                    />
                                </div>

                                {/* Public Checkbox */}
                                <label className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-200/50 dark:border-blue-800/50 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors touch-manipulation">
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="mt-0.5 w-5 h-5 rounded border-2 border-blue-300 dark:border-blue-700 text-primary focus:ring-primary focus:ring-2 cursor-pointer flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <span className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                                            Make this board public
                                        </span>
                                        <span className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                            Anyone with the link can view this board
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Mobile: Full-width form fields stacked */}
                        <div className="flex flex-col space-y-3 sm:hidden">
                            {/* Board Name Input */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                                    Board Name
                                </label>
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full text-xl font-bold bg-white/50 dark:bg-slate-800/50 border-2 border-primary/30 focus:border-primary rounded-xl px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
                                    placeholder="Enter board name..."
                                />
                            </div>

                            {/* Description Input */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                                    Description (Optional)
                                </label>
                                <input
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="w-full text-base bg-white/50 dark:bg-slate-800/50 border-2 border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-4 py-3 outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 transition-colors"
                                    placeholder="Add a description..."
                                />
                            </div>

                            {/* Public Checkbox */}
                            <label className="flex items-start gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-200/50 dark:border-blue-800/50 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors touch-manipulation">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    className="mt-0.5 w-5 h-5 rounded border-2 border-blue-300 dark:border-blue-700 text-primary focus:ring-primary focus:ring-2 cursor-pointer flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                                        Make this board public
                                    </span>
                                    <span className="block text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                        Anyone with the link can view this board
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Bottom Row: Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t-2 border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="flex-1 sm:flex-none bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white px-6 py-4 sm:py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 text-base touch-manipulation min-h-[56px] sm:min-h-[52px]"
                                title="Delete Board"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>Delete Board</span>
                            </button>
                            <button
                                onClick={handleSaveBoard}
                                disabled={isSaving}
                                className="flex-1 bg-primary text-white px-6 py-4 sm:py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-base touch-manipulation min-h-[56px] sm:min-h-[52px]"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    // VIEW MODE - Compact and streamlined
                    <div className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Link
                                href="/my-boards"
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 touch-manipulation"
                                title="Back to My Boards"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                                    {board?.name || 'Loading...'}
                                </h1>
                                {board?.isPublic && board?.creatorName && !isOwner && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {board.creatorImageUrl ? (
                                            <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden">
                                                <Image
                                                    src={board.creatorImageUrl}
                                                    alt={board.creatorName}
                                                    fill
                                                    sizes="14px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="w-2 h-2 text-primary" />
                                            </div>
                                        )}
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                            by {board.creatorName}
                                        </span>
                                        <span className="text-gray-300 dark:text-gray-700 text-[10px]">•</span>
                                        <Link
                                            href={`/?creator=${board.userId}`}
                                            className="text-[10px] text-primary hover:underline whitespace-nowrap"
                                        >
                                            View more
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {board?.isPublic && (
                                <button
                                    onClick={handleShare}
                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-all touch-manipulation"
                                    title="Share Board"
                                >
                                    {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                </button>
                            )}
                            {(isOwner || isAdmin) && !isStarterBoard && (
                                <Link
                                    href={`/board/${board?.id}?edit=true`}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-lg transition-all touch-manipulation"
                                    title="Edit Board"
                                >
                                    <Pencil className="w-4 h-4" />
                                </Link>
                            )}
                            <SettingsMenu />
                        </div>
                    </div>
                )}
            </header>

            {/* Search Bar - Only show when cards exist and in edit mode */}
            {isEditing && cards.length > 0 && (
                <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search cards..."
                            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Type Filter - Only show if both types exist */}
            {showTypeFilter && (
                <div className="max-w-7xl mx-auto mb-6 flex justify-center">
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-1 rounded-2xl border border-gray-200 dark:border-gray-800 flex gap-1 shadow-sm overflow-x-auto max-w-full">
                        {(['All', 'Thing', 'Word'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={clsx(
                                    "px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all transform active:scale-95 whitespace-nowrap",
                                    typeFilter === type
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                                )}
                            >
                                {type === 'All' ? 'Everything' : type}
                                <span className="ml-2 opacity-50 text-[10px]">
                                    ({type === 'All' ? cards.length : cards.filter(c => c.type === type).length})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid */}
            <div ref={gridRef} className="max-w-7xl mx-auto">
                {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50">
                        <div className="p-6 bg-gray-100 dark:bg-slate-700 rounded-full mb-6 animate-float">
                            <Plus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Cards Yet</h3>
                        <p className="text-gray-500 max-w-md">
                            Tap the + button below to create your first picture card for {board?.name}!
                        </p>
                    </div>
                ) : filteredCards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50">
                        <div className="p-6 bg-gray-100 dark:bg-slate-700 rounded-full mb-6">
                            <Search className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No cards match &quot;{searchTerm}&quot;</h3>
                        <p className="text-gray-500 max-w-md">
                            Try a different search term
                        </p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={filteredCards.map(c => c.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className={`grid gap-3 sm:gap-4 md:gap-6 ${cardSize === 'small'
                                ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
                                : cardSize === 'large'
                                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                                }`}>
                                {filteredCards.map((card, index) => (
                                    <PecsCard
                                        key={card.id}
                                        card={card}
                                        isEditing={isEditing}
                                        onDelete={handleDeleteCard}
                                        onEdit={handleEditCard}
                                        onMoveCopy={handleMoveCopyCard}
                                        isFocused={focusedCardIndex === index}
                                        onFocus={() => setFocusedCardIndex(index)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Like and Comments Section - Only show for public boards when not owner */}
            {!isOwner && board?.isPublic && (
                <div className="mt-12 space-y-8 max-w-4xl mx-auto px-4">
                    {/* Like Button */}
                    <div className="flex justify-center">
                        <LikeButton boardId={boardId} size="lg" />
                    </div>

                    {/* Comments Section */}
                    <CommentsSection boardId={boardId} />
                </div>
            )}

            {/* Floating Action Buttons - Only in Edit Mode */}
            {isEditing && (
                <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex flex-col gap-4 sm:gap-5">
                    {/* Batch Upload Button */}
                    <button
                        onClick={handleBatchUpload}
                        className="p-4 sm:p-5 bg-gradient-to-r from-secondary to-primary text-white rounded-2xl shadow-2xl hover:shadow-secondary/50 transition-all transform hover:scale-105 active:scale-95 group touch-manipulation min-w-[60px] min-h-[60px] sm:min-w-[64px] sm:min-h-[64px] flex items-center justify-center"
                        aria-label="Batch Upload Cards"
                        title="Batch Upload Multiple Images"
                    >
                        <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>

                    {/* Add Card Button - Primary Action */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-5 sm:p-6 bg-gradient-to-r from-primary to-accent text-white rounded-2xl shadow-2xl hover:shadow-primary/50 transition-all transform hover:scale-105 active:scale-95 group touch-manipulation min-w-[68px] min-h-[68px] sm:min-w-[72px] sm:min-h-[72px] flex items-center justify-center ring-4 ring-white/20"
                        aria-label="Add New Card"
                    >
                        <Plus className="w-8 h-8 sm:w-9 sm:h-9 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
            )}

            {/* Modal */}
            <AddCardModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onCardAdded={handleCardAdded}
                onCardUpdated={handleCardUpdated}
                boardId={boardId}
                editCard={editingCard}
                batchMode={isBatchMode}
            />

            {/* Move/Copy Modal */}
            {moveCopyCard && (
                <MoveCopyCardModal
                    isOpen={isMoveCopyModalOpen}
                    onClose={() => {
                        setIsMoveCopyModalOpen(false);
                        setMoveCopyCard(null);
                    }}
                    onSuccess={handleMoveCopySuccess}
                    card={moveCopyCard}
                    currentBoardId={boardId}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteBoard}
                title="Delete Board?"
                message={`Are you sure you want to delete "${board?.name}"? This will permanently delete the board and all its cards. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </main>
    );
}
