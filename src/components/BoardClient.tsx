'use client';

import { useState, useEffect, useRef, useOptimistic, startTransition } from 'react';
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
import { Plus, Upload, ArrowLeft, Loader2, Search, X, Trash2, Share2, Check, MoreHorizontal, ChevronDown, ChevronUp, Grid3X3, Grid2X2, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
    const { cardSize: userCardSize, setCardSize } = useSettings();

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
    const [categoryFilter, setCategoryFilter] = useState<string>('All');

    // Keyboard navigation state
    const [focusedCardIndex, setFocusedCardIndex] = useState<number>(-1);

    // Header visibility state
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Share button state
    const [isCopied, setIsCopied] = useState(false);

    // Board settings panel state (collapsed by default on mobile)
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

    // More options menu state for secondary actions
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    // Swipe gesture ref
    const gridRef = useRef<HTMLDivElement>(null);

    // Computed: check if it's a template board
    const isStarterBoard = boardId.startsWith('starter-');

    // Computed: only allow editing if owner or admin, and requested, and NOT a template board
    const isEditing = requestedEdit && (isOwner || isAdmin) && !isStarterBoard;

    const cardSize = isEditing ? 'large' : userCardSize;

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
        // Only update the real state - optimistic state will sync automatically
        setCards(prev => [newCard, ...prev]);
    };

    const handleCardUpdated = (updatedCard: Card) => {
        // Only update the real state - optimistic state will sync automatically
        setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
        setEditingCard(null);
        setIsModalOpen(false);
    };

    const handleEditCard = (card: Card) => {
        setEditingCard(card);
        setIsModalOpen(true);
    };

    const handleDeleteCard = async (cardId: string) => {
        // Optimistic update for instant UI feedback
        startTransition(() => {
            addOptimisticCard({ action: 'delete', cardId });
        });

        try {
            const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
            if (res.ok) {
                // Update real state after successful deletion
                setCards(prev => prev.filter(c => c.id !== cardId));
                toast.success('Card deleted successfully');
            } else {
                // On error, the optimistic state will revert automatically when we don't update cards
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

        // Try native share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: board.name,
                    text: board.description || `Check out this PECS board: ${board.name}`,
                    url: shareUrl,
                });
                return;
            } catch (error) {
                // User cancelled or share failed, fall back to clipboard
                if ((error as Error).name === 'AbortError') {
                    return; // User cancelled, don't show error
                }
            }
        }

        // Fallback to clipboard
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

    // Filter cards based on search term and category
    // Use optimisticCards for instant UI updates
    const displayCards = optimisticCards;

    // Get unique categories from cards (excluding empty/undefined)
    const existingCategories = [...new Set(displayCards.map(c => c.category).filter((c): c is string => !!c))];
    const showCategoryFilter = existingCategories.length > 0;

    const filteredCards = displayCards.filter(card => {
        const matchesSearch = card.label.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || card.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

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

        // Optimistically update UI
        const newCards = arrayMove(currentCards, oldIndex, newIndex);
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
                setCards(currentCards);
                toast.error('Failed to reorder cards');
            }
        } catch (error) {
            console.error('Error reordering cards:', error);
            setCards(currentCards);
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
            if (filteredCards.length === 0) return;

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
            if (filteredCards.length === 0) return;

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
        if (filteredCards.length === 0) return;

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
        <main className={`min-h-screen p-2 sm:p-4 md:p-8 relative ${isEditing ? 'pb-28 sm:pb-32' : 'pb-8'}`}>
            {/* Header */}
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
                                                    handleBatchUpload();
                                                    setIsMoreMenuOpen(false);
                                                }}
                                                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors text-left"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Batch Upload
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsDeleteDialogOpen(true);
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
                                onClick={handleSaveBoard}
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
                                    onClick={handleShare}
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
                                        handleShare();
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

            {/* Search Bar - Only show when there are many cards */}
            {isEditing && displayCards.length > 6 && (
                <div className="max-w-7xl mx-auto mb-3 sm:mb-4 px-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search cards..."
                            className="w-full pl-9 pr-9 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Category Filter - Only show if categories exist */}
            {showCategoryFilter && (
                <div className="max-w-7xl mx-auto mb-4 sm:mb-6 px-1">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            onClick={() => setCategoryFilter('All')}
                            className={clsx(
                                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 whitespace-nowrap flex-shrink-0",
                                categoryFilter === 'All'
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                            )}
                        >
                            All ({displayCards.length})
                        </button>
                        {existingCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={clsx(
                                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 whitespace-nowrap flex-shrink-0",
                                    categoryFilter === cat
                                        ? "bg-primary text-white shadow-md"
                                        : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                )}
                            >
                                {cat} ({displayCards.filter(c => c.category === cat).length})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid */}
            <div ref={gridRef} className="max-w-7xl mx-auto">
                {displayCards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50">
                        <div className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full mb-4 sm:mb-6">
                            <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Cards Yet</h3>
                        <p className="text-gray-500 text-sm sm:text-base max-w-sm mb-6">
                            Start building your communication board by adding picture cards
                        </p>
                        {isEditing && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all touch-manipulation"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Your First Card</span>
                            </button>
                        )}
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

            {/* Like and Comments Section - Show for public boards */}
            {board?.isPublic && (
                <div className="mt-12 space-y-8 max-w-4xl mx-auto px-4">
                    {/* Like Button - Only show if not owner */}
                    {!isOwner && (
                        <div className="flex justify-center">
                            <LikeButton boardId={boardId} size="lg" />
                        </div>
                    )}

                    {/* Comments Section */}
                    <CommentsSection boardId={boardId} />
                </div>
            )}

            {/* Floating Add Card Button - Only in Edit Mode */}
            {isEditing && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 sm:bottom-8 z-40">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-4 sm:px-8 sm:py-5 bg-gradient-to-r from-primary via-primary to-accent text-white rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all transform hover:scale-105 active:scale-95 group touch-manipulation"
                        aria-label="Add New Card"
                    >
                        <Plus className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-bold text-base sm:text-lg">Add Card</span>
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
                existingCategories={existingCategories}
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
