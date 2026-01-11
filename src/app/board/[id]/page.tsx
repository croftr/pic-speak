'use client';

import { useState, useEffect, use } from 'react';
import PecsCard from '@/components/PecsCard';
import AddCardModal from '@/components/AddCardModal';
import { Card, Board } from '@/types';
import { Plus, LayoutGrid, Settings, ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEditing = searchParams.get('edit') === 'true';

    const unwrappedParams = use(params);
    const [cards, setCards] = useState<Card[]>([]);
    const [board, setBoard] = useState<Board | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit states
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // We need to inject the boardId into the AddCardModal
    // Assuming AddCardModal doesn't know about boardId yet, we handled that in the API but UI needs to pass it
    // Wait, I need to update AddCardModal to accept boardId or handle it internally? 
    // It's better if I update AddCardModal to accept `boardId` as a prop so it knows where to save.

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Fetch Cards
                const cardsRes = await fetch(`/api/cards?boardId=${unwrappedParams.id}`);
                if (cardsRes.ok) setCards(await cardsRes.json());

                // Fetch Board Info
                const boardsRes = await fetch('/api/boards');
                if (boardsRes.ok) {
                    const boards = await boardsRes.json();
                    const found = boards.find((b: Board) => b.id === unwrappedParams.id);
                    if (found) {
                        setBoard(found);
                        setEditName(found.name);
                        setEditDesc(found.description || '');
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [unwrappedParams.id]);


    const handleCardAdded = (newCard: Card) => {
        setCards(prev => [...prev, newCard]);
    };

    const handleDeleteCard = async (cardId: string) => {
        try {
            const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
            if (res.ok) {
                setCards(prev => prev.filter(c => c.id !== cardId));
            }
        } catch (error) {
            console.error("Failed to delete card", error);
        }
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
                    description: editDesc
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setBoard(updated);
                // Exit edit mode
                router.push(`/board/${board.id}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="min-h-screen p-4 md:p-8 relative pb-32">
            {/* Header */}
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center glass p-6 rounded-3xl sticky top-4 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-4 flex-1">
                    <Link href="/my-boards" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-2xl shadow-lg transform rotate-3 hidden md:block">
                        <LayoutGrid className="w-8 h-8 text-white" />
                    </div>
                    {isEditing ? (
                        <div className="flex-1 max-w-lg space-y-2">
                            <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full text-3xl font-bold bg-transparent border-b-2 border-primary/50 focus:border-primary outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Board Name"
                            />
                            <input
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full text-sm text-gray-500 bg-transparent border-b border-gray-200 focus:border-primary outline-none"
                                placeholder="Description (optional)"
                            />
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent tracking-tight">
                                {board?.name || 'Loading...'}
                            </h1>
                            {board?.description && (
                                <p className="text-gray-500 text-sm mt-1">{board.description}</p>
                            )}
                        </div>
                    )}
                </div>

                {isEditing && (
                    <button
                        onClick={handleSaveBoard}
                        disabled={isSaving}
                        className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                )}
            </header>

            {/* Grid */}
            <div className="max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-bounce p-4 rounded-full bg-primary/20">
                            <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                        </div>
                    </div>
                ) : cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50">
                        <div className="p-6 bg-gray-100 dark:bg-slate-700 rounded-full mb-6 animate-float">
                            <Plus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Cards Yet</h3>
                        <p className="text-gray-500 max-w-md">
                            Tap the + button below to create your first picture card for {board?.name}!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {cards.map((card) => (
                            <PecsCard
                                key={card.id}
                                card={card}
                                isEditing={isEditing}
                                onDelete={handleDeleteCard}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button - Only in Edit Mode */}
            {isEditing && (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="fixed bottom-8 right-8 z-40 p-5 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-2xl hover:shadow-primary/50 transition-all transform hover:scale-110 active:scale-95 group"
                    aria-label="Add New Card"
                >
                    <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            {/* Modal */}
            {/* I need to modify AddCardModal to accept boardId */}
            <AddCardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCardAdded={handleCardAdded}
                boardId={unwrappedParams.id}
            />
        </main>
    );
}
