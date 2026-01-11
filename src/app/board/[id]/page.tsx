'use client';

import { useState, useEffect, use } from 'react';
import PecsCard from '@/components/PecsCard';
import AddCardModal from '@/components/AddCardModal';
import { Card, Board } from '@/types';
import { Plus, LayoutGrid, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [cards, setCards] = useState<Card[]>([]);
    const [board, setBoard] = useState<Board | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

                // Fetch Board Info (Optional if we want to show title)
                // I didn't make a specific GET /api/boards/[id] yet, but I can filter client side or add it.
                // For now let's just use "My Board" or fetch all and find. 
                const boardsRes = await fetch('/api/boards');
                if (boardsRes.ok) {
                    const boards = await boardsRes.json();
                    const found = boards.find((b: Board) => b.id === unwrappedParams.id);
                    if (found) setBoard(found);
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

    return (
        <main className="min-h-screen p-4 md:p-8 relative pb-32">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center glass p-6 rounded-3xl sticky top-4 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/my-boards" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-2xl shadow-lg transform rotate-3">
                        <LayoutGrid className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent tracking-tight">
                        {board?.name || 'Loading...'}
                    </h1>
                </div>
                <button className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500">
                    <Settings className="w-6 h-6" />
                </button>
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
                            <PecsCard key={card.id} card={card} />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-8 z-40 p-5 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-2xl hover:shadow-primary/50 transition-all transform hover:scale-110 active:scale-95 group"
                aria-label="Add New Card"
            >
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
            </button>

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
