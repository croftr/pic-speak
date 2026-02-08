'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, Board } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';
import { Plus } from 'lucide-react';

import { useBoardCards } from '@/hooks/useBoardCards';
import BoardToolbar from '@/components/board/BoardToolbar';
import CardGrid from '@/components/board/CardGrid';
import BoardFilter from '@/components/board/BoardFilter';

// Dynamically import heavy components
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
const MergeBoardModal = dynamic(() => import('@/components/MergeBoardModal'), {
    loading: () => null
});

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
    const { cardSize: userCardSize } = useSettings();

    // Custom hook for card operations
    const {
        optimisticCards: cards, // Use optimistic state for instant UI updates
        handleCardAdded,
        handleCardUpdated,
        handleDeleteCard,
        handleDragEnd,
        handleMoveCopySuccess,
        handleMergeComplete
    } = useBoardCards(initialCards, boardId);

    const [board, setBoard] = useState<Board>(initialBoard);
    const [isOwner] = useState(initialIsOwner);
    const [isAdmin] = useState(initialIsAdmin);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [isMoveCopyModalOpen, setIsMoveCopyModalOpen] = useState(false);
    const [moveCopyCard, setMoveCopyCard] = useState<Card | null>(null);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isMergeBoardModalOpen, setIsMergeBoardModalOpen] = useState(false);

    // Edit states
    const [editName, setEditName] = useState(initialBoard.name);
    const [editDesc, setEditDesc] = useState(initialBoard.description || '');
    const [isPublic, setIsPublic] = useState(initialBoard.isPublic || false);
    const [isSaving, setIsSaving] = useState(false);

    // Search/Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');

    // Share button state
    const [isCopied, setIsCopied] = useState(false);

    // Computed
    const isStarterBoard = boardId.startsWith('starter-');
    const isEditing = requestedEdit && (isOwner || isAdmin) && !isStarterBoard;
    const cardSize = isEditing ? 'large' : userCardSize;

    // Filter logic
    const normalizeCategory = (cat: string) => cat.trim().toLowerCase().replace(/^\w/, c => c.toUpperCase());

    const filteredCards = cards.filter(card => {
        const matchesSearch = card.label.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || (card.category ? normalizeCategory(card.category) === categoryFilter : false);
        return matchesSearch && matchesCategory;
    });

    // Handlers
    const handleEditCard = (card: Card) => {
        setEditingCard(card);
        setIsModalOpen(true);
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

    const onMoveCopySuccessWrapper = (action: 'move' | 'copy') => {
        if (moveCopyCard) {
            handleMoveCopySuccess(action, moveCopyCard.id);
        }
        setIsMoveCopyModalOpen(false);
        setMoveCopyCard(null);
    };

    const onMergeCompleteWrapper = (addedCards: Card[]) => {
        handleMergeComplete(addedCards);
        setIsMergeBoardModalOpen(false);
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

        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/board/${board.id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: board.name,
                    text: board.description || `Check out this communication board: ${board.name}`,
                    url: shareUrl,
                });
                return;
            } catch (error) {
                if ((error as Error).name === 'AbortError') {
                    return;
                }
            }
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            toast.success('Board link copied to clipboard!');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            toast.error('Failed to copy link');
        }
    };

    // Existing categories calculation for AddCardModal
    const existingCategories = [...new Set(cards.map(c => c.category).filter((c): c is string => !!c).map(normalizeCategory))];

    return (
        <main className={`min-h-screen p-2 sm:p-4 md:p-8 relative ${isEditing ? 'pb-28 sm:pb-32' : 'pb-8'}`}>
            <BoardToolbar
                board={board}
                isEditing={isEditing}
                editName={editName}
                setEditName={setEditName}
                editDesc={editDesc}
                setEditDesc={setEditDesc}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
                isSaving={isSaving}
                onSave={handleSaveBoard}
                onDelete={() => setIsDeleteDialogOpen(true)}
                onShare={handleShare}
                isCopied={isCopied}
                onBatchUpload={handleBatchUpload}
                onMergeBoard={() => setIsMergeBoardModalOpen(true)}
            />

            <BoardFilter
                cards={cards}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                isEditing={isEditing}
            />

            <CardGrid
                cards={filteredCards}
                totalCardsCount={cards.length}
                isEditing={isEditing}
                cardSize={cardSize}
                onDragEnd={handleDragEnd}
                onDelete={handleDeleteCard}
                onEdit={handleEditCard}
                onMoveCopy={handleMoveCopyCard}
                searchTerm={searchTerm}
                onAddCard={() => setIsModalOpen(true)}
                onStartEditing={!isEditing && (isOwner || isAdmin) && !isStarterBoard && cards.length === 0
                    ? () => router.push(`/board/${boardId}?edit=true`)
                    : undefined
                }
            />

            {/* Like and Comments Section - Show for public boards */}
            {board?.isPublic && (
                <div className="mt-12 space-y-8 max-w-4xl mx-auto px-4">
                    {!isOwner && (
                        <div className="flex justify-center">
                            <LikeButton boardId={boardId} size="lg" />
                        </div>
                    )}
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

            {/* Modals */}
            <AddCardModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onCardAdded={handleCardAdded}
                onCardUpdated={(updated) => {
                    handleCardUpdated(updated);
                    setIsModalOpen(false);
                    setEditingCard(null);
                }}
                boardId={boardId}
                editCard={editingCard}
                batchMode={isBatchMode}
                existingCategories={existingCategories}
                existingCardLabels={cards.map(c => c.label)}
            />

            {moveCopyCard && (
                <MoveCopyCardModal
                    isOpen={isMoveCopyModalOpen}
                    onClose={() => {
                        setIsMoveCopyModalOpen(false);
                        setMoveCopyCard(null);
                    }}
                    onSuccess={onMoveCopySuccessWrapper}
                    card={moveCopyCard}
                    currentBoardId={boardId}
                />
            )}

            <MergeBoardModal
                isOpen={isMergeBoardModalOpen}
                onClose={() => setIsMergeBoardModalOpen(false)}
                onMergeComplete={onMergeCompleteWrapper}
                boardId={boardId}
                existingCards={cards}
            />

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
